import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Role } from "@arena/db";
import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL } from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import {
  decryptSecret,
  encryptSecret,
  getDummyHash,
  hashPassword,
  newSessionToken,
  sha256,
  verifyPassword,
} from "./crypto";

const ISSUER = "Methstreams";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h sliding window
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const PW_MIN = 10;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
}

const toSessionUser = (u: { id: string; username: string; email: string; role: Role; totpEnabled: boolean }): SessionUser => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
  totpEnabled: u.totpEnabled,
});

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───── Login ─────

  /** Returns a session token on success, or { needsTotp: true } when a valid TOTP code is required. */
  async login(
    usernameRaw: string,
    password: string,
    totp: string | undefined,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<{ token: string; user: SessionUser } | { needsTotp: true }> {
    const username = String(usernameRaw ?? "").trim().toLowerCase();
    if (!username || !password) throw new BadRequestException("Username and password are required");

    const user = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN, OR: [{ username }, { email: username }] },
    });

    // Equalize timing for unknown users.
    if (!user || !user.passwordHash) {
      await verifyPassword(await getDummyHash(), password);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException("Account temporarily locked. Try again later.");
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
      await this.registerFailure(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.totpEnabled) {
      if (!totp) return { needsTotp: true };
      if (!this.checkTotp(user.totpSecret, totp)) {
        await this.registerFailure(user.id, user.failedLoginAttempts);
        throw new UnauthorizedException("Invalid authentication code");
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const token = await this.createSession(user.id, ctx);
    return { token, user: toSessionUser(user) };
  }

  private async registerFailure(userId: string, current: number) {
    const next = current + 1;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: next,
        ...(next >= MAX_FAILED ? { lockedUntil: new Date(Date.now() + LOCK_MS), failedLoginAttempts: 0 } : {}),
      },
    });
    if (next >= MAX_FAILED) this.logger.warn(`Admin ${userId} locked after ${MAX_FAILED} failed attempts`);
  }

  // ───── Sessions ─────

  async createSession(userId: string, ctx: { ip?: string; userAgent?: string }): Promise<string> {
    const token = newSessionToken();
    await this.prisma.adminSession.create({
      data: {
        tokenHash: sha256(token),
        userId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        ip: ctx.ip?.slice(0, 190),
        userAgent: ctx.userAgent?.slice(0, 500),
      },
    });
    return token;
  }

  /** Validates the cookie token, slides the expiry, and returns the admin or null. */
  async validateSession(token: string | undefined): Promise<SessionUser | null> {
    if (!token) return null;
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || session.user.role !== Role.ADMIN) {
      if (session) await this.prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    return toSessionUser(session.user);
  }

  async logout(token: string | undefined) {
    if (token) await this.prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  revokeAllSessions(userId: string) {
    return this.prisma.adminSession.deleteMany({ where: { userId } });
  }

  // ───── TOTP (2FA) ─────

  private checkTotp(encSecret: string | null, token: string): boolean {
    if (!encSecret) return false;
    try {
      const code = String(token).replace(/\s/g, "");
      if (!/^\d{6}$/.test(code)) return false;
      // epochTolerance 30s == ±1 time step, to absorb client/server clock drift.
      return verifySync({ token: code, secret: decryptSecret(encSecret), epochTolerance: 30 }).valid === true;
    } catch {
      return false;
    }
  }

  /** Starts 2FA enrollment: stores an (encrypted) secret, returns the otpauth URI + QR, leaves 2FA off until confirmed. */
  async setupTotp(userId: string): Promise<{ otpauthUrl: string; qrDataUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: user.username, issuer: ISSUER });
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: encryptSecret(secret), totpEnabled: false } });
    return { otpauthUrl, qrDataUrl: await toDataURL(otpauthUrl) };
  }

  async enableTotp(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) throw new BadRequestException("Start 2FA setup first");
    if (!this.checkTotp(user.totpSecret, code)) throw new BadRequestException("Code did not match. Try again.");
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
  }

  async disableTotp(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException("Wrong password");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: false, totpSecret: null } });
  }

  // ───── Account management ─────

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    if (next.length < PW_MIN) throw new BadRequestException(`New password must be at least ${PW_MIN} characters`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, current))) {
      throw new UnauthorizedException("Current password is wrong");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
    await this.prisma.adminSession.deleteMany({ where: { userId } }); // force re-login everywhere
  }

  listAdmins() {
    return this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true, username: true, email: true, totpEnabled: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async createAdmin(input: { username?: unknown; email?: unknown; password?: unknown }) {
    const username = String(input.username ?? "").trim().toLowerCase();
    const email = String(input.email ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new BadRequestException("Username: 3–32 chars, a-z 0-9 . _ -");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException("Invalid email");
    if (password.length < PW_MIN) throw new BadRequestException(`Password must be at least ${PW_MIN} characters`);
    if (await this.prisma.user.findFirst({ where: { OR: [{ username }, { email }] } })) {
      throw new ConflictException("Username or email already exists");
    }
    const user = await this.prisma.user.create({
      data: { username, email, role: Role.ADMIN, passwordHash: await hashPassword(password) },
    });
    return { id: user.id, username: user.username, email: user.email };
  }

  async deleteAdmin(targetId: string, actingId: string) {
    if (targetId === actingId) throw new BadRequestException("You cannot delete your own account");
    const total = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    if (total <= 1) throw new BadRequestException("Cannot delete the last admin");
    const target = await this.prisma.user.findFirst({ where: { id: targetId, role: Role.ADMIN } });
    if (!target) throw new NotFoundException("Admin not found");
    await this.prisma.user.delete({ where: { id: targetId } });
    return { deleted: targetId };
  }
}

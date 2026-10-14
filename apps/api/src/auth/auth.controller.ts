import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { SESSION_COOKIE, sessionCookieOptions } from "./auth.constants";
import { SessionGuard, type AdminRequest } from "./session.guard";

type Body_ = Record<string, unknown>;
const str = (v: unknown) => String(v ?? "");

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(@Body() body: Body_, @Req() req: AdminRequest, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(str(body.username), str(body.password), body.totp ? str(body.totp) : undefined, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if ("needsTotp" in result) return { needsTotp: true };
    res.cookie(SESSION_COOKIE, result.token, sessionCookieOptions());
    return { user: result.user };
  }

  @Post("logout")
  async logout(@Req() req: AdminRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@Req() req: AdminRequest) {
    return { user: req.adminUser };
  }

  // ── 2FA ──

  @Post("2fa/setup")
  @UseGuards(SessionGuard)
  setup2fa(@Req() req: AdminRequest) {
    return this.auth.setupTotp(req.adminUser!.id);
  }

  @Post("2fa/enable")
  @UseGuards(SessionGuard)
  async enable2fa(@Body() body: Body_, @Req() req: AdminRequest) {
    await this.auth.enableTotp(req.adminUser!.id, str(body.code));
    return { ok: true, totpEnabled: true };
  }

  @Post("2fa/disable")
  @UseGuards(SessionGuard)
  async disable2fa(@Body() body: Body_, @Req() req: AdminRequest) {
    await this.auth.disableTotp(req.adminUser!.id, str(body.password));
    return { ok: true, totpEnabled: false };
  }

  @Post("change-password")
  @UseGuards(SessionGuard)
  async changePassword(@Body() body: Body_, @Req() req: AdminRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.changePassword(req.adminUser!.id, str(body.current), str(body.next));
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
    return { ok: true };
  }

  // ── Admin accounts ──

  @Get("users")
  @UseGuards(SessionGuard)
  listUsers() {
    return this.auth.listAdmins();
  }

  @Post("users")
  @UseGuards(SessionGuard)
  createUser(@Body() body: Body_) {
    return this.auth.createAdmin(body);
  }

  @Delete("users/:id")
  @UseGuards(SessionGuard)
  deleteUser(@Param("id") id: string, @Req() req: AdminRequest) {
    return this.auth.deleteAdmin(id, req.adminUser!.id);
  }
}

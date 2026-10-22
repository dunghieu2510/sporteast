/**
 * Admin account CLI. Run from repo root so .env is loaded, e.g.
 *   npx dotenv -e .env -- npx tsx apps/api/scripts/admin.ts create <username> <email> <password>
 *   npx dotenv -e .env -- npx tsx apps/api/scripts/admin.ts reset-2fa <username>
 *   npx dotenv -e .env -- npx tsx apps/api/scripts/admin.ts reset-password <username> <newPassword>
 *   npx dotenv -e .env -- npx tsx apps/api/scripts/admin.ts unlock <username>
 *   npx dotenv -e .env -- npx tsx apps/api/scripts/admin.ts list
 */
import { PrismaClient } from "@arena/db";
import { hash as argonHash } from "@node-rs/argon2";

const prisma = new PrismaClient();
const ARGON = { memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;

async function main() {
  const [cmd, a, b, c] = process.argv.slice(2);

  switch (cmd) {
    case "create": {
      const username = (a ?? "").trim().toLowerCase();
      const email = (b ?? "").trim().toLowerCase();
      const password = c ?? "";
      if (!username || !email || password.length < 10) {
        throw new Error("Usage: create <username> <email> <password(min 10 chars)>");
      }
      if (await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } })) {
        throw new Error("Username or email already exists");
      }
      const u = await prisma.user.create({
        data: { username, email, role: "ADMIN", passwordHash: await argonHash(password, ARGON) },
      });
      console.log(`✅ Admin created: ${u.username} <${u.email}>`);
      break;
    }
    case "reset-2fa": {
      const r = await prisma.user.updateMany({
        where: { username: (a ?? "").trim().toLowerCase(), role: "ADMIN" },
        data: { totpEnabled: false, totpSecret: null },
      });
      console.log(r.count ? `✅ 2FA disabled for ${a}` : `No admin named "${a}"`);
      break;
    }
    case "reset-password": {
      const username = (a ?? "").trim().toLowerCase();
      const password = b ?? "";
      if (!username || password.length < 10) {
        throw new Error("Usage: reset-password <username> <newPassword(min 10 chars)>");
      }
      const r = await prisma.user.updateMany({
        where: { username, role: "ADMIN" },
        data: { passwordHash: await argonHash(password, ARGON), failedLoginAttempts: 0, lockedUntil: null },
      });
      console.log(r.count ? `✅ Password reset for ${username}` : `No admin named "${username}"`);
      break;
    }
    case "unlock": {
      const r = await prisma.user.updateMany({
        where: { username: (a ?? "").trim().toLowerCase(), role: "ADMIN" },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      console.log(r.count ? `✅ Unlocked ${a}` : `No admin named "${a}"`);
      break;
    }
    case "list": {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { username: true, email: true, totpEnabled: true, lastLoginAt: true },
      });
      console.table(admins);
      break;
    }
    default:
      console.log("Commands: create | reset-2fa | unlock | list");
  }
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

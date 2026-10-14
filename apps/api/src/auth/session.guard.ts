import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService, type SessionUser } from "./auth.service";
import { SESSION_COOKIE } from "./auth.constants";

export interface AdminRequest extends Request {
  adminUser?: SessionUser;
  cookies: Record<string, string>;
}

/** Protects admin endpoints: requires a valid session cookie. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const user = await this.auth.validateSession(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException("Not authenticated");
    req.adminUser = user;
    return true;
  }
}

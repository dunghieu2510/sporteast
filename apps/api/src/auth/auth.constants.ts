import type { CookieOptions } from "express";

export const SESSION_COOKIE = "se_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters (stronger than the minimum).
const ARGON_OPTS = { memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;

export const hashPassword = (pw: string) => argonHash(pw, ARGON_OPTS);

// A real argon2 hash, computed once, so a login for a non-existent user still
// spends the same CPU on verification (no user-enumeration timing oracle).
let dummyHash: Promise<string> | null = null;
export const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

export async function verifyPassword(hash: string, pw: string): Promise<boolean> {
  try {
    return await argonVerify(hash, pw, ARGON_OPTS);
  } catch {
    return false;
  }
}

export const newSessionToken = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function encKey(): Buffer {
  const raw = process.env.AUTH_ENC_KEY ?? "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("AUTH_ENC_KEY must be 32 bytes, base64-encoded");
  return key;
}

/** AES-256-GCM. Output: base64(iv[12] | tag[16] | ciphertext). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------------------
// Credential auth helpers — PIN/password hashing + signed session tokens.
//
// Friends pick a name + a PIN or password; the secret is hashed with scrypt
// (never stored in plaintext). The session cookie is HMAC-signed so it can't be
// forged (you can't just set cvj_user=someoneelse to impersonate them).
// Node's built-in crypto only — no dependencies.
// ---------------------------------------------------------------------------

import "server-only";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";

const SECRET =
  process.env.SESSION_SECRET ||
  // Dev/demo fallback. MUST be overridden in production via SESSION_SECRET.
  "dev-insecure-secret-change-me-in-production";

// Carina and Johnny (the original two) may keep their short PINs; every other
// player must choose at least 6 letters or numbers.
export const PRIVILEGED_IDS = new Set(["carina", "johnny"]);
export const PRIVILEGED_MIN_SECRET_LENGTH = 4;
export const GENERAL_MIN_SECRET_LENGTH = 6;
// Back-compat: the general minimum.
export const MIN_SECRET_LENGTH = GENERAL_MIN_SECRET_LENGTH;

/** Minimum PIN/password length for a given account (by id or name). */
export function minSecretLength(idOrName: string): number {
  return PRIVILEGED_IDS.has(slugId(idOrName))
    ? PRIVILEGED_MIN_SECRET_LENGTH
    : GENERAL_MIN_SECRET_LENGTH;
}

export function hashSecret(secret: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(secret, salt, 32).toString("hex");
  return `${salt}:${dk}`;
}

export function verifySecret(secret: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, dk] = stored.split(":");
  if (!salt || !dk) return false;
  const calc = scryptSync(secret, salt, 32);
  const orig = Buffer.from(dk, "hex");
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}

export function signSession(userId: string): string {
  const sig = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", SECRET).update(userId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}

/** Turn a display name into a stable-ish id, with a random suffix for uniqueness. */
export function slugId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20) || "player";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

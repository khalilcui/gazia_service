/* Admin key check. Only the SHA-256 hash of the key is kept in the code. */
import { createHash, timingSafeEqual } from "node:crypto";
import type { Req } from "./http";

// SHA-256 of the default admin key. Override with the ADMIN_KEY_SHA256 env var.
const DEFAULT_HASH = "d638a8e769d532b698c567d8e470f3e4a82e00dba355e2c8bc99f49343f3965b";

function expectedHash(): string {
  return (process.env.ADMIN_KEY_SHA256 || DEFAULT_HASH).trim().toLowerCase();
}

export function keyMatches(key: string): boolean {
  if (!key) return false;
  const got = Buffer.from(createHash("sha256").update(key).digest("hex"));
  const want = Buffer.from(expectedHash());
  return got.length === want.length && timingSafeEqual(got, want);
}

export function isAdmin(req: Req): boolean {
  const header = req.headers["x-admin-key"];
  return keyMatches(String(Array.isArray(header) ? header[0] : header || ""));
}

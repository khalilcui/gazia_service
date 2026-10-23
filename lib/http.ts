/* Small HTTP helpers shared by the /api functions (plain Node req/res). */
import type { IncomingMessage, ServerResponse } from "node:http";

export type Req = IncomingMessage & { body?: unknown };
export type Res = ServerResponse;

export function send(res: Res, code: number, body: unknown, cache = "no-store"): void {
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", cache);
  res.end(JSON.stringify(body));
}

/** Reads the raw request body (up to `limit` bytes). */
export function readRaw(req: Req, limit: number): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error("Too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Reads a JSON body. Vercel may already have parsed it into req.body. */
export async function readJson<T = Record<string, unknown>>(req: Req, limit = 20_000): Promise<T> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body as T;
  if (typeof req.body === "string") {
    if (req.body.length > limit) throw Object.assign(new Error("Too large"), { status: 413 });
    try { return JSON.parse(req.body) as T; } catch { return {} as T; }
  }
  const raw = await readRaw(req, limit);
  try { return JSON.parse(raw.toString("utf8") || "{}") as T; } catch { return {} as T; }
}

/** Removes control characters, trims and caps the length of user text. */
export function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function newId(): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, "0")).join("");
  return Date.now().toString(36) + "-" + rand;
}

export function validId(id: unknown): id is string {
  return /^[a-z0-9-]{6,40}$/.test(String(id ?? ""));
}

export function url(req: Req): URL {
  return new URL(req.url || "/", "http://local");
}

export function methodNotAllowed(res: Res, allow: string): void {
  res.setHeader("allow", allow);
  send(res, 405, { error: "Method not allowed." });
}

export function fail(res: Res, e: unknown): void {
  const status = (e as { status?: number })?.status;
  if (status === 413) return send(res, 413, { error: "That is too large." });
  console.error(e);
  send(res, 500, { error: "Storage error. Try again in a moment." });
}

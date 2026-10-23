/* /api/login — checks the admin key on the server. */
import { keyMatches } from "../lib/auth";
import { methodNotAllowed, readJson, send, type Req, type Res } from "../lib/http";
import { storage } from "../lib/storage";

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") return methodNotAllowed(res, "POST");
  const body = await readJson<{ key?: string }>(req, 2_000).catch(() => ({} as { key?: string }));
  if (!keyMatches(String(body.key || ""))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return send(res, 401, { ok: false, error: "Wrong admin key." });
  }
  const s = storage();
  return send(res, 200, { ok: true, storage: s ? s.kind : null });
}

/* ==========================================================
   /api/content — the website's editable content.

   GET                    → current content (public)
   PUT   (admin)          → save new content, live for everyone
   GET   ?history=1 (admin) → previous saved versions
   POST  ?restore=<file> (admin) → bring back a previous version

   Admin requests send the key in the "x-admin-key" header.
   ========================================================== */
import { isAdmin } from "../lib/auth";
import { fail, methodNotAllowed, readJson, send, url, type Req, type Res } from "../lib/http";
import { storage, type Storage } from "../lib/storage";

const FILE = "content/site.json";
const HISTORY = "content/history/";
const KEEP = 15;

interface Saved { updatedAt: string; content: Record<string, unknown> }

async function backup(s: Storage): Promise<void> {
  const current = await s.readJSON<Saved>(FILE);
  if (!current) return;
  const stamp = (current.updatedAt || new Date().toISOString()).replace(/[:.]/g, "-");
  await s.writeJSON(HISTORY + stamp + ".json", current);
  const old = (await s.list(HISTORY)).sort().reverse().slice(KEEP);
  await s.remove(old);
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const s = storage();
  if (!s) return send(res, 503, { enabled: false, error: "Storage is not connected yet." });
  const q = url(req).searchParams;

  try {
    if (req.method === "GET") {
      if (q.get("history")) {
        if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
        const files = (await s.list(HISTORY)).sort().reverse();
        return send(res, 200, { enabled: true, versions: files.map((f) => f.slice(HISTORY.length)) });
      }
      const saved = await s.readJSON<Saved>(FILE);
      return send(res, 200, { enabled: true, storage: s.kind, updatedAt: saved?.updatedAt || null, content: saved?.content || null });
    }

    if (req.method === "PUT") {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
      const body = await readJson<{ content?: unknown }>(req, 3_500_000);
      const content = body.content;
      if (!content || typeof content !== "object" || Array.isArray(content) || !("hero" in content)) {
        return send(res, 400, { error: "That content doesn't look right." });
      }
      await backup(s);
      const saved: Saved = { updatedAt: new Date().toISOString(), content: content as Record<string, unknown> };
      await s.writeJSON(FILE, saved);
      return send(res, 200, { ok: true, updatedAt: saved.updatedAt });
    }

    if (req.method === "POST" && q.get("restore")) {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
      const name = q.get("restore") || "";
      if (!/^[\w-]+\.json$/.test(name)) return send(res, 400, { error: "Unknown version." });
      const old = await s.readJSON<Saved>(HISTORY + name);
      if (!old) return send(res, 404, { error: "That version no longer exists." });
      await backup(s);
      const saved: Saved = { updatedAt: new Date().toISOString(), content: old.content };
      await s.writeJSON(FILE, saved);
      return send(res, 200, { ok: true, updatedAt: saved.updatedAt, content: saved.content });
    }

    return methodNotAllowed(res, "GET, PUT, POST");
  } catch (e) {
    return fail(res, e);
  }
}

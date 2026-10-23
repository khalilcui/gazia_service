/* ==========================================================
   /api/messages — the contact form inbox.

   POST                 → a visitor sends a message (public)
   GET   (admin)        → all messages, newest first
   PATCH {id, read}     → mark read / unread (admin)
   DELETE ?id=…         → delete (admin)
   ========================================================== */
import { isAdmin } from "../lib/auth";
import { clean, fail, methodNotAllowed, newId, readJson, send, url, validId, type Req, type Res } from "../lib/http";
import { readMany, storage } from "../lib/storage";

const DIR = "messages/";

interface Message { id: string; name: string; email: string; subject: string; message: string; created_at: string; read: boolean }

export default async function handler(req: Req, res: Res): Promise<void> {
  const s = storage();
  if (!s) return send(res, 503, { enabled: false, error: "Message storage is not connected yet." });
  const q = url(req).searchParams;

  try {
    if (req.method === "POST") {
      const b = await readJson<Record<string, unknown>>(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot
      const name = clean(b.name, 80), email = clean(b.email, 120), subject = clean(b.subject, 140), message = clean(b.message, 2000);
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 3) {
        return send(res, 400, { error: "Add your name, a valid email and a message." });
      }
      const id = newId();
      const item: Message = { id, name, email, subject, message, created_at: new Date().toISOString(), read: false };
      await s.writeJSON(DIR + id + ".json", item);
      return send(res, 201, { ok: true });
    }

    if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });

    if (req.method === "GET") {
      const files = (await s.list(DIR)).sort().reverse().slice(0, 500);
      const items = (await readMany<Message>(s, files)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return send(res, 200, { enabled: true, items });
    }

    if (req.method === "PATCH") {
      const b = await readJson<{ id?: string; read?: boolean }>(req);
      if (!validId(b.id)) return send(res, 400, { error: "Unknown message." });
      const item = await s.readJSON<Message>(DIR + b.id + ".json");
      if (!item) return send(res, 404, { error: "That message no longer exists." });
      item.read = !!b.read;
      await s.writeJSON(DIR + b.id + ".json", item);
      return send(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = q.get("id");
      if (!validId(id)) return send(res, 400, { error: "Unknown message." });
      await s.remove([DIR + id + ".json"]);
      return send(res, 200, { ok: true });
    }

    return methodNotAllowed(res, "GET, POST, PATCH, DELETE");
  } catch (e) {
    return fail(res, e);
  }
}

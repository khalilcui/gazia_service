/* ==========================================================
   /api/feedback — visitor ratings and reviews.

   GET               → published feedback (public)
   GET  ?all=1       → everything, including hidden (admin)
   POST              → new feedback (live straight away, unless
                       FEEDBACK_REQUIRE_APPROVAL=1 is set in Vercel)
   PATCH {id, approved} → show / hide (admin)
   DELETE ?id=…      → delete (admin)
   ========================================================== */
import { isAdmin } from "../lib/auth";
import { clean, fail, methodNotAllowed, newId, readJson, send, url, validId, type Req, type Res } from "../lib/http";
import { readMany, storage } from "../lib/storage";

const DIR = "feedback/";
const REQUIRE_APPROVAL = process.env.FEEDBACK_REQUIRE_APPROVAL === "1";

interface Feedback { id: string; name: string; role: string; rating: number; message: string; created_at: string; approved: boolean }

const newestFirst = (a: Feedback, b: Feedback) => String(b.created_at).localeCompare(String(a.created_at));

export default async function handler(req: Req, res: Res): Promise<void> {
  const s = storage();
  if (!s) return send(res, 503, { enabled: false, error: "Feedback storage is not connected yet." });
  const q = url(req).searchParams;

  try {
    if (req.method === "GET") {
      const all = !!q.get("all");
      if (all && !isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
      const files = (await s.list(DIR)).sort().reverse().slice(0, all ? 500 : 150);
      let items = (await readMany<Feedback>(s, files)).sort(newestFirst);
      if (!all) items = items.filter((x) => x.approved).slice(0, 100).map((x) => ({ ...x }));
      return send(res, 200, { enabled: true, requireApproval: REQUIRE_APPROVAL, items });
    }

    if (req.method === "POST") {
      const b = await readJson<Record<string, unknown>>(req);
      if (b.website) return send(res, 200, { ok: true, approved: false }); // honeypot
      const name = clean(b.name, 60), role = clean(b.role, 60), message = clean(b.message, 800);
      const rating = Math.max(1, Math.min(5, parseInt(String(b.rating), 10) || 0));
      if (!name || message.length < 3 || !parseInt(String(b.rating), 10)) {
        return send(res, 400, { error: "Name, rating and a message are required." });
      }
      const id = newId();
      const item: Feedback = { id, name, role, rating, message, created_at: new Date().toISOString(), approved: !REQUIRE_APPROVAL };
      await s.writeJSON(DIR + id + ".json", item);
      return send(res, 201, { ok: true, approved: item.approved, item: item.approved ? item : null });
    }

    if (req.method === "PATCH") {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
      const b = await readJson<{ id?: string; approved?: boolean }>(req);
      if (!validId(b.id)) return send(res, 400, { error: "Unknown feedback." });
      const item = await s.readJSON<Feedback>(DIR + b.id + ".json");
      if (!item) return send(res, 404, { error: "That feedback no longer exists." });
      item.approved = !!b.approved;
      await s.writeJSON(DIR + b.id + ".json", item);
      return send(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
      const id = q.get("id");
      if (!validId(id)) return send(res, 400, { error: "Unknown feedback." });
      await s.remove([DIR + id + ".json"]);
      return send(res, 200, { ok: true });
    }

    return methodNotAllowed(res, "GET, POST, PATCH, DELETE");
  } catch (e) {
    return fail(res, e);
  }
}

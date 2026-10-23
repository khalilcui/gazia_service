/* ==========================================================
   /api/upload — admin uploads an image or PDF.
   Body: the raw file. Headers: x-admin-key, content-type,
   x-filename. Returns { url }.
   ========================================================== */
import { isAdmin } from "../lib/auth";
import { fail, methodNotAllowed, readRaw, send, type Req, type Res } from "../lib/http";
import { storage } from "../lib/storage";

const MAX = 4_000_000; // Vercel functions accept ~4.5 MB bodies
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
  "image/svg+xml": ".svg", "application/pdf": ".pdf"
};

export const config = { api: { bodyParser: false } };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") return methodNotAllowed(res, "POST");
  if (!isAdmin(req)) return send(res, 401, { error: "Wrong admin key." });
  const s = storage();
  if (!s) return send(res, 503, { enabled: false, error: "Storage is not connected yet." });

  const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return send(res, 415, { error: "Upload a JPG, PNG, WebP, GIF, SVG or PDF file." });

  try {
    const data = await readRaw(req, MAX);
    if (!data.length) return send(res, 400, { error: "The file is empty." });
    const rawName = decodeURIComponent(String(req.headers["x-filename"] || "file"));
    const base = rawName.replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
    const fileUrl = await s.putFile("uploads/" + base + ext, data, type);
    return send(res, 201, { ok: true, url: fileUrl });
  } catch (e) {
    return fail(res, e);
  }
}

/* ==========================================================
   Local server: `npm run dev` → http://localhost:3000
   Serves public/, runs the /api functions, and stores data in
   .data/ (or in Vercel Blob if BLOB_READ_WRITE_TOKEN is set).
   ========================================================== */
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.LOCAL_DATA_DIR) process.env.LOCAL_DATA_DIR = ".data";

const ROOT = path.resolve("public");
const DATA = path.resolve(process.env.LOCAL_DATA_DIR || ".data");
const PORT = Number(process.env.PORT || 3000);
const PAGES = new Set(["/about", "/skills", "/languages", "/services", "/work", "/feedback", "/contact", "/admin"]);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".pdf": "application/pdf", ".txt": "text/plain"
};

type Handler = (req: unknown, res: unknown) => Promise<void>;
const handlers = new Map<string, Handler>();
async function apiHandler(name: string): Promise<Handler | null> {
  if (!/^[a-z-]+$/.test(name)) return null;
  if (handlers.has(name)) return handlers.get(name)!;
  const file = path.resolve("api", name + ".ts");
  try { await fs.access(file); } catch { return null; }
  const mod = await import(pathToFileURL(file).href);
  const h = (mod.default?.default || mod.default) as Handler;
  handlers.set(name, h);
  return h;
}

async function serveFile(res: import("node:http").ServerResponse, base: string, rel: string): Promise<boolean> {
  const file = path.resolve(base, "." + rel);
  if (!file.startsWith(base)) return false;
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return false;
    res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(await fs.readFile(file));
    return true;
  } catch { return false; }
}

createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://localhost");
  try {
    if (u.pathname.startsWith("/api/")) {
      const h = await apiHandler(u.pathname.slice(5).replace(/\/$/, ""));
      if (h) return await h(req, res);
      res.writeHead(404, { "content-type": "application/json" }); return res.end('{"error":"Not found"}');
    }
    if (u.pathname.startsWith("/files/") && await serveFile(res, DATA, u.pathname.slice(6))) return;
    let p = decodeURIComponent(u.pathname);
    if (p === "/" || PAGES.has(p.replace(/\/$/, ""))) p = "/index.html";
    if (await serveFile(res, ROOT, p)) return;
    if (await serveFile(res, ROOT, p + ".html")) return;
    res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
    res.end("Server error");
  }
}).listen(PORT, () => {
  console.log(`Gazia Services running at http://localhost:${PORT}`);
  console.log(process.env.BLOB_READ_WRITE_TOKEN ? "Storage: Vercel Blob" : `Storage: local files in ${DATA}`);
});

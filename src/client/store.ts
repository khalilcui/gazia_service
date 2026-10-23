/* ==========================================================
   Talks to the server (/api/*).
   - "server" mode: content, uploads, feedback and messages are
     stored on Vercel Blob. Admin edits are live for everyone and
     survive a reload.
   - "browser" mode (storage not connected yet): the site shows
     its built-in content; admin edits are kept in this browser.
   ========================================================== */
import { DEFAULT_CONTENT } from "./data";
import type { Content, FeedbackItem } from "./types";

export type Mode = "server" | "browser";
export interface Message { id: string; name: string; email: string; subject: string; message: string; created_at: string; read: boolean }

const LOCAL_KEY = "gz_services_content_v1";
const KEY_KEY = "gz_admin_key";
// SHA-256 of the admin key, used only when the server isn't reachable.
const ADMIN_HASH = "d638a8e769d532b698c567d8e470f3e4a82e00dba355e2c8bc99f49343f3965b";

let mode: Mode = "browser";
let problem = "";
let requireApproval = false;

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Fills anything missing in saved content with the defaults (so new fields always exist). */
export function withDefaults(saved: unknown): Content {
  const merge = (base: unknown, over: unknown): unknown => {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    const out: Record<string, unknown> = { ...base };
    Object.keys(over).forEach((k) => {
      const b = base[k], o = over[k];
      if (o === undefined || o === null) return;
      if (b !== undefined && Array.isArray(b) !== Array.isArray(o)) return;
      if (b !== undefined && typeof b !== typeof o) return;
      out[k] = isObj(b) && isObj(o) ? merge(b, o) : o;
    });
    return out;
  };
  return merge(clone(DEFAULT_CONTENT), isObj(saved) ? saved : {}) as Content;
}

function key(): string { try { return sessionStorage.getItem(KEY_KEY) || ""; } catch { return ""; } }

async function api<T = Record<string, unknown>>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (admin) {
    const k = key();
    if (!k) throw new Error("Log out and log in again.");
    headers.set("x-admin-key", k);
  }
  const r = await fetch(path, { ...init, headers, cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw Object.assign(new Error(j.error || "Server error " + r.status), { status: r.status });
  return j;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function compressImage(file: File, maxSide: number, quality: number): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onerror = () => { URL.revokeObjectURL(u); reject(new Error("That image couldn't be read.")); };
    img.onload = () => {
      URL.revokeObjectURL(u);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d")!;
      if (file.type === "image/png") ctx.clearRect(0, 0, c.width, c.height); else { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process the image."))), type, quality);
    };
    img.src = u;
  });
}
function toDataURL(b: Blob): Promise<string> {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(b); });
}
async function upload(blob: Blob, name: string): Promise<string> {
  const j = await api<{ url: string }>("/api/upload", { method: "POST", body: blob, headers: { "content-type": blob.type, "x-filename": encodeURIComponent(name) } }, true);
  return j.url;
}

export const Store = {
  get mode(): Mode { return mode; },
  get problem(): string { return problem; },

  /** Loads the live content. Falls back to this browser's draft or the defaults. */
  async load(): Promise<Content> {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch("/api/content?t=" + Date.now(), { cache: "no-store", signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json().catch(() => ({})) as { enabled?: boolean; content?: unknown };
      if (r.ok && j.enabled) { mode = "server"; problem = ""; return withDefaults(j.content); }
      problem = r.status === 503 ? "Blob storage isn't connected. In Vercel: Storage → Create → Blob → connect it to this project, then Redeploy."
        : r.status === 404 ? "The server functions aren't deployed. Deploy from GitHub with the settings in SETUP.md."
        : "The server returned an error (" + r.status + ").";
    } catch {
      problem = "The server couldn't be reached.";
    }
    mode = "browser";
    try { const raw = localStorage.getItem(LOCAL_KEY); if (raw) return withDefaults(JSON.parse(raw)); } catch { /* ignore */ }
    return withDefaults(null);
  },

  async login(password: string): Promise<{ ok: boolean; msg?: string }> {
    if (!password) return { ok: false, msg: "Enter the admin password." };
    try {
      const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: password }) });
      if (r.status === 401) return { ok: false, msg: "Wrong password." };
      if (r.ok) { try { sessionStorage.setItem(KEY_KEY, password); } catch { /* ignore */ } return { ok: true }; }
    } catch { /* server unreachable: check locally below */ }
    if (!window.crypto?.subtle) return { ok: false, msg: "Open the site over https to use admin." };
    if ((await sha256(password)) !== ADMIN_HASH) return { ok: false, msg: "Wrong password." };
    try { sessionStorage.setItem(KEY_KEY, password); } catch { /* ignore */ }
    return { ok: true };
  },
  isLoggedIn(): boolean { return !!key(); },
  logout(): void { try { sessionStorage.removeItem(KEY_KEY); } catch { /* ignore */ } },

  async save(content: Content): Promise<string> {
    if (mode === "server") {
      await api("/api/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) }, true);
      return "Published — live for every visitor";
    }
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(content)); }
    catch { throw new Error("This browser's storage is full. Use smaller images, or connect Blob storage."); }
    return "Saved in this browser only — connect storage to publish";
  },
  resetLocal(): void { try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ } },

  async history(): Promise<string[]> {
    if (mode !== "server") return [];
    return (await api<{ versions: string[] }>("/api/content?history=1", {}, true)).versions || [];
  },
  async restore(name: string): Promise<Content> {
    const j = await api<{ content: unknown }>("/api/content?restore=" + encodeURIComponent(name), { method: "POST" }, true);
    return withDefaults(j.content);
  },

  async uploadImage(file: File): Promise<string> {
    if (mode === "server") return upload(await compressImage(file, 1800, 0.86), file.name);
    return toDataURL(await compressImage(file, 1200, 0.78));
  },
  async uploadFile(file: File): Promise<string> {
    if (file.size > 4_000_000) throw new Error("Files must be under 4 MB.");
    if (mode === "server") return upload(file, file.name);
    if (file.size > 1_500_000) throw new Error("Until storage is connected, files must be under 1.5 MB.");
    return toDataURL(file);
  },

  exportJson(content: Content): void {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }));
    a.download = "gazia-services-content.json";
    document.body.appendChild(a); a.click(); a.remove();
  },

  feedback: {
    get requireApproval(): boolean { return requireApproval; },
    async listPublic(): Promise<FeedbackItem[]> {
      if (mode !== "server") return [];
      try { const j = await api<{ items: FeedbackItem[]; requireApproval: boolean }>("/api/feedback?t=" + Date.now()); requireApproval = j.requireApproval; return j.items || []; }
      catch { return []; }
    },
    async submit(f: FeedbackItem & { website?: string }): Promise<{ approved: boolean }> {
      if (mode !== "server") throw Object.assign(new Error("not-connected"), { code: "not-connected" });
      const j = await api<{ approved: boolean }>("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      return { approved: !!j.approved };
    },
    async listAll(): Promise<FeedbackItem[]> {
      if (mode !== "server") return [];
      const j = await api<{ items: FeedbackItem[]; requireApproval: boolean }>("/api/feedback?all=1", {}, true);
      requireApproval = j.requireApproval;
      return j.items || [];
    },
    async setApproved(id: string, approved: boolean): Promise<void> {
      await api("/api/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, approved }) }, true);
    },
    async remove(id: string): Promise<void> { await api("/api/feedback?id=" + encodeURIComponent(id), { method: "DELETE" }, true); }
  },

  messages: {
    async send(m: { name: string; email: string; subject: string; message: string; website?: string }): Promise<void> {
      if (mode !== "server") throw Object.assign(new Error("not-connected"), { code: "not-connected" });
      await api("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(m) });
    },
    async listAll(): Promise<Message[]> {
      if (mode !== "server") return [];
      return (await api<{ items: Message[] }>("/api/messages", {}, true)).items || [];
    },
    async setRead(id: string, read: boolean): Promise<void> {
      await api("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, read }) }, true);
    },
    async remove(id: string): Promise<void> { await api("/api/messages?id=" + encodeURIComponent(id), { method: "DELETE" }, true); }
  }
};

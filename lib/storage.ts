/* ==========================================================
   Storage used by the API.
   - On Vercel: Vercel Blob (needs BLOB_READ_WRITE_TOKEN, added
     automatically when a Blob store is connected to the project).
   - Locally (npm run dev): plain files in .data/
   - Neither available: null → the site falls back to its
     built-in content and the admin works in "this browser" mode.
   ========================================================== */
import { del, get, list, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface Storage {
  kind: "blob" | "local";
  readJSON<T>(pathname: string): Promise<T | null>;
  writeJSON(pathname: string, data: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
  remove(pathnames: string[]): Promise<void>;
  putFile(pathname: string, data: Buffer, contentType: string): Promise<string>;
}

const ACCESS = "public" as const;

function blobStorage(): Storage {
  return {
    kind: "blob",
    async readJSON<T>(pathname: string): Promise<T | null> {
      try {
        const r = await get(pathname, { access: ACCESS, useCache: false });
        if (!r || r.statusCode !== 200 || !r.stream) return null;
        const text = await new Response(r.stream).text();
        return JSON.parse(text) as T;
      } catch (e) {
        if ((e as Error)?.name === "BlobNotFoundError") return null;
        throw e;
      }
    },
    async writeJSON(pathname, data) {
      await put(pathname, JSON.stringify(data), {
        access: ACCESS,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60
      });
    },
    async list(prefix) {
      const out: string[] = [];
      let cursor: string | undefined;
      do {
        const r = await list({ prefix, limit: 1000, cursor });
        r.blobs.forEach((b) => out.push(b.pathname));
        cursor = r.hasMore ? r.cursor : undefined;
      } while (cursor);
      return out;
    },
    async remove(pathnames) {
      if (pathnames.length) await del(pathnames);
    },
    async putFile(pathname, data, contentType) {
      const r = await put(pathname, data, {
        access: ACCESS,
        addRandomSuffix: true,
        contentType,
        cacheControlMaxAge: 60 * 60 * 24 * 365
      });
      return r.url;
    }
  };
}

function localStorage(dir: string): Storage {
  const abs = (p: string) => {
    const full = path.resolve(dir, p);
    if (!full.startsWith(path.resolve(dir))) throw new Error("Bad path");
    return full;
  };
  async function walk(root: string): Promise<string[]> {
    let entries: import("node:fs").Dirent[] = [];
    try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return []; }
    const nested = await Promise.all(entries.map((e) => {
      const p = path.join(root, e.name);
      return e.isDirectory() ? walk(p) : Promise.resolve([p]);
    }));
    return nested.flat();
  }
  return {
    kind: "local",
    async readJSON<T>(pathname: string): Promise<T | null> {
      try { return JSON.parse(await fs.readFile(abs(pathname), "utf8")) as T; } catch { return null; }
    },
    async writeJSON(pathname, data) {
      const f = abs(pathname);
      await fs.mkdir(path.dirname(f), { recursive: true });
      await fs.writeFile(f, JSON.stringify(data, null, 2));
    },
    async list(prefix) {
      const base = path.resolve(dir);
      const files = await walk(base);
      return files.map((f) => path.relative(base, f).split(path.sep).join("/")).filter((p) => p.startsWith(prefix));
    },
    async remove(pathnames) {
      await Promise.all(pathnames.map((p) => fs.rm(abs(p), { force: true })));
    },
    async putFile(pathname, data) {
      const ext = path.extname(pathname);
      const name = pathname.slice(0, pathname.length - ext.length) + "-" + Math.random().toString(36).slice(2, 8) + ext;
      const f = abs(name);
      await fs.mkdir(path.dirname(f), { recursive: true });
      await fs.writeFile(f, data);
      return "/files/" + name;
    }
  };
}

export function storage(): Storage | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobStorage();
  if (process.env.LOCAL_DATA_DIR) return localStorage(process.env.LOCAL_DATA_DIR);
  return null;
}

/** Reads many JSON files in parallel, skipping any that fail. */
export async function readMany<T>(s: Storage, pathnames: string[]): Promise<T[]> {
  const rows = await Promise.all(pathnames.map((p) => s.readJSON<T>(p).catch(() => null)));
  return rows.filter((x): x is Awaited<T> => x != null) as T[];
}

# Gazia Services — Setup Guide

## What's inside

| Part | Where |
|---|---|
| Page markup | `public/index.html` |
| Styles (shared look with the portfolio) | `public/css/style.css` |
| Front end (TypeScript, bundled to `public/js/app.js` on build) | `src/client/` |
| — all original content | `src/client/data.ts` |
| — 28 colour themes | `src/client/themes.ts` |
| — 3D background, hero screen, contact desk | `src/client/scene3d.ts` |
| — rendering, routing, feedback, contact form, cursor | `src/client/main.ts` |
| — admin panel | `src/client/admin.ts` |
| — talks to the server | `src/client/store.ts` |
| Server API (Node.js + TypeScript, Vercel functions) | `api/` |
| — `/api/content` content (GET public, PUT admin, history, restore) | `api/content.ts` |
| — `/api/feedback` ratings and reviews | `api/feedback.ts` |
| — `/api/messages` contact form inbox | `api/messages.ts` |
| — `/api/upload` image / PDF uploads | `api/upload.ts` |
| — `/api/login` checks the admin password | `api/login.ts` |
| Storage (Vercel Blob, or `.data/` locally), password check | `lib/` |
| Build + local server | `scripts/` |

---

## Step 1 — Project pictures (already included)

The five Work projects use original illustrations in `public/images/` (`work-graphic.svg`, `work-presentation.svg`, `work-canva.svg`, `work-marketing.svg`, `work-cv.svg`). To show real client work instead, upload a picture in Admin → Work, or replace these files.

Optional: save https://gazia-services-website.vercel.app/assets/hero-bg-C5WEVfg2.jpg as `public/images/hero-bg.jpg` for the faded picture behind the hero. Without it the hero simply shows the 3D scene.

## Step 2 — Deploy to Vercel

1. Push this folder to the GitHub repo.
2. vercel.com → **Add New → Project** → import the repo.
   `vercel.json` already sets everything: build command `npm run build`, output directory `public`. Leave the framework preset as **Other**.
3. Deploy.

## Step 3 — Connect storage (required once, 2 minutes)

This is what makes admin edits **stay after a reload and show for every visitor**, and lets visitors send feedback and messages.

1. Vercel → the project → **Storage** tab → **Create** → **Blob** → name it `gazia-services` → access **Public** → **Create**.
2. Connect it to this project (all environments). This adds `BLOB_READ_WRITE_TOKEN` automatically.
3. **Deployments** → newest deployment → **⋯** → **Redeploy**.

Check it worked: open `https://<your-site>/api/content`. It should start with `{"enabled":true`.
- `"enabled":false` → storage isn't connected, or you didn't redeploy after connecting it.
- 404 → the latest code isn't deployed.

The admin panel also shows a green **Live** badge when storage is connected, or a red note explaining what's missing.

---

## Admin panel

- Click **Admin** (top right) or open `/admin` → password **`ghazia4321`**.
- Tabs: Home · Numbers · About · Education · Skills · Languages · Services · Work · Feedback · Messages · Contact · Footer & SEO · Show / hide · History.
- Add, edit, delete and reorder anything. Upload images (they're resized automatically).
- **Save & publish** → live for everyone straight away, and still there after a reload.
- **History** → every publish keeps the previous version; click **Restore** to go back.
- **Backup** downloads all content as a JSON file.
- While logged in, every section shows an **Edit section** button.

### Changing the password
1. Get the SHA-256 hash of the new password (e.g. search "sha256 online", or run `node -e "console.log(require('crypto').createHash('sha256').update('NEW-PASSWORD').digest('hex'))"`).
2. Vercel → Settings → Environment Variables → add `ADMIN_KEY_SHA256` = that hash → Redeploy.
3. Also replace `ADMIN_HASH` in `src/client/store.ts` (used only if the server can't be reached).

The password itself is never stored in the code — only its hash — and it is checked on the server.

## Feedback

Visitors rate the service (1–5 stars) and leave a message. It shows on the site straight away, with an average rating and a scrolling review wall.
In Admin → **Feedback** you can **Hide**, **Show** or **Delete** any review, and add reviews you received elsewhere (WhatsApp, email).

Prefer to approve reviews first? Add the environment variable `FEEDBACK_REQUIRE_APPROVAL` = `1` and redeploy. New reviews then stay hidden until you click **Show**, and the Admin button shows how many are waiting.

## Contact messages

The contact form saves each message. Admin → **Messages** lists them with **Reply** (opens your email app), **Mark read** and **Delete**. The Admin button shows a count of new messages.
If storage isn't connected yet, the form opens the visitor's email app instead, addressed to the email in Admin → Contact.

## Please confirm with the client

- **Numbers** (Projects Completed **25+**, Happy Clients **15+**) are starting values — the old site animates these from 0 in a way that couldn't be read. *Years Learning 7* (2018–2025) and *Skills 23* (10 professional + 13 IT) come from the original content. Change them in Admin → Numbers.
- **Social links** on the old site point to the LinkedIn / Instagram / Facebook home pages. Put Gazia's real profile links in Admin → Contact.

## Local development

```bash
npm install
npm run dev          # builds, watches and serves http://localhost:3000
npm run typecheck    # TypeScript checks for the server and the browser code
```
Locally, content, feedback, messages and uploads are saved in `.data/` (not committed).

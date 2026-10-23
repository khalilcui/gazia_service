# Gazia — Design, Digital & Admin Services

Services website for **Gazia Hussain** (Luton, England): graphic design, Canva templates, digital marketing, Microsoft Office support, CVs, presentations, document formatting, research, email and productivity help.

Built with **TypeScript** (front end and server), **Node.js** serverless functions, **Three.js** and **Vercel Blob** storage.

## Features
- **All original content** from gazia-services-website.vercel.app — About, education timeline, 23 skills with levels, 4 languages, 10 services, 5 portfolio projects, contact details.
- **28 colour themes** (Signature, 7 Blues, 7 Turquoise) — the same set as the portfolio. The whole site, the 3D scenes and the cursor recolour.
- **3D moving background** with the same movement as the portfolio: paper sheets, colour-swatch fans, pencils, slides, cubes, rings and gems drift and travel with the page as you scroll, and follow the mouse.
- **3D hero** — a design-studio screen with orbiting design tools. **3D contact desk** — laptop, mug, papers, plant and floating envelopes.
- **Snake cursor**, 3D skills coverflow, animated skill bars and counters, filterable work gallery with zoom.
- **Feedback section** — star ratings, average score, review wall. New reviews go live at once; the admin can hide or delete them.
- **Contact form inbox** — messages are saved and shown in the admin panel (reply, mark read, delete).
- **Admin panel** (Admin button or `/admin`, password `ghazia4321`): edit, add, delete and reorder everything, upload images. **Save & publish** stores the content on the server — it is still there after a reload and every visitor sees it. Every publish keeps the previous version in **History** so it can be restored.
- Old links still work: `/about`, `/skills`, `/services`, `/services#canva-designs`, `/work`, `/contact`, `/admin`.
- Responsive, keyboard friendly, reduced-motion support.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000 — data is saved in .data/
```

## Deploy
See **[SETUP.md](SETUP.md)** — push to GitHub, import into Vercel, connect a Blob store, redeploy.

/* ==========================================================
   Gazia Services — rendering, themes, routing, 3D, cursor,
   skills coverflow, work gallery, feedback and contact.
   ========================================================== */
import { initAdmin } from "./admin";
import { DEFAULT_CONTENT, IMAGE_FALLBACK } from "./data";
import { hydrateIcons, icon } from "./icons";
import { Scene3D } from "./scene3d";
import { Store } from "./store";
import { THEMES } from "./themes";
import type { Content, FeedbackItem, Theme } from "./types";

export const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
export const esc = (s: unknown): string => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const fine = window.matchMedia("(pointer: fine)").matches;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const safeUrl = (u: string): string => (/^(https?:|mailto:|tel:|\/|#|images\/|data:image\/|blob:)/i.test(u.trim()) ? u.trim() : "#");

let C: Content = DEFAULT_CONTENT;
let theme: Theme = THEMES[0];

/* ---------------- Themes ---------------- */
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)).join(",");
function applyTheme(id: string): void {
  theme = THEMES.find((t) => t.id === id) || THEMES[0];
  const r = document.documentElement.style;
  (["a1", "a2", "a3", "bg", "bg2"] as const).forEach((k) => { r.setProperty("--" + k, theme[k]); r.setProperty("--" + k + "-rgb", hexRgb(theme[k])); });
  document.body.classList.toggle("light", !!theme.light);
  const meta = $<HTMLMetaElement>('meta[name="theme-color"]'); if (meta) meta.content = theme.bg;
  $$(".swatch").forEach((s) => s.classList.toggle("on", s.dataset.id === theme.id));
  Scene3D.setTheme(theme);
  try { localStorage.setItem("gz_theme", theme.id); } catch { /* ignore */ }
}
function buildThemePicker(): void {
  let html = "";
  THEMES.forEach((t) => {
    if (t.group) html += '<p class="theme-group">' + t.group + "</p>";
    html += '<button class="swatch" data-id="' + t.id + '" title="' + t.name + '"><span style="background:linear-gradient(135deg,' + t.a1 + "," + t.a2 + ')"></span>' + t.name + "</button>";
  });
  $("#themeGrid").innerHTML = html;
  $$(".swatch").forEach((b) => { b.onclick = () => applyTheme(b.dataset.id || ""); });
  $("#themeBtn").innerHTML = icon("palette");
  $("#themeClose").innerHTML = icon("x");
  $("#themeBtn").onclick = (e) => { e.stopPropagation(); $("#themePanel").classList.toggle("open"); };
  $("#themeClose").onclick = () => $("#themePanel").classList.remove("open");
  document.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest("#themePanel,#themeBtn")) $("#themePanel").classList.remove("open"); });
}

/* ---------------- Routing: /about, /services#canva-designs … ---------------- */
const SECTIONS = ["home", "about", "skills", "languages", "services", "work", "feedback", "contact"];
function showSection(el: Element | null): void {
  el?.closest("section")?.querySelectorAll(".reveal").forEach((r) => r.classList.add("in"));
}
function goTo(id: string, push = true, smooth = true): void {
  const el = id === "home" ? document.body : document.getElementById(id);
  if (!el) return;
  if (id !== "home") showSection(el);
  if (id === "home") window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "instant" });
  else el.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "start" });
  if (push) history.pushState({ id }, "", id === "home" ? "/" : "/" + id);
  document.body.classList.remove("menu-open");
}
function initRouting(): void {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-go], a[href^='/']");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
    const [path, hash] = href.split("#");
    const id = a.dataset.go || (path === "/" ? "home" : path.slice(1));
    if (!SECTIONS.includes(id)) return;
    e.preventDefault();
    if (hash && document.getElementById(hash)) { highlight(hash); history.pushState({ id }, "", href); return; }
    goTo(id);
  });
  window.addEventListener("popstate", () => routeFromUrl(true));
}
function highlight(id: string, smooth = true): void {
  const el = document.getElementById(id); if (!el) return;
  showSection(el);
  el.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "center" });
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
}
function routeFromUrl(smooth: boolean): void {
  const p = location.pathname.replace(/\/+$/, "").slice(1) || "home";
  if (p === "admin") { document.dispatchEvent(new CustomEvent("open-admin")); return; }
  const hash = location.hash.slice(1);
  if (hash && document.getElementById(hash)) { setTimeout(() => highlight(hash, smooth), 300); return; }
  if (SECTIONS.includes(p) && p !== "home") setTimeout(() => goTo(p, false, smooth), smooth ? 0 : 250);
}

/* ---------------- Rendering ---------------- */
function headingHtml(text: string): string {
  // Colour the last word (or the part after a comma) with the theme gradient.
  const t = esc(text);
  const comma = t.lastIndexOf(", ");
  if (comma > 0) return t.slice(0, comma + 2) + '<span class="grad">' + t.slice(comma + 2) + "</span>";
  return t.replace(/(\S+)$/, '<span class="grad">$1</span>');
}
function bars(list: { name: string; level: number }[]): string {
  return (list || []).map((s) => {
    const l = Math.max(0, Math.min(100, +s.level || 0));
    return '<div class="sbar"><div class="sbar-top"><span>' + esc(s.name) + "</span><b>" + l + '%</b></div><div class="bar"><span style="--w:' + l + '%"></span></div></div>';
  }).join("");
}
function socials(): string {
  const ct = C.contact;
  return ([["linkedin", ct.linkedin, "LinkedIn"], ["instagram", ct.instagram, "Instagram"], ["facebook", ct.facebook, "Facebook"]] as const)
    .filter((x) => x[1]).map((x) => '<a class="soc" href="' + esc(safeUrl(x[1])) + '" target="_blank" rel="noopener" aria-label="' + x[2] + '" title="' + x[2] + '">' + icon(x[0]) + "</a>").join("");
}

export function render(content: Content): void {
  C = content;
  const h = C.hero;
  document.title = C.site.title || DEFAULT_CONTENT.site.title;
  const desc = $<HTMLMetaElement>('meta[name="description"]'); if (desc) desc.content = C.site.description;
  const brand = esc(C.site.brand || "Gazia");
  $("#brandName").innerHTML = brand + '<span class="dot">.</span>';
  $("#footName").innerHTML = brand + '<span class="dot">.</span>';
  $("#footBrand").textContent = C.site.brand;
  $$(".brand-mark").forEach((m) => { m.textContent = (C.site.brand || "G").charAt(0).toUpperCase(); });

  // Hero
  $("#heroAvailable span:last-child").textContent = h.available;
  $("#heroAvailable").style.display = h.available ? "" : "none";
  $("#heroEyebrow").textContent = h.eyebrow;
  $("#heroFirst").textContent = h.firstName;
  $("#heroLast").textContent = h.lastName;
  $("#heroIntro").textContent = h.intro;
  const p = $<HTMLAnchorElement>("#heroPrimary"), s = $<HTMLAnchorElement>("#heroSecondary");
  p.href = safeUrl(h.primary.href); p.innerHTML = esc(h.primary.label) + icon("arrow");
  s.href = safeUrl(h.secondary.href); s.innerHTML = esc(h.secondary.label) + icon("eye");
  $("#heroMeta").innerHTML = [["pin", h.location], ["clock", h.responseTime]].filter((x) => x[1]).map((x) => "<li>" + icon(x[0]) + "<span>" + esc(x[1]) + "</span></li>").join("");
  $("#heroPhoto").innerHTML = h.photo ? '<img src="' + esc(safeUrl(h.photo)) + '" alt="' + esc(h.firstName + " " + h.lastName) + '" />' : "";
  $("#heroPhoto").classList.toggle("has", !!h.photo);
  $("#heroBackdrop").innerHTML = h.backdrop ? '<img src="' + esc(safeUrl(h.backdrop)) + '" alt="" />' : "";
  Scene3D.setScreen(h.screenTitle, h.screenText);

  // About
  const a = C.about;
  $("#aboutEyebrow").textContent = a.eyebrow;
  $("#aboutHeading").innerHTML = headingHtml(a.heading);
  $("#aboutSub").textContent = a.sub;
  $("#aboutGreeting").innerHTML = headingHtml(a.greeting);
  $("#aboutStory").innerHTML = (a.story || []).map((t) => "<p>" + esc(t) + "</p>").join("");
  $("#aboutFacts").innerHTML = (a.facts || []).map((f) => "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>").join("");
  $("#eduTimeline").innerHTML = (C.education || []).map((e) =>
    '<article class="tl-item reveal"><span class="tl-dot">' + icon("book") + '</span><div class="glass tl-card tilt"><span class="period">' + esc(e.period) + "</span><h3>" + esc(e.school) + '</h3><p class="place">' + icon("pin") + esc(e.place) + '</p><p class="tl-text">' + esc(e.text) + "</p></div></article>"
  ).join("");

  // Skills
  const sk = C.skills;
  $("#skillsHeading").innerHTML = headingHtml(sk.heading);
  $("#skillsSub").textContent = sk.sub;
  $("#featuredTitle").textContent = sk.featuredTitle;
  buildCoverflow(sk.featured || []);
  $("#proSkills").innerHTML = bars(sk.professional);
  $("#itSkills").innerHTML = bars(sk.it);

  // Languages
  $("#langHeading").innerHTML = headingHtml(C.languages.heading);
  $("#langSub").textContent = C.languages.sub;
  $("#langGrid").innerHTML = (C.languages.items || []).map((l) =>
    '<article class="glass lang tilt reveal"><span class="lang-flag">' + esc(l.flag) + "</span><h3>" + esc(l.name) + '</h3><span class="lang-level ' + (/fluent|native/i.test(l.level) ? "hi" : "") + '">' + esc(l.level) + "</span></article>"
  ).join("");

  // Services
  const sv = C.services;
  $("#servicesHeading").innerHTML = headingHtml(sv.heading);
  $("#servicesSub").textContent = sv.sub;
  $("#svcGrid").innerHTML = (sv.items || []).map((x, i) =>
    '<article class="glass svc tilt reveal" style="--i:' + i + '" id="' + esc(x.id || "service-" + i) + '"><span class="svc-num">' + String(i + 1).padStart(2, "0") + '</span><span class="svc-ico">' + icon(x.icon) + "</span><h3>" + esc(x.title) + "</h3><p>" + esc(x.text) + "</p>" +
    ((x.points || []).filter(Boolean).length ? '<ul class="svc-points">' + x.points.filter(Boolean).map((pt) => "<li>" + icon("tick") + esc(pt) + "</li>").join("") + "</ul>" : "") +
    '<a class="svc-link" href="/contact" data-go="contact" data-svc="' + esc(x.title) + '">Ask about this ' + icon("arrow") + "</a></article>"
  ).join("");
  $$("[data-svc]").forEach((b) => b.addEventListener("click", () => {
    const sub = $<HTMLInputElement>('#contactForm [name="subject"]'); if (sub && !sub.value) sub.value = "Enquiry: " + (b.dataset.svc || "");
  }));
  $("#svcCtaTitle").textContent = sv.ctaTitle;
  $("#svcCtaText").textContent = sv.ctaText;
  $("#svcCtaBtn").innerHTML = esc(sv.ctaLabel) + icon("arrow");

  // Work
  $("#workHeading").innerHTML = headingHtml(C.work.heading);
  $("#workSub").textContent = C.work.sub;
  buildWork();

  // Stats
  $("#stats").innerHTML = (C.stats || []).map((x) =>
    '<div class="stat-big"><strong data-count="' + (+x.value || 0) + '" data-suffix="' + esc(x.suffix) + '">0' + esc(x.suffix) + "</strong><span>" + esc(x.label) + "</span></div>"
  ).join("");
  countersDone = false;

  // Contact
  const ct = C.contact;
  $("#contactHeading").innerHTML = headingHtml(ct.heading);
  $("#contactText").textContent = ct.text;
  const rows: [string, string, string][] = [];
  if (ct.email) rows.push(["mail", "Email", '<a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a><button class="copy" data-copy="' + esc(ct.email) + '" aria-label="Copy email">' + icon("copy") + "</button>"]);
  if (ct.phone) rows.push(["phone", "Phone", '<a href="tel:' + esc(ct.phone.replace(/\s/g, "")) + '">' + esc(ct.phone) + "</a>"]);
  if (ct.location) rows.push(["pin", "Location", esc(ct.location)]);
  if (ct.responseTime) rows.push(["clock", "Response time", esc(ct.responseTime)]);
  $("#contactList").innerHTML = rows.map((r) => '<li><span class="c-ico">' + icon(r[0]) + "</span><div><small>" + r[1] + "</small><span>" + r[2] + "</span></div></li>").join("");
  $$(".copy").forEach((b) => { b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy || ""); toast("Email copied"); }; });
  $("#contactSocials").innerHTML = socials();
  $("#contactMotto").innerHTML = "<p>" + esc(ct.motto) + "</p>" + icon("heart");

  // Footer
  $("#footTagline").textContent = C.footer.tagline;
  $("#footLoc").textContent = ct.location;
  $("#footServices").innerHTML = (sv.items || []).slice(0, 6).map((x) => '<li><a href="/services#' + esc(x.id) + '" data-go="services">' + esc(x.title) + "</a></li>").join("");
  $("#footEmail").innerHTML = ct.email ? '<a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + "</a>" : "";
  $("#footSocials").innerHTML = socials();
  $("#footCta").innerHTML = esc(C.footer.ctaLabel) + icon("arrow");
  $("#footNote").textContent = C.footer.note;

  renderFeedback();

  // Show / hide sections
  const vis = C.sections || {};
  Object.keys(vis).forEach((k) => {
    const sec = document.getElementById(k); if (sec) sec.style.display = vis[k] === false ? "none" : "";
    const link = $('#navLinks a[data-sec="' + k + '"]'); if (link) link.style.display = vis[k] === false ? "none" : "";
  });

  hydrateIcons();
  observeReveal();
  bindTilt();
}

/* ---------------- Skills coverflow ---------------- */
const flow = { i: 0, n: 0, timer: 0 as number | undefined };
function buildCoverflow(cards: Content["skills"]["featured"]): void {
  const stage = $("#skillStage");
  flow.n = cards.length; if (flow.i >= flow.n) flow.i = 0;
  stage.innerHTML = cards.map((s, i) => {
    const lvl = Math.max(0, Math.min(100, +s.level || 0));
    return '<article class="flow-card glass" data-i="' + i + '"><span class="flow-ico">' + icon(s.icon) + '</span><span class="flow-cat">' + esc(s.category) + "</span><h3>" + esc(s.title) + '</h3><div class="ring" style="--p:' + lvl + '"><b>' + lvl + "%</b></div></article>";
  }).join("");
  $$(".flow-card", stage).forEach((c) => { c.onclick = () => { flow.i = +(c.dataset.i || 0); layoutFlow(); restartFlow(); }; });
  layoutFlow(); restartFlow();
}
function layoutFlow(): void {
  const w = window.innerWidth, gap = w < 640 ? 150 : w < 1000 ? 200 : 240;
  $$(".flow-card").forEach((c, i) => {
    let d = i - flow.i;
    if (d > flow.n / 2) d -= flow.n; if (d < -flow.n / 2) d += flow.n;
    const ad = Math.abs(d);
    c.style.transform = "translate(-50%,-50%) translateX(" + d * gap + "px) translateZ(" + -ad * 170 + "px) rotateY(" + -d * 32 + "deg) scale(" + (d === 0 ? 1.08 : 1 - ad * 0.06) + ")";
    c.style.zIndex = String(20 - ad); c.style.opacity = String(ad > 3 ? 0 : 1 - ad * 0.18);
    c.style.pointerEvents = ad > 3 ? "none" : "";
    c.classList.toggle("active", d === 0);
  });
}
function stepFlow(dir: number): void { if (!flow.n) return; flow.i = (flow.i + dir + flow.n) % flow.n; layoutFlow(); }
function restartFlow(): void { clearInterval(flow.timer); if (!reduce) flow.timer = window.setInterval(() => stepFlow(1), 3500); }
function initFlowControls(): void {
  $("#skillPrev").innerHTML = icon("left"); $("#skillNext").innerHTML = icon("right");
  $("#skillPrev").onclick = () => { stepFlow(-1); restartFlow(); };
  $("#skillNext").onclick = () => { stepFlow(1); restartFlow(); };
  const el = $("#skillFlow"); let sx: number | null = null;
  el.addEventListener("mouseenter", () => clearInterval(flow.timer));
  el.addEventListener("mouseleave", restartFlow);
  el.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { stepFlow(dx < 0 ? 1 : -1); restartFlow(); } sx = null; });
  window.addEventListener("resize", layoutFlow);
}

/* ---------------- Work gallery ---------------- */
let workFilter = "All";
function buildWork(): void {
  const items = C.work.items || [];
  const cats = ["All", ...Array.from(new Set(items.map((x) => x.category).filter(Boolean)))];
  if (!cats.includes(workFilter)) workFilter = "All";
  $("#workFilters").innerHTML = cats.map((c) => '<button role="tab" class="filter ' + (c === workFilter ? "on" : "") + '" aria-selected="' + (c === workFilter) + '" data-f="' + esc(c) + '">' + esc(c) + "</button>").join("");
  $$("#workFilters .filter").forEach((b) => { b.onclick = () => { workFilter = b.dataset.f || "All"; buildWork(); }; });
  const shown = items.map((x, i) => ({ x, i })).filter(({ x }) => workFilter === "All" || x.category === workFilter);
  $("#workGrid").innerHTML = shown.map(({ x, i }) =>
    '<figure class="glass work tilt" data-i="' + i + '" tabindex="0"><div class="work-img"><img src="' + esc(safeUrl(x.image)) + '" alt="' + esc(x.title) + '" loading="lazy" /><span class="work-zoom">' + icon("eye") + "</span></div><figcaption><span class=\"work-cat\">" + esc(x.category) + "</span><h3>" + esc(x.title) + "</h3></figcaption></figure>"
  ).join("");
  $$("#workGrid .work").forEach((f) => {
    const open = () => {
      const it = items[+(f.dataset.i || 0)];
      const link = it.link ? '<a class="btn btn-outline btn-sm" href="' + esc(safeUrl(it.link)) + '" target="_blank" rel="noopener">Open project ' + icon("external") + "</a>" : "";
      openLightbox($<HTMLImageElement>("img", f).src, '<span class="work-cat">' + esc(it.category) + "</span><strong>" + esc(it.title) + "</strong>" + (it.text ? "<span>" + esc(it.text) + "</span>" : "") + link);
    };
    f.onclick = open;
    f.onkeydown = (e) => { if (e.key === "Enter") open(); };
    requestAnimationFrame(() => f.classList.add("in"));
  });
  bindTilt();
}

/* ---------------- Lightbox ---------------- */
function openLightbox(src: string, capHtml: string): void {
  const img = $<HTMLImageElement>("#lbImg");
  img.src = src; img.classList.remove("zoom2");
  $("#lbCap").innerHTML = capHtml;
  $("#lightbox").classList.add("open"); $("#lightbox").setAttribute("aria-hidden", "false");
  document.body.classList.add("noscroll");
}
function closeLightbox(): void { $("#lightbox").classList.remove("open"); $("#lightbox").setAttribute("aria-hidden", "true"); document.body.classList.remove("noscroll"); }
function initLightbox(): void {
  $("#lbClose").innerHTML = icon("x");
  $("#lbClose").onclick = closeLightbox;
  $("#lightbox").addEventListener("click", (e) => { if ((e.target as HTMLElement).id === "lightbox") closeLightbox(); });
  $("#lbImg").addEventListener("click", function (this: HTMLElement) { this.classList.toggle("zoom2"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
}

/* ---------------- Counters & skill bars ---------------- */
let countersDone = false;
function runCounters(): void {
  if (countersDone) return; countersDone = true;
  $$("[data-count]").forEach((el) => {
    const target = +(el.dataset.count || 0), suf = el.dataset.suffix || "";
    if (reduce) { el.textContent = target + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (now: number) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * e) + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

/* ---------------- Snake cursor ---------------- */
function initSnake(): void {
  const cv = $<HTMLCanvasElement>("#snake");
  if (!fine || reduce) { cv.remove(); return; }
  document.documentElement.classList.add("snake-on");
  const cx = cv.getContext("2d")!; const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rs = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  rs(); addEventListener("resize", rs);
  const N = 20, pts: { x: number; y: number }[] = []; const m = { x: innerWidth / 2, y: innerHeight / 2 };
  for (let i = 0; i < N; i++) pts.push({ x: m.x, y: m.y });
  let hot = false, visible = false, down = false;
  addEventListener("pointermove", (e) => { m.x = e.clientX; m.y = e.clientY; visible = true; hot = !!(e.target as HTMLElement).closest?.("a,button,.stars-input,.work,.flow-card,.svc,input,textarea,select,label"); }, { passive: true });
  addEventListener("pointerdown", () => { down = true; }); addEventListener("pointerup", () => { down = false; });
  document.addEventListener("mouseleave", () => { visible = false; });
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  (function loop() {
    pts[0].x += (m.x - pts[0].x) * 0.55; pts[0].y += (m.y - pts[0].y) * 0.55;
    for (let i = 1; i < N; i++) { pts[i].x += (pts[i - 1].x - pts[i].x) * 0.42; pts[i].y += (pts[i - 1].y - pts[i].y) * 0.42; }
    cx.clearRect(0, 0, innerWidth, innerHeight);
    if (visible) {
      const head = hex(theme.light ? theme.a1 : theme.a3), mid = hex(theme.a2), tail = hex(theme.a1);
      for (let i = N - 1; i >= 0; i--) {
        const k = i / (N - 1); const c = k < 0.5 ? mix(head, mid, k * 2) : mix(mid, tail, (k - 0.5) * 2);
        let r = 7.5 - k * 5.2; if (i === 0) r = hot ? 13 : down ? 5 : 8;
        cx.beginPath(); cx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
        cx.fillStyle = "rgba(" + c.join(",") + "," + (i === 0 && hot ? 0.35 : 1 - k * 0.7) + ")"; cx.fill();
        if (i === 0) { cx.lineWidth = 1.5; cx.strokeStyle = "rgba(" + mid.join(",") + ",0.9)"; cx.stroke(); }
      }
    }
    requestAnimationFrame(loop);
  })();
}

/* ---------------- Feedback ---------------- */
const STAR = '<svg viewBox="0 0 24 24" class="star" aria-hidden="true"><path d="M12 2.8l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z"/></svg>';
const RATE_TEXT = ["Tap a star", "Poor", "Fair", "Good", "Very good", "Excellent"];
let remoteFb: FeedbackItem[] = [], fbRating = 0;
function starRow(n: number): string { let h = ""; for (let i = 1; i <= 5; i++) h += '<span class="' + (i <= Math.round(n) ? "on" : "") + '">' + STAR + "</span>"; return '<span class="stars" aria-label="' + n.toFixed(1) + ' out of 5">' + h + "</span>"; }
function fbDate(d?: string): string { if (!d) return ""; const x = new Date(d); return isNaN(+x) ? "" : x.toLocaleDateString(undefined, { month: "short", year: "numeric" }); }
function renderFeedback(): void {
  const f = C.feedback;
  $("#fbHeading").innerHTML = headingHtml(f.heading || "");
  $("#fbText").textContent = f.text || "";
  const items = (f.items || []).concat(remoteFb).filter((x) => x && x.message);
  const n = items.length;
  if (n) {
    const avg = items.reduce((a, x) => a + (+x.rating || 0), 0) / n;
    const rows = [5, 4, 3, 2, 1].map((k) => {
      const c = items.filter((x) => Math.round(+x.rating) === k).length;
      return '<div class="fb-bar"><span>' + k + "</span>" + STAR + '<div class="track"><i style="--w:' + Math.round(c / n * 100) + '%"></i></div><b>' + c + "</b></div>";
    }).join("");
    $("#fbSummary").innerHTML = '<p class="fb-avg">' + avg.toFixed(1) + "<small>/5</small></p>" + starRow(avg) + '<p class="fb-total">Based on ' + n + " review" + (n > 1 ? "s" : "") + '</p><div class="fb-bars">' + rows + "</div>";
  } else {
    $("#fbSummary").innerHTML = '<div class="fb-empty-ico">' + icon("star") + '</div><p class="fb-avg small">No reviews yet</p>' + starRow(0) + '<p class="fb-total">Be the first to rate the service.</p>';
  }
  const card = (x: FeedbackItem) => {
    const ini = esc((x.name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase());
    return '<article class="glass fb-card"><span class="fb-quote">&ldquo;</span>' + starRow(+x.rating || 0) + '<p class="fb-text">' + esc(x.message) + '</p><div class="fb-who"><span class="fb-av">' + ini + "</span><div><strong>" + esc(x.name) + "</strong><small>" + esc([x.role, fbDate(x.created_at)].filter(Boolean).join(" · ")) + "</small></div></div></article>";
  };
  const wall = $("#fbWall");
  if (!n) { wall.innerHTML = ""; wall.className = "fb-wall"; return; }
  if (n >= 3 && !reduce) {
    const cards = items.map(card).join("");
    wall.className = "fb-wall marquee in";
    wall.innerHTML = '<div class="fb-track" style="--dur:' + Math.max(25, n * 8) + 's">' + cards + cards + "</div>";
  } else { wall.className = "fb-wall static in"; wall.innerHTML = items.map(card).join(""); }
}
export async function reloadFeedback(): Promise<void> { remoteFb = await Store.feedback.listPublic(); renderFeedback(); }
function initFeedbackForm(): void {
  const box = $("#starsInput"), txt = $("#rateText"), form = $<HTMLFormElement>("#fbForm"), out = $("#fbMsgOut"), msg = $<HTMLTextAreaElement>("#fbMsg");
  box.innerHTML = [1, 2, 3, 4, 5].map((i) => '<button type="button" role="radio" aria-checked="false" aria-label="' + i + " star" + (i > 1 ? "s" : "") + " — " + RATE_TEXT[i] + '" data-v="' + i + '">' + STAR + "</button>").join("");
  const btns = $$("button", box);
  const paint = (v: number) => { btns.forEach((b) => b.classList.toggle("on", +(b.dataset.v || 0) <= v)); txt.textContent = RATE_TEXT[v] || RATE_TEXT[0]; };
  const setMsg = (t: string, cls = "") => { out.textContent = t; out.className = "form-msg " + cls; };
  btns.forEach((b) => {
    b.addEventListener("mouseenter", () => paint(+(b.dataset.v || 0)));
    b.addEventListener("click", () => {
      fbRating = +(b.dataset.v || 0);
      btns.forEach((x) => x.setAttribute("aria-checked", String(+(x.dataset.v || 0) === fbRating)));
      paint(fbRating); b.classList.add("pop"); setTimeout(() => b.classList.remove("pop"), 400); setMsg("");
    });
  });
  box.addEventListener("mouseleave", () => paint(fbRating));
  msg.addEventListener("input", () => { $("#fbCount").textContent = msg.value.length + " / 800"; });
  form.addEventListener("input", () => { if (out.classList.contains("err")) setMsg(""); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hp = $<HTMLInputElement>("#fbHp").value; if (hp) return;
    const name = $<HTMLInputElement>("#fbName").value.trim(), role = $<HTMLInputElement>("#fbRole").value.trim(), message = msg.value.trim();
    if (!fbRating) return setMsg("Choose a star rating first.", "err");
    if (!name) { setMsg("Add your name.", "err"); $("#fbName").focus(); return; }
    if (message.length < 3) { setMsg("Write a short message (at least 3 characters).", "err"); msg.focus(); return; }
    let last = 0; try { last = +(localStorage.getItem("gz_fb_last") || 0); } catch { /* ignore */ }
    if (Date.now() - last < 60000) return setMsg("Thanks! Please wait a minute before sending more feedback.", "err");
    const btn = $<HTMLButtonElement>("button[type=submit]", form); btn.disabled = true; setMsg("Sending…");
    try {
      const res = await Store.feedback.submit({ name, role, rating: fbRating, message, website: hp });
      try { localStorage.setItem("gz_fb_last", String(Date.now())); } catch { /* ignore */ }
      form.reset(); fbRating = 0; paint(0); $("#fbCount").textContent = "0 / 800";
      if (res.approved) { setMsg("Thank you! Your feedback is now live on this page.", "ok"); reloadFeedback(); }
      else setMsg("Thank you! Your feedback was sent and will appear once it's approved.", "ok");
      form.classList.add("sent"); setTimeout(() => form.classList.remove("sent"), 1200);
    } catch (err) {
      setMsg((err as { code?: string }).code === "not-connected" ? "Feedback isn't available right now. Please try again later." : "Couldn't send your feedback. Check your connection and try again.", "err");
    }
    btn.disabled = false;
  });
}

/* ---------------- Contact form ---------------- */
function initContactForm(): void {
  const f = $<HTMLFormElement>("#contactForm"), msg = $("#formMsg"), ta = $<HTMLTextAreaElement>("#ctMsg");
  const setMsg = (t: string, cls = "") => { msg.textContent = t; msg.className = "form-msg " + cls; };
  ta.addEventListener("input", () => { $("#ctCount").textContent = ta.value.length + " / 2000"; });
  f.addEventListener("input", () => { if (msg.classList.contains("err")) setMsg(""); });
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)) as Record<string, string>;
    if (d.website) return;
    if (!d.name.trim() || d.message.trim().length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return setMsg("Add your name, a valid email and a message.", "err");
    const btn = $<HTMLButtonElement>("button[type=submit]", f); btn.disabled = true; setMsg("Sending…");
    try {
      await Store.messages.send({ name: d.name.trim(), email: d.email.trim(), subject: d.subject.trim(), message: d.message.trim() });
      f.reset(); $("#ctCount").textContent = "0 / 2000";
      setMsg("Message sent — Gazia will reply " + (C.contact.responseTime ? C.contact.responseTime.toLowerCase() : "soon") + ".", "ok");
    } catch (err) {
      if ((err as { code?: string }).code === "not-connected" && C.contact.email) {
        const body = encodeURIComponent(d.message + "\n\n— " + d.name + " (" + d.email + ")");
        location.href = "mailto:" + C.contact.email + "?subject=" + encodeURIComponent(d.subject || "Enquiry from " + d.name) + "&body=" + body;
        setMsg("Opening your email app…", "ok");
      } else setMsg("Couldn't send right now. Please email " + C.contact.email + " instead.", "err");
    }
    btn.disabled = false;
  });
}

/* ---------------- Nav, reveal, tilt ---------------- */
let io: IntersectionObserver | null = null;
function observeReveal(): void {
  if (!("IntersectionObserver" in window) || reduce) { $$(".reveal").forEach((e) => e.classList.add("in")); runCounters(); return; }
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io!.unobserve(e.target);
    if (e.target.id === "stats") runCounters();
  }), { threshold: 0.12 });
  $$(".reveal:not(.in)").forEach((e) => io!.observe(e));
  if ($("#stats").classList.contains("in")) runCounters();
}
function bindTilt(): void {
  if (!fine || reduce) return;
  $$(".tilt").forEach((el) => {
    if (el.dataset.tb) return; el.dataset.tb = "1";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "perspective(800px) rotateX(" + (-y * 8) + "deg) rotateY(" + (x * 10) + "deg) translateZ(6px)";
      el.style.setProperty("--mx", (x + 0.5) * 100 + "%"); el.style.setProperty("--my", (y + 0.5) * 100 + "%");
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}
function initNav(): void {
  const nav = $("#nav"), links = $$<HTMLAnchorElement>("#navLinks a");
  $("#menuBtn").onclick = () => document.body.classList.toggle("menu-open");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    nav.classList.toggle("scrolled", scrollY > 20);
    let cur = "home";
    $$("main section").forEach((s) => { if (s.style.display !== "none" && s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    if (cur === "languages") cur = "skills";
    links.forEach((l) => l.classList.toggle("active", l.dataset.go === cur));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
}

/* ---------------- Toast & confirm ---------------- */
let tt: number | undefined;
export function toast(t: string, kind = ""): void { const el = $("#toast"); el.textContent = t; el.className = "toast show " + kind; clearTimeout(tt); tt = window.setTimeout(() => { el.className = "toast"; }, 3000); }
export function ask(text: string, okLabel = "Confirm"): Promise<boolean> {
  return new Promise((res) => {
    const m = document.createElement("div"); m.className = "modal open"; m.setAttribute("role", "dialog");
    m.innerHTML = '<div class="glass modal-box"><h3>' + icon("trash") + esc(okLabel) + '</h3><p class="muted">' + esc(text) + '</p><div class="modal-actions"><button class="btn btn-outline" data-a="0">Cancel</button><button class="btn btn-primary" data-a="1">' + esc(okLabel) + "</button></div></div>";
    document.body.appendChild(m);
    const done = (v: boolean) => { m.remove(); res(v); };
    m.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>("[data-a]"); if (b) done(b.dataset.a === "1"); else if (e.target === m) done(false); });
    $<HTMLButtonElement>('[data-a="1"]', m).focus();
  });
}

/* ---------------- Images: local file → original site → placeholder ---------------- */
document.addEventListener("error", (e) => {
  const el = e.target as HTMLImageElement;
  if (el.tagName !== "IMG" || el.dataset.fb === "2") return;
  const m = (el.getAttribute("src") || "").match(/^\/?images\/([\w.-]+)$/);
  if (m && IMAGE_FALLBACK[m[1]] && !el.dataset.fb) { el.dataset.fb = "1"; el.src = IMAGE_FALLBACK[m[1]]; return; }
  el.dataset.fb = "2";
  if (!el.getAttribute("alt")) { el.style.display = "none"; return; } // decorative image: just hide it
  el.src = placeholder(el.getAttribute("alt") || "Project");
}, true);
function placeholder(label: string): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + theme.a1 + '"/><stop offset="1" stop-color="' + theme.a2 + '"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="315" font-family="Arial" font-weight="700" font-size="40" fill="white" text-anchor="middle">' + esc(label) + "</text></svg>";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ---------------- Boot ---------------- */
export const App = {
  render, toast, ask, esc, reloadFeedback,
  get: (): Content => C,
  theme: (): Theme => theme
};
export type AppApi = typeof App;

async function boot(): Promise<void> {
  $("#year").textContent = String(new Date().getFullYear());
  buildThemePicker();
  let saved: string | null = null; try { saved = localStorage.getItem("gz_theme"); } catch { /* ignore */ }
  applyTheme(saved || "electric");
  initRouting(); initFlowControls(); initLightbox(); initNav(); initContactForm(); initFeedbackForm(); initSnake();
  hydrateIcons();
  initAdmin(App);
  const content = await Store.load();
  render(content);
  Scene3D.start();
  $("#loader").classList.add("done");
  routeFromUrl(false);
  reloadFeedback();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { boot(); });
else boot();

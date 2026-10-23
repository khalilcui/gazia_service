/* ==========================================================
   Admin panel — edit every section without touching code.
   Opens only after the admin password is accepted. "Save &
   publish" stores the content on the server, so the change is
   still there after a reload and every visitor sees it.
   ========================================================== */
import { icon, ICON_NAMES } from "./icons";
import { Store } from "./store";
import type { AppApi } from "./main";
import type { Content } from "./types";

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

type FieldDef =
  | { t: "text" } | { t: "textarea" } | { t: "number"; max?: number } | { t: "icon" } | { t: "image" } | { t: "file" }
  | { t: "strings"; long?: boolean } | { t: "list"; item: [string, string, FieldDef][]; blank: Record<string, unknown> };
type Field = [string, string, FieldDef];
interface Tab { key: string; label: string; fields?: Field[]; special?: "feedback" | "messages" | "sections" | "versions" }

const S: FieldDef = { t: "text" }, TA: FieldDef = { t: "textarea" }, LVL: FieldDef = { t: "number", max: 100 };
const SVC_ICONS = ICON_NAMES.filter((n) => !["left", "right", "up", "down", "x", "plus", "trash", "save", "logout", "pause", "play", "refresh", "copy", "upload"].includes(n));

const TABS: Tab[] = [
  { key: "hero", label: "Home", fields: [
    ["hero.available", "Availability badge (leave empty to hide)", S], ["hero.eyebrow", "Small heading", S],
    ["hero.firstName", "First name", S], ["hero.lastName", "Last name", S], ["hero.intro", "Intro text", TA],
    ["hero.location", "Location", S], ["hero.responseTime", "Response time line", S],
    ["hero.primary.label", "Main button text", S], ["hero.primary.href", "Main button link (e.g. /services)", S],
    ["hero.secondary.label", "Second button text", S], ["hero.secondary.href", "Second button link (e.g. /work)", S],
    ["hero.screenTitle", "3D screen — title", S], ["hero.screenText", "3D screen — subtitle", S],
    ["hero.photo", "Profile photo (optional, floats over the 3D screen)", { t: "image" }],
    ["hero.backdrop", "Faded background picture (optional)", { t: "image" }]
  ] },
  { key: "stats", label: "Numbers", fields: [
    ["stats", "Counters", { t: "list", item: [["value", "Number", { t: "number", max: 1000000 }], ["suffix", "After the number (e.g. +)", S], ["label", "Label", S]], blank: { value: 1, suffix: "+", label: "New counter" } }]
  ] },
  { key: "about", label: "About", fields: [
    ["about.eyebrow", "Small heading", S], ["about.heading", "Heading", S], ["about.sub", "Sub-heading", TA],
    ["about.greeting", "Greeting", S], ["about.story", "Story paragraphs", { t: "strings", long: true }],
    ["about.facts", "Quick facts", { t: "list", item: [["label", "Label", S], ["value", "Value", S]], blank: { label: "Label", value: "Value" } }]
  ] },
  { key: "education", label: "Education", fields: [
    ["education", "Timeline", { t: "list", item: [["period", "Years", S], ["school", "School / college", S], ["place", "Place", S], ["text", "What you gained", TA]], blank: { period: "", school: "New school", place: "", text: "" } }]
  ] },
  { key: "skills", label: "Skills", fields: [
    ["skills.heading", "Heading", S], ["skills.sub", "Sub-heading", TA], ["skills.featuredTitle", "3D cards title", S],
    ["skills.featured", "3D skill cards", { t: "list", item: [["icon", "Icon", { t: "icon" }], ["title", "Skill", S], ["category", "Category", S], ["level", "Level %", LVL]], blank: { icon: "star", title: "New skill", category: "Professional", level: 85 } }],
    ["skills.professional", "Professional skills", { t: "list", item: [["name", "Skill", S], ["level", "Level %", LVL]], blank: { name: "New skill", level: 85 } }],
    ["skills.it", "IT & digital skills", { t: "list", item: [["name", "Skill", S], ["level", "Level %", LVL]], blank: { name: "New skill", level: 85 } }]
  ] },
  { key: "languages", label: "Languages", fields: [
    ["languages.heading", "Heading", S], ["languages.sub", "Sub-heading", TA],
    ["languages.items", "Languages", { t: "list", item: [["flag", "Flag / emoji", S], ["name", "Language", S], ["level", "Level (Fluent, Conversational…)", S]], blank: { flag: "🌍", name: "New language", level: "Conversational" } }]
  ] },
  { key: "services", label: "Services", fields: [
    ["services.heading", "Heading", S], ["services.sub", "Sub-heading", TA],
    ["services.items", "Services", { t: "list", item: [["icon", "Icon", { t: "icon" }], ["title", "Title", S], ["text", "Short description", TA], ["points", "What's included (optional)", { t: "strings" }], ["id", "Link name (used in /services#…)", S]], blank: { id: "", icon: "sparkle", title: "New service", text: "", points: [] } }],
    ["services.ctaTitle", "Bottom box — heading", S], ["services.ctaText", "Bottom box — text", TA], ["services.ctaLabel", "Bottom box — button", S]
  ] },
  { key: "work", label: "Work", fields: [
    ["work.heading", "Heading", S], ["work.sub", "Sub-heading", TA],
    ["work.items", "Projects (categories become the filter buttons)", { t: "list", item: [["image", "Image", { t: "image" }], ["title", "Title", S], ["category", "Category", S], ["text", "Description (shown when opened)", TA], ["link", "Link (optional)", S]], blank: { image: "", title: "New project", category: "Graphic Designs", text: "", link: "" } }]
  ] },
  { key: "feedback", label: "Feedback", special: "feedback" },
  { key: "messages", label: "Messages", special: "messages" },
  { key: "contact", label: "Contact", fields: [
    ["contact.heading", "Heading", S], ["contact.text", "Text", TA], ["contact.email", "Email", S], ["contact.phone", "Phone (optional)", S],
    ["contact.location", "Location", S], ["contact.responseTime", "Response time", S],
    ["contact.linkedin", "LinkedIn link", S], ["contact.instagram", "Instagram link", S], ["contact.facebook", "Facebook link", S],
    ["contact.motto", "Sign over the 3D desk", S]
  ] },
  { key: "footer", label: "Footer & SEO", fields: [
    ["site.brand", "Brand name", S], ["site.title", "Browser tab title", S], ["site.description", "Search engine description", TA],
    ["footer.tagline", "Footer tagline", TA], ["footer.ctaLabel", "Footer button", S], ["footer.note", "Copyright note", S]
  ] },
  { key: "sections", label: "Show / hide", special: "sections" },
  { key: "versions", label: "History", special: "versions" }
];
const SEC_TAB: Record<string, string> = { home: "hero", about: "about", skills: "skills", languages: "languages", services: "services", work: "work", feedback: "feedback", contact: "contact" };

export function initAdmin(App: AppApi): void {
  const esc = App.esc;
  let draft: Content | null = null, tab = "hero", dirty = false, previewT: number | undefined;
  const D = () => draft as unknown as Record<string, unknown>;

  /* ---------- path helpers ---------- */
  function get(path: string): unknown { return path.split(".").reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), D()); }
  function set(path: string, val: unknown): void {
    const ks = path.split("."), last = ks.pop()!;
    const o = ks.reduce<Record<string, unknown>>((acc, k) => acc[k] as Record<string, unknown>, D()); o[last] = val;
  }
  function changed(): void {
    dirty = true; $("#apSave")?.classList.add("pulse");
    clearTimeout(previewT); previewT = window.setTimeout(() => App.render(JSON.parse(JSON.stringify(draft))), 250);
  }
  const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

  /* ---------- fields ---------- */
  function field(path: string, label: string, d: FieldDef): string {
    const v = get(path);
    const sv = v == null ? "" : String(v);
    const lab = '<span class="ap-label">' + esc(label) + "</span>";
    switch (d.t) {
      case "textarea": return '<label class="ap-field">' + lab + '<textarea data-p="' + path + '" rows="3">' + esc(sv) + "</textarea></label>";
      case "number": return '<label class="ap-field">' + lab + '<input type="number" min="0" max="' + (d.max || 100) + '" data-p="' + path + '" data-num="' + (d.max || 100) + '" value="' + esc(sv) + '" /></label>';
      case "icon": return '<label class="ap-field">' + lab + '<div class="ap-iconsel"><span>' + icon(sv) + '</span><select data-p="' + path + '">' + SVC_ICONS.map((n) => "<option" + (n === sv ? " selected" : "") + ">" + n + "</option>").join("") + "</select></div></label>";
      case "image": {
        const up = sv.indexOf("data:") === 0;
        return '<div class="ap-field">' + lab + '<div class="ap-img">' + (sv ? '<img src="' + esc(sv) + '" alt="" />' : '<span class="ap-noimg">No image</span>') +
          '<div><input data-p="' + path + '" placeholder="Paste an image link…" value="' + esc(up ? "(uploaded image)" : sv) + '" ' + (up ? "readonly" : "") + ' /><label class="ap-btn">' + icon("upload") + 'Upload<input type="file" accept="image/*" data-up="' + path + '" hidden /></label>' + (sv ? '<button class="ap-btn ghost" data-clear="' + path + '">' + icon("x") + "Remove</button>" : "") + "</div></div></div>";
      }
      case "file": return '<div class="ap-field">' + lab + '<div class="ap-row"><input data-p="' + path + '" placeholder="Paste a link…" value="' + esc(sv) + '" /><label class="ap-btn">' + icon("upload") + 'Upload<input type="file" accept=".pdf" data-upf="' + path + '" hidden /></label></div></div>';
      case "strings": return strings(path, label, !!d.long);
      case "list": return list(path, label, d.item, d.blank);
      default: return '<label class="ap-field">' + lab + '<input data-p="' + path + '" value="' + esc(sv) + '" /></label>';
    }
  }
  function moveBtns(path: string, i: number, n: number): string {
    return '<button class="ap-mini" data-mv="' + path + "|" + i + '|-1" ' + (i === 0 ? "disabled" : "") + ' aria-label="Move up">' + icon("up") + "</button>" +
      '<button class="ap-mini" data-mv="' + path + "|" + i + '|1" ' + (i === n - 1 ? "disabled" : "") + ' aria-label="Move down">' + icon("down") + "</button>" +
      '<button class="ap-mini danger" data-del="' + path + "|" + i + '" aria-label="Delete">' + icon("trash") + "</button>";
  }
  function strings(path: string, label: string, long: boolean): string {
    const arr = (get(path) as string[]) || [];
    return '<div class="ap-group"><div class="ap-ghead"><span class="ap-label">' + esc(label) + " (" + arr.length + ')</span></div><div class="ap-strings">' +
      arr.map((s, i) => '<div class="ap-str">' + (long ? '<textarea rows="3" data-p="' + path + "." + i + '">' + esc(s) + "</textarea>" : '<input data-p="' + path + "." + i + '" value="' + esc(s) + '" />') + moveBtns(path, i, arr.length) + "</div>").join("") +
      '</div><button class="ap-add" data-adds="' + path + '">' + icon("plus") + "Add</button></div>";
  }
  function list(path: string, label: string, item: Field[], blank: Record<string, unknown>): string {
    const arr = (get(path) as unknown[]) || [];
    return '<div class="ap-group"><div class="ap-ghead"><span class="ap-label">' + esc(label) + " (" + arr.length + ")</span></div>" +
      arr.map((_, i) => '<div class="ap-item"><div class="ap-itembar"><span>#' + (i + 1) + "</span><div>" + moveBtns(path, i, arr.length) + "</div></div>" + item.map((f) => field(path + "." + i + "." + f[0], f[1], f[2])).join("") + "</div>").join("") +
      '<button class="ap-add" data-addl="' + path + "\" data-blank='" + esc(JSON.stringify(blank)) + "'>" + icon("plus") + "Add new</button></div>";
  }
  function tabBody(t: Tab): string {
    if (t.fields) return t.fields.map((f) => field(f[0], f[1], f[2])).join("");
    if (t.special === "feedback") return field("feedback.heading", "Section heading", S) + field("feedback.text", "Intro text", TA) +
      '<div class="ap-group"><div class="ap-ghead"><span class="ap-label">Visitor feedback</span></div><div id="apInbox"><p class="ap-hint">Loading…</p></div><button class="ap-btn ghost" id="apInboxRefresh">' + icon("refresh") + "Refresh</button></div>" +
      list("feedback.items", "Reviews you add yourself (e.g. from WhatsApp or email)", [["name", "Name", S], ["role", "Service / who they are", S], ["rating", "Stars (1–5)", { t: "number", max: 5 }], ["message", "Message", TA]], { name: "", role: "", rating: 5, message: "" });
    if (t.special === "messages") return '<p class="ap-hint">Messages people send through the contact form.</p><div id="apMessages"><p class="ap-hint">Loading…</p></div><button class="ap-btn ghost" id="apMsgRefresh">' + icon("refresh") + "Refresh</button>";
    if (t.special === "sections") return '<p class="ap-hint">Hidden sections disappear from the page and the menu.</p>' + Object.keys(draft!.sections).map((k) =>
      '<label class="ap-toggle"><input type="checkbox" data-tog="' + k + '" ' + (draft!.sections[k] !== false ? "checked" : "") + " /><span></span>" + k.charAt(0).toUpperCase() + k.slice(1) + "</label>").join("");
    if (t.special === "versions") return '<p class="ap-hint">Every time you publish, the previous version is kept. Restore one if something went wrong.</p><div id="apVersions"><p class="ap-hint">Loading…</p></div>';
    return "";
  }

  /* ---------- feedback inbox ---------- */
  const stars5 = (n: number) => { n = Math.max(0, Math.min(5, Math.round(+n || 0))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); };
  function storageNote(): string {
    return Store.mode === "server"
      ? '<p class="ap-note ok">' + icon("check") + "<span><strong>Storage connected.</strong> Everything you publish is live for every visitor.</span></p>"
      : '<p class="ap-note err">' + icon("x") + "<span><strong>Storage is not connected.</strong> " + esc(Store.problem) + " Until then, visitors can't send feedback or messages and your edits stay in this browser.</span></p>";
  }
  async function loadInbox(): Promise<void> {
    const box = $("#apInbox"); if (!box) return;
    const r = $("#apInboxRefresh"); if (r) r.onclick = () => { loadInbox(); };
    if (Store.mode !== "server") { box.innerHTML = storageNote(); return; }
    let rows;
    try { rows = await Store.feedback.listAll(); } catch (e) { box.innerHTML = '<p class="ap-hint">Couldn\'t load feedback: ' + esc((e as Error).message) + "</p>"; return; }
    updateBadge();
    if (!rows.length) { box.innerHTML = '<p class="ap-hint">No feedback yet.</p>'; return; }
    const hidden = rows.filter((x) => !x.approved).length;
    box.innerHTML = (hidden ? '<p class="ap-note">' + icon("bell") + "<span><strong>" + hidden + " hidden.</strong> Click <b>Show</b> to put it on the website.</span></p>" : "") + rows.map((x) => {
      const live = !!x.approved;
      return '<div class="ap-card ' + (live ? "" : "pending") + '"><div class="ap-card-head"><strong>' + esc(x.name) + (x.role ? " · " + esc(x.role) : "") + '</strong><span class="ap-badge ' + (live ? "live" : "wait") + '">' + (live ? "Live" : "Hidden") + '</span></div><div class="ap-stars">' + stars5(x.rating) + "</div><p>" + esc(x.message) + '</p><div class="ap-actions">' +
        (live ? '<button class="ap-btn ghost" data-fbhide="' + esc(x.id) + '">' + icon("eye") + "Hide</button>" : '<button class="ap-btn" data-fbok="' + esc(x.id) + '">' + icon("check") + "Show</button>") +
        '<button class="ap-btn ghost" data-fbdel="' + esc(x.id) + '">' + icon("trash") + "Delete</button></div></div>";
    }).join("");
    $$("[data-fbok],[data-fbhide]", box).forEach((b) => {
      b.onclick = async () => {
        b.setAttribute("disabled", "");
        const show = !!b.dataset.fbok;
        try { await Store.feedback.setApproved((b.dataset.fbok || b.dataset.fbhide)!, show); App.reloadFeedback(); loadInbox(); App.toast(show ? "Now live on the website" : "Hidden from the website", "ok"); }
        catch (e) { App.toast("Couldn't update: " + (e as Error).message, "err"); b.removeAttribute("disabled"); }
      };
    });
    $$("[data-fbdel]", box).forEach((b) => {
      b.onclick = async () => {
        if (!(await App.ask("This feedback will be deleted permanently.", "Delete"))) return;
        try { await Store.feedback.remove(b.dataset.fbdel!); App.reloadFeedback(); loadInbox(); App.toast("Feedback deleted"); }
        catch (e) { App.toast("Couldn't delete: " + (e as Error).message, "err"); }
      };
    });
  }

  /* ---------- messages inbox ---------- */
  async function loadMessages(): Promise<void> {
    const box = $("#apMessages"); if (!box) return;
    const r = $("#apMsgRefresh"); if (r) r.onclick = () => { loadMessages(); };
    if (Store.mode !== "server") { box.innerHTML = storageNote(); return; }
    let rows;
    try { rows = await Store.messages.listAll(); } catch (e) { box.innerHTML = '<p class="ap-hint">Couldn\'t load messages: ' + esc((e as Error).message) + "</p>"; return; }
    updateBadge();
    if (!rows.length) { box.innerHTML = '<p class="ap-hint">No messages yet.</p>'; return; }
    box.innerHTML = rows.map((m) => {
      const when = new Date(m.created_at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const reply = "mailto:" + encodeURIComponent(m.email) + "?subject=" + encodeURIComponent("Re: " + (m.subject || "your message"));
      return '<div class="ap-card ' + (m.read ? "" : "unread") + '"><div class="ap-card-head"><strong>' + esc(m.name) + '</strong><span class="ap-badge ' + (m.read ? "live" : "wait") + '">' + (m.read ? "Read" : "New") + '</span></div><p class="ap-meta"><a href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a> · " + esc(when) + "</p>" +
        (m.subject ? '<p class="ap-subj">' + esc(m.subject) + "</p>" : "") + "<p>" + esc(m.message) + '</p><div class="ap-actions"><a class="ap-btn" href="' + esc(reply) + '">' + icon("reply") + "Reply</a>" +
        '<button class="ap-btn ghost" data-mread="' + esc(m.id) + '" data-v="' + (m.read ? "0" : "1") + '">' + icon(m.read ? "mail" : "check") + (m.read ? "Mark unread" : "Mark read") + "</button>" +
        '<button class="ap-btn ghost" data-mdel="' + esc(m.id) + '">' + icon("trash") + "Delete</button></div></div>";
    }).join("");
    $$("[data-mread]", box).forEach((b) => {
      b.onclick = async () => { try { await Store.messages.setRead(b.dataset.mread!, b.dataset.v === "1"); loadMessages(); } catch (e) { App.toast("Couldn't update: " + (e as Error).message, "err"); } };
    });
    $$("[data-mdel]", box).forEach((b) => {
      b.onclick = async () => {
        if (!(await App.ask("This message will be deleted permanently.", "Delete"))) return;
        try { await Store.messages.remove(b.dataset.mdel!); loadMessages(); App.toast("Message deleted"); } catch (e) { App.toast("Couldn't delete: " + (e as Error).message, "err"); }
      };
    });
  }

  /* ---------- version history ---------- */
  async function loadVersions(): Promise<void> {
    const box = $("#apVersions"); if (!box) return;
    if (Store.mode !== "server") { box.innerHTML = storageNote(); return; }
    let rows: string[];
    try { rows = await Store.history(); } catch (e) { box.innerHTML = '<p class="ap-hint">Couldn\'t load history: ' + esc((e as Error).message) + "</p>"; return; }
    if (!rows.length) { box.innerHTML = '<p class="ap-hint">No earlier versions yet — they appear after you publish.</p>'; return; }
    const label = (f: string) => { const iso = f.replace(".json", "").replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "$1:$2:$3.$4Z"); const d = new Date(iso); return isNaN(+d) ? f : d.toLocaleString(); };
    box.innerHTML = rows.map((f) => '<div class="ap-ver"><span>' + icon("history") + esc(label(f)) + '</span><button class="ap-btn ghost" data-restore="' + esc(f) + '">Restore</button></div>').join("");
    $$("[data-restore]", box).forEach((b) => {
      b.onclick = async () => {
        if (!(await App.ask("Replace the live website with this earlier version? The current version is kept in History too.", "Restore"))) return;
        try { draft = await Store.restore(b.dataset.restore!); dirty = false; App.render(JSON.parse(JSON.stringify(draft))); drawPanel(); App.toast("Restored — live for everyone", "ok"); }
        catch (e) { App.toast("Couldn't restore: " + (e as Error).message, "err"); }
      };
    });
  }

  /* ---------- panel ---------- */
  function drawPanel(): void {
    const p = $("#adminPanel"); const t = TABS.find((x) => x.key === tab) || TABS[0];
    const body = $(".ap-body", p); const scroll = body ? body.scrollTop : 0;
    const live = Store.mode === "server";
    p.innerHTML =
      '<div class="ap-head"><div><h3>' + icon("edit") + 'Edit website</h3><span class="ap-mode ' + (live ? "ok" : "warn") + '">' + (live ? "Live — Save & publish updates the site for everyone" : "Storage not connected — edits stay in this browser") + "</span></div>" +
      '<button class="icon-btn" id="apClose" aria-label="Close panel">' + icon("x") + "</button></div>" +
      '<nav class="ap-tabs">' + TABS.filter((x) => x.special !== "versions" || live).map((x) => '<button class="' + (x.key === tab ? "on" : "") + '" data-tab="' + x.key + '">' + x.label + "</button>").join("") + "</nav>" +
      '<div class="ap-body"><h4 class="ap-title">' + esc(t.label) + "</h4>" + tabBody(t) + "</div>" +
      '<div class="ap-foot"><button class="btn btn-primary" id="apSave">' + icon("save") + (live ? "Save &amp; publish" : "Save") + "</button>" +
      '<button class="btn btn-outline" id="apExport" title="Download all content as a backup file">' + icon("download") + "Backup</button>" +
      '<button class="btn btn-outline" id="apLogout">' + icon("logout") + "Log out</button>" +
      (live ? "" : '<button class="ap-link" id="apReset">Reset to original</button>') + "</div>";
    if (dirty) $("#apSave").classList.add("pulse");
    if (tab === "feedback") loadInbox();
    if (tab === "messages") loadMessages();
    if (tab === "versions") loadVersions();
    $(".ap-body", p).scrollTop = scroll;
    bindPanel();
  }

  function bindPanel(): void {
    const p = $("#adminPanel");
    $("#apClose").onclick = closePanel;
    $$("[data-tab]", p).forEach((b) => { b.onclick = () => { tab = b.dataset.tab || "hero"; drawPanel(); $(".ap-body").scrollTop = 0; }; });
    $$<HTMLInputElement>("[data-p]", p).forEach((el) => {
      el.addEventListener("input", () => {
        if (el.readOnly) return;
        const max = el.dataset.num ? +el.dataset.num : 0;
        set(el.dataset.p!, max ? Math.max(0, Math.min(max, +el.value || 0)) : el.value);
        if (el.tagName === "SELECT") { const prev = el.parentElement?.querySelector("span"); if (prev) prev.innerHTML = icon(el.value); }
        changed();
      });
    });
    $$<HTMLInputElement>("[data-tog]", p).forEach((el) => { el.onchange = () => { draft!.sections[el.dataset.tog!] = el.checked; changed(); }; });
    $$("[data-del]", p).forEach((b) => {
      b.onclick = async () => {
        const [path, i] = b.dataset.del!.split("|"); const arr = get(path) as unknown[];
        if (!(await App.ask("This item will be removed when you save.", "Delete"))) return;
        arr.splice(+i, 1); changed(); drawPanel();
      };
    });
    $$("[data-mv]", p).forEach((b) => {
      b.onclick = () => {
        const [path, si, sd] = b.dataset.mv!.split("|"); const arr = get(path) as unknown[]; const i = +si, j = i + +sd;
        if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; changed(); drawPanel();
      };
    });
    $$("[data-adds]", p).forEach((b) => { b.onclick = () => { (get(b.dataset.adds!) as string[]).push(""); changed(); drawPanel(); const ins = $$('[data-p^="' + b.dataset.adds + '."]'); if (ins.length) ins[ins.length - 1].focus(); }; });
    $$("[data-addl]", p).forEach((b) => { b.onclick = () => { (get(b.dataset.addl!) as unknown[]).push(JSON.parse(b.dataset.blank || "{}")); changed(); drawPanel(); const items = $$(".ap-item"); if (items.length) items[items.length - 1].scrollIntoView({ block: "center" }); }; });
    $$("[data-clear]", p).forEach((b) => { b.onclick = () => { set(b.dataset.clear!, ""); changed(); drawPanel(); }; });
    $$<HTMLInputElement>("[data-up]", p).forEach((inp) => {
      inp.onchange = async () => {
        const f = inp.files?.[0]; if (!f) return;
        App.toast("Uploading image…");
        try { set(inp.dataset.up!, await Store.uploadImage(f)); changed(); drawPanel(); App.toast("Image added — remember to save", "ok"); }
        catch (e) { App.toast((e as Error).message || "Upload failed", "err"); }
      };
    });
    $$<HTMLInputElement>("[data-upf]", p).forEach((inp) => {
      inp.onchange = async () => {
        const f = inp.files?.[0]; if (!f) return;
        App.toast("Uploading file…");
        try { set(inp.dataset.upf!, await Store.uploadFile(f)); changed(); drawPanel(); App.toast("File added — remember to save", "ok"); }
        catch (e) { App.toast((e as Error).message || "Upload failed", "err"); }
      };
    });
    const saveBtn = $<HTMLButtonElement>("#apSave");
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      // Give new services a link name so /services#… works.
      const used = new Set<string>();
      draft!.services.items.forEach((x, i) => { let id = slug(x.id || x.title) || "service-" + (i + 1); while (used.has(id)) id += "-2"; used.add(id); x.id = id; });
      try { const m = await Store.save(JSON.parse(JSON.stringify(draft))); dirty = false; saveBtn.classList.remove("pulse"); App.render(JSON.parse(JSON.stringify(draft))); App.toast(m, "ok"); }
      catch (e) { App.toast("Couldn't save: " + (e as Error).message, "err"); }
      saveBtn.disabled = false;
    };
    $("#apExport").onclick = () => { Store.exportJson(draft!); App.toast("Backup downloaded", "ok"); };
    const rs = $("#apReset"); if (rs) rs.onclick = async () => {
      if (!(await App.ask("Discard all edits made in this browser and go back to the original content?", "Reset"))) return;
      Store.resetLocal(); draft = await Store.load(); dirty = false; App.render(JSON.parse(JSON.stringify(draft))); drawPanel();
    };
    $("#apLogout").onclick = async () => {
      if (dirty && !(await App.ask("You have unsaved changes. Log out anyway?", "Log out"))) return;
      Store.logout(); document.body.classList.remove("admin-on"); closePanel(); dirty = false; draft = null;
      App.render(await Store.load()); updateBadge();
      if (location.pathname === "/admin") history.replaceState({}, "", "/");
      App.toast("Logged out");
    };
  }

  function openPanel(t?: string): void {
    if (t) tab = t;
    if (!draft) draft = JSON.parse(JSON.stringify(App.get()));
    drawPanel();
    const p = $("#adminPanel"); p.classList.add("open"); p.setAttribute("aria-hidden", "false");
    document.body.classList.add("panel-open");
  }
  function closePanel(): void { const p = $("#adminPanel"); p.classList.remove("open"); p.setAttribute("aria-hidden", "true"); document.body.classList.remove("panel-open"); }

  function enterAdmin(): void {
    document.body.classList.add("admin-on");
    draft = JSON.parse(JSON.stringify(App.get()));
    addSectionButtons(); openPanel(); updateBadge();
  }

  /** New messages + hidden feedback, shown on the Admin button. */
  async function updateBadge(): Promise<void> {
    const btn = $("#adminNav"); if (!btn) return;
    let n = 0;
    if (Store.isLoggedIn() && Store.mode === "server") {
      try {
        const [msgs, fb] = await Promise.all([Store.messages.listAll(), Store.feedback.listAll()]);
        n = msgs.filter((m) => !m.read).length + (Store.feedback.requireApproval ? fb.filter((x) => !x.approved).length : 0);
      } catch { /* ignore */ }
    }
    let dot = $(".fb-dot", btn);
    if (!n) { dot?.remove(); btn.title = "Admin"; return; }
    if (!dot) { dot = document.createElement("span"); dot.className = "fb-dot"; btn.appendChild(dot); }
    dot.textContent = String(n); btn.title = n + " new";
  }
  function addSectionButtons(): void {
    Object.keys(SEC_TAB).forEach((id) => {
      const sec = document.getElementById(id); if (!sec || $(".sec-edit", sec)) return;
      const b = document.createElement("button"); b.className = "sec-edit"; b.innerHTML = icon("edit") + "Edit section";
      b.onclick = () => openPanel(SEC_TAB[id]); sec.appendChild(b);
    });
  }

  /* ---------- login ---------- */
  const keyBtn = $("#adminNav"), modal = $("#loginModal"), form = $<HTMLFormElement>("#loginForm"), pass = $<HTMLInputElement>("#adminPass"), msg = $("#loginMsg");
  keyBtn.innerHTML = icon("key") + "<span>Admin</span>";
  const openLogin = () => { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); msg.textContent = ""; pass.value = ""; setTimeout(() => pass.focus(), 50); };
  const closeLogin = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); };
  keyBtn.onclick = () => { if (document.body.classList.contains("admin-on")) openPanel(); else openLogin(); };
  document.addEventListener("open-admin", () => { if (document.body.classList.contains("admin-on")) openPanel(); else openLogin(); });
  $("#loginCancel").onclick = closeLogin;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeLogin(); });
  pass.addEventListener("input", () => { msg.textContent = ""; });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); msg.className = "form-msg"; msg.textContent = "Checking…";
    const r = await Store.login(pass.value.trim());
    if (!r.ok) { msg.className = "form-msg err"; msg.textContent = r.msg || "Wrong password."; form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake"); return; }
    closeLogin(); enterAdmin(); App.toast("Welcome back, Gazia", "ok");
  });
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  if (Store.isLoggedIn()) { document.body.classList.add("admin-on"); addSectionButtons(); setTimeout(updateBadge, 1500); }
}

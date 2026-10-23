/* ==========================================================
   3D scenes (Three.js)
   - Background: paper sheets, colour-swatch fans, pencils,
     slides, cubes, rings and gems drifting with the same
     movement as the portfolio — they follow the mouse and
     travel with the page while you scroll.
   - Hero: a design studio screen with orbiting design tools.
   - Contact: a creative desk (laptop, mug, papers, envelopes).
   Every accent colour follows the selected theme.
   ========================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Theme } from "./types";

type Slot = "a1" | "a2" | "a3";
interface Mover { v: THREE.Vector3; r: THREE.Vector3; phase: number }

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = window.innerWidth < 760;
const DPR = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.6);
const UP = new THREE.Vector3(0, 1, 0);

/* ---------------- Materials that follow the theme ---------------- */
const mats: Record<Slot, THREE.MeshStandardMaterial[]> = { a1: [], a2: [], a3: [] };
function themed(slot: Slot, opts: THREE.MeshStandardMaterialParameters & { glow?: number } = {}): THREE.MeshStandardMaterial {
  const { glow = 0.35, ...rest } = opts;
  const m = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.15, ...rest });
  m.userData.slot = slot; m.userData.glow = glow;
  mats[slot].push(m);
  return m;
}
const white = new THREE.MeshStandardMaterial({ color: 0xf5f7ff, roughness: 0.3, metalness: 0.04 });
const paper = new THREE.MeshStandardMaterial({ color: 0xfbfcff, roughness: 0.55, metalness: 0 });
const ink = new THREE.MeshStandardMaterial({ color: 0xc9d3e6, roughness: 0.6 });
const dark = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.55 });
const silver = new THREE.MeshStandardMaterial({ color: 0xdfe5ef, roughness: 0.25, metalness: 0.8 });
const wood = new THREE.MeshStandardMaterial({ color: 0xf1d3a1, roughness: 0.7 });

const rbox = (w: number, h: number, d: number, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 0.001));

/* ---------------- Design objects ---------------- */
function docCard(head: THREE.Material, block: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.1, 1.45, 0.05, 0.04), paper));
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.16, 0.02), head); h.position.set(0, 0.5, 0.035); g.add(h);
  [0.24, 0.08, -0.08].forEach((y, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(i === 2 ? 0.5 : 0.86, 0.05, 0.02), ink); l.position.set(i === 2 ? -0.18 : 0, y, 0.035); g.add(l); });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), block); b.position.set(-0.23, -0.4, 0.035); g.add(b);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.02), ink); b2.position.set(0.22, -0.32, 0.035); g.add(b2);
  const b3 = b2.clone(); b3.position.y = -0.46; g.add(b3);
  return g;
}

function swatchFan(list: THREE.Material[]): THREE.Group {
  const g = new THREE.Group();
  list.forEach((m, i) => {
    const arm = new THREE.Group();
    const plate = new THREE.Mesh(rbox(0.34, 1.35, 0.035, 0.03), m); plate.position.y = 0.62; plate.position.z = i * 0.04;
    arm.add(plate); arm.rotation.z = (i - (list.length - 1) / 2) * 0.32; g.add(arm);
  });
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16), silver); pin.rotation.x = Math.PI / 2; pin.position.z = 0.08; g.add(pin);
  return g;
}

function pencil(body: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 6), body); g.add(shaft);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 6), wood); cone.position.y = -0.9; cone.rotation.x = Math.PI; g.add(cone);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 8), dark); lead.position.y = -1.03; lead.rotation.x = Math.PI; g.add(lead);
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.16, 16), silver); fer.position.y = 0.83; g.add(fer);
  const er = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16), white); er.position.y = 0.99; g.add(er);
  return g;
}

function slideCard(bar: THREE.Material, chart: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.6, 0.95, 0.05, 0.04), paper));
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.02), bar); t.position.set(-0.35, 0.3, 0.035); g.add(t);
  [0.18, 0.3, 0.42, 0.26].forEach((h, i) => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.03), chart); c.position.set(0.2 + i * 0.17, -0.32 + h / 2, 0.04); g.add(c); });
  [0.06, -0.08, -0.22].forEach((y) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.02), ink); l.position.set(-0.4, y, 0.035); g.add(l); });
  return g;
}

function bond(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

/** A twisting ribbon of colour dots (the same motion as the portfolio's helix). */
function helix(turns: number, mA: THREE.Material, mB: THREE.Material, mR: THREE.Material): THREE.Group {
  const g = new THREE.Group(); const R = 0.9, steps = turns * 10;
  for (let i = 0; i < steps; i++) {
    const a = i * (Math.PI * 2 / 10), y = i * 0.32 - steps * 0.16;
    const p1 = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R);
    const p2 = new THREE.Vector3(-Math.cos(a) * R, y, -Math.sin(a) * R);
    const b1 = new THREE.Mesh(i % 3 ? new THREE.SphereGeometry(0.16, 14, 10) : rbox(0.28, 0.28, 0.28, 0.06), mA); b1.position.copy(p1);
    const b2 = new THREE.Mesh(i % 3 ? new THREE.SphereGeometry(0.16, 14, 10) : rbox(0.28, 0.28, 0.28, 0.06), mB); b2.position.copy(p2);
    g.add(b1, b2, bond(p1, p2, 0.04, mR));
  }
  return g;
}

function lights(scene: THREE.Scene): THREE.PointLight[] {
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(4, 6, 8);
  const p1 = new THREE.PointLight(0x3b82f6, 2.2, 40, 1.4); p1.position.set(-8, 4, 6);
  const p2 = new THREE.PointLight(0x38bdf8, 1.6, 40, 1.4); p2.position.set(8, -5, 4);
  scene.add(amb, key, p1, p2);
  return [p1, p2];
}

/* ---------------- Canvas textures (redrawn per theme) ---------------- */
type Draw = (c: CanvasRenderingContext2D, w: number, h: number, t: Theme) => void;
const textures: { tex: THREE.CanvasTexture; ctx: CanvasRenderingContext2D; w: number; h: number; draw: Draw }[] = [];
let currentTheme: Theme | null = null;
function canvasTex(w: number, h: number, draw: Draw): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textures.push({ tex, ctx: c.getContext("2d")!, w, h, draw });
  return tex;
}
function redrawAll(): void {
  if (!currentTheme) return;
  textures.forEach((x) => { x.ctx.clearRect(0, 0, x.w, x.h); x.draw(x.ctx, x.w, x.h, currentTheme!); x.tex.needsUpdate = true; });
}
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

const screen = { title: "Gazia Studio", text: "Design · Digital · Admin" };

const drawStudio: Draw = (c, W, H, t) => {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef3fb");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // window bar
  c.fillStyle = "#e6ebf4"; c.fillRect(0, 0, W, 54);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(34 + i * 30, 27, 9, 0, 7); c.fill(); });
  c.fillStyle = "#c9d3e6"; rr(c, W / 2 - 160, 16, 320, 22, 11); c.fill();
  // side toolbar
  c.fillStyle = "#f4f6fb"; c.fillRect(0, 54, 92, H - 54);
  [t.a1, t.a2, t.a3, "#0b1736", "#ffffff"].forEach((col, i) => { c.fillStyle = col; rr(c, 22, 84 + i * 62, 48, 48, 12); c.fill(); c.strokeStyle = "#d5dceb"; c.lineWidth = 2; c.stroke(); });
  // artboard
  c.fillStyle = "#ffffff"; c.shadowColor = "rgba(15,30,70,.18)"; c.shadowBlur = 30; rr(c, 130, 92, W - 330, H - 140, 18); c.fill(); c.shadowBlur = 0;
  const bx = 130, by = 92, bw = W - 330, bh = H - 140;
  const hg = c.createLinearGradient(bx, by, bx + bw, by + 180); hg.addColorStop(0, t.a1); hg.addColorStop(1, t.a2);
  c.fillStyle = hg; rr(c, bx, by, bw, 190, 18); c.fill(); c.fillRect(bx, by + 150, bw, 40);
  c.fillStyle = "#fff"; c.textAlign = "left";
  c.font = "800 64px Sora, Arial, sans-serif"; c.fillText(screen.title, bx + 40, by + 100);
  c.font = "600 30px Manrope, Arial, sans-serif"; c.globalAlpha = 0.92; c.fillText(screen.text, bx + 42, by + 148); c.globalAlpha = 1;
  // cards on the artboard
  for (let i = 0; i < 3; i++) {
    const x = bx + 36 + i * ((bw - 72) / 3), w = (bw - 72) / 3 - 20, y = by + 222;
    c.fillStyle = "#f3f6fc"; rr(c, x, y, w, bh - 260, 14); c.fill();
    c.fillStyle = i === 1 ? t.a2 : t.a1; c.globalAlpha = 0.85; rr(c, x + 16, y + 16, w - 32, 70, 10); c.fill(); c.globalAlpha = 1;
    c.fillStyle = "#c9d3e6"; rr(c, x + 16, y + 102, w - 50, 12, 6); c.fill(); rr(c, x + 16, y + 124, w - 80, 12, 6); c.fill();
  }
  // right panel: palette + mini chart
  const px = W - 180;
  c.fillStyle = "#f4f6fb"; c.fillRect(px, 54, 180, H - 54);
  c.fillStyle = "#0b1736"; c.font = "700 20px Manrope, Arial"; c.fillText("Palette", px + 22, 96);
  [t.a1, t.a2, t.a3].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(px + 42 + i * 48, 132, 18, 0, 7); c.fill(); });
  c.fillStyle = "#0b1736"; c.fillText("Growth", px + 22, 200);
  [50, 80, 64, 110, 136].forEach((h, i) => { c.fillStyle = i % 2 ? t.a2 : t.a1; rr(c, px + 22 + i * 28, 330 - h, 18, h, 5); c.fill(); });
  c.strokeStyle = t.a1; c.lineWidth = 4; c.beginPath();
  [[0, 70], [1, 60], [2, 40], [3, 46], [4, 20]].forEach(([i, y], k) => { const x = px + 31 + i * 28, yy = 230 + y; k ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.stroke();
};

const drawMail: Draw = (c, W, H, t) => {
  c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
  c.fillStyle = t.a1; c.fillRect(0, 0, W, 64);
  c.fillStyle = "#fff"; c.font = "700 30px Sora, Arial"; c.textAlign = "left"; c.fillText("New message", 30, 43);
  c.fillStyle = "#0b1736"; c.font = "800 50px Sora, Arial"; c.fillText("Let's work", 34, 150); c.fillText("together", 34, 208);
  c.fillStyle = t.a1; c.beginPath(); c.arc(W - 90, 168, 46, 0, 7); c.fill();
  c.strokeStyle = "#fff"; c.lineWidth = 7; c.lineJoin = "round"; c.beginPath(); c.moveTo(W - 112, 168); c.lineTo(W - 64, 146); c.lineTo(W - 84, 194); c.lineTo(W - 92, 172); c.closePath(); c.stroke();
  [262, 310, 358].forEach((y, i) => { c.fillStyle = "#eef2f9"; rr(c, 34, y, W - 68, 34, 10); c.fill(); c.fillStyle = "#c9d3e6"; rr(c, 50, y + 12, [180, 260, 220][i], 10, 5); c.fill(); });
  c.fillStyle = t.a1; rr(c, W - 230, 418, 196, 56, 14); c.fill();
  c.fillStyle = "#fff"; c.font = "700 26px Manrope, Arial"; c.textAlign = "center"; c.fillText("Send", W - 132, 455);
};

/* ---------------- Background scene ---------------- */
const bgCanvas = document.getElementById("bg3d") as HTMLCanvasElement | null;
const bg = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(55, 1, 0.1, 100),
  items: [] as THREE.Object3D[], helixes: [] as THREE.Group[], lights: [] as THREE.PointLight[], points: null as THREE.Points | null
};
if (bgCanvas) {
  bg.renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: !small });
  bg.renderer.setPixelRatio(DPR);
  bg.camera.position.z = 16;
  bg.lights = lights(bg.scene);
  const mA1 = themed("a1", { glow: 0.45 }), mA2 = themed("a2", { glow: 0.4 }), mA3 = themed("a3", { glow: 0.2, transparent: true, opacity: 0.75 });
  const gemMat = themed("a2", { glow: 0.5, flatShading: true, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.85 });
  const N = small ? 15 : 28;
  for (let i = 0; i < N; i++) {
    const kind = i % 7; let obj: THREE.Object3D;
    if (kind === 0) obj = docCard(mA1, mA2);
    else if (kind === 1) obj = swatchFan([mA1, mA2, mA3, white]);
    else if (kind === 2) obj = pencil(i % 2 ? mA1 : mA2);
    else if (kind === 3) obj = new THREE.Mesh(rbox(0.8, 0.8, 0.8, 0.14), i % 2 ? mA2 : mA1);
    else if (kind === 4) obj = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.13, 16, 48), mA2);
    else if (kind === 5) obj = slideCard(mA1, mA2);
    else obj = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), gemMat);
    const s = 0.6 + Math.random() * 0.7; obj.scale.setScalar(s);
    obj.position.set((Math.random() - 0.5) * 32, (Math.random() - 0.5) * 22, -3 - Math.random() * 9);
    obj.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const u: Mover = {
      v: new THREE.Vector3((Math.random() - 0.5) * 0.032, (Math.random() - 0.5) * 0.032, (Math.random() - 0.5) * 0.012),
      r: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.034, (Math.random() - 0.5) * 0.024),
      phase: Math.random() * 6.28
    };
    obj.userData = u;
    bg.scene.add(obj); bg.items.push(obj);
  }
  const h1 = helix(small ? 2 : 3, mA1, mA2, mA3); h1.position.set(-15, 0, -8); h1.rotation.z = 0.5;
  const h2 = helix(small ? 2 : 3, mA2, mA1, mA3); h2.position.set(15.5, 1, -9); h2.rotation.z = -0.45;
  h1.userData = { spin: 0.012, par: 0.9 }; h2.userData = { spin: -0.012, par: 1.15 };
  bg.scene.add(h1, h2); bg.helixes.push(h1, h2);

  const P = small ? 260 : 600, pos = new Float32Array(P * 3);
  for (let i = 0; i < P * 3; i++) pos[i] = (Math.random() - 0.5) * (i % 3 === 2 ? 20 : 40);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  bg.points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0.75, depthWrite: false }));
  bg.scene.add(bg.points);
}

/* ---------------- Hero scene: design studio screen ---------------- */
const heroCanvas = document.getElementById("hero3d") as HTMLCanvasElement | null;
const hero = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(38, 1, 0.1, 100),
  monitor: new THREE.Group(), orbit: [] as THREE.Object3D[], lights: [] as THREE.PointLight[], helix: null as THREE.Group | null
};
if (heroCanvas) {
  hero.renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
  hero.renderer.setPixelRatio(DPR);
  hero.camera.position.set(0, 0.4, 11);
  hero.lights = lights(hero.scene);

  const m = hero.monitor;
  const frame = new THREE.Mesh(rbox(4.5, 2.95, 0.2, 0.16), dark); m.add(frame);
  const edge = new THREE.Mesh(rbox(4.62, 3.07, 0.12, 0.18), themed("a1", { glow: 0.8, metalness: 0.4 })); edge.position.z = -0.06; m.add(edge);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.24, 2.69), new THREE.MeshBasicMaterial({ map: canvasTex(1280, 812, drawStudio), toneMapped: false }));
  scr.position.z = 0.105; m.add(scr);
  const neck = new THREE.Mesh(rbox(0.36, 1.1, 0.2, 0.06), silver); neck.position.set(0, -1.9, -0.22); m.add(neck);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.12, 48), silver); base.scale.z = 0.55; base.position.set(0, -2.45, -0.15); m.add(base);
  m.scale.setScalar(1.18); m.position.set(0.15, 0.55, 0); m.rotation.y = -0.18;
  hero.scene.add(m);

  const oA = themed("a1", { glow: 0.45 }), oB = themed("a2", { glow: 0.4 }), oC = themed("a3", { glow: 0.25 });
  const count = small ? 8 : 12;
  for (let i = 0; i < count; i++) {
    const k = i % 6;
    const o: THREE.Object3D = k === 0 ? docCard(oA, oB) : k === 1 ? pencil(oB) : k === 2 ? new THREE.Mesh(rbox(0.6, 0.6, 0.6, 0.12), oA)
      : k === 3 ? swatchFan([oA, oB, oC, white]) : k === 4 ? new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.1, 14, 40), oB) : slideCard(oA, oB);
    o.scale.setScalar(k === 0 || k === 3 || k === 5 ? 0.55 : 0.75);
    o.userData = { R: 3.4 + Math.random() * 1.3, a: (i / count) * Math.PI * 2, s: 0.22 + Math.random() * 0.22, y: (Math.random() - 0.5) * 3.8, bob: Math.random() * 6, spin: 0.008 + Math.random() * 0.016 };
    hero.scene.add(o); hero.orbit.push(o);
  }
  const hh = helix(1, oA, oB, themed("a3", { glow: 0.2, transparent: true, opacity: 0.7 }));
  hh.scale.setScalar(0.8); hh.position.set(-4.6, 0.6, -2.6); hh.rotation.z = 0.25;
  hero.scene.add(hh); hero.helix = hh;
}

/* ---------------- Contact scene: creative desk ---------------- */
const contactCanvas = document.getElementById("contact3d") as HTMLCanvasElement | null;
const desk = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(36, 1, 0.1, 100),
  lights: [] as THREE.PointLight[], floaters: [] as THREE.Object3D[], glow: null as THREE.Mesh | null, helix: null as THREE.Group | null,
  visible: false, zoom: 1
};
if (contactCanvas) {
  desk.renderer = new THREE.WebGLRenderer({ canvas: contactCanvas, alpha: true, antialias: true });
  desk.renderer.setPixelRatio(DPR);
  desk.camera.position.set(0, 3.6, 9);
  desk.lights = lights(desk.scene);
  const spot = new THREE.SpotLight(0xffffff, 0.6, 30, 0.6, 0.7); spot.position.set(1, 9, 5); desk.scene.add(spot);

  const fade = document.createElement("canvas"); fade.width = fade.height = 256;
  const fc = fade.getContext("2d")!, gr = fc.createRadialGradient(128, 128, 20, 128, 128, 128);
  gr.addColorStop(0, "#fff"); gr.addColorStop(0.55, "#bbb"); gr.addColorStop(1, "#000"); fc.fillStyle = gr; fc.fillRect(0, 0, 256, 256);
  const table = new THREE.Mesh(new THREE.CircleGeometry(7.5, 64), new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.3, metalness: 0.7, transparent: true, alphaMap: new THREE.CanvasTexture(fade), depthWrite: false }));
  table.rotation.x = -Math.PI / 2; desk.scene.add(table);
  const glow = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 64), themed("a2", { glow: 1.2, transparent: true, opacity: 0.55 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01; desk.scene.add(glow); desk.glow = glow;

  // Laptop
  const lap = new THREE.Group();
  const baseL = new THREE.Mesh(rbox(3.0, 0.14, 2.0, 0.06), silver); baseL.position.y = 0.07; lap.add(baseL);
  const keys = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 1.0), dark); keys.position.set(0, 0.15, -0.3); lap.add(keys);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.5), new THREE.MeshStandardMaterial({ color: 0xc8d0dd, roughness: 0.4, metalness: 0.6 })); pad.position.set(0, 0.15, 0.55); lap.add(pad);
  const lid = new THREE.Group(); lid.position.set(0, 0.14, -1.0);
  const lidBox = new THREE.Mesh(rbox(3.0, 1.95, 0.08, 0.06), silver); lidBox.position.y = 0.975; lid.add(lidBox);
  const lscr = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 1.74), new THREE.MeshBasicMaterial({ map: canvasTex(900, 563, drawMail), toneMapped: false }));
  lscr.position.set(0, 0.99, 0.045); lid.add(lscr);
  lid.rotation.x = -0.28; lap.add(lid);
  lap.position.set(0.1, 0, 0.2); lap.rotation.y = -0.25; desk.scene.add(lap);

  // Mug
  const mugMat = themed("a1", { glow: 0.3, roughness: 0.35 });
  const mug = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.9, 40, 1, true), mugMat); cup.position.y = 0.45; mug.add(cup);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.36, 40), mugMat); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01; mug.add(bottom);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.38, 40), new THREE.MeshStandardMaterial({ color: 0x4a2a17, roughness: 0.3 })); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.8; mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 12, 30, Math.PI), mugMat); handle.rotation.z = -Math.PI / 2; handle.position.set(0.42, 0.45, 0); mug.add(handle);
  (cup.material as THREE.Material).side = THREE.DoubleSide;
  mug.position.set(2.6, 0, 0.9); desk.scene.add(mug);

  // Paper stack + swatch fan
  const stack = new THREE.Group();
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 1.75), paper); p.position.y = 0.015 + i * 0.035; p.rotation.y = (Math.random() - 0.5) * 0.18; stack.add(p); }
  const top = docCard(themed("a1", { glow: 0.3 }), themed("a2", { glow: 0.3 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.17; top.scale.setScalar(1.1); stack.add(top);
  stack.position.set(-2.5, 0, 0.8); stack.rotation.y = 0.35; desk.scene.add(stack);
  const fan = swatchFan([themed("a1"), themed("a2"), themed("a3"), white]); fan.rotation.set(-Math.PI / 2, 0, 0.6); fan.position.set(-1.2, 0.05, 2.1); fan.scale.setScalar(0.9); desk.scene.add(fan);

  // Pencil cup
  const pc = new THREE.Group();
  const pcup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); pcup.position.y = 0.5; pc.add(pcup);
  [[-0.12, 0.1, 0.25], [0.13, -0.05, -0.2], [0, 0.14, 0.05]].forEach(([x, z, r], i) => { const p = pencil(i === 1 ? themed("a2") : themed("a1")); p.scale.setScalar(0.75); p.position.set(x, 1.15, z); p.rotation.set(Math.PI + r * 0.4, 0, r); pc.add(p); });
  pc.position.set(-2.4, 0, -1.6); desk.scene.add(pc);

  // Plant
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 32), white); pot.position.y = 0.3; plant.add(pot);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), leaf); l.scale.set(0.6, 1.6, 0.3);
    const a = (i / 7) * Math.PI * 2; l.position.set(Math.cos(a) * 0.18, 0.95, Math.sin(a) * 0.18); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    plant.add(l);
  }
  plant.position.set(2.9, 0, -1.6); desk.scene.add(plant);

  const hd = helix(2, themed("a1", { glow: 0.5 }), themed("a2", { glow: 0.45 }), themed("a3", { glow: 0.3, transparent: true, opacity: 0.6 }));
  hd.scale.setScalar(0.65); hd.position.set(-3.2, 3.4, -3.4); hd.rotation.z = 0.15; desk.scene.add(hd); desk.helix = hd;

  // Floating envelopes
  const flap = themed("a1", { glow: 0.35 });
  for (let i = 0; i < 4; i++) {
    const env = new THREE.Group();
    env.add(new THREE.Mesh(rbox(0.9, 0.6, 0.05, 0.03), paper));
    const shape = new THREE.Shape(); shape.moveTo(-0.45, 0.3); shape.lineTo(0.45, 0.3); shape.lineTo(0, -0.05); shape.closePath();
    const f = new THREE.Mesh(new THREE.ShapeGeometry(shape), flap); f.position.z = 0.03; env.add(f);
    env.position.set(-2.2 + i * 1.6, 3.1 + Math.random() * 1.2, -1.2 - Math.random() * 1.2);
    env.rotation.set(0.2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4);
    env.userData = { base: env.position.y, ph: Math.random() * 6, spin: 0.006 + Math.random() * 0.01 };
    desk.scene.add(env); desk.floaters.push(env);
  }
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { desk.visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(contactCanvas);
  else desk.visible = true;
}

/* ---------------- Theme ---------------- */
function setTheme(t: Theme): void {
  currentTheme = t;
  (["a1", "a2", "a3"] as Slot[]).forEach((slot) => {
    const col = new THREE.Color(t[slot]);
    mats[slot].forEach((m) => { m.color.copy(col); m.emissive = col.clone().multiplyScalar(m.userData.glow as number); });
  });
  [bg.lights, hero.lights, desk.lights].forEach((ls) => { if (ls.length) { ls[0].color.set(t.a1); ls[1].color.set(t.a2); } });
  if (bg.points) (bg.points.material as THREE.PointsMaterial).color.set(t.light ? t.a1 : t.a3);
  redrawAll();
}
function setScreen(title: string, text: string): void {
  screen.title = title || "Gazia Studio"; screen.text = text || "";
  redrawAll();
}

/* ---------------- Interaction & loop ---------------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

function resize(): void {
  if (bg.renderer) { bg.renderer.setSize(window.innerWidth, window.innerHeight, false); bg.camera.aspect = window.innerWidth / window.innerHeight; bg.camera.updateProjectionMatrix(); }
  if (hero.renderer && heroCanvas) {
    const w = heroCanvas.clientWidth || 400, h = heroCanvas.clientHeight || 400;
    hero.renderer.setSize(w, h, false); hero.camera.aspect = w / h;
    hero.camera.position.z = 11.5 * Math.max(1, 1.15 / hero.camera.aspect); hero.camera.updateProjectionMatrix();
  }
  if (desk.renderer && contactCanvas) {
    const w = contactCanvas.clientWidth || 400, h = contactCanvas.clientHeight || 400;
    desk.renderer.setSize(w, h, false); desk.camera.aspect = w / h;
    desk.zoom = Math.max(1, 1.25 / desk.camera.aspect); desk.camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resize);

let running = true, started = false;
const t0 = performance.now();
let lastScroll = window.scrollY, scrollVel = 0;
document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) loop(); });

function loop(): void {
  if (!running) return;
  const t = (performance.now() - t0) / 1000;
  mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
  // Scroll speed (px per frame), smoothed, drives the background
  const dy = window.scrollY - lastScroll; lastScroll = window.scrollY;
  scrollVel += (dy - scrollVel) * 0.25;
  const pxToWorld = 26 / Math.max(1, window.innerHeight);
  const boost = Math.min(Math.abs(scrollVel) * 0.02, 1.6);

  if (bg.renderer) {
    if (!reduce) {
      bg.items.forEach((o) => {
        const u = o.userData as Mover, depth = 1.25 + (o.position.z + 12) / 10 * 0.6;
        o.position.add(u.v);
        o.position.y += Math.sin(t * 1.4 + u.phase) * 0.008 + scrollVel * pxToWorld * depth;
        const spin = 1 + boost * 4;
        o.rotation.x += u.r.x * spin; o.rotation.y += u.r.y * spin; o.rotation.z += u.r.z * spin;
        if (o.position.x > 16) o.position.x = -16; if (o.position.x < -16) o.position.x = 16;
        if (o.position.y > 12) o.position.y -= 24; if (o.position.y < -12) o.position.y += 24;
        if (o.position.z > -2) u.v.z = -Math.abs(u.v.z); if (o.position.z < -12) u.v.z = Math.abs(u.v.z);
      });
      bg.helixes.forEach((d) => {
        d.rotation.y += (d.userData.spin as number) * (1 + boost * 5);
        d.position.y += scrollVel * pxToWorld * (d.userData.par as number);
        if (d.position.y > 20) d.position.y -= 40; if (d.position.y < -20) d.position.y += 40;
      });
      if (bg.points) { bg.points.rotation.y = t * 0.05; bg.points.position.y = (bg.points.position.y + scrollVel * pxToWorld * 0.6) % 20; }
    }
    bg.camera.position.x = mouse.x * 2.2;
    bg.camera.position.y = -mouse.y * 1.6;
    bg.camera.lookAt(0, 0, 0);
    bg.renderer.render(bg.scene, bg.camera);
  }

  if (hero.renderer && window.scrollY < window.innerHeight * 1.2) {
    if (!reduce) {
      hero.monitor.rotation.y = -0.15 + Math.sin(t * 0.7) * 0.28 + mouse.x * 0.3;
      hero.monitor.rotation.x = Math.sin(t * 0.5) * 0.05;
      hero.monitor.position.y = 0.55 + Math.sin(t * 1.6) * 0.12;
      hero.orbit.forEach((o) => {
        const u = o.userData as { R: number; a: number; s: number; y: number; bob: number; spin: number };
        u.a += u.s * 0.03;
        o.position.set(Math.cos(u.a) * u.R, u.y + Math.sin(t * 1.6 + u.bob) * 0.3, Math.sin(u.a) * u.R * 0.7);
        o.rotation.x += u.spin * 2; o.rotation.z += u.spin * 1.4;
      });
      if (hero.helix) hero.helix.rotation.y += 0.022;
    }
    hero.scene.rotation.x = mouse.y * 0.12;
    hero.scene.rotation.y = mouse.x * 0.18;
    hero.renderer.render(hero.scene, hero.camera);
  }

  if (desk.renderer && desk.visible) {
    if (!reduce) {
      if (desk.helix) desk.helix.rotation.y += 0.015;
      desk.floaters.forEach((f) => { const u = f.userData as { base: number; ph: number; spin: number }; f.position.y = u.base + Math.sin(t * 1.3 + u.ph) * 0.25; f.rotation.y += u.spin; });
      if (desk.glow) (desk.glow.material as THREE.MeshStandardMaterial).opacity = 0.4 + Math.sin(t * 2) * 0.15;
    }
    const z = desk.zoom, ang = mouse.x * 0.22 + Math.sin(t * 0.25) * 0.08;
    desk.camera.position.set(Math.sin(ang) * 9 * z, 3.6 * z - mouse.y * 0.5, Math.cos(ang) * 9 * z);
    desk.camera.lookAt(0.2, 1.0, 0);
    desk.renderer.render(desk.scene, desk.camera);
  }
  requestAnimationFrame(loop);
}

export const Scene3D = {
  setTheme,
  setScreen,
  resize,
  start(): void { if (started) return; started = true; resize(); loop(); }
};

/* ==========================================================
   3D scenes (Three.js) — "creative flow" motion
   - Background: design objects ride along waving flow lanes,
     swerve away from the mouse like a magnet and spring back,
     the whole field twists like a vortex as you scroll, paint-
     brush ribbons wave behind them and confetti drifts down.
   - Hero: the studio screen flips in, design tools fly in and
     loop around it on a figure-eight path; the screen leans
     toward the mouse.
   - Contact: envelopes launch from the laptop like messages
     being sent.
   Every accent colour follows the selected theme.
   ========================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Theme } from "./types";

type Slot = "a1" | "a2" | "a3";
interface Flow { lane: number; u: number; speed: number; dir: number; jy: number; jz: number; s: number; r: THREE.Vector3; off: THREE.Vector3 }
interface Ribbon { mesh: THREE.Mesh; base: Float32Array; length: number; amp: number; freq: number; speed: number; twist: number }

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = window.innerWidth < 760;
const DPR = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.6);

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

/** A paint-brush stroke: a tapered ribbon that waves and twists. */
function ribbon(length: number, width: number, mat: THREE.Material, amp: number, freq: number, speed: number, twist: number): Ribbon {
  const geo = new THREE.PlaneGeometry(length, width, small ? 90 : 160, 1);
  const base = Float32Array.from(geo.attributes.position.array as ArrayLike<number>);
  const mesh = new THREE.Mesh(geo, mat);
  const r: Ribbon = { mesh, base, length, amp, freq, speed, twist };
  waveRibbon(r, 0);
  return r;
}
function waveRibbon(r: Ribbon, t: number): void {
  const pos = r.mesh.geometry.attributes.position as THREE.BufferAttribute;
  const a = pos.array as Float32Array;
  for (let i = 0; i < a.length; i += 3) {
    const x = r.base[i], y0 = r.base[i + 1];
    const taper = Math.sin(Math.PI * (x / r.length + 0.5));
    const ph = x * r.freq + t * r.speed;
    const ang = Math.sin(ph * 0.5 + t * 0.4) * r.twist;
    const w = y0 * (0.25 + 0.75 * taper);
    a[i + 1] = Math.sin(ph) * r.amp + w * Math.cos(ang);
    a[i + 2] = Math.cos(ph * 0.7) * r.amp * 0.8 + w * Math.sin(ang);
  }
  pos.needsUpdate = true;
  r.mesh.geometry.computeVertexNormals();
}
const brush = (slot: Slot, opacity: number) => themed(slot, { glow: 0.7, transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.4, depthWrite: false });

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

/* ---------------- Background scene: flow lanes ---------------- */
const LANES = [
  { y: 7.5, z: -6, amp: 2.2, f: 1, f2: 2, ph: 0, dir: 1 },
  { y: 2.5, z: -8, amp: 2.8, f: 1.5, f2: 1, ph: 1.7, dir: -1 },
  { y: -2.5, z: -5, amp: 2.4, f: 1, f2: 1.5, ph: 3.1, dir: 1 },
  { y: -7.5, z: -9, amp: 2.0, f: 2, f2: 1, ph: 4.4, dir: -1 }
];
function lanePos(l: number, u: number, t: number, jy: number, jz: number, out: THREE.Vector3): THREE.Vector3 {
  const L = LANES[l], a = u * Math.PI * 2;
  return out.set((u * 2 - 1) * 22, L.y + jy + Math.sin(a * L.f + L.ph + t * 0.3) * L.amp, L.z + jz + Math.cos(a * L.f2 + L.ph) * 2.2);
}
const bgCanvas = document.getElementById("bg3d") as HTMLCanvasElement | null;
const bg = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(55, 1, 0.1, 100),
  flow: new THREE.Group(), items: [] as THREE.Object3D[], ribbons: [] as Ribbon[], lights: [] as THREE.PointLight[],
  confetti: null as THREE.Points | null, fall: new Float32Array(0), sway: new Float32Array(0), twist: 0
};
if (bgCanvas) {
  bg.renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: !small });
  bg.renderer.setPixelRatio(DPR);
  bg.camera.position.z = 16;
  bg.lights = lights(bg.scene);
  bg.scene.add(bg.flow);
  const mA1 = themed("a1", { glow: 0.45 }), mA2 = themed("a2", { glow: 0.4 }), mA3 = themed("a3", { glow: 0.2, transparent: true, opacity: 0.75 });
  const gemMat = themed("a2", { glow: 0.5, flatShading: true, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.85 });
  const N = small ? 16 : 30;
  for (let i = 0; i < N; i++) {
    const kind = i % 7; let obj: THREE.Object3D;
    if (kind === 0) obj = docCard(mA1, mA2);
    else if (kind === 1) obj = swatchFan([mA1, mA2, mA3, white]);
    else if (kind === 2) obj = pencil(i % 2 ? mA1 : mA2);
    else if (kind === 3) obj = new THREE.Mesh(rbox(0.8, 0.8, 0.8, 0.14), i % 2 ? mA2 : mA1);
    else if (kind === 4) obj = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.13, 16, 48), mA2);
    else if (kind === 5) obj = slideCard(mA1, mA2);
    else obj = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), gemMat);
    const lane = i % LANES.length;
    const u: Flow = {
      lane, u: (i / N + Math.random() * 0.08) % 1, speed: 0.0007 + Math.random() * 0.0008, dir: LANES[lane].dir,
      jy: (Math.random() - 0.5) * 1.6, jz: (Math.random() - 0.5) * 2.5, s: 0.6 + Math.random() * 0.6,
      r: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.024, (Math.random() - 0.5) * 0.016),
      off: new THREE.Vector3()
    };
    obj.scale.setScalar(u.s);
    obj.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    obj.userData = u;
    bg.flow.add(obj); bg.items.push(obj);
  }
  // Paint-brush ribbons sweeping across the field
  const r1 = ribbon(40, 1.3, brush("a1", 0.5), 1.6, 0.22, 0.9, 1.4); r1.mesh.position.set(0, 4, -12); r1.mesh.rotation.z = 0.12;
  const r2 = ribbon(40, 0.9, brush("a2", 0.42), 1.2, 0.3, -1.1, 1.8); r2.mesh.position.set(0, -4.5, -10); r2.mesh.rotation.z = -0.1;
  const r3 = ribbon(36, 0.5, brush("a3", 0.35), 1.0, 0.4, 1.4, 2.2); r3.mesh.position.set(0, 0, -14); r3.mesh.rotation.z = 0.3;
  bg.ribbons.push(r1, r2, r3); bg.flow.add(r1.mesh, r2.mesh, r3.mesh);

  // Confetti drifting down
  const P = small ? 180 : 420, pos = new Float32Array(P * 3), col = new Float32Array(P * 3);
  bg.fall = new Float32Array(P); bg.sway = new Float32Array(P);
  for (let i = 0; i < P; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 44; pos[i * 3 + 1] = (Math.random() - 0.5) * 28; pos[i * 3 + 2] = -2 - Math.random() * 16;
    bg.fall[i] = 0.006 + Math.random() * 0.018; bg.sway[i] = Math.random() * 6.28;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  bg.confetti = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
  bg.scene.add(bg.confetti);
}

/* ---------------- Hero scene: design studio screen ---------------- */
const heroCanvas = document.getElementById("hero3d") as HTMLCanvasElement | null;
const hero = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(38, 1, 0.1, 100),
  monitor: new THREE.Group(), orbit: [] as THREE.Object3D[], lights: [] as THREE.PointLight[], ribbon: null as Ribbon | null, intro: -1, tilt: { x: 0, y: 0 }
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
    const from = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1).normalize().multiplyScalar(16);
    o.userData = { R: 3.6 + (i % 3) * 0.55, a: (i / count) * Math.PI * 2, s: 0.16 + Math.random() * 0.1, y: ((i % 4) - 1.5) * 0.7, spin: 0.008 + Math.random() * 0.016, from, delay: 0.25 + i * 0.09 };
    o.position.copy(from);
    hero.scene.add(o); hero.orbit.push(o);
  }
  const hr = ribbon(16, 0.7, brush("a2", 0.55), 0.9, 0.5, 1.3, 1.6);
  hr.mesh.position.set(0, -0.6, -3.2); hr.mesh.rotation.z = 0.22;
  hero.scene.add(hr.mesh); hero.ribbon = hr;
}

/* ---------------- Contact scene: creative desk ---------------- */
const contactCanvas = document.getElementById("contact3d") as HTMLCanvasElement | null;
const desk = {
  renderer: null as THREE.WebGLRenderer | null, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(36, 1, 0.1, 100),
  lights: [] as THREE.PointLight[], floaters: [] as THREE.Object3D[], glow: null as THREE.Mesh | null, ribbon: null as Ribbon | null,
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

  const dr = ribbon(14, 0.6, brush("a2", 0.5), 0.7, 0.55, 1.2, 1.8);
  dr.mesh.position.set(-0.5, 4.2, -4); dr.mesh.rotation.z = 0.08; desk.scene.add(dr.mesh); desk.ribbon = dr;

  // Envelopes that launch from the laptop like messages being sent
  const flap = themed("a1", { glow: 0.35 });
  for (let i = 0; i < 5; i++) {
    const env = new THREE.Group();
    env.add(new THREE.Mesh(rbox(0.9, 0.6, 0.05, 0.03), paper));
    const shape = new THREE.Shape(); shape.moveTo(-0.45, 0.3); shape.lineTo(0.45, 0.3); shape.lineTo(0, -0.05); shape.closePath();
    const f = new THREE.Mesh(new THREE.ShapeGeometry(shape), flap); f.position.z = 0.03; env.add(f);
    env.scale.setScalar(0.001);
    env.userData = { delay: i * 0.9, dur: 4.5, side: (i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.45) };
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
  if (bg.confetti) {
    const c = bg.confetti.geometry.attributes.color as THREE.BufferAttribute, arr = c.array as Float32Array;
    const pal = [t.a1, t.a2, t.a3, t.light ? t.a1 : "#ffffff"].map((h) => new THREE.Color(h));
    for (let i = 0; i < arr.length / 3; i++) { const k = pal[i % pal.length]; arr[i * 3] = k.r; arr[i * 3 + 1] = k.g; arr[i * 3 + 2] = k.b; }
    c.needsUpdate = true;
  }
  redrawAll();
}
function setScreen(title: string, text: string): void {
  screen.title = title || "Gazia Studio"; screen.text = text || "";
  redrawAll();
}

/* ---------------- Interaction & loop ---------------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const ndc = new THREE.Vector3(), hit = new THREE.Vector3(), tmp = new THREE.Vector3(), aim = new THREE.Vector3();
let mouseActive = false;
document.addEventListener("pointerleave", () => { mouseActive = false; });
window.addEventListener("pointermove", (e) => {
  mouseActive = e.pointerType === "mouse";
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
    // Scroll twists the whole field like a vortex
    bg.twist += (window.scrollY * 0.00045 - bg.twist) * 0.06;
    bg.flow.rotation.z = bg.twist;
    bg.flow.rotation.x = Math.sin(t * 0.15) * 0.08;
    bg.flow.updateMatrixWorld();
    // Mouse position on the plane the objects travel through, in the field's own space
    ndc.set(mouse.tx, -mouse.ty, 0.5).unproject(bg.camera).sub(bg.camera.position).normalize();
    const dist = (-7 - bg.camera.position.z) / ndc.z;
    hit.copy(bg.camera.position).addScaledVector(ndc, dist);
    bg.flow.worldToLocal(hit);
    if (!reduce) {
      const speed = 1 + boost * 3;
      bg.items.forEach((o) => {
        const u = o.userData as Flow;
        u.u = (u.u + u.speed * u.dir * speed + 1) % 1;
        lanePos(u.lane, u.u, t, u.jy, u.jz, tmp);
        // Magnetic swerve away from the cursor, then spring back
        const dx = tmp.x - hit.x, dy = tmp.y - hit.y, d = Math.hypot(dx, dy) || 1, R = 5;
        const push = mouseActive && d < R ? (R - d) / R : 0;
        aim.set((dx / d) * push * 3.4, (dy / d) * push * 3.4, push * 3);
        u.off.lerp(aim, 0.08);
        o.position.copy(tmp).add(u.off);
        o.scale.setScalar(u.s * (1 + u.off.length() * 0.07));
        o.rotation.x += u.r.x * speed; o.rotation.y += u.r.y * speed + push * 0.04; o.rotation.z += u.r.z * speed;
      });
      bg.ribbons.forEach((r) => waveRibbon(r, t * (1 + boost)));
      if (bg.confetti) {
        const pa = bg.confetti.geometry.attributes.position as THREE.BufferAttribute, a = pa.array as Float32Array;
        const lift = scrollVel * pxToWorld * 0.5;
        for (let i = 0; i < bg.fall.length; i++) {
          a[i * 3 + 1] += -bg.fall[i] * (1 + boost * 2) + lift;
          a[i * 3] += Math.sin(t * 1.3 + bg.sway[i]) * 0.008;
          if (a[i * 3 + 1] < -15) a[i * 3 + 1] += 30; else if (a[i * 3 + 1] > 15) a[i * 3 + 1] -= 30;
        }
        pa.needsUpdate = true;
      }
    }
    bg.camera.position.x = mouse.x * 1.2;
    bg.camera.position.y = -mouse.y * 0.9;
    bg.camera.position.z = 16 - Math.min(boost, 1) * 1.2;
    bg.camera.lookAt(0, 0, 0);
    bg.renderer.render(bg.scene, bg.camera);
  }

  if (hero.renderer && window.scrollY < window.innerHeight * 1.2) {
    if (hero.intro < 0) hero.intro = t;
    const k = reduce ? 1 : Math.min(1, (t - hero.intro) / 1.6), ease = 1 - Math.pow(1 - k, 4);
    // Screen flips in, then leans toward the mouse with a soft spring
    hero.tilt.y += ((-0.18 + mouse.x * 0.45) - hero.tilt.y) * 0.06;
    hero.tilt.x += ((mouse.y * 0.16) - hero.tilt.x) * 0.06;
    hero.monitor.rotation.y = hero.tilt.y - (1 - ease) * Math.PI * 1.1;
    hero.monitor.rotation.x = hero.tilt.x;
    hero.monitor.scale.setScalar(1.18 * (0.55 + 0.45 * ease));
    hero.monitor.position.y = 0.55 + (reduce ? 0 : Math.sin(t * 1.1) * 0.06);
    hero.orbit.forEach((o) => {
      const u = o.userData as { R: number; a: number; s: number; y: number; spin: number; from: THREE.Vector3; delay: number };
      if (!reduce) u.a += u.s * 0.025;
      // Figure-eight loop around the screen
      tmp.set(Math.sin(u.a) * u.R * 1.15, u.y + Math.sin(2 * u.a) * u.R * 0.35, Math.cos(u.a) * u.R * 0.6);
      const f = reduce ? 1 : Math.min(1, Math.max(0, (t - hero.intro - u.delay) / 1.2)), fe = 1 - Math.pow(1 - f, 3);
      o.position.copy(u.from).lerp(tmp, fe);
      if (!reduce) { o.rotation.x += u.spin * 2; o.rotation.z += u.spin * 1.4; }
    });
    if (hero.ribbon && !reduce) waveRibbon(hero.ribbon, t);
    hero.scene.rotation.x = mouse.y * 0.06;
    hero.scene.rotation.y = mouse.x * 0.08;
    hero.renderer.render(hero.scene, hero.camera);
  }

  if (desk.renderer && desk.visible) {
    if (!reduce) {
      if (desk.ribbon) waveRibbon(desk.ribbon, t);
      desk.floaters.forEach((f, i) => {
        const u = f.userData as { delay: number; dur: number; side: number };
        const k = ((t + u.delay) % u.dur) / u.dur;
        f.position.set(0.1 + u.side * 3.2 * k, 1.5 + 5.2 * k - 1.4 * k * k, -0.6 - 2.2 * k);
        f.rotation.set(0.25 - k * 0.4, u.side * k * 1.6, Math.sin(t * 3 + i) * 0.22);
        const grow = Math.min(1, k / 0.12), fade = 1 - Math.max(0, (k - 0.78) / 0.22);
        f.scale.setScalar(Math.max(0.001, grow * fade));
      });
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

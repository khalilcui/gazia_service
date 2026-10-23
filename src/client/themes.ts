/* 28 colour themes in 3 groups — the same set as the portfolio. Each one recolours the
   whole site, the 3D scenes and the cursor. */
import type { Theme } from "./types";

export const THEMES: Theme[] = [
  { group: "Signature", id: "electric", name: "Electric Blue",  a1: "#1e6bff", a2: "#38bdf8", a3: "#bae6fd", bg: "#030817", bg2: "#071330" },
  { id: "purple",   name: "Royal Purple",   a1: "#7c3aed", a2: "#a78bfa", a3: "#e9d5ff", bg: "#0a0518", bg2: "#170b33" },
  { id: "emerald",  name: "Emerald",        a1: "#059669", a2: "#34d399", a3: "#bbf7d0", bg: "#02100b", bg2: "#06241a" },
  { id: "rose",     name: "Rose Gold",      a1: "#e11d74", a2: "#f9a8b8", a3: "#ffe4ec", bg: "#14050c", bg2: "#2a0b19" },
  { id: "teal",     name: "Teal Lab",       a1: "#0d9488", a2: "#2dd4bf", a3: "#ccfbf1", bg: "#021211", bg2: "#062826" },
  { id: "sunset",   name: "Sunset Orange",  a1: "#ea580c", a2: "#fb923c", a3: "#fed7aa", bg: "#140803", bg2: "#2b1306" },
  { id: "crimson",  name: "Crimson",        a1: "#dc2626", a2: "#f87171", a3: "#fecaca", bg: "#140404", bg2: "#2a0909" },
  { id: "cyan",     name: "Cyan Ice",       a1: "#0891b2", a2: "#67e8f9", a3: "#e0fbff", bg: "#020f14", bg2: "#06222c" },
  { id: "lavender", name: "Lavender",       a1: "#8b5cf6", a2: "#c4b5fd", a3: "#f3e8ff", bg: "#0d0a1a", bg2: "#1c1633" },
  { id: "mint",     name: "Mint",           a1: "#10b981", a2: "#6ee7b7", a3: "#d1fae5", bg: "#03110d", bg2: "#08261d" },
  { id: "golden",   name: "Golden",         a1: "#d97706", a2: "#fbbf24", a3: "#fef3c7", bg: "#120b02", bg2: "#271a05" },
  { id: "magenta",  name: "Magenta",        a1: "#c026d3", a2: "#e879f9", a3: "#fae8ff", bg: "#12041a", bg2: "#250a33" },
  { id: "silver",   name: "Midnight Silver",a1: "#64748b", a2: "#cbd5e1", a3: "#f1f5f9", bg: "#07090d", bg2: "#131820" },
  { id: "light",    name: "Pure Light",     a1: "#2563eb", a2: "#0ea5e9", a3: "#1e3a8a", bg: "#eef4ff", bg2: "#ffffff", light: true },

  /* 7 blues */
  { group: "Blues", id: "sky",      name: "Sky Blue",       a1: "#0284c7", a2: "#7dd3fc", a3: "#e0f2fe", bg: "#03101c", bg2: "#082338" },
  { id: "royalblue",name: "Royal Blue",     a1: "#1d4ed8", a2: "#60a5fa", a3: "#dbeafe", bg: "#030a1f", bg2: "#0a1a45" },
  { id: "navy",     name: "Navy",           a1: "#1e3a8a", a2: "#3b82f6", a3: "#bfdbfe", bg: "#020617", bg2: "#0b1533" },
  { id: "sapphire", name: "Sapphire",       a1: "#0f52ba", a2: "#4f8ff7", a3: "#c7dcff", bg: "#020a1a", bg2: "#08193d" },
  { id: "cobalt",   name: "Cobalt",         a1: "#0047ab", a2: "#3d8bff", a3: "#cfe2ff", bg: "#010818", bg2: "#061a40" },
  { id: "azure",    name: "Azure",          a1: "#0077ff", a2: "#5cc8ff", a3: "#d6f1ff", bg: "#020c1a", bg2: "#071f3d" },
  { id: "iceblue",  name: "Ice Blue",       a1: "#3b82f6", a2: "#a5d8ff", a3: "#eef7ff", bg: "#06101f", bg2: "#10233f" },

  /* 7 turquoise */
  { group: "Turquoise", id: "turquoise", name: "Turquoise", a1: "#0fb5ae", a2: "#40e0d0", a3: "#ccfbf6", bg: "#021312", bg2: "#06302d" },
  { id: "aqua",     name: "Aqua",           a1: "#06b6d4", a2: "#5eead4", a3: "#d5fdf7", bg: "#02121a", bg2: "#062b38" },
  { id: "lagoon",   name: "Lagoon",         a1: "#0e9f9a", a2: "#48d1cc", a3: "#c9f7f3", bg: "#021614", bg2: "#08302c" },
  { id: "caribbean",name: "Caribbean",      a1: "#00a6a6", a2: "#00e5d4", a3: "#c2fff8", bg: "#011414", bg2: "#032f2f" },
  { id: "tiffany",  name: "Tiffany",        a1: "#0abab5", a2: "#81d8d0", a3: "#e2f9f6", bg: "#031615", bg2: "#0a2f2c" },
  { id: "seafoam",  name: "Seafoam",        a1: "#20b2aa", a2: "#9fe2bf", a3: "#e6fbf1", bg: "#031512", bg2: "#0b2e27" },
  { id: "deepturq", name: "Deep Turquoise", a1: "#00838f", a2: "#26c6da", a3: "#c5f6fb", bg: "#010f12", bg2: "#04262c" }
];

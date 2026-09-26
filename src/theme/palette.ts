// Builds a Material 3 style tonal scheme from a single seed color.
// Tones are laid out in OKLCH so every hue gets even lightness steps; the
// role → tone mapping mirrors the hand-tuned teal palette in styles/theme.css.

export type Mode = "light" | "dark";

type Oklch = { l: number; c: number; h: number };

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const s = m[1].length === 3 ? [...m[1]].map((ch) => ch + ch).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function normalizeHex(hex: string): string | null {
  const rgb = parseHex(hex);
  return rgb && toHex(rgb);
}

function toHex(rgb: number[]): string {
  return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = (parseHex(hex) ?? [0, 0, 0]).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

function oklchToLinear({ l: L, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** CIELAB-like tone (0–100) at the given hue/chroma, chroma reduced until it fits sRGB. */
function tone(h: number, c: number, t: number): string {
  // For a neutral color OKLab L is the cube root of luminance, so convert the L* tone via Y.
  const y = t > 8 ? ((t + 16) / 116) ** 3 : t / 903.3;
  const l = Math.cbrt(y);
  let lo = 0;
  let hi = c;
  if (!inGamut(oklchToLinear({ l, c, h }))) {
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  return toHex(oklchToLinear({ l, c, h }).map(fromLinear));
}

type PaletteKey = "p" | "s" | "t" | "n" | "nv";

const roles: Record<string, [PaletteKey, number, number]> = {
  // variable: [palette, light tone, dark tone]
  "--md-surface": ["n", 98, 6],
  "--md-surface-lowest": ["n", 100, 10],
  "--md-surface-low": ["n", 96, 12],
  "--md-surface-container": ["n", 93, 16],
  "--md-surface-high": ["n", 91, 21],
  "--md-on-surface": ["n", 10, 90],
  "--md-on-surface-variant": ["nv", 30, 80],
  "--md-outline": ["nv", 50, 60],
  "--md-outline-variant": ["nv", 80, 30],
  "--md-primary": ["p", 40, 80],
  "--md-on-primary": ["p", 100, 20],
  "--md-primary-container": ["p", 90, 30],
  "--md-on-primary-container": ["p", 10, 90],
  "--md-secondary-container": ["s", 90, 30],
  "--md-on-secondary-container": ["s", 10, 90],
  "--md-tertiary": ["t", 40, 80],
};

export function schemeFromSeed(seed: string, mode: Mode): Record<string, string> {
  const { c, h } = hexToOklch(seed);
  const palettes: Record<PaletteKey, [number, number]> = {
    p: [h, Math.max(c, 0.1)],
    s: [h, Math.min(c / 3, 0.04)],
    t: [(h + 60) % 360, Math.max(c / 2, 0.05)],
    n: [h, Math.min(c / 12, 0.01)],
    nv: [h, Math.min(c / 6, 0.02)],
  };
  const out: Record<string, string> = {};
  for (const [name, [key, light, dark]] of Object.entries(roles)) {
    const [ph, pc] = palettes[key];
    out[name] = tone(ph, pc, mode === "light" ? light : dark);
  }
  return out;
}

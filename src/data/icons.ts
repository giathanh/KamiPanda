export type IconDef = { paths: string[]; circles?: [number, number, number][]; rects?: [number, number, number, number, number][]; dots?: string; filled?: boolean };

// Stroke icons lifted from the Marka design board.
export const icons: Record<string, IconDef> = {
  menu: { paths: ["M4 6h16M4 12h16M4 18h16"] },
  pen: { paths: ["M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z", "M13.5 8.5l2 2"] },
  folderOpen: { paths: ["M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1", "M3 17l2.6-6.1A1.5 1.5 0 0 1 7 10h13.2a1 1 0 0 1 .92 1.39L18.4 18a1.5 1.5 0 0 1-1.4 1H5a2 2 0 0 1-2-2V7"] },
  folder: { paths: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"] },
  outline: { paths: ["M9 6h11M9 12h11M12 18h8"], dots: "M4 6h.01M4 12h.01M7 18h.01" },
  search: { paths: ["M20 20l-3.5-3.5"], circles: [[11, 11, 7]] },
  history: { paths: ["M12 7v5l3 2"], circles: [[12, 12, 9]] },
  moon: { paths: ["M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"] },
  sun: { paths: ["M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"], circles: [[12, 12, 4]] },
  sliders: { paths: ["M4 7h9M17 7h3M4 17h3M11 17h9"], circles: [[15, 7, 2], [9, 17, 2]] },
  plus: { paths: ["M12 5v14M5 12h14"] },
  chevronDown: { paths: ["M6 9l6 6 6-6"] },
  chevronRight: { paths: ["M9 6l6 6-6 6"] },
  file: { paths: ["M6 3h8l4 4v14H6z", "M14 3v4h4"] },
  image: { paths: ["M21 16l-5-5-8 8"], rects: [[3, 5, 18, 14, 2]], circles: [[8.5, 10, 1.5]] },
  check: { paths: ["M5 12l5 5 9-10"] },
  focus: { paths: ["M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"], circles: [[12, 12, 3]] },
  bold: { paths: ["M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"] },
  italic: { paths: ["M19 4h-9M14 20H5M15 4 9 20"] },
  code: { paths: ["M8 8l-4 4 4 4M16 8l4 4-4 4"] },
  link: { paths: ["M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1", "M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"] },
  bulletList: { paths: ["M9 6h11M9 12h11M9 18h11"], dots: "M4 6h.01M4 12h.01M4 18h.01" },
  taskList: { paths: ["M4 7l2 2 3-3M4 16l2 2 3-3M13 8h7M13 17h7"] },
  table: { paths: ["M3 10h18M3 15h18M9 4v16"], rects: [[3, 4, 18, 16, 2]] },
  copy: { paths: ["M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"], rects: [[8, 8, 12, 12, 2]] },
  quote: { paths: ["M7 7h4v4H7zM7 11c0 3-1 5-3 6M15 7h4v4h-4zM15 11c0 3-1 5-3 6"] },
  divider: { paths: ["M4 12h16"] },
  close: { paths: ["M6 6l12 12M18 6L6 18"] },
  filePlus: { paths: ["M14 3H6v18h12V7z", "M14 3v4h4", "M12 11v6M9 14h6"] },
  folderPlus: { paths: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M12 10v6M9 13h6"] },
  trash: { paths: ["M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"] },
  refresh: { paths: ["M20 11a8 8 0 0 0-14.9-3.5L4 9", "M4 4v5h5", "M4 13a8 8 0 0 0 14.9 3.5L20 15", "M20 20v-5h-5"] },
  reset: { paths: ["M4 12a8 8 0 1 0 2.34-5.66L4 8.5", "M4 4v4.5h4.5"] },
};

/** Standalone SVG markup for `name`, for places outside Vue templates such as native menus. */
export function iconSvg(name: string, size: number, color: string, strokeWidth = 1.8) {
  const icon = icons[name];
  if (!icon) return undefined;
  const paint = icon.filled ? `fill="${color}"` : `fill="none" stroke="${color}" stroke-width="${strokeWidth}"`;
  const shapes = [
    ...icon.paths.map((d) => `<path d="${d}"/>`),
    ...(icon.dots ? [`<path d="${icon.dots}" stroke-width="2.7"/>`] : []),
    ...(icon.circles ?? []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`),
    ...(icon.rects ?? []).map(([x, y, w, h, rx]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`),
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${paint} stroke-linecap="round" stroke-linejoin="round">${shapes.join("")}</svg>`;
}

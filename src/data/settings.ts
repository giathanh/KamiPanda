import { computed, reactive, ref, watch } from "vue";
import type { LanguagePreference, MessageKey } from "../i18n";
import { normalizeHex, schemeFromSeed, type Mode } from "../theme/palette";

export type ThemePreference = Mode | "system";
export type EditorFont = "serif" | "sans" | "mono";
export type LineSpacing = "compact" | "normal" | "relaxed";
export type ContentWidth = "narrow" | "medium" | "wide" | "full";

export interface ColorToken {
  name: string;
  label: MessageKey;
}

export interface ColorGroup {
  label: MessageKey;
  tokens: ColorToken[];
}

/** Seed colors offered in Settings. The first one is the palette hand-tuned in styles/theme.css. */
export const accentPresets: { name: MessageKey; color: string }[] = [
  { name: "accent.teal", color: "#006a60" },
  { name: "accent.blue", color: "#0061a4" },
  { name: "accent.indigo", color: "#4355b9" },
  { name: "accent.violet", color: "#6f43c0" },
  { name: "accent.rose", color: "#a9336b" },
  { name: "accent.red", color: "#b3261e" },
  { name: "accent.orange", color: "#9a4600" },
  { name: "accent.olive", color: "#5b6300" },
  { name: "accent.green", color: "#006e1c" },
  { name: "accent.slate", color: "#4f5b66" },
];
const DEFAULT_ACCENT = accentPresets[0].color;

export const colorGroups: ColorGroup[] = [
  {
    label: "colors.surfaces",
    tokens: [
      { name: "--md-surface", label: "colors.background" },
      { name: "--md-surface-lowest", label: "colors.editor" },
      { name: "--md-surface-low", label: "colors.surfaceLow" },
      { name: "--md-surface-container", label: "colors.surfaceContainer" },
      { name: "--md-surface-high", label: "colors.surfaceHigh" },
    ],
  },
  {
    label: "colors.textLines",
    tokens: [
      { name: "--md-on-surface", label: "colors.text" },
      { name: "--md-on-surface-variant", label: "colors.secondaryText" },
      { name: "--md-outline", label: "colors.outline" },
      { name: "--md-outline-variant", label: "colors.divider" },
    ],
  },
  {
    label: "colors.accent",
    tokens: [
      { name: "--md-primary", label: "colors.primary" },
      { name: "--md-on-primary", label: "colors.onPrimary" },
      { name: "--md-primary-container", label: "colors.primaryContainer" },
      { name: "--md-on-primary-container", label: "colors.onPrimaryContainer" },
      { name: "--md-secondary-container", label: "colors.selection" },
      { name: "--md-on-secondary-container", label: "colors.onSelection" },
      { name: "--md-tertiary", label: "colors.tertiary" },
      { name: "--md-error", label: "colors.error" },
    ],
  },
  {
    label: "colors.code",
    tokens: [
      { name: "--code-keyword", label: "colors.keyword" },
      { name: "--code-string", label: "colors.string" },
      { name: "--code-number", label: "colors.number" },
      { name: "--code-comment", label: "colors.comment" },
      { name: "--code-function", label: "colors.function" },
      { name: "--code-type", label: "colors.type" },
      { name: "--code-property", label: "colors.property" },
      { name: "--code-variable", label: "colors.variable" },
      { name: "--code-operator", label: "colors.operator" },
      { name: "--code-tag", label: "colors.tag" },
      { name: "--code-attribute", label: "colors.attribute" },
    ],
  },
];

interface StoredSettings {
  theme: ThemePreference;
  accent: string;
  /** Per-mode overrides of individual CSS variables, applied on top of the accent scheme. */
  overrides: Record<Mode, Record<string, string>>;
  /** Write edits to disk shortly after typing stops, instead of waiting for ⌘S. */
  autoSave: boolean;
  language: LanguagePreference;
  /** Scale factor for the editor and preview text, adjusted from the status bar. */
  editorZoom: number;
  /** Body text size of the live preview, in px at 100% zoom. Source mode and headings scale with it. */
  fontSize: number;
  fontFamily: EditorFont;
  lineSpacing: LineSpacing;
  contentWidth: ContentWidth;
}

const STORAGE_KEY = "kamipanda.settings";

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 28;
export const FONT_SIZE_DEFAULT = 19;

const fontStacks: Record<EditorFont, string> = { serif: "var(--font-doc)", sans: "var(--font-ui)", mono: "var(--font-mono)" };
const lineHeights: Record<LineSpacing, number> = { compact: 1.4, normal: 1.55, relaxed: 1.8 };
const contentWidths: Record<ContentWidth, number | null> = { narrow: 600, medium: 728, wide: 960, full: null };

function clampFontSize(value: number) {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(value)));
}

function oneOf<T extends string>(value: unknown, options: Record<T, unknown>, fallback: T): T {
  return typeof value === "string" && value in options ? (value as T) : fallback;
}

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10));
}

function load(): StoredSettings {
  const fallback: StoredSettings = {
    theme: "light", accent: DEFAULT_ACCENT, overrides: { light: {}, dark: {} }, autoSave: true, language: "system", editorZoom: 1,
    fontSize: FONT_SIZE_DEFAULT, fontFamily: "serif", lineSpacing: "normal", contentWidth: "medium",
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw) return fallback;
    return {
      theme: ["light", "dark", "system"].includes(raw.theme) ? raw.theme : fallback.theme,
      accent: normalizeHex(raw.accent ?? "") ?? fallback.accent,
      overrides: { light: { ...raw.overrides?.light }, dark: { ...raw.overrides?.dark } },
      autoSave: typeof raw.autoSave === "boolean" ? raw.autoSave : fallback.autoSave,
      language: ["system", "en", "vi", "zh", "ja"].includes(raw.language) ? raw.language : fallback.language,
      editorZoom: typeof raw.editorZoom === "number" ? clampZoom(raw.editorZoom) : fallback.editorZoom,
      fontSize: typeof raw.fontSize === "number" ? clampFontSize(raw.fontSize) : fallback.fontSize,
      fontFamily: oneOf(raw.fontFamily, fontStacks, fallback.fontFamily),
      lineSpacing: oneOf(raw.lineSpacing, lineHeights, fallback.lineSpacing),
      contentWidth: oneOf(raw.contentWidth, contentWidths, fallback.contentWidth),
    };
  } catch {
    return fallback;
  }
}

export const settings = reactive<StoredSettings>(load());

const systemDark = ref(false);
const media = window.matchMedia?.("(prefers-color-scheme: dark)");
if (media) {
  systemDark.value = media.matches;
  media.addEventListener("change", (e) => (systemDark.value = e.matches));
}

export const resolvedMode = computed<Mode>(() =>
  settings.theme === "system" ? (systemDark.value ? "dark" : "light") : settings.theme,
);

/** Effective value of every editable color in the current mode, read back after applying. */
export const effectiveColors = ref<Record<string, string>>({});

const allTokens = colorGroups.flatMap((g) => g.tokens.map((t) => t.name));

function apply() {
  const root = document.documentElement;
  const mode = resolvedMode.value;
  root.dataset.theme = mode;
  root.style.setProperty("--editor-zoom", String(settings.editorZoom));
  root.style.setProperty("--editor-font-scale", String(settings.fontSize / FONT_SIZE_DEFAULT));
  root.style.setProperty("--editor-font", fontStacks[settings.fontFamily]);
  root.style.setProperty("--editor-line-height", String(lineHeights[settings.lineSpacing]));
  const width = contentWidths[settings.contentWidth];
  root.style.setProperty("--editor-max-width", width === null ? "none" : `${width * settings.editorZoom}px`);

  const vars: Record<string, string> = {
    ...(settings.accent === DEFAULT_ACCENT ? {} : schemeFromSeed(settings.accent, mode)),
    ...settings.overrides[mode],
  };
  for (const name of allTokens) {
    if (vars[name]) root.style.setProperty(name, vars[name]);
    else root.style.removeProperty(name);
  }

  const computed = getComputedStyle(root);
  effectiveColors.value = Object.fromEntries(
    allTokens.map((name) => [name, normalizeHex(computed.getPropertyValue(name)) ?? "#000000"]),
  );
}

watch([settings, resolvedMode], () => {
  apply();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}, { deep: true, immediate: true });

export function setOverride(name: string, value: string) {
  const hex = normalizeHex(value);
  if (hex) settings.overrides[resolvedMode.value][name] = hex;
}

export function clearOverride(name: string) {
  delete settings.overrides[resolvedMode.value][name];
}

export function resetColors() {
  settings.accent = DEFAULT_ACCENT;
  settings.overrides = { light: {}, dark: {} };
}

export function zoomIn() {
  settings.editorZoom = clampZoom(settings.editorZoom + ZOOM_STEP);
}

export function zoomOut() {
  settings.editorZoom = clampZoom(settings.editorZoom - ZOOM_STEP);
}

export function resetZoom() {
  settings.editorZoom = 1;
}

export function setFontSize(value: number) {
  settings.fontSize = clampFontSize(value);
}

export function resetEditorSettings() {
  Object.assign(settings, { fontSize: FONT_SIZE_DEFAULT, fontFamily: "serif", lineSpacing: "normal", contentWidth: "medium" });
}

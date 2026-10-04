import { ref, watch } from "vue";
import type { LanguagePreference, MessageKey } from "../i18n";
import { normalizeHex, schemeFromSeed, type Mode } from "../theme/palette";
import {
  choice,
  colorSchemeField,
  createSettingsStore,
  custom,
  defineSettings,
  number,
  resolveColorScheme,
  toggle,
  type ColorSchemePreference,
} from "../settings-kit";

export type ThemePreference = ColorSchemePreference;
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

const STORAGE_KEY = "kamipanda.settings";

const fontStacks: Record<EditorFont, string> = { serif: "var(--font-doc)", sans: "var(--font-ui)", mono: "var(--font-mono)" };
const lineHeights: Record<LineSpacing, number> = { compact: 1.4, normal: 1.55, relaxed: 1.8 };
const contentWidths: Record<ContentWidth, number | null> = { narrow: 600, medium: 728, wide: 960, full: null };

const keysOf = <T extends string>(record: Record<T, unknown>) => Object.keys(record) as T[];

const schema = defineSettings({
  theme: colorSchemeField("light"),
  accent: custom(DEFAULT_ACCENT, (raw) => (typeof raw === "string" ? normalizeHex(raw) : null) ?? undefined),
  /** Per-mode overrides of individual CSS variables, applied on top of the accent scheme. */
  overrides: custom<Record<Mode, Record<string, string>>>({ light: {}, dark: {} }, (raw: any) => ({
    light: { ...raw?.light },
    dark: { ...raw?.dark },
  })),
  /** Write edits to disk shortly after typing stops, instead of waiting for ⌘S. */
  autoSave: toggle(true),
  language: choice<LanguagePreference>(["system", "en", "vi", "zh", "ja"], "system"),
  /** Scale factor for the editor and preview text, adjusted from the status bar. */
  editorZoom: number({ min: 0.5, max: 2, step: 0.1, default: 1 }),
  /** Body text size of the live preview, in px at 100% zoom. Source mode and headings scale with it. */
  fontSize: number({ min: 14, max: 28, default: 19 }),
  fontFamily: choice(keysOf(fontStacks), "serif"),
  lineSpacing: choice(keysOf(lineHeights), "normal"),
  contentWidth: choice(keysOf(contentWidths), "medium"),
});

export const store = createSettingsStore(schema, { key: STORAGE_KEY });
export const settings = store.settings;

export const ZOOM_MIN = schema.editorZoom.min;
export const ZOOM_MAX = schema.editorZoom.max;

export const FONT_SIZE_MIN = schema.fontSize.min;
export const FONT_SIZE_MAX = schema.fontSize.max;
export const FONT_SIZE_DEFAULT = schema.fontSize.default;

/** Settings restored by the "Reset editor settings" button. */
export const editorKeys = ["fontSize", "fontFamily", "lineSpacing", "contentWidth"] as const;
/** Settings restored by the "Reset all colors" button. */
export const colorKeys = ["accent", "overrides"] as const;

export const resolvedMode = resolveColorScheme(() => settings.theme);

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

watch([settings, resolvedMode], apply, { deep: true, immediate: true });

export function setOverride(name: string, value: string) {
  const hex = normalizeHex(value);
  if (hex) settings.overrides[resolvedMode.value][name] = hex;
}

export function clearOverride(name: string) {
  delete settings.overrides[resolvedMode.value][name];
}

export function resetColors() {
  store.reset([...colorKeys]);
}

export function zoomIn() {
  settings.editorZoom = schema.editorZoom.clamp(settings.editorZoom + schema.editorZoom.step);
}

export function zoomOut() {
  settings.editorZoom = schema.editorZoom.clamp(settings.editorZoom - schema.editorZoom.step);
}

export function resetZoom() {
  store.reset(["editorZoom"]);
}

export function resetEditorSettings() {
  store.reset([...editorKeys]);
}

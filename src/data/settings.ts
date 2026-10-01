import { computed, reactive, ref, watch } from "vue";
import type { LanguagePreference, MessageKey } from "../i18n";
import { normalizeHex, schemeFromSeed, type Mode } from "../theme/palette";

export type ThemePreference = Mode | "system";

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
}

const STORAGE_KEY = "kamipanda.settings";

function load(): StoredSettings {
  const fallback: StoredSettings = { theme: "light", accent: DEFAULT_ACCENT, overrides: { light: {}, dark: {} }, autoSave: true, language: "system" };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw) return fallback;
    return {
      theme: ["light", "dark", "system"].includes(raw.theme) ? raw.theme : fallback.theme,
      accent: normalizeHex(raw.accent ?? "") ?? fallback.accent,
      overrides: { light: { ...raw.overrides?.light }, dark: { ...raw.overrides?.dark } },
      autoSave: typeof raw.autoSave === "boolean" ? raw.autoSave : fallback.autoSave,
      language: ["system", "en", "vi", "zh", "ja"].includes(raw.language) ? raw.language : fallback.language,
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

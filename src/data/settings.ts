import { computed, reactive, ref, watch } from "vue";
import { normalizeHex, schemeFromSeed, type Mode } from "../theme/palette";

export type ThemePreference = Mode | "system";

export interface ColorToken {
  name: string;
  label: string;
}

export interface ColorGroup {
  label: string;
  tokens: ColorToken[];
}

/** Seed colors offered in Settings. The first one is the palette hand-tuned in styles/theme.css. */
export const accentPresets = [
  { name: "Teal", color: "#006a60" },
  { name: "Blue", color: "#0061a4" },
  { name: "Indigo", color: "#4355b9" },
  { name: "Violet", color: "#6f43c0" },
  { name: "Rose", color: "#a9336b" },
  { name: "Red", color: "#b3261e" },
  { name: "Orange", color: "#9a4600" },
  { name: "Olive", color: "#5b6300" },
  { name: "Green", color: "#006e1c" },
  { name: "Slate", color: "#4f5b66" },
];
const DEFAULT_ACCENT = accentPresets[0].color;

export const colorGroups: ColorGroup[] = [
  {
    label: "Surfaces",
    tokens: [
      { name: "--md-surface", label: "Background" },
      { name: "--md-surface-lowest", label: "Editor" },
      { name: "--md-surface-low", label: "Surface low" },
      { name: "--md-surface-container", label: "Surface container" },
      { name: "--md-surface-high", label: "Surface high" },
    ],
  },
  {
    label: "Text & lines",
    tokens: [
      { name: "--md-on-surface", label: "Text" },
      { name: "--md-on-surface-variant", label: "Secondary text" },
      { name: "--md-outline", label: "Outline" },
      { name: "--md-outline-variant", label: "Divider" },
    ],
  },
  {
    label: "Accent",
    tokens: [
      { name: "--md-primary", label: "Primary" },
      { name: "--md-on-primary", label: "On primary" },
      { name: "--md-primary-container", label: "Primary container" },
      { name: "--md-on-primary-container", label: "On primary container" },
      { name: "--md-secondary-container", label: "Selection" },
      { name: "--md-on-secondary-container", label: "On selection" },
      { name: "--md-tertiary", label: "Tertiary" },
      { name: "--md-error", label: "Error" },
    ],
  },
  {
    label: "Code syntax",
    tokens: [
      { name: "--code-keyword", label: "Keyword" },
      { name: "--code-string", label: "String" },
      { name: "--code-number", label: "Number" },
      { name: "--code-comment", label: "Comment" },
      { name: "--code-function", label: "Function" },
      { name: "--code-type", label: "Type" },
      { name: "--code-property", label: "Property" },
      { name: "--code-variable", label: "Variable" },
      { name: "--code-operator", label: "Operator" },
      { name: "--code-tag", label: "Tag" },
      { name: "--code-attribute", label: "Attribute" },
    ],
  },
];

interface StoredSettings {
  theme: ThemePreference;
  accent: string;
  /** Per-mode overrides of individual CSS variables, applied on top of the accent scheme. */
  overrides: Record<Mode, Record<string, string>>;
}

const STORAGE_KEY = "kamipanda.settings";

function load(): StoredSettings {
  const fallback: StoredSettings = { theme: "light", accent: DEFAULT_ACCENT, overrides: { light: {}, dark: {} } };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw) return fallback;
    return {
      theme: ["light", "dark", "system"].includes(raw.theme) ? raw.theme : fallback.theme,
      accent: normalizeHex(raw.accent ?? "") ?? fallback.accent,
      overrides: { light: { ...raw.overrides?.light }, dark: { ...raw.overrides?.dark } },
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

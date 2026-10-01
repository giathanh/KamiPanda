import { computed, watch } from "vue";
import { settings } from "../data/settings";
import en from "./en";
import ja from "./ja";
import vi from "./vi";
import zh from "./zh";

export type Messages = Record<keyof typeof en, string>;
export type MessageKey = keyof Messages;
export type Locale = "en" | "vi" | "zh" | "ja";
export type LanguagePreference = Locale | "system";

const messages: Record<Locale, Messages> = { en, vi, zh, ja };

/** Languages offered in Settings, each named in its own language. */
export const languages: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "vi", label: "Tiếng Việt" },
  { id: "zh", label: "简体中文" },
  { id: "ja", label: "日本語" },
];

/** Value for the `lang` attribute, so CJK text picks the right glyphs. */
const htmlLang: Record<Locale, string> = { en: "en", vi: "vi", zh: "zh-Hans", ja: "ja" };

function systemLocale(): Locale {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split("-")[0];
    if (base in messages) return base as Locale;
  }
  return "en";
}

export const locale = computed<Locale>(() =>
  settings.language === "system" ? systemLocale() : settings.language,
);

watch(locale, (l) => (document.documentElement.lang = htmlLang[l]), { immediate: true });

/** Looks up a UI string in the current language, filling `{name}` placeholders from `params`. */
export function t(key: MessageKey, params?: Record<string, string | number>) {
  const text = messages[locale.value][key] ?? en[key];
  return params ? text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m)) : text;
}

import { computed, ref, type ComputedRef } from "vue";
import { choice } from "./schema";

export type ColorScheme = "light" | "dark";
export type ColorSchemePreference = ColorScheme | "system";

/** Ready-made field for a Light / Dark / System preference. */
export function colorSchemeField(fallback: ColorSchemePreference = "system") {
  return choice<ColorSchemePreference>(["light", "dark", "system"], fallback);
}

const systemDark = ref(false);
const media = typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)") : undefined;
if (media) {
  systemDark.value = media.matches;
  media.addEventListener("change", (e) => (systemDark.value = e.matches));
}

/** The scheme actually in effect, following the OS when the preference is "system". */
export function resolveColorScheme(preference: () => ColorSchemePreference): ComputedRef<ColorScheme> {
  return computed(() => {
    const pref = preference();
    return pref === "system" ? (systemDark.value ? "dark" : "light") : pref;
  });
}

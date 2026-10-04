# settings-kit

Reusable settings screen for Vue 3 apps: a schema-driven store that loads, validates and saves settings, plus the UI building blocks for the screen. It lives inside KamiPanda for now and is meant to move into its own package once a second app uses it.

**Rule:** nothing in this folder may import from the host app (only `vue` and files inside this folder). `tests/settings-kit.test.ts` enforces it.

## Store

```ts
import { choice, colorSchemeField, createSettingsStore, defineSettings, number, toggle } from "../settings-kit";

const schema = defineSettings({
  theme: colorSchemeField("system"),
  autoSave: toggle(true),
  fontSize: number({ min: 14, max: 28, default: 19 }),
  font: choice(["serif", "sans", "mono"], "serif"),
});

export const store = createSettingsStore(schema, { key: "myapp.settings" });
store.settings.fontSize = 20;          // saved automatically
store.reset(["fontSize", "font"]);     // back to defaults
store.isDefault(["fontSize", "font"]); // true
```

Each field parses what was stored and falls back to its default when the value is missing or invalid, so stale or hand-edited storage never breaks the app. Use `custom(default, parse)` for app-specific shapes.

`resolveColorScheme(() => store.settings.theme)` gives the effective `"light" | "dark"`, following the OS for `"system"`.

## UI

`SettingsLayout` › `SettingsSection` › `SettingsCard` › `SettingsRow`, with the controls `SegmentedControl`, `SelectControl` and `NumberStepper` (bind with `v-model`). Anything app-specific goes in as ordinary markup inside these components. Shared classes for such markup: `sk-hint`, `sk-tonal`.

The components take already-translated strings as props, so the kit does not depend on any i18n library.

## Theming contract

Colors come from the host's Material 3 CSS variables: `--md-primary`, `--md-on-primary`, `--md-secondary-container`, `--md-on-secondary-container`, `--md-surface-low`, `--md-surface-container`, `--md-on-surface`, `--md-on-surface-variant`. The host is expected to reset `button` styles (no border/background, inherited font).

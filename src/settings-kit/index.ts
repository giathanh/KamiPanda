/**
 * Reusable settings screen: a schema-driven store plus the UI building blocks.
 * Nothing in this folder may import from the host app — see README.md.
 */
export { choice, custom, defineSettings, number, toggle, type Field, type NumberField, type Schema, type ValuesOf } from "./schema";
export { createSettingsStore, type SettingsStore, type SettingsStoreOptions } from "./store";
export { colorSchemeField, resolveColorScheme, type ColorScheme, type ColorSchemePreference } from "./colorScheme";

export { default as SettingsLayout } from "./components/SettingsLayout.vue";
export { default as SettingsSection } from "./components/SettingsSection.vue";
export { default as SettingsCard } from "./components/SettingsCard.vue";
export { default as SettingsRow } from "./components/SettingsRow.vue";
export { default as SegmentedControl } from "./components/SegmentedControl.vue";
export { default as SelectControl } from "./components/SelectControl.vue";
export { default as NumberStepper } from "./components/NumberStepper.vue";

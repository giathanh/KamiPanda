<script setup lang="ts">
import { computed } from "vue";
import {
  accentPresets,
  clearOverride,
  colorGroups,
  effectiveColors,
  resetColors,
  resolvedMode,
  setOverride,
  settings,
  type ThemePreference,
} from "../data/settings";
import { appVersion, checkForUpdates, lastResult, updateProgress, updateStatus } from "../data/updater";
import { normalizeHex } from "../theme/palette";
import Icon from "./Icon.vue";

defineEmits<{ close: [] }>();

const themes: { id: ThemePreference; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const overrides = computed(() => settings.overrides[resolvedMode.value]);
const isCustomAccent = computed(() => !accentPresets.some((p) => p.color === settings.accent));
const hasChanges = computed(
  () => settings.accent !== accentPresets[0].color || Object.keys({ ...settings.overrides.light, ...settings.overrides.dark }).length > 0,
);

function setAccent(value: string) {
  const hex = normalizeHex(value);
  if (hex) settings.accent = hex;
}

function commitHex(name: string, e: Event) {
  const input = e.target as HTMLInputElement;
  if (normalizeHex(input.value)) setOverride(name, input.value);
  else input.value = effectiveColors.value[name];
}

const updateLabel = computed(() => {
  if (updateStatus.value === "checking") return "Checking…";
  if (updateStatus.value === "downloading") return updateProgress.value === null ? "Downloading…" : `Downloading ${updateProgress.value}%`;
  return "Check for updates";
});
</script>

<template>
  <div class="settings">
    <header class="pane-header" data-tauri-drag-region>
      <span class="title" data-tauri-drag-region>Settings</span>
      <button class="icon-btn" aria-label="Close settings" title="Close (Esc)" @click="$emit('close')"><Icon name="close" /></button>
    </header>

    <div class="scroll">
      <div class="content">
        <section>
          <h2>Appearance</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">Theme</span>
                <span class="row-sub">System follows your macOS appearance.</span>
              </div>
              <div role="group" aria-label="Theme" class="segmented">
                <button
                  v-for="t in themes"
                  :key="t.id"
                  :aria-pressed="settings.theme === t.id"
                  :class="{ on: settings.theme === t.id }"
                  @click="settings.theme = t.id"
                >
                  <Icon v-if="settings.theme === t.id" name="check" :size="16" :stroke-width="2.2" />
                  {{ t.label }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Editor</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">Auto save</span>
                <span class="row-sub">Save changes automatically a moment after you stop typing.</span>
              </div>
              <div role="group" aria-label="Auto save" class="segmented">
                <button
                  v-for="opt in [true, false]"
                  :key="String(opt)"
                  :aria-pressed="settings.autoSave === opt"
                  :class="{ on: settings.autoSave === opt }"
                  @click="settings.autoSave = opt"
                >
                  <Icon v-if="settings.autoSave === opt" name="check" :size="16" :stroke-width="2.2" />
                  {{ opt ? "On" : "Off" }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Updates</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">KamiPanda {{ appVersion }}</span>
                <span class="row-sub">{{ lastResult ?? "New versions are checked automatically on launch." }}</span>
              </div>
              <button class="tonal" :disabled="updateStatus === 'checking' || updateStatus === 'downloading'" @click="checkForUpdates()">
                <Icon name="reset" :size="18" />
                {{ updateLabel }}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2>Accent color</h2>
          <div class="card">
            <p class="hint">The whole palette — surfaces, text, highlights — is generated from this color for both light and dark themes.</p>
            <div class="swatches" role="radiogroup" aria-label="Accent color">
              <button
                v-for="p in accentPresets"
                :key="p.color"
                role="radio"
                class="swatch"
                :aria-checked="settings.accent === p.color"
                :aria-label="p.name"
                :title="p.name"
                :style="{ '--swatch': p.color }"
                @click="settings.accent = p.color"
              >
                <Icon v-if="settings.accent === p.color" name="check" :size="18" :stroke-width="2.6" />
              </button>
              <label
                class="swatch custom"
                :class="{ selected: isCustomAccent }"
                :style="isCustomAccent ? { '--swatch': settings.accent } : undefined"
                title="Custom color"
              >
                <Icon :name="isCustomAccent ? 'check' : 'plus'" :size="18" :stroke-width="2.4" />
                <input type="color" aria-label="Custom accent color" :value="settings.accent" @input="setAccent(($event.target as HTMLInputElement).value)" />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div class="section-head">
            <h2>Customize colors</h2>
            <span class="badge">{{ resolvedMode === "dark" ? "Dark theme" : "Light theme" }}</span>
          </div>
          <p class="hint outside">
            Fine-tune individual colors. Changes apply to the {{ resolvedMode }} theme only — switch themes to edit the other one.
          </p>
          <div v-for="group in colorGroups" :key="group.label" class="card list">
            <h3>{{ group.label }}</h3>
            <div v-for="token in group.tokens" :key="token.name" class="color-row">
              <label class="color-well" :style="{ background: effectiveColors[token.name] }">
                <input
                  type="color"
                  :aria-label="token.label"
                  :value="effectiveColors[token.name]"
                  @input="setOverride(token.name, ($event.target as HTMLInputElement).value)"
                />
              </label>
              <div class="row-text">
                <span class="row-title">{{ token.label }}</span>
                <span class="row-sub mono">{{ token.name }}</span>
              </div>
              <input
                class="hex"
                spellcheck="false"
                :aria-label="`${token.label} hex value`"
                :value="effectiveColors[token.name]"
                @change="commitHex(token.name, $event)"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <button
                class="icon-btn sm"
                :class="{ hidden: !overrides[token.name] }"
                :aria-label="`Reset ${token.label}`"
                title="Reset"
                :disabled="!overrides[token.name]"
                @click="clearOverride(token.name)"
              >
                <Icon name="reset" :size="18" />
              </button>
            </div>
          </div>
        </section>

        <div class="footer">
          <button class="tonal" :disabled="!hasChanges" @click="resetColors()">
            <Icon name="reset" :size="18" />
            Reset all colors
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pane-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 28px;
}

.title {
  flex-grow: 1;
  font-size: 15px;
  font-weight: 600;
}

.scroll {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
}

.content {
  max-width: 680px;
  margin: 0 auto;
  padding: 8px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2 {
  margin: 0 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-primary);
  letter-spacing: 0.1px;
}

h3 {
  margin: 4px 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.card {
  background: var(--md-surface-low);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card.list {
  padding: 12px 8px;
  gap: 0;
}

.hint {
  margin: 0;
  color: var(--md-on-surface-variant);
  line-height: 1.45;
}

.hint.outside {
  margin: -4px 4px 4px;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-text {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-title {
  font-weight: 500;
}

.row-sub {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.mono {
  font-family: var(--font-mono);
  font-size: 11px;
}

/* Segmented button — same shape as the editor mode switch. */
.segmented {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.segmented button {
  height: 36px;
  border-radius: 8px;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
  font-weight: 500;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.segmented button:first-child {
  border-radius: 18px 8px 8px 18px;
}

.segmented button:last-child {
  border-radius: 8px 18px 18px 8px;
}

.segmented button.on {
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-weight: 600;
  padding-left: 12px;
}

/* ---- Accent swatches ---- */
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.swatch {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: var(--swatch);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-radius 0.2s, box-shadow 0.15s;
}

.swatch:hover {
  box-shadow: 0 2px 6px rgba(var(--md-shadow), 0.25);
}

.swatch[aria-checked="true"],
.swatch.selected {
  border-radius: 14px;
  outline: 2px solid var(--swatch);
  outline-offset: 3px;
}

.swatch.custom:not(.selected) {
  background: var(--md-surface-container);
  color: var(--md-on-surface-variant);
  border: 1.5px dashed var(--md-outline);
}

.swatch.custom:focus-within {
  outline: 2px solid var(--md-primary);
  outline-offset: 3px;
}

/* Native color inputs sit invisibly over their visual well. */
input[type="color"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}

/* ---- Color rows ---- */
.color-row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 52px;
  padding: 4px 8px;
  border-radius: 14px;
}

.color-row:hover {
  background: color-mix(in srgb, var(--md-on-surface) 4%, transparent);
}

.color-well {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-on-surface) 18%, transparent);
  cursor: pointer;
}

.color-well:focus-within {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.hex {
  width: 92px;
  height: 32px;
  flex-shrink: 0;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-lowest);
  color: var(--md-on-surface);
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: lowercase;
  user-select: text;
}

.hex:focus {
  outline: none;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}

.icon-btn.sm {
  width: 32px;
  height: 32px;
  border-radius: 16px;
}

.icon-btn.hidden {
  visibility: hidden;
}

.footer {
  display: flex;
  justify-content: flex-end;
}

.tonal {
  height: 40px;
  padding: 0 20px 0 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.row .tonal {
  flex-shrink: 0;
}

.tonal:disabled {
  opacity: 0.38;
  cursor: default;
}
</style>

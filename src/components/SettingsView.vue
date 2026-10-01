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
import { languages, t, type LanguagePreference, type MessageKey } from "../i18n";
import { appVersion, checkForUpdates, lastResult, updateProgress, updateStatus } from "../data/updater";
import { normalizeHex } from "../theme/palette";
import Icon from "./Icon.vue";

defineEmits<{ close: [] }>();

const themes: { id: ThemePreference; label: MessageKey }[] = [
  { id: "light", label: "settings.light" },
  { id: "dark", label: "settings.dark" },
  { id: "system", label: "settings.system" },
];

const languageOptions = computed<{ id: LanguagePreference; label: string }[]>(() => [
  { id: "system", label: t("settings.system") },
  ...languages,
]);

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
  if (updateStatus.value === "checking") return t("update.checking");
  if (updateStatus.value === "downloading")
    return updateProgress.value === null ? t("update.downloading") : t("update.downloadingPercent", { n: updateProgress.value });
  return t("update.check");
});
</script>

<template>
  <div class="settings">
    <header class="pane-header" data-tauri-drag-region>
      <span class="title" data-tauri-drag-region>{{ t("settings.title") }}</span>
      <button class="icon-btn" :aria-label="t('settings.close')" :title="t('settings.closeShortcut')" @click="$emit('close')"><Icon name="close" /></button>
    </header>

    <div class="scroll">
      <div class="content">
        <section>
          <h2>{{ t("settings.appearance") }}</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">{{ t("settings.theme") }}</span>
                <span class="row-sub">{{ t("settings.themeHint") }}</span>
              </div>
              <div role="group" :aria-label="t('settings.theme')" class="segmented">
                <button
                  v-for="theme in themes"
                  :key="theme.id"
                  :aria-pressed="settings.theme === theme.id"
                  :class="{ on: settings.theme === theme.id }"
                  @click="settings.theme = theme.id"
                >
                  <Icon v-if="settings.theme === theme.id" name="check" :size="16" :stroke-width="2.2" />
                  {{ t(theme.label) }}
                </button>
              </div>
            </div>
            <div class="row">
              <div class="row-text">
                <span class="row-title">{{ t("settings.language") }}</span>
                <span class="row-sub">{{ t("settings.languageHint") }}</span>
              </div>
              <div class="select">
                <select v-model="settings.language" :aria-label="t('settings.language')">
                  <option v-for="opt in languageOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                </select>
                <Icon name="chevronDown" :size="18" :stroke-width="2" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>{{ t("settings.editor") }}</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">{{ t("settings.autoSave") }}</span>
                <span class="row-sub">{{ t("settings.autoSaveHint") }}</span>
              </div>
              <div role="group" :aria-label="t('settings.autoSave')" class="segmented">
                <button
                  v-for="opt in [true, false]"
                  :key="String(opt)"
                  :aria-pressed="settings.autoSave === opt"
                  :class="{ on: settings.autoSave === opt }"
                  @click="settings.autoSave = opt"
                >
                  <Icon v-if="settings.autoSave === opt" name="check" :size="16" :stroke-width="2.2" />
                  {{ opt ? t("settings.on") : t("settings.off") }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>{{ t("settings.updates") }}</h2>
          <div class="card">
            <div class="row">
              <div class="row-text">
                <span class="row-title">KamiPanda {{ appVersion }}</span>
                <span class="row-sub">{{ lastResult ? t(lastResult.key, lastResult.params) : t("update.autoCheck") }}</span>
              </div>
              <button class="tonal" :disabled="updateStatus === 'checking' || updateStatus === 'downloading'" @click="checkForUpdates()">
                <Icon name="reset" :size="18" />
                {{ updateLabel }}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2>{{ t("settings.accent") }}</h2>
          <div class="card">
            <p class="hint">{{ t("settings.accentHint") }}</p>
            <div class="swatches" role="radiogroup" :aria-label="t('settings.accent')">
              <button
                v-for="p in accentPresets"
                :key="p.color"
                role="radio"
                class="swatch"
                :aria-checked="settings.accent === p.color"
                :aria-label="t(p.name)"
                :title="t(p.name)"
                :style="{ '--swatch': p.color }"
                @click="settings.accent = p.color"
              >
                <Icon v-if="settings.accent === p.color" name="check" :size="18" :stroke-width="2.6" />
              </button>
              <label
                class="swatch custom"
                :class="{ selected: isCustomAccent }"
                :style="isCustomAccent ? { '--swatch': settings.accent } : undefined"
                :title="t('settings.customColor')"
              >
                <Icon :name="isCustomAccent ? 'check' : 'plus'" :size="18" :stroke-width="2.4" />
                <input type="color" :aria-label="t('settings.customAccent')" :value="settings.accent" @input="setAccent(($event.target as HTMLInputElement).value)" />
              </label>
            </div>
          </div>
        </section>

        <section>
          <div class="section-head">
            <h2>{{ t("settings.customize") }}</h2>
            <span class="badge">{{ resolvedMode === "dark" ? t("settings.darkBadge") : t("settings.lightBadge") }}</span>
          </div>
          <p class="hint outside">
            {{ resolvedMode === "dark" ? t("settings.customizeHintDark") : t("settings.customizeHintLight") }}
          </p>
          <div v-for="group in colorGroups" :key="group.label" class="card list">
            <h3>{{ t(group.label) }}</h3>
            <div v-for="token in group.tokens" :key="token.name" class="color-row">
              <label class="color-well" :style="{ background: effectiveColors[token.name] }">
                <input
                  type="color"
                  :aria-label="t(token.label)"
                  :value="effectiveColors[token.name]"
                  @input="setOverride(token.name, ($event.target as HTMLInputElement).value)"
                />
              </label>
              <div class="row-text">
                <span class="row-title">{{ t(token.label) }}</span>
                <span class="row-sub mono">{{ token.name }}</span>
              </div>
              <input
                class="hex"
                spellcheck="false"
                :aria-label="t('settings.hexValue', { name: t(token.label) })"
                :value="effectiveColors[token.name]"
                @change="commitHex(token.name, $event)"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <button
                class="icon-btn sm"
                :class="{ hidden: !overrides[token.name] }"
                :aria-label="t('settings.resetToken', { name: t(token.label) })"
                :title="t('settings.reset')"
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
            {{ t("settings.resetAll") }}
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

/* Dropdown styled like the segmented buttons, with the native menu underneath. */
.select {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--md-on-surface);
}

.select select {
  appearance: none;
  height: 36px;
  min-width: 160px;
  padding: 0 40px 0 16px;
  border: 0;
  border-radius: 18px;
  background: var(--md-surface-container);
  color: inherit;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.select select:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.select :deep(svg) {
  position: absolute;
  right: 14px;
  pointer-events: none;
  color: var(--md-on-surface-variant);
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

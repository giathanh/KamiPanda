<script setup lang="ts">
import { computed } from "vue";
import {
  accentPresets,
  clearOverride,
  colorGroups,
  colorKeys,
  editorKeys,
  effectiveColors,
  resetColors,
  resetEditorSettings,
  resolvedMode,
  setOverride,
  settings,
  store,
  type ContentWidth,
  type EditorFont,
  type LineSpacing,
  type ThemePreference,
} from "../data/settings";
import { languages, t, type LanguagePreference } from "../i18n";
import { appVersion, checkForUpdates, lastResult, updateProgress, updateStatus } from "../data/updater";
import { normalizeHex } from "../theme/palette";
import {
  NumberStepper,
  SegmentedControl,
  SelectControl,
  SettingsCard,
  SettingsLayout,
  SettingsRow,
  SettingsSection,
} from "../settings-kit";
import Icon from "./Icon.vue";

defineEmits<{ close: [] }>();

const themes = computed<{ value: ThemePreference; label: string }[]>(() => [
  { value: "light", label: t("settings.light") },
  { value: "dark", label: t("settings.dark") },
  { value: "system", label: t("settings.system") },
]);

const onOff = computed(() => [
  { value: true, label: t("settings.on") },
  { value: false, label: t("settings.off") },
]);

const fonts = computed<{ value: EditorFont; label: string; style: Record<string, string> }[]>(() => [
  { value: "serif", label: t("settings.fontSerif"), style: { fontFamily: "var(--font-doc)" } },
  { value: "sans", label: t("settings.fontSans"), style: { fontFamily: "var(--font-ui)" } },
  { value: "mono", label: t("settings.fontMono"), style: { fontFamily: "var(--font-mono)" } },
]);

const lineSpacings = computed<{ value: LineSpacing; label: string }[]>(() => [
  { value: "compact", label: t("settings.lineCompact") },
  { value: "normal", label: t("settings.lineNormal") },
  { value: "relaxed", label: t("settings.lineRelaxed") },
]);

const contentWidths = computed<{ value: ContentWidth; label: string }[]>(() => [
  { value: "narrow", label: t("settings.widthNarrow") },
  { value: "medium", label: t("settings.widthMedium") },
  { value: "wide", label: t("settings.widthWide") },
  { value: "full", label: t("settings.widthFull") },
]);

const languageOptions = computed<{ value: LanguagePreference; label: string }[]>(() => [
  { value: "system", label: t("settings.system") },
  ...languages.map((l) => ({ value: l.id, label: l.label })),
]);

const editorChanged = computed(() => !store.isDefault([...editorKeys]));
const hasChanges = computed(() => !store.isDefault([...colorKeys]));

const overrides = computed(() => settings.overrides[resolvedMode.value]);
const isCustomAccent = computed(() => !accentPresets.some((p) => p.color === settings.accent));

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
  <SettingsLayout :title="t('settings.title')" :close-label="t('settings.close')" :close-title="t('settings.closeShortcut')" @close="$emit('close')">
    <SettingsSection :title="t('settings.appearance')">
      <SettingsCard>
        <SettingsRow :title="t('settings.theme')" :subtitle="t('settings.themeHint')">
          <SegmentedControl v-model="settings.theme" :options="themes" :label="t('settings.theme')" />
        </SettingsRow>
        <SettingsRow :title="t('settings.language')" :subtitle="t('settings.languageHint')">
          <SelectControl v-model="settings.language" :options="languageOptions" :label="t('settings.language')" />
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>

    <SettingsSection :title="t('settings.editor')">
      <SettingsCard>
        <SettingsRow :title="t('settings.autoSave')" :subtitle="t('settings.autoSaveHint')">
          <SegmentedControl v-model="settings.autoSave" :options="onOff" :label="t('settings.autoSave')" />
        </SettingsRow>
        <SettingsRow :title="t('settings.fontSize')" :subtitle="t('settings.fontSizeHint')">
          <NumberStepper
            v-model="settings.fontSize"
            :field="store.schema.fontSize"
            :label="t('settings.fontSize')"
            :decrease-label="t('settings.fontSmaller')"
            :increase-label="t('settings.fontLarger')"
            :format="(n) => `${n} px`"
          />
        </SettingsRow>
        <SettingsRow :title="t('settings.font')" :subtitle="t('settings.fontHint')">
          <SegmentedControl v-model="settings.fontFamily" :options="fonts" :label="t('settings.font')" />
        </SettingsRow>
        <SettingsRow :title="t('settings.lineSpacing')">
          <SegmentedControl v-model="settings.lineSpacing" :options="lineSpacings" :label="t('settings.lineSpacing')" />
        </SettingsRow>
        <SettingsRow :title="t('settings.contentWidth')" :subtitle="t('settings.contentWidthHint')">
          <SelectControl v-model="settings.contentWidth" :options="contentWidths" :label="t('settings.contentWidth')" />
        </SettingsRow>
        <p class="sample" :style="{ fontSize: `${settings.fontSize}px` }">{{ t("settings.sampleText") }}</p>
        <template #footer>
          <button class="sk-tonal" :disabled="!editorChanged" @click="resetEditorSettings()">
            <Icon name="reset" :size="18" />
            {{ t("settings.resetEditor") }}
          </button>
        </template>
      </SettingsCard>
    </SettingsSection>

    <SettingsSection :title="t('settings.updates')">
      <SettingsCard>
        <SettingsRow
          :title="`KamiPanda ${appVersion}`"
          :subtitle="lastResult ? t(lastResult.key, lastResult.params) : t('update.autoCheck')"
        >
          <button class="sk-tonal" :disabled="updateStatus === 'checking' || updateStatus === 'downloading'" @click="checkForUpdates()">
            <Icon name="reset" :size="18" />
            {{ updateLabel }}
          </button>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>

    <SettingsSection :title="t('settings.accent')">
      <SettingsCard>
        <p class="sk-hint">{{ t("settings.accentHint") }}</p>
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
      </SettingsCard>
    </SettingsSection>

    <SettingsSection
      :title="t('settings.customize')"
      :badge="resolvedMode === 'dark' ? t('settings.darkBadge') : t('settings.lightBadge')"
      :hint="resolvedMode === 'dark' ? t('settings.customizeHintDark') : t('settings.customizeHintLight')"
    >
      <SettingsCard v-for="group in colorGroups" :key="group.label" list :heading="t(group.label)">
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
      </SettingsCard>
    </SettingsSection>

    <div class="footer">
      <button class="sk-tonal" :disabled="!hasChanges" @click="resetColors()">
        <Icon name="reset" :size="18" />
        {{ t("settings.resetAll") }}
      </button>
    </div>
  </SettingsLayout>
</template>

<style scoped>
/* Live sample of the editor typography. */
.sample {
  margin: 0;
  padding: 14px 18px;
  border-radius: 14px;
  background: var(--md-surface-lowest);
  font-family: var(--editor-font, var(--font-doc));
  line-height: var(--editor-line-height, 1.55);
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

/* Text column of a color row. */
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

.footer {
  display: flex;
  justify-content: flex-end;
}
</style>

<script setup lang="ts">
import type { EditorView } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  insertCodeBlock,
  insertDivider,
  insertImage,
  insertLink,
  insertQuote,
  insertTable,
  setBlock,
  toggleInline,
  toggleList,
  type BlockKind,
  type FormatState,
} from "../editor/formatting";
import { t, type MessageKey } from "../i18n";
import Icon from "./Icon.vue";

const props = defineProps<{ view?: EditorView; state: FormatState }>();

function blockLabel(kind: BlockKind) {
  return kind === "p" ? t("format.paragraph") : t("format.heading", { n: kind.slice(1) });
}
const blockOptions: BlockKind[] = ["p", "h1", "h2", "h3"];

const openMenu = ref<"block" | "insert" | null>(null);
const root = ref<HTMLElement>();

function run(fn: (v: EditorView) => unknown) {
  openMenu.value = null;
  if (props.view) fn(props.view);
}

function toggle(menu: "block" | "insert") {
  openMenu.value = openMenu.value === menu ? null : menu;
}

function onOutside(e: MouseEvent) {
  if (openMenu.value && !root.value?.contains(e.target as Node)) openMenu.value = null;
}
onMounted(() => document.addEventListener("mousedown", onOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutside));

const insertItems: { label: MessageKey; icon: string; fn: (v: EditorView) => unknown }[] = [
  { label: "format.codeBlock", icon: "code", fn: insertCodeBlock },
  { label: "format.quote", icon: "quote", fn: insertQuote },
  { label: "format.table", icon: "table", fn: insertTable },
  { label: "format.divider", icon: "divider", fn: insertDivider },
];
</script>

<template>
  <!-- mousedown.prevent keeps focus (and the selection) in the editor. -->
  <div ref="root" class="toolbar" role="toolbar" :aria-label="t('format.toolbar')" @mousedown.prevent>
    <div class="menu-anchor">
      <button class="block-select" :aria-expanded="openMenu === 'block'" @click="toggle('block')">
        {{ blockLabel(state.block) }}
        <Icon name="chevronDown" :size="18" :stroke-width="2" />
      </button>
      <div v-if="openMenu === 'block'" class="menu" role="menu">
        <button
          v-for="b in blockOptions"
          :key="b"
          role="menuitemradio"
          :aria-checked="state.block === b"
          :class="['menu-item', `menu-${b}`, { selected: state.block === b }]"
          @click="run((v) => setBlock(v, b))"
        >
          {{ blockLabel(b) }}
        </button>
      </div>
    </div>

    <span class="sep" />
    <button class="tool" :class="{ on: state.bold }" :aria-label="t('format.bold')" :title="`${t('format.bold')} (⌘B)`" :aria-pressed="state.bold" @click="run((v) => toggleInline(v, 'bold'))">
      <Icon name="bold" :stroke-width="state.bold ? 2.2 : 1.8" />
    </button>
    <button class="tool" :class="{ on: state.italic }" :aria-label="t('format.italic')" :title="`${t('format.italic')} (⌘I)`" :aria-pressed="state.italic" @click="run((v) => toggleInline(v, 'italic'))">
      <Icon name="italic" />
    </button>
    <button class="tool" :class="{ on: state.code }" :aria-label="t('format.inlineCode')" :title="`${t('format.inlineCode')} (⌘E)`" :aria-pressed="state.code" @click="run((v) => toggleInline(v, 'code'))">
      <Icon name="code" />
    </button>
    <button class="tool" :class="{ on: state.link }" :aria-label="t('format.link')" :title="`${t('format.link')} (⌘K)`" @click="run(insertLink)">
      <Icon name="link" />
    </button>

    <span class="sep" />
    <button class="tool" :aria-label="t('format.bulletList')" :title="t('format.bulletList')" @click="run((v) => toggleList(v, 'bullet'))">
      <Icon name="bulletList" />
    </button>
    <button class="tool" :aria-label="t('format.taskList')" :title="t('format.taskList')" @click="run((v) => toggleList(v, 'task'))">
      <Icon name="taskList" />
    </button>
    <button class="tool" :aria-label="t('format.image')" :title="t('format.image')" @click="run(insertImage)">
      <Icon name="image" />
    </button>
    <button class="tool" :aria-label="t('format.table')" :title="t('format.table')" @click="run(insertTable)">
      <Icon name="table" />
    </button>

    <div class="menu-anchor">
      <button class="fab" :aria-label="t('format.insertBlock')" :title="t('format.insertBlock')" :aria-expanded="openMenu === 'insert'" @click="toggle('insert')">
        <Icon name="plus" :size="22" :stroke-width="2" />
      </button>
      <div v-if="openMenu === 'insert'" class="menu menu-end" role="menu">
        <button v-for="item in insertItems" :key="item.label" role="menuitem" class="menu-item" @click="run(item.fn)">
          <Icon :name="item.icon" :size="18" />
          {{ t(item.label) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  height: 64px;
  padding: 8px 8px 8px 12px;
  border-radius: 32px;
  background: var(--md-surface-high);
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow:
    0 6px 20px rgba(var(--md-shadow), 0.14),
    0 1px 3px rgba(var(--md-shadow), 0.1);
}

.block-select {
  height: 40px;
  min-width: 124px;
  border-radius: 20px;
  background: var(--md-surface-lowest);
  color: var(--md-on-surface);
  font-size: 14px;
  font-weight: 600;
  padding: 0 10px 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.sep {
  width: 1px;
  height: 24px;
  background: var(--md-outline-variant);
  margin: 0 6px;
}

.tool {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  color: var(--md-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-radius 0.2s,
    background-color 0.15s;
}

.tool:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

/* M3 Expressive: a toggled button morphs from circle to rounded square. */
.tool.on {
  border-radius: 12px;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.fab {
  width: 48px;
  height: 48px;
  margin-left: 6px;
  border-radius: 16px;
  background: var(--md-primary);
  color: var(--md-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  background: color-mix(in srgb, var(--md-primary) 88%, var(--md-on-primary));
}

.menu-anchor {
  position: relative;
}

.menu {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  min-width: 180px;
  padding: 8px 0;
  border-radius: 16px;
  background: var(--md-surface-container);
  box-shadow: 0 6px 20px rgba(var(--md-shadow), 0.18);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.menu-end {
  left: auto;
  right: 0;
}

.menu-item {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  color: var(--md-on-surface);
  font-size: 14px;
}

.menu-item:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.menu-item.selected {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.menu-h1,
.menu-h2,
.menu-h3 {
  font-family: var(--font-doc);
  font-weight: 600;
}
.menu-h1 {
  font-size: 22px;
}
.menu-h2 {
  font-size: 19px;
}
.menu-h3 {
  font-size: 17px;
}
</style>

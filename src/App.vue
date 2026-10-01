<script setup lang="ts">
import { EditorSelection } from "@codemirror/state";
import { marked } from "marked";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import FileTree from "./components/FileTree.vue";
import FormatToolbar from "./components/FormatToolbar.vue";
import Icon from "./components/Icon.vue";
import MarkdownEditor from "./components/MarkdownEditor.vue";
import SettingsView from "./components/SettingsView.vue";
import { resolvedMode, settings } from "./data/settings";
import { t, type MessageKey } from "./i18n";
import { resetZoom, resolvedMode, settings, ZOOM_MAX, ZOOM_MIN, zoomIn, zoomOut } from "./data/settings";
import { showTreeMenu } from "./data/treeMenu";
import { checkForUpdates } from "./data/updater";
import {
  activeFile,
  activeFolder,
  createFile,
  error,
  isDirty,
  openWorkspace,
  refresh,
  renamingId,
  rootName,
  rootPath,
  saveActive,
  tree,
} from "./data/workspace";
import type { FormatState } from "./editor/formatting";

type ViewMode = "live" | "source" | "split";
type Panel = "files" | "outline" | "search" | "history";

const mode = ref<ViewMode>("live");
const panel = ref<Panel>("files");
const sidebarOpen = ref(true);
const focusMode = ref(false);
const settingsOpen = ref(false);
const dark = computed(() => resolvedMode.value === "dark");
const editor = ref<InstanceType<typeof MarkdownEditor>>();
const format = ref<FormatState>({ bold: false, italic: false, code: false, strike: false, link: false, block: "p" });

const modes: { id: ViewMode; label: MessageKey }[] = [
  { id: "live", label: "editor.live" },
  { id: "source", label: "editor.source" },
  { id: "split", label: "editor.split" },
];

const railItems: { id: Panel; label: MessageKey; icon: string }[] = [
  { id: "files", label: "panel.files", icon: "folder" },
  { id: "outline", label: "panel.outline", icon: "outline" },
  { id: "search", label: "panel.search", icon: "search" },
  { id: "history", label: "panel.history", icon: "history" },
];
const panelLabel = computed(() => t(railItems.find((i) => i.id === panel.value)!.label));

/** The empty-state sentence around the bold folder name, which sits at a different spot in each language. */
const selectNoteParts = computed(() => t("empty.selectNote", { name: "\0" }).split("\0"));

const words = computed(() => {
  const text = (activeFile.value?.content ?? "").replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`~\-[\]()!|]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
});
const readMinutes = computed(() => Math.max(1, Math.round(words.value / 200)));

const previewHtml = computed(() =>
  mode.value === "split" && activeFile.value ? (marked.parse(activeFile.value.content, { gfm: true }) as string) : "",
);

const outline = computed(() => {
  const items: { level: number; text: string; line: number }[] = [];
  let inFence = false;
  (activeFile.value?.content ?? "").split("\n").forEach((line, i) => {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) items.push({ level: m[1].length, text: m[2], line: i + 1 });
  });
  return items;
});

function jumpToLine(n: number) {
  const view = editor.value?.view;
  if (!view) return;
  const line = view.state.doc.line(n);
  view.dispatch({ selection: EditorSelection.cursor(line.to), scrollIntoView: true });
  view.focus();
}

function selectPanel(id: Panel) {
  settingsOpen.value = false;
  if (panel.value === id) sidebarOpen.value = !sidebarOpen.value;
  else {
    panel.value = id;
    sidebarOpen.value = true;
  }
}

/** Renames happen inline in the file tree, so reveal it first. */
function startRename() {
  if (!activeFile.value) return;
  focusMode.value = false;
  settingsOpen.value = false;
  panel.value = "files";
  sidebarOpen.value = true;
  if (activeFolder.value) activeFolder.value.open = true;
  renamingId.value = activeFile.value.id;
}

function onKey(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveActive();
  } else if (mod && e.key.toLowerCase() === "o") {
    e.preventDefault();
    openWorkspace();
  } else if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
    e.preventDefault();
    focusMode.value = !focusMode.value;
  } else if (mod && (e.key === "=" || e.key === "+")) {
    e.preventDefault();
    zoomIn();
  } else if (mod && (e.key === "-" || e.key === "_")) {
    e.preventDefault();
    zoomOut();
  } else if (mod && e.key === "0") {
    e.preventDefault();
    resetZoom();
  } else if (mod && e.key === ",") {
    e.preventDefault();
    settingsOpen.value = !settingsOpen.value;
  } else if (e.key === "Escape" && settingsOpen.value) {
    settingsOpen.value = false;
  } else if (e.key === "Escape" && focusMode.value) {
    focusMode.value = false;
  }
}
onMounted(() => {
  window.addEventListener("keydown", onKey);
  if (import.meta.env.PROD) checkForUpdates({ silent: true });
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="app" :class="{ focus: focusMode }">
    <!-- Navigation rail -->
    <nav v-if="!focusMode" class="rail" :aria-label="t('nav.primary')">
      <!-- Space for the native macOS traffic lights (overlay title bar). -->
      <div class="titlebar-space" data-tauri-drag-region />
      <button class="icon-btn lg" :aria-label="sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')" @click="sidebarOpen = !sidebarOpen">
        <Icon name="menu" :size="22" />
      </button>
      <button class="open-folder" :aria-label="t('nav.openFolder')" :title="t('nav.openFolderShortcut')" @click="openWorkspace()">
        <Icon name="folderOpen" :size="24" />
      </button>
      <div class="rail-items">
        <button
          v-for="item in railItems"
          :key="item.id"
          class="rail-item"
          :class="{ active: panel === item.id && sidebarOpen }"
          @click="selectPanel(item.id)"
        >
          <span class="indicator"><Icon :name="item.icon" :size="22" /></span>
          <span class="rail-label">{{ t(item.label) }}</span>
        </button>
      </div>
      <div class="grow" data-tauri-drag-region />
      <button class="icon-btn lg" :aria-label="dark ? t('nav.lightTheme') : t('nav.darkTheme')" @click="settings.theme = dark ? 'light' : 'dark'">
        <Icon :name="dark ? 'sun' : 'moon'" :size="22" />
      </button>
      <button
        class="icon-btn lg"
        :class="{ active: settingsOpen }"
        :aria-label="t('nav.settings')"
        :title="t('nav.settingsShortcut')"
        :aria-pressed="settingsOpen"
        @click="settingsOpen = !settingsOpen"
      >
        <Icon name="sliders" :size="22" />
      </button>
    </nav>

    <!-- Side panel -->
    <aside v-if="!focusMode && sidebarOpen" class="side" :aria-label="panelLabel">
      <div class="side-header" data-tauri-drag-region>
        <div class="side-title">
          <span class="overline">{{ panel === "files" ? t("panel.workspace") : activeFile?.name }}</span>
          <span class="headline" :title="panel === 'files' ? rootPath ?? undefined : undefined">
            {{ panel === "files" ? rootName || t("panel.noFolder") : panelLabel }}
          </span>
        </div>
        <template v-if="panel === 'files' && rootPath">
          <button class="icon-btn" :aria-label="t('panel.newFile')" :title="t('panel.newFile')" @click="createFile()"><Icon name="plus" /></button>
          <button class="icon-btn" :aria-label="t('panel.reloadFolder')" :title="t('panel.reloadFolder')" @click="refresh()"><Icon name="reset" /></button>
        </template>
      </div>

      <div v-if="panel === 'files' && rootPath" role="tree" class="tree files" @contextmenu.prevent="showTreeMenu()">
        <FileTree :nodes="tree" />
        <p v-if="!tree.length" class="empty">{{ t("panel.noMarkdown") }}</p>
      </div>

      <div v-else-if="panel === 'files'" class="tree">
        <p class="empty">{{ t("panel.openToBrowse") }}</p>
        <button class="tonal-btn" @click="openWorkspace()"><Icon name="folderOpen" :size="18" />{{ t("nav.openFolder") }}</button>
      </div>

      <div v-else-if="panel === 'outline'" class="tree">
        <button
          v-for="h in outline"
          :key="h.line"
          class="outline-item"
          :style="{ paddingLeft: `${12 + (h.level - 1) * 16}px` }"
          :class="`lvl${h.level}`"
          @click="jumpToLine(h.line)"
        >
          {{ h.text || t("panel.untitled") }}
        </button>
        <p v-if="!outline.length" class="empty">{{ t("panel.noHeadings") }}</p>
      </div>

      <p v-else class="empty">{{ t("panel.notAvailable", { panel: panelLabel }) }}</p>
    </aside>

    <!-- Editor pane -->
    <main v-if="settingsOpen && !focusMode" class="pane">
      <SettingsView @close="settingsOpen = false" />
    </main>

    <main v-show="(!settingsOpen || focusMode) && !activeFile" class="pane empty-pane">
      <header class="pane-header" data-tauri-drag-region />
      <div class="placeholder">
        <Icon name="folderOpen" :size="40" class="outline-color" />
        <p v-if="!rootPath">{{ t("empty.openToStart") }}</p>
        <p v-else>{{ selectNoteParts[0] }}<strong>{{ rootName }}</strong>{{ selectNoteParts[1] }}</p>
        <button v-if="!rootPath" class="tonal-btn" @click="openWorkspace()"><Icon name="folderOpen" :size="18" />{{ t("nav.openFolder") }}</button>
        <button v-else class="tonal-btn" @click="createFile()"><Icon name="plus" :size="18" />{{ t("empty.newNote") }}</button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </main>

    <main v-if="activeFile" v-show="!settingsOpen || focusMode" class="pane">
      <header class="pane-header" data-tauri-drag-region>
        <div class="breadcrumb" data-tauri-drag-region>
          <template v-if="activeFolder">
            <span class="muted">{{ activeFolder.name }}</span>
            <Icon name="chevronRight" :size="16" :stroke-width="2" class="outline-color" />
          </template>
          <span class="doc-name" :title="t('editor.renameHint')" @dblclick="startRename">{{ activeFile.name }}</span>
        </div>
        <div role="group" :aria-label="t('editor.mode')" class="segmented">
          <button v-for="m in modes" :key="m.id" :aria-pressed="mode === m.id" :class="{ on: mode === m.id }" @click="mode = m.id">
            <Icon v-if="mode === m.id" name="check" :size="16" :stroke-width="2.2" />
            {{ t(m.label) }}
          </button>
        </div>
        <div style="width: 8px" />
        <button
          class="icon-btn"
          :aria-label="focusMode ? t('editor.exitFocusMode') : t('editor.focusMode')"
          :aria-pressed="focusMode"
          :title="t('editor.focusModeShortcut')"
          @click="focusMode = !focusMode"
        >
          <Icon name="focus" />
        </button>
      </header>

      <div class="body" :class="{ split: mode === 'split' }">
        <div class="editor-wrap">
          <MarkdownEditor
            ref="editor"
            v-model="activeFile.content"
            :doc-id="activeFile.id"
            :mode="mode === 'live' ? 'live' : 'source'"
            @format="format = $event"
          />
        </div>
        <!-- Content is the user's own local document. -->
        <article v-if="mode === 'split'" class="preview" v-html="previewHtml" />

        <div v-if="mode === 'live'" class="toolbar-dock">
          <FormatToolbar :view="editor?.view" :state="format" />
        </div>
      </div>

      <footer class="status">
        <span>Markdown</span><span>UTF-8</span><span>LF</span>
        <span class="grow" />
        <span v-if="error" class="error" :title="error" @click="error = null">{{ error }}</span>
        <span>{{ t(words === 1 ? "status.word" : "status.words", { n: words }) }}</span>
        <span>{{ t("status.readTime", { n: readMinutes }) }}</span>
        <span v-if="isDirty(activeFile)" class="state edited">{{ settings.autoSave ? t("status.edited") : t("status.editedManual") }}</span>
        <span v-else class="state saved"><Icon name="check" :size="14" :stroke-width="2.4" />{{ t("status.saved") }}</span>
        <div role="group" aria-label="Zoom" class="zoom">
          <button aria-label="Zoom out" title="Zoom out (⌘−)" :disabled="settings.editorZoom <= ZOOM_MIN" @click="zoomOut">−</button>
          <button class="zoom-level" title="Reset zoom (⌘0)" @click="resetZoom">{{ Math.round(settings.editorZoom * 100) }}%</button>
          <button aria-label="Zoom in" title="Zoom in (⌘+)" :disabled="settings.editorZoom >= ZOOM_MAX" @click="zoomIn">+</button>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  background: var(--md-surface);
  color: var(--md-on-surface);
}

.grow {
  flex-grow: 1;
}

.icon-btn.active {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.muted {
  color: var(--md-on-surface-variant);
}

.outline-color {
  color: var(--md-outline);
}

/* ---- Rail ---- */
.rail {
  width: 88px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 0 16px;
}

.titlebar-space {
  align-self: stretch;
  height: 16px;
}

.open-folder {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(var(--md-shadow), 0.12);
}

.open-folder:hover {
  box-shadow: 0 3px 8px rgba(var(--md-shadow), 0.18);
}

.rail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.rail-item {
  width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--md-on-surface-variant);
}

.indicator {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s;
}

.rail-item:hover .indicator {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.rail-item.active {
  color: var(--md-on-surface);
}

.rail-item.active .indicator {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.rail-label {
  font-size: 12px;
  font-weight: 500;
}

.rail-item.active .rail-label {
  font-weight: 650;
}

/* ---- Side panel ---- */
.side {
  width: 272px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px 16px 4px;
  min-height: 0;
}

.side-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px 8px 12px;
}

.side-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
  min-width: 0;
}

.overline {
  font-size: 12px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  letter-spacing: 0.4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.headline {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.2px;
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  min-height: 0;
}

/* Fill the panel so right-clicking the empty space below the tree opens its menu. */
.tree.files {
  flex-grow: 1;
}

.outline-item {
  min-height: 36px;
  border-radius: 18px;
  padding-right: 12px;
  text-align: left;
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.outline-item.lvl1 {
  color: var(--md-on-surface);
  font-weight: 600;
}

.outline-item:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.empty {
  margin: 8px 12px;
  color: var(--md-on-surface-variant);
}

/* ---- Editor pane ---- */
.pane {
  flex-grow: 1;
  min-width: 0;
  margin: 8px 8px 8px 0;
  background: var(--md-surface-lowest);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.focus .pane {
  margin: 8px;
}

.pane-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 28px;
}

.focus .pane-header {
  padding-left: 84px; /* clear the traffic lights */
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-grow: 1;
  min-width: 0;
  font-size: 15px;
  white-space: nowrap;
}

.doc-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segmented {
  display: flex;
  gap: 2px;
}

.segmented button {
  height: 36px;
  border-radius: 8px;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-radius 0.2s;
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

.body {
  flex-grow: 1;
  min-height: 0;
  position: relative;
  display: flex;
}

.editor-wrap {
  flex: 1 1 0;
  min-width: 0;
}

.split .editor-wrap {
  border-right: 1px solid var(--md-outline-variant);
}

.preview {
  flex: 1 1 0;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 40px 80px;
  font-family: var(--font-doc);
  font-size: 18px;
  line-height: 1.55;
  user-select: text;
  zoom: var(--editor-zoom, 1);
}

.preview :deep(h1) {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.6px;
  margin: 0 0 12px;
}

.preview :deep(h2) {
  font-size: 26px;
  font-weight: 600;
  margin: 28px 0 10px;
}

.preview :deep(p) {
  margin: 0 0 12px;
}

.preview :deep(a) {
  color: var(--md-primary);
}

.preview :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.8em;
  background: var(--md-surface-low);
  padding: 2px 6px;
  border-radius: 6px;
}

.preview :deep(pre) {
  background: var(--md-surface-low);
  border-radius: 16px;
  padding: 14px 16px;
  overflow-x: auto;
}

.preview :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 14px;
}

.preview :deep(blockquote) {
  margin: 0 0 12px;
  padding-left: 16px;
  border-left: 3px solid var(--md-primary);
  color: var(--md-on-surface-variant);
}

.preview :deep(ul:has(input)) {
  list-style: none;
  padding-left: 0;
}

.preview :deep(input[type="checkbox"]) {
  accent-color: var(--md-primary);
  margin-right: 10px;
}

.preview :deep(table) {
  border-collapse: collapse;
  font-family: var(--font-ui);
  font-size: 14px;
}

.preview :deep(th),
.preview :deep(td) {
  border: 1px solid var(--md-outline-variant);
  padding: 6px 12px;
}

.preview :deep(hr) {
  border: 0;
  border-top: 1px solid var(--md-outline-variant);
}

.toolbar-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.toolbar-dock > * {
  pointer-events: auto;
}

.status {
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px 2px 28px;
  font-size: 12px;
  color: var(--md-on-surface-variant);
}

.state {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.saved {
  color: var(--md-primary);
}

.zoom {
  display: flex;
  align-items: center;
  margin-right: -8px;
}

.zoom button {
  height: 24px;
  min-width: 24px;
  border-radius: 12px;
  font-size: 14px;
  color: var(--md-on-surface-variant);
}

.zoom .zoom-level {
  min-width: 44px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.zoom button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.zoom button:disabled {
  opacity: 0.38;
}

.error {
  color: var(--md-error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.tonal-btn {
  align-self: flex-start;
  height: 40px;
  border-radius: 20px;
  padding: 0 20px 0 16px;
  margin: 4px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.tonal-btn:hover {
  box-shadow: 0 1px 3px rgba(var(--md-shadow), 0.15);
}

.placeholder {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-bottom: 64px;
  color: var(--md-on-surface-variant);
  text-align: center;
}

.placeholder p {
  margin: 0;
}

.placeholder .tonal-btn {
  align-self: center;
}

.placeholder .error {
  white-space: normal;
  max-width: 480px;
}
</style>

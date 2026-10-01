<script setup lang="ts">
import { showTreeMenu } from "../data/treeMenu";
import { activeId, isDirty, renameNode, renamingId, selectFile, trashNode, type Folder, type TreeNode } from "../data/workspace";
import { t } from "../i18n";
import Icon from "./Icon.vue";

/** `parent` is the folder holding `nodes`, absent at the workspace root. */
defineProps<{ nodes: TreeNode[]; depth?: number; parent?: Folder }>();

/** Focuses the rename field and selects the name without its extension. */
function focusInput(el: unknown) {
  if (!(el instanceof HTMLInputElement) || document.activeElement === el) return;
  el.focus();
  el.setSelectionRange(0, el.value.replace(/\.(md|markdown)$/i, "").length);
}

function commit(node: TreeNode, e: Event) {
  // Enter commits and removes the input, which then fires blur; handle only once.
  if (renamingId.value !== node.id) return;
  renamingId.value = null;
  renameNode(node, (e.target as HTMLInputElement).value);
}
</script>

<template>
  <template v-for="node in nodes" :key="node.id">
    <div
      v-if="node.id === renamingId"
      class="row"
      :class="{ current: node.id === activeId }"
      :style="{ paddingLeft: `${12 + (depth ?? 0) * 24}px` }"
    >
      <template v-if="node.kind === 'folder'">
        <span class="twisty-space" />
        <Icon name="folder" :size="18" class="primary" />
      </template>
      <Icon v-else name="file" :size="18" :class="node.id === activeId ? '' : 'muted'" />
      <input
        :ref="focusInput"
        class="rename"
        :value="node.name"
        :aria-label="node.kind === 'folder' ? t('tree.folderName') : t('tree.fileName')"
        spellcheck="false"
        @keydown.enter.prevent="commit(node, $event)"
        @keydown.esc.prevent.stop="renamingId = null"
        @blur="commit(node, $event)"
      />
    </div>

    <template v-else-if="node.kind === 'folder'">
      <button
        class="row"
        role="treeitem"
        :aria-expanded="node.assets ? undefined : node.open"
        :style="{ paddingLeft: `${12 + (depth ?? 0) * 24}px` }"
        @click="node.open = !node.open"
        @contextmenu.prevent.stop="showTreeMenu(node, parent)"
        @keydown.f2.prevent="renamingId = node.id"
        @keydown.meta.backspace.prevent="trashNode(node)"
      >
        <template v-if="node.assets">
          <span class="twisty-space" />
          <Icon name="image" :size="18" class="muted" />
          <span class="muted">{{ node.name }}</span>
        </template>
        <template v-else>
          <Icon :name="node.open ? 'chevronDown' : 'chevronRight'" :size="16" :stroke-width="2" class="muted" />
          <Icon name="folder" :size="18" :class="node.open ? 'primary' : 'muted'" />
          <span class="folder-name">{{ node.name }}</span>
        </template>
      </button>
      <FileTree v-if="node.open && !node.assets" :nodes="node.children" :depth="(depth ?? 0) + 1" :parent="node" />
    </template>

    <button
      v-else
      class="row"
      role="treeitem"
      :class="{ current: node.id === activeId }"
      :aria-current="node.id === activeId ? 'page' : undefined"
      :style="{ paddingLeft: `${12 + (depth ?? 0) * 24}px` }"
      :title="t('tree.fileHint')"
      @click="selectFile(node)"
      @dblclick="renamingId = node.id"
      @contextmenu.prevent.stop="showTreeMenu(node, parent)"
      @keydown.f2.prevent="renamingId = node.id"
      @keydown.meta.backspace.prevent="trashNode(node)"
    >
      <Icon name="file" :size="18" :class="node.id === activeId ? '' : 'muted'" />
      <span class="file-name">{{ node.name }}</span>
      <span v-if="isDirty(node)" class="dirty" :aria-label="t('tree.unsaved')" />
    </button>
  </template>
</template>

<style scoped>
.row {
  height: 36px;
  border-radius: 18px;
  color: var(--md-on-surface);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  text-align: left;
  font-size: 14px;
  flex-shrink: 0;
}

.row:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.row.current {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.folder-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rename {
  flex-grow: 1;
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  margin-left: -4px;
  border: 2px solid var(--md-primary);
  border-radius: 8px;
  background: var(--md-surface-lowest);
  color: var(--md-on-surface);
  font: inherit;
  outline: none;
}

.current .file-name {
  font-weight: 650;
}

.twisty-space {
  width: 16px;
  flex-shrink: 0;
}

.muted {
  color: var(--md-on-surface-variant);
}

.primary {
  color: var(--md-primary);
}

.dirty {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--md-primary);
  flex-shrink: 0;
}
</style>

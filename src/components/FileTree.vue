<script setup lang="ts">
import { activeId, isDirty, type TreeNode } from "../data/workspace";
import Icon from "./Icon.vue";

defineProps<{ nodes: TreeNode[]; depth?: number }>();
</script>

<template>
  <template v-for="node in nodes" :key="node.id">
    <template v-if="node.kind === 'folder'">
      <button
        class="row"
        role="treeitem"
        :aria-expanded="node.assets ? undefined : node.open"
        :style="{ paddingLeft: `${12 + (depth ?? 0) * 24}px` }"
        @click="node.open = !node.open"
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
      <FileTree v-if="node.open && !node.assets" :nodes="node.children" :depth="(depth ?? 0) + 1" />
    </template>

    <button
      v-else
      class="row"
      role="treeitem"
      :class="{ current: node.id === activeId }"
      :aria-current="node.id === activeId ? 'page' : undefined"
      :style="{ paddingLeft: `${12 + (depth ?? 0) * 24}px` }"
      @click="activeId = node.id"
    >
      <Icon name="file" :size="18" :class="node.id === activeId ? '' : 'muted'" />
      <span class="file-name">{{ node.name }}</span>
      <span v-if="isDirty(node)" class="dirty" aria-label="Unsaved changes" />
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
}

.file-name {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

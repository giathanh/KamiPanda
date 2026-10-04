<script setup lang="ts">
import "../styles.css";
import KitIcon from "./KitIcon.vue";

defineProps<{ title: string; closeLabel: string; closeTitle?: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div class="sk-settings">
    <header class="sk-header" data-tauri-drag-region>
      <span class="sk-title" data-tauri-drag-region>{{ title }}</span>
      <button class="sk-icon-btn" :aria-label="closeLabel" :title="closeTitle ?? closeLabel" @click="$emit('close')">
        <KitIcon name="close" />
      </button>
    </header>

    <div class="sk-scroll">
      <div class="sk-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sk-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sk-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 28px;
}

.sk-title {
  flex-grow: 1;
  font-size: 15px;
  font-weight: 600;
}

.sk-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  color: var(--md-on-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.sk-icon-btn:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.sk-scroll {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
}

.sk-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 8px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
</style>

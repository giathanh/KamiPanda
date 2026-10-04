<script setup lang="ts" generic="T extends string">
import KitIcon from "./KitIcon.vue";

defineProps<{ options: { value: T; label: string }[]; label: string }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <!-- Styled like the segmented buttons, with the native menu underneath. -->
  <div class="sk-select">
    <select v-model="model" :aria-label="label">
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <KitIcon name="chevronDown" :size="18" :stroke-width="2" />
  </div>
</template>

<style scoped>
.sk-select {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--md-on-surface);
}

.sk-select select {
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

.sk-select select:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.sk-select svg {
  position: absolute;
  right: 14px;
  pointer-events: none;
  color: var(--md-on-surface-variant);
}
</style>

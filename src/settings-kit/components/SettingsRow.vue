<script setup lang="ts">
/** Title and optional subtitle on the left, the control (default slot) on the right. */
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="sk-row">
    <div class="sk-row-text">
      <span class="sk-row-title"><slot name="title">{{ title }}</slot></span>
      <span v-if="subtitle" class="sk-row-sub">{{ subtitle }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.sk-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sk-row-text {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sk-row-title {
  font-weight: 500;
}

.sk-row-sub {
  font-size: 12px;
  color: var(--md-on-surface-variant);
}
</style>

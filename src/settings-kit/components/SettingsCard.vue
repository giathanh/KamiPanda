<script setup lang="ts">
/** Rounded container for rows. `list` tightens it for dense lists; `heading` adds a small caps label on top. */
defineProps<{ list?: boolean; heading?: string }>();
</script>

<template>
  <div class="sk-card" :class="{ 'sk-card-list': list }">
    <h3 v-if="heading">{{ heading }}</h3>
    <slot />
    <div v-if="$slots.footer" class="sk-card-footer"><slot name="footer" /></div>
  </div>
</template>

<style scoped>
.sk-card {
  background: var(--md-surface-low);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sk-card-list {
  padding: 12px 8px;
  gap: 0;
}

h3 {
  margin: 4px 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.sk-card-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

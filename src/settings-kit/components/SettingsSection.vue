<script setup lang="ts">
/** A titled group of cards. `badge` sits next to the title; `hint` is a line of help text under it. */
defineProps<{ title: string; badge?: string; hint?: string }>();
</script>

<template>
  <section class="sk-section">
    <div class="sk-section-head">
      <h2>{{ title }}</h2>
      <span v-if="badge" class="sk-badge">{{ badge }}</span>
    </div>
    <p v-if="hint" class="sk-hint sk-hint-outside">{{ hint }}</p>
    <slot />
  </section>
</template>

<style scoped>
.sk-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-section-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-primary);
  letter-spacing: 0.1px;
}

.sk-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.sk-hint-outside {
  margin: -4px 4px 4px;
}
</style>

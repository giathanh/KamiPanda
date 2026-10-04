<script setup lang="ts" generic="T extends string | number | boolean">
import KitIcon from "./KitIcon.vue";

export interface SegmentOption<V> {
  value: V;
  label: string;
  /** Inline style for the button, e.g. to preview a font. */
  style?: Record<string, string>;
}

defineProps<{ options: SegmentOption<T>[]; label: string }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <div role="group" :aria-label="label" class="sk-segmented">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      :aria-pressed="model === opt.value"
      :class="{ on: model === opt.value }"
      :style="opt.style"
      @click="model = opt.value"
    >
      <KitIcon v-if="model === opt.value" name="check" :size="16" :stroke-width="2.2" />
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.sk-segmented {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.sk-segmented button {
  height: 36px;
  border-radius: 8px;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
  font-weight: 500;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sk-segmented button:first-child {
  border-radius: 18px 8px 8px 18px;
}

.sk-segmented button:last-child {
  border-radius: 8px 18px 18px 8px;
}

.sk-segmented button.on {
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-weight: 600;
  padding-left: 12px;
}
</style>

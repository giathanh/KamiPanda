<script setup lang="ts">
import type { NumberField } from "../schema";

const props = withDefaults(
  defineProps<{
    field: NumberField;
    label: string;
    decreaseLabel: string;
    increaseLabel: string;
    format?: (value: number) => string;
  }>(),
  { format: (value: number) => String(value) },
);
const model = defineModel<number>({ required: true });

function step(direction: 1 | -1) {
  model.value = props.field.clamp(model.value + direction * props.field.step);
}
</script>

<template>
  <div role="group" :aria-label="label" class="sk-stepper">
    <button :aria-label="decreaseLabel" :disabled="model <= field.min" @click="step(-1)">−</button>
    <span class="sk-stepper-value" aria-live="polite">{{ format(model) }}</span>
    <button :aria-label="increaseLabel" :disabled="model >= field.max" @click="step(1)">+</button>
  </div>
</template>

<style scoped>
.sk-stepper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 36px;
  border-radius: 18px;
  background: var(--md-surface-container);
}

.sk-stepper button {
  width: 40px;
  height: 36px;
  border-radius: 18px;
  font-size: 18px;
  color: var(--md-on-surface);
}

.sk-stepper button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}

.sk-stepper button:disabled {
  opacity: 0.38;
  cursor: default;
}

.sk-stepper-value {
  min-width: 52px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>

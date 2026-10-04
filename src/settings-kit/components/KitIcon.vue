<script setup lang="ts">
// The kit draws its own few glyphs so it does not depend on the host app's icon set.
const paths = {
  check: "M5 12l5 5 9-10",
  chevronDown: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
};

withDefaults(defineProps<{ name: keyof typeof paths; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 1.8,
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

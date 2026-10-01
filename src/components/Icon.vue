<script setup lang="ts">
import { computed } from "vue";
import { icons } from "../data/icons";

const props = withDefaults(defineProps<{ name: string; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 1.8,
});

const icon = computed(() => icons[props.name]);
</script>

<template>
  <svg
    v-if="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="icon.filled ? 'currentColor' : 'none'"
    :stroke="icon.filled ? 'none' : 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in icon.paths" :key="d" :d="d" />
    <path v-if="icon.dots" :d="icon.dots" :stroke-width="2.7" />
    <circle v-for="c in icon.circles" :key="c.join()" :cx="c[0]" :cy="c[1]" :r="c[2]" />
    <rect v-for="r in icon.rects" :key="r.join()" :x="r[0]" :y="r[1]" :width="r[2]" :height="r[3]" :rx="r[4]" />
  </svg>
</template>

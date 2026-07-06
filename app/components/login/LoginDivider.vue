<template>
  <div class="divider">
    <span class="divider__line"></span>
    <span class="divider__text">{{ text }}</span>
    <span class="divider__line"></span>
  </div>
</template>

<script setup lang="ts">
// Simple "or" divider between the password form and social login buttons.
withDefaults(defineProps<{ text?: string }>(), { text: '或' })
</script>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-subtle);
  font-size: 12px;
}
.divider__line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
</style>

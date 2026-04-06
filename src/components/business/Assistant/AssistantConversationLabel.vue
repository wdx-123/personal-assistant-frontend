<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <div class="assistant-conversation-label">
    <strong class="assistant-conversation-label__title" :title="title">{{ title }}</strong>
  </div>
</template>

<style scoped>
.assistant-conversation-label {
  display: block;
  min-width: 0;
  font-family: var(--assistant-font-family-sans);
}

.assistant-conversation-label__title {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font-size: var(--assistant-type-sidebar-item-size);
  font-weight: inherit;
  line-height: var(--assistant-type-sidebar-item-line-height);
  letter-spacing: -0.005em;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>

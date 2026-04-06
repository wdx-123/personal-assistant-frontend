<script setup lang="ts">
interface Props {
  content: string
}

defineProps<Props>()
</script>

<template>
  <div class="assistant-user-message-content">
    {{ content || '暂无内容' }}
  </div>
</template>

<style scoped>
.assistant-user-message-content {
  width: fit-content;
  max-width: min(680px, 72vw);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.72;
}
</style>

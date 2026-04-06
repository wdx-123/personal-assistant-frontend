<script setup lang="ts">
import { computed } from 'vue'
import { renderAssistantMarkdown } from './assistantMarkdown'

interface Props {
  content: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const html = computed(() => renderAssistantMarkdown(props.content))
</script>

<template>
  <div class="assistant-markdown" :class="{ compact }" v-html="html" />
</template>

<style scoped>
.assistant-markdown {
  color: #0f172a;
  line-height: 1.72;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
  width: 100%;
}

.assistant-markdown:deep(h1),
.assistant-markdown:deep(h2),
.assistant-markdown:deep(h3),
.assistant-markdown:deep(h4) {
  margin: 18px 0 10px;
  color: #0f172a;
  line-height: 1.35;
}

.assistant-markdown:deep(h1) {
  font-size: 24px;
}

.assistant-markdown:deep(h2) {
  font-size: 20px;
}

.assistant-markdown:deep(h3) {
  font-size: 17px;
}

.assistant-markdown:deep(p),
.assistant-markdown:deep(ul),
.assistant-markdown:deep(ol),
.assistant-markdown:deep(blockquote),
.assistant-markdown:deep(pre),
.assistant-markdown:deep(table) {
  margin: 0 0 14px;
}

.assistant-markdown:deep(ul),
.assistant-markdown:deep(ol) {
  padding-left: 20px;
}

.assistant-markdown:deep(li + li) {
  margin-top: 6px;
}

.assistant-markdown:deep(blockquote) {
  padding: 10px 14px;
  border-left: 3px solid #93c5fd;
  border-radius: 0 14px 14px 0;
  background: rgba(219, 234, 254, 0.42);
  color: #1e3a8a;
}

.assistant-markdown:deep(code) {
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 0.92em;
  background: rgba(15, 23, 42, 0.08);
}

.assistant-markdown:deep(pre) {
  overflow: auto;
  max-width: 100%;
  border-radius: 16px;
  padding: 14px 16px;
  background: #0f172a;
  color: #e2e8f0;
}

.assistant-markdown:deep(pre code) {
  white-space: pre;
  padding: 0;
  background: transparent;
  color: inherit;
}

.assistant-markdown:deep(table) {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 14px;
}

.assistant-markdown:deep(th),
.assistant-markdown:deep(td) {
  padding: 10px 12px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  text-align: left;
}

.assistant-markdown:deep(th) {
  background: rgba(241, 245, 249, 0.95);
}

.assistant-markdown:deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.assistant-markdown.compact {
  font-size: 13px;
}

.assistant-markdown.compact:deep(h1) {
  font-size: 20px;
}

.assistant-markdown.compact:deep(h2) {
  font-size: 17px;
}
</style>

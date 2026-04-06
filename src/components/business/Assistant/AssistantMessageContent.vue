<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AssistantMessage, AssistantTraceItem } from '@/types'
import AssistantMarkdownContent from './AssistantMarkdownContent.vue'

interface Props {
  message: AssistantMessage
}

const props = defineProps<Props>()

const expandedTraceKeys = ref<string[]>([])
const isTraceSectionExpanded = ref(false)

const hasScope = computed(() => Boolean(props.message.scope))
const hasTraceItems = computed(() => props.message.trace_items.length > 0)
const hasCards = computed(() => props.message.cards.length > 0)
const traceSummary = computed(() => {
  const total = props.message.trace_items.length
  const successCount = props.message.trace_items.filter((item) => item.status === 'success').length
  const awaitingCount = props.message.trace_items.filter((item) => item.status === 'awaiting_confirmation').length
  const pendingCount = props.message.trace_items.filter((item) => item.status === 'pending').length
  const skippedCount = props.message.trace_items.filter((item) => item.status === 'skipped').length

  if (awaitingCount > 0) {
    return `共 ${total} 步，当前有 ${awaitingCount} 个工具等待你在下方确认栏中选择`
  }

  if (pendingCount > 0) {
    return `共 ${total} 步，正在执行 ${pendingCount} 步，已完成 ${successCount} 步`
  }

  if (skippedCount > 0) {
    return `共 ${total} 步，已完成 ${successCount} 步，跳过 ${skippedCount} 步`
  }

  return `共 ${total} 步，已完成 ${successCount} 步`
})

watch(
  () => props.message.trace_items,
  (traceItems) => {
    const awaitingKeys = traceItems
      .filter((item) => item.status === 'awaiting_confirmation')
      .map((item) => item.key)

    if (awaitingKeys.length === 0) return

    isTraceSectionExpanded.value = true
    expandedTraceKeys.value = Array.from(
      new Set([...expandedTraceKeys.value, ...awaitingKeys]),
    )
  },
  { immediate: true, deep: true },
)

const isTraceExpanded = (key: string) => expandedTraceKeys.value.includes(key)

const toggleTraceExpanded = (key: string) => {
  expandedTraceKeys.value = isTraceExpanded(key)
    ? expandedTraceKeys.value.filter((item) => item !== key)
    : [...expandedTraceKeys.value, key]
}

const toggleTraceSection = () => {
  isTraceSectionExpanded.value = !isTraceSectionExpanded.value
}

const getStatusLabel = (status: AssistantTraceItem['status']) => {
  if (status === 'awaiting_confirmation') return '等待确认'
  if (status === 'skipped') return '已跳过'
  if (status === 'success') return '已完成'
  if (status === 'error') return '失败'
  return '进行中'
}

const getStatusClass = (status: AssistantTraceItem['status']) => {
  if (status === 'success') return 'assistant-message-content__status-badge--success'
  if (status === 'error') return 'assistant-message-content__status-badge--error'
  if (status === 'awaiting_confirmation') return 'assistant-message-content__status-badge--warning'
  if (status === 'skipped') return 'assistant-message-content__status-badge--muted'
  return 'assistant-message-content__status-badge--processing'
}

</script>

<template>
  <div class="assistant-message-content">
    <div v-if="hasScope" class="assistant-message-content__scope">
      <span class="assistant-message-content__scope-pill">用户：{{ message.scope?.user_name }}</span>
      <span class="assistant-message-content__scope-pill">组织：{{ message.scope?.org_name }}</span>
      <span class="assistant-message-content__scope-pill">任务：{{ message.scope?.task_name || '默认任务' }}</span>
      <span v-if="message.scope?.doc_scope_label" class="assistant-message-content__scope-pill">
        文档：{{ message.scope.doc_scope_label }}
      </span>
    </div>

    <AssistantMarkdownContent
      v-if="message.content"
      :content="message.content"
    />

    <section v-if="hasTraceItems" class="assistant-message-content__section">
      <button
        class="assistant-message-content__trace-overview"
        type="button"
        @click="toggleTraceSection"
      >
        <div class="assistant-message-content__trace-overview-copy">
          <span class="assistant-message-content__section-title">处理过程</span>
          <strong>执行步骤</strong>
          <p>{{ traceSummary }}</p>
        </div>

        <span class="assistant-message-content__trace-overview-action">
          {{ isTraceSectionExpanded ? '收起' : '展开' }}
        </span>
      </button>

      <div v-if="isTraceSectionExpanded" class="assistant-message-content__trace-list">
        <article
          v-for="trace in message.trace_items"
          :key="trace.key"
          class="assistant-message-content__trace-card"
        >
          <div class="assistant-message-content__trace-header">
            <div class="assistant-message-content__trace-main">
              <strong>{{ trace.title }}</strong>
              <p>{{ trace.description }}</p>
            </div>

            <div class="assistant-message-content__trace-meta">
              <span
                class="assistant-message-content__status-badge"
                :class="getStatusClass(trace.status)"
              >
                {{ getStatusLabel(trace.status) }}
              </span>
              <span v-if="trace.duration_ms" class="assistant-message-content__trace-duration">
                {{ trace.duration_ms }} ms
              </span>
            </div>
          </div>

          <div v-if="trace.content" class="assistant-message-content__trace-summary">
            {{ trace.content }}
          </div>

          <div
            v-if="trace.detail_markdown"
            class="assistant-message-content__trace-detail-toggle"
          >
            <button type="button" @click="toggleTraceExpanded(trace.key)">
              {{ isTraceExpanded(trace.key) ? '收起详情' : '查看详情' }}
            </button>
          </div>

          <div
            v-if="trace.detail_markdown && isTraceExpanded(trace.key)"
            class="assistant-message-content__trace-detail"
          >
            <AssistantMarkdownContent :content="trace.detail_markdown" compact />
          </div>

          <div
            v-if="trace.confirmation_title || trace.confirmation_description"
            class="assistant-message-content__trace-confirm"
          >
            <strong v-if="trace.confirmation_title">{{ trace.confirmation_title }}</strong>
            <p v-if="trace.confirmation_description">{{ trace.confirmation_description }}</p>
            <p class="assistant-message-content__trace-confirm-tip">
              请在输入框上方的确认栏中选择是否继续。
            </p>
          </div>
        </article>
      </div>
    </section>

    <section v-if="hasCards" class="assistant-message-content__section">
      <div class="assistant-message-content__section-title">结果摘要</div>

      <div class="assistant-message-content__card-list">
        <article
          v-for="card in message.cards"
          :key="card.key"
          class="assistant-message-content__result-card"
        >
          <h4>{{ card.title }}</h4>
          <p class="assistant-message-content__result-summary">{{ card.summary }}</p>

          <div class="assistant-message-content__metric-list">
            <div
              v-for="metric in card.metrics"
              :key="`${card.key}-${metric.label}`"
              class="assistant-message-content__metric"
            >
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>

          <ul class="assistant-message-content__bullet-list">
            <li v-for="bullet in card.bullets" :key="bullet">{{ bullet }}</li>
          </ul>

          <p v-if="card.extra" class="assistant-message-content__extra">{{ card.extra }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.assistant-message-content {
  display: grid;
  gap: 16px;
  width: min(100%, 920px);
  max-width: 100%;
}

.assistant-message-content__scope {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
}

.assistant-message-content__scope-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #475569;
  font-size: 12px;
  line-height: 1.3;
  background: #ffffff;
}

.assistant-message-content__section {
  display: grid;
  gap: 12px;
}

.assistant-message-content__trace-overview {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: left;
  background: transparent;
}

.assistant-message-content__trace-overview-copy {
  display: grid;
  gap: 4px;
}

.assistant-message-content__trace-overview-copy strong {
  color: #0f172a;
  font-size: 15px;
}

.assistant-message-content__trace-overview-copy p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.assistant-message-content__trace-overview-action {
  flex-shrink: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.assistant-message-content__section-title {
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.assistant-message-content__trace-list,
.assistant-message-content__card-list {
  display: grid;
  gap: 12px;
  max-width: 100%;
}

.assistant-message-content__trace-card,
.assistant-message-content__result-card {
  display: grid;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
  background: #ffffff;
}

.assistant-message-content__trace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.assistant-message-content__trace-main strong,
.assistant-message-content__result-card h4 {
  color: #0f172a;
  font-size: 16px;
}

.assistant-message-content__trace-main p,
.assistant-message-content__result-summary,
.assistant-message-content__trace-confirm p,
.assistant-message-content__extra {
  margin: 6px 0 0;
  color: #475569;
  line-height: 1.65;
}

.assistant-message-content__trace-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.assistant-message-content__status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  border: 1px solid transparent;
}

.assistant-message-content__status-badge--success {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.assistant-message-content__status-badge--error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.assistant-message-content__status-badge--warning {
  color: #92400e;
  background: #fff7ed;
  border-color: #fed7aa;
}

.assistant-message-content__status-badge--muted {
  color: #475569;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.assistant-message-content__status-badge--processing {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.assistant-message-content__trace-duration {
  color: #94a3b8;
  font-size: 12px;
}

.assistant-message-content__trace-summary {
  margin-top: 10px;
  color: #334155;
  line-height: 1.65;
}

.assistant-message-content__trace-detail-toggle {
  margin-top: 10px;
}

.assistant-message-content__trace-detail-toggle button {
  border: 0;
  padding: 0;
  cursor: pointer;
  color: #2563eb;
  background: transparent;
}

.assistant-message-content__trace-detail {
  margin-top: 14px;
  padding-left: 14px;
  border-left: 2px solid #dbe4ee;
}

.assistant-message-content__trace-confirm {
  margin-top: 12px;
  padding-left: 14px;
  border-left: 2px solid #dbe4ee;
}

.assistant-message-content__trace-confirm-tip {
  color: #64748b;
}

.assistant-message-content__metric-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
  max-width: 100%;
}

.assistant-message-content__metric {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.assistant-message-content__metric span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
}

.assistant-message-content__metric strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
}

.assistant-message-content__bullet-list {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #334155;
}

.assistant-message-content__bullet-list li + li {
  margin-top: 6px;
}

.assistant-message-content__result-card h4 {
  margin: 0;
}

@media (max-width: 960px) {
  .assistant-message-content__trace-header {
    flex-direction: column;
  }

  .assistant-message-content__metric-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<script setup lang="ts">
import { Tag } from 'ant-design-vue'
import { computed } from 'vue'
import { useAssistantStore } from '@/stores'
import type { AssistantMetric, AssistantTraceItem } from '@/types'

interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
})

const assistantStore = useAssistantStore()

const scopeRows = computed(() => {
  const scope = assistantStore.detailScope
  if (!scope) return []

  return [
    {
      label: '当前用户',
      value: scope.user_name,
    },
    {
      label: '当前组织',
      value: scope.org_name,
    },
    {
      label: '最近任务',
      value: scope.task_name || '默认任务',
    },
    {
      label: '文档范围',
      value: scope.doc_scope_label || scope.scope_label,
    },
  ]
})

const traceItems = computed(() => assistantStore.detailTraceItems)
const structuredCards = computed(() => assistantStore.detailCards)

const toneColorMap: Record<NonNullable<AssistantMetric['tone']>, string> = {
  primary: 'blue',
  success: 'green',
  warning: 'gold',
  danger: 'red',
}

const getStatusColor = (status: AssistantTraceItem['status']) => {
  if (status === 'success') return 'green'
  if (status === 'error') return 'red'
  if (status === 'awaiting_confirmation') return 'gold'
  if (status === 'skipped') return 'default'
  return 'processing'
}

const getStatusLabel = (status: AssistantTraceItem['status']) => {
  if (status === 'awaiting_confirmation') return '等待确认'
  if (status === 'skipped') return '已跳过'
  if (status === 'success') return '已完成'
  if (status === 'error') return '失败'
  return '进行中'
}
</script>

<template>
  <aside class="assistant-insight" :class="{ compact }">
    <section class="assistant-insight__panel">
      <header class="assistant-insight__section-header">
        <span class="assistant-insight__eyebrow">Session Scope</span>
        <h3 class="assistant-insight__title">当前分析范围</h3>
      </header>

      <div v-if="scopeRows.length" class="assistant-insight__scope-grid">
        <article
          v-for="item in scopeRows"
          :key="item.label"
          class="assistant-insight__scope-card"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <div v-else class="assistant-insight__empty">
        当前还没有可展示的范围信息。
      </div>
    </section>

    <section class="assistant-insight__panel">
      <header class="assistant-insight__section-header">
        <span class="assistant-insight__eyebrow">Execution</span>
        <h3 class="assistant-insight__title">执行轨迹与结果</h3>
      </header>

      <div v-if="traceItems.length" class="assistant-insight__trace-list">
        <article
          v-for="trace in traceItems"
          :key="trace.key"
          class="assistant-insight__trace-card"
        >
          <div class="assistant-insight__trace-head">
            <strong>{{ trace.title }}</strong>
            <Tag :color="getStatusColor(trace.status)">
              {{ getStatusLabel(trace.status) }}
            </Tag>
          </div>
          <p>{{ trace.description }}</p>
          <div class="assistant-insight__trace-meta">
            <span v-if="trace.duration_ms">{{ trace.duration_ms }} ms</span>
            <span v-if="trace.content">{{ trace.content }}</span>
          </div>
        </article>
      </div>

      <div v-else class="assistant-insight__empty">
        当前还没有执行轨迹。
      </div>

      <div v-if="structuredCards.length" class="assistant-insight__card-list">
        <article
          v-for="card in structuredCards"
          :key="card.key"
          class="assistant-insight__result-card"
        >
          <div class="assistant-insight__result-head">
            <h4>{{ card.title }}</h4>
            <Tag :color="toneColorMap[card.metrics[0]?.tone || 'primary']">
              {{ card.type }}
            </Tag>
          </div>
          <p class="assistant-insight__summary">{{ card.summary }}</p>

          <div class="assistant-insight__metrics">
            <div
              v-for="metric in card.metrics"
              :key="`${card.key}-${metric.label}`"
              class="assistant-insight__metric"
            >
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>

          <ul class="assistant-insight__bullets">
            <li v-for="bullet in card.bullets" :key="bullet">{{ bullet }}</li>
          </ul>

          <p v-if="card.extra" class="assistant-insight__extra">{{ card.extra }}</p>
        </article>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.assistant-insight {
  display: grid;
  gap: 18px;
  min-height: 0;
  font-family: var(--assistant-font-family-sans);
}

.assistant-insight.compact {
  gap: 14px;
}

.assistant-insight__panel {
  display: grid;
  gap: 14px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 24px;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
  box-shadow: 0 18px 36px rgba(148, 163, 184, 0.12);
}

.assistant-insight__section-header {
  display: grid;
  gap: 4px;
}

.assistant-insight__eyebrow {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.assistant-insight__title {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
}

.assistant-insight__scope-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.assistant-insight__scope-card {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(248, 250, 252, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.assistant-insight__scope-card span,
.assistant-insight__metric span {
  color: #94a3b8;
  font-size: 12px;
}

.assistant-insight__scope-card strong,
.assistant-insight__metric strong,
.assistant-insight__trace-head strong,
.assistant-insight__result-head h4 {
  color: #0f172a;
}

.assistant-insight__trace-list,
.assistant-insight__card-list {
  display: grid;
  gap: 14px;
}

.assistant-insight__trace-card,
.assistant-insight__result-card {
  display: grid;
  gap: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
  padding-top: 14px;
}

.assistant-insight__trace-card:first-child,
.assistant-insight__result-card:first-child {
  border-top: 0;
  padding-top: 0;
}

.assistant-insight__trace-head,
.assistant-insight__result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.assistant-insight__trace-card p,
.assistant-insight__summary,
.assistant-insight__extra {
  margin: 0;
  color: #475569;
  line-height: 1.65;
}

.assistant-insight__trace-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.assistant-insight__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.assistant-insight__metric {
  display: grid;
  gap: 4px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.82);
  padding-bottom: 10px;
}

.assistant-insight__bullets {
  margin: 0;
  padding-left: 18px;
  color: #334155;
}

.assistant-insight__bullets li + li {
  margin-top: 6px;
}

.assistant-insight__empty {
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .assistant-insight__scope-grid,
  .assistant-insight__metrics {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

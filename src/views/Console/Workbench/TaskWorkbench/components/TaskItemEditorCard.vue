<script setup lang="ts">
import {
  CheckCircleOutlined,
  DeleteOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import type { OJTaskAnalyzeCandidate } from '@/types'
import { PLATFORM_OPTIONS } from '../constants'
import {
  getFormItemStatusMeta,
  getPlatformLabel,
} from '../formatters'
import type { TaskFormItem } from '../local.types'

defineProps<{
  item: TaskFormItem
  index: number
  canRemove: boolean
}>()

const emit = defineEmits<{
  analyze: [item: TaskFormItem]
  remove: [index: number]
  changePlatform: [payload: { item: TaskFormItem; value: TaskFormItem['platform'] }]
  changeTitle: [payload: { item: TaskFormItem; value: string }]
  selectCandidate: [payload: { item: TaskFormItem; candidate: OJTaskAnalyzeCandidate }]
}>()
</script>

<template>
  <div class="task-item-card">
    <div class="task-item-card-header">
      <div class="task-item-index">
        第 {{ index + 1 }} 题
        <a-tag :color="getFormItemStatusMeta(item.status).color">
          {{ getFormItemStatusMeta(item.status).label }}
        </a-tag>
      </div>
      <a-space>
        <a-button size="small" @click="emit('analyze', item)">
          <template #icon><SyncOutlined /></template>
          重新分析
        </a-button>
        <a-button
          size="small"
          danger
          :disabled="!canRemove"
          @click="emit('remove', index)"
        >
          <template #icon><DeleteOutlined /></template>
          删除
        </a-button>
      </a-space>
    </div>

    <div class="task-item-row">
      <a-select
        :value="item.platform"
        style="width: 160px"
        :options="PLATFORM_OPTIONS"
        @update:value="(value) => emit('changePlatform', { item, value: value as TaskFormItem['platform'] })"
      />
      <a-input
        :value="item.title"
        class="task-item-title-input"
        placeholder="请输入题目标题，例如 Two Sum / A+B Problem"
        @update:value="(value) => emit('changeTitle', { item, value: value as string })"
      />
    </div>

    <div :class="['task-item-feedback', `is-${item.status}`]">
      <template v-if="item.status === 'resolved'">
        <div class="analysis-feedback-main">
          <CheckCircleOutlined class="analysis-feedback-icon success" />
          <div>
            <div class="analysis-feedback-title">已锁定唯一题目</div>
            <div class="analysis-feedback-subtitle">
              {{ getPlatformLabel(item.platform) }} · {{ item.resolvedQuestionCode || '-' }}
              <span v-if="item.resolvedTitle"> · {{ item.resolvedTitle }}</span>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="item.status === 'ambiguous'">
        <div class="analysis-feedback-main">
          <WarningOutlined class="analysis-feedback-icon warning" />
          <div>
            <div class="analysis-feedback-title">命中多个候选，请手动确认</div>
            <div class="analysis-feedback-subtitle">
              请选择最符合的权威题目，系统会写入对应的分析令牌。
            </div>
          </div>
        </div>
        <div class="candidate-grid">
          <button
            v-for="candidate in item.candidates"
            :key="candidate.analysis_token"
            type="button"
            class="candidate-card"
            @click="emit('selectCandidate', { item, candidate })"
          >
            <div class="candidate-code">{{ candidate.resolved_question_code }}</div>
            <div class="candidate-title">{{ candidate.resolved_title }}</div>
          </button>
        </div>
      </template>

      <template v-else-if="item.status === 'missing'">
        <div class="analysis-feedback-main">
          <WarningOutlined class="analysis-feedback-icon danger" />
          <div>
            <div class="analysis-feedback-title">本地题库未命中</div>
            <div class="analysis-feedback-subtitle">
              {{ item.errorText || '请修正标题后重新分析，当前不允许直接提交。' }}
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="item.status === 'invalid'">
        <div class="analysis-feedback-main">
          <WarningOutlined class="analysis-feedback-icon danger" />
          <div>
            <div class="analysis-feedback-title">输入需要修正</div>
            <div class="analysis-feedback-subtitle">
              {{ item.errorText || '标题为空或分析失败，请检查后重试。' }}
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="item.status === 'analyzing'">
        <div class="analysis-feedback-main">
          <SyncOutlined class="analysis-feedback-icon info spin" />
          <div>
            <div class="analysis-feedback-title">正在分析题目</div>
            <div class="analysis-feedback-subtitle">正在比对本地题库，请稍候。</div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="analysis-feedback-main">
          <SyncOutlined class="analysis-feedback-icon muted" />
          <div>
            <div class="analysis-feedback-title">等待分析</div>
            <div class="analysis-feedback-subtitle">修改平台或标题后，需要重新执行题单分析。</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.task-item-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.task-item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.task-item-index {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.task-item-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-item-title-input {
  flex: 1;
}

.task-item-feedback {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid transparent;
}

.task-item-feedback.is-idle {
  background: rgba(248, 250, 252, 0.92);
  border-color: rgba(148, 163, 184, 0.18);
}

.task-item-feedback.is-analyzing {
  background: rgba(239, 246, 255, 0.95);
  border-color: rgba(96, 165, 250, 0.24);
}

.task-item-feedback.is-resolved {
  background: rgba(236, 253, 245, 0.92);
  border-color: rgba(52, 211, 153, 0.28);
}

.task-item-feedback.is-ambiguous {
  background: rgba(255, 251, 235, 0.95);
  border-color: rgba(251, 191, 36, 0.28);
}

.task-item-feedback.is-missing,
.task-item-feedback.is-invalid {
  background: rgba(254, 242, 242, 0.94);
  border-color: rgba(248, 113, 113, 0.26);
}

.analysis-feedback-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.analysis-feedback-icon {
  margin-top: 2px;
  font-size: 18px;
}

.analysis-feedback-icon.success {
  color: #059669;
}

.analysis-feedback-icon.warning {
  color: #d97706;
}

.analysis-feedback-icon.danger {
  color: #dc2626;
}

.analysis-feedback-icon.info {
  color: #2563eb;
}

.analysis-feedback-icon.muted {
  color: #64748b;
}

.analysis-feedback-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.analysis-feedback-subtitle {
  margin-top: 4px;
  color: #475569;
  line-height: 1.7;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.candidate-card {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.candidate-card:hover {
  transform: translateY(-1px);
  border-color: rgba(217, 119, 6, 0.42);
  box-shadow: 0 12px 24px rgba(217, 119, 6, 0.12);
}

.candidate-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
}

.candidate-title {
  margin-top: 6px;
  color: #1f2937;
  line-height: 1.6;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .task-item-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-item-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

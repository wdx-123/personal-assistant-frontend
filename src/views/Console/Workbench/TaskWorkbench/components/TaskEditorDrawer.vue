<script setup lang="ts">
import { PlusOutlined, SyncOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import TaskItemEditorCard from './TaskItemEditorCard.vue'
import type {
  TaskAnalysisSummary,
  TaskFormItem,
  TaskFormState,
} from '../local.types'

defineProps<{
  open: boolean
  drawerTitle: string
  okText: string
  loading: boolean
  submitting: boolean
  analyzing: boolean
  form: TaskFormState
  orgLoading: boolean
  orgSelectOptions: Array<{ label: string; value: number }>
  showExecuteAt: boolean
  analysisSummary: TaskAnalysisSummary
  blockingCount: number
  analysisMessage: string
  canManualAnalyze: boolean
  ready: boolean
  disablePastDate: (current: Dayjs) => boolean
}>()

const emit = defineEmits<{
  close: []
  submit: []
  analyzeAll: []
  addItem: []
  analyzeItem: [item: TaskFormItem]
  removeItem: [index: number]
  changePlatform: [payload: { item: TaskFormItem; value: TaskFormItem['platform'] }]
  changeTitle: [payload: { item: TaskFormItem; value: string }]
  selectCandidate: [payload: { item: TaskFormItem; candidate: any }]
}>()
</script>

<template>
  <a-drawer
    :open="open"
    :title="drawerTitle"
    width="920"
    :mask-closable="!submitting"
    destroy-on-close
    class="task-drawer"
    @close="emit('close')"
  >
    <a-spin :spinning="loading || submitting">
      <a-form layout="vertical" class="task-form">
        <a-row :gutter="16">
          <a-col :xs="24" :lg="14">
            <a-form-item label="任务标题" required>
              <a-input
                v-model:value="form.title"
                placeholder="例如：3 月周测补题任务"
                :maxlength="120"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :lg="10">
            <a-form-item label="执行模式" required>
              <a-radio-group v-model:value="form.mode">
                <a-radio-button value="immediate">立即执行</a-radio-button>
                <a-radio-button value="scheduled">定时执行</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :xs="24" :lg="showExecuteAt ? 12 : 24">
            <a-form-item label="执行组织" required>
              <a-select
                v-model:value="form.orgIds"
                mode="multiple"
                :max-tag-count="4"
                :loading="orgLoading"
                :options="orgSelectOptions"
                placeholder="选择可见组织"
              />
            </a-form-item>
          </a-col>
          <a-col v-if="showExecuteAt" :xs="24" :lg="12">
            <a-form-item label="计划执行时间" required>
              <a-date-picker
                v-model:value="form.executeAt"
                show-time
                style="width: 100%"
                :disabled-date="disablePastDate"
                placeholder="选择未来时间"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="任务说明">
          <a-textarea
            v-model:value="form.description"
            :rows="3"
            :maxlength="500"
            show-count
            placeholder="描述这次任务的背景、目标或适用人群"
          />
        </a-form-item>

        <a-card :bordered="false" class="analysis-summary-card">
          <div class="analysis-summary-header">
            <div>
              <div class="analysis-summary-title">题单解析</div>
              <div class="analysis-summary-subtitle">
                输入题目标题后先做本地分析，只有全部锁定为唯一题目后才允许提交。
              </div>
            </div>
            <a-space>
              <a-button
                :loading="analyzing"
                :disabled="!canManualAnalyze"
                @click="emit('analyzeAll')"
              >
                <template #icon><SyncOutlined /></template>
                分析题单
              </a-button>
              <a-button type="dashed" @click="emit('addItem')">
                <template #icon><PlusOutlined /></template>
                添加题目
              </a-button>
            </a-space>
          </div>

          <a-space wrap>
            <a-tag color="success">已解析 {{ analysisSummary.resolved }}</a-tag>
            <a-tag color="processing">分析中 {{ analysisSummary.analyzing }}</a-tag>
            <a-tag color="default">待分析 {{ analysisSummary.idle }}</a-tag>
            <a-tag color="warning">待选择 {{ analysisSummary.ambiguous }}</a-tag>
            <a-tag color="error">未命中 {{ analysisSummary.missing }}</a-tag>
            <a-tag color="volcano">需修正 {{ analysisSummary.invalid }}</a-tag>
          </a-space>

          <a-alert
            :type="blockingCount === 0 ? 'success' : 'warning'"
            show-icon
            class="analysis-summary-alert"
            :message="analysisMessage"
          />
        </a-card>

        <div class="task-item-list">
          <TaskItemEditorCard
            v-for="(item, index) in form.items"
            :key="item.key"
            :item="item"
            :index="index"
            :can-remove="form.items.length > 1"
            @analyze="emit('analyzeItem', $event)"
            @remove="emit('removeItem', $event)"
            @change-platform="emit('changePlatform', $event)"
            @change-title="emit('changeTitle', $event)"
            @select-candidate="emit('selectCandidate', $event)"
          />
        </div>
      </a-form>
    </a-spin>

    <template #footer>
      <div class="drawer-footer">
        <a-space>
          <a-button @click="emit('close')">取消</a-button>
          <a-button
            type="primary"
            :loading="submitting"
            :disabled="loading || analyzing || !ready"
            @click="emit('submit')"
          >
            {{ okText }}
          </a-button>
        </a-space>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
.analysis-summary-card {
  margin-bottom: 20px;
  background:
    linear-gradient(135deg, rgba(221, 244, 255, 0.9), rgba(255, 255, 255, 0.96)),
    radial-gradient(circle at top right, rgba(110, 231, 255, 0.25), transparent 45%);
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.analysis-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.analysis-summary-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.analysis-summary-subtitle {
  margin-top: 6px;
  color: #475569;
  line-height: 1.7;
}

.analysis-summary-alert {
  margin-top: 14px;
}

.task-item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .analysis-summary-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

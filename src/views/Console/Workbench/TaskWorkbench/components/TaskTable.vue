<script setup lang="ts">
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ForkOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue'
import type { OJTaskListItem } from '@/types'
import { LIST_COLUMNS, TABLE_LOCALE } from '../constants'
import {
  formatDateTime,
  getExecutionStatusMeta,
  getModeLabel,
  getTaskStatusMeta,
} from '../formatters'

const props = defineProps<{
  tasks: OJTaskListItem[]
  loading: boolean
  pagination: Record<string, unknown>
  canRevise: boolean
  canEditRecord: (record: OJTaskListItem) => boolean
  canDeleteRecord: (record: OJTaskListItem) => boolean
  canExecuteRecord: (record: OJTaskListItem) => boolean
  canRetryRecord: (record: OJTaskListItem) => boolean
}>()

const emit = defineEmits<{
  change: [pagination: { current?: number; pageSize?: number }]
  view: [record: OJTaskListItem]
  edit: [record: OJTaskListItem]
  execute: [record: OJTaskListItem]
  revise: [record: OJTaskListItem]
  retry: [record: OJTaskListItem]
  delete: [record: OJTaskListItem]
}>()

function handleTableChange(pagination: { current?: number; pageSize?: number }) {
  emit('change', pagination)
}

function handleView(record: OJTaskListItem) {
  emit('view', record)
}

function handleEdit(record: OJTaskListItem) {
  emit('edit', record)
}

function handleExecute(record: OJTaskListItem) {
  emit('execute', record)
}

function handleRevise(record: OJTaskListItem) {
  emit('revise', record)
}

function handleRetry(record: OJTaskListItem) {
  emit('retry', record)
}

function handleDelete(record: OJTaskListItem) {
  emit('delete', record)
}
</script>

<template>
  <a-table
    :columns="LIST_COLUMNS as any"
    :data-source="tasks"
    :pagination="pagination"
    :loading="loading"
    :locale="TABLE_LOCALE"
    row-key="task_id"
    size="middle"
    :scroll="{ x: 1750 }"
    @change="handleTableChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'title'">
        <div class="task-title-cell">
          <div class="task-title-main">{{ record.title }}</div>
          <div class="task-title-sub">
            v{{ record.version_no }} · root #{{ record.root_task_id }}
            <span v-if="record.parent_task_id"> · 来源 #{{ record.parent_task_id }}</span>
          </div>
          <div v-if="record.description" class="task-title-desc">
            {{ record.description }}
          </div>
        </div>
      </template>
      <template v-else-if="column.key === 'mode'">
        <a-tag :color="record.mode === 'scheduled' ? 'gold' : 'blue'">
          {{ getModeLabel(record.mode) }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'status'">
        <a-tag :color="getTaskStatusMeta(record.status).color">
          {{ getTaskStatusMeta(record.status).label }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'execution_status'">
        <a-tag :color="getExecutionStatusMeta(record.execution_status).color">
          {{ getExecutionStatusMeta(record.execution_status).label }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'execute_at'">
        {{ formatDateTime(record.execute_at) }}
      </template>
      <template v-else-if="column.key === 'updated_at'">
        {{ formatDateTime(record.updated_at) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <div class="action-buttons">
          <a-button type="link" size="small" @click="handleView(record as OJTaskListItem)">
            <template #icon><EyeOutlined /></template>
            详情
          </a-button>
          <a-button
            v-if="props.canEditRecord(record as OJTaskListItem)"
            type="link"
            size="small"
            @click="handleEdit(record as OJTaskListItem)"
          >
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
          <a-button
            v-if="props.canExecuteRecord(record as OJTaskListItem)"
            type="link"
            size="small"
            @click="handleExecute(record as OJTaskListItem)"
          >
            <template #icon><PlayCircleOutlined /></template>
            提前执行
          </a-button>
          <a-button
            v-if="canRevise"
            type="link"
            size="small"
            @click="handleRevise(record as OJTaskListItem)"
          >
            <template #icon><ForkOutlined /></template>
            派生
          </a-button>
          <a-button
            v-if="props.canRetryRecord(record as OJTaskListItem)"
            type="link"
            size="small"
            @click="handleRetry(record as OJTaskListItem)"
          >
            <template #icon><RedoOutlined /></template>
            重试
          </a-button>
          <a-button
            v-if="props.canDeleteRecord(record as OJTaskListItem)"
            type="link"
            danger
            size="small"
            @click="handleDelete(record as OJTaskListItem)"
          >
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
        </div>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.task-title-cell,
.task-title-main,
.task-title-sub,
.task-title-desc {
  display: block;
}

.task-title-main {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.task-title-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.task-title-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #4b5563;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

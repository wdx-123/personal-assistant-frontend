<script setup lang="ts">
import type { OJTaskExecutionUserDetail, OJTaskExecutionUserItem } from '@/types'
import { USER_DETAIL_ITEM_COLUMNS } from '../constants'
import {
  getPlatformLabel,
  getResolutionStatusMeta,
  getTaskItemReasonNote,
  getUserStatusLabel,
} from '../formatters'

defineProps<{
  open: boolean
  loading: boolean
  error: string
  detail: OJTaskExecutionUserDetail | null
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <a-drawer
    :open="open"
    width="980"
    :mask-closable="true"
    destroy-on-close
    class="user-detail-drawer"
    @close="emit('close')"
  >
    <template #title>
      <div class="detail-title-block">
        <div class="detail-title-main">{{ detail?.username_snapshot || '用户执行快照' }}</div>
        <div class="detail-title-sub">
          <span v-if="detail">用户 #{{ detail.user_id }}</span>
        </div>
      </div>
    </template>

    <a-spin :spinning="loading">
      <a-alert
        v-if="error"
        type="error"
        show-icon
        class="page-alert"
        :message="error"
      />

      <template v-if="detail">
        <a-card :bordered="false" class="section-card">
          <a-descriptions :column="2" bordered class="detail-descriptions">
            <a-descriptions-item label="用户名">
              {{ detail.username_snapshot }}
            </a-descriptions-item>
            <a-descriptions-item label="用户状态">
              {{ getUserStatusLabel(detail.user_status_snapshot) }}
            </a-descriptions-item>
            <a-descriptions-item label="完成题数">
              {{ detail.completed_item_count }}
            </a-descriptions-item>
            <a-descriptions-item label="待完成题数">
              {{ detail.pending_item_count }}
            </a-descriptions-item>
            <a-descriptions-item label="执行组织" :span="2">
              <a-space wrap>
                <a-tag v-for="org in detail.orgs" :key="`${detail.user_id}-${org.org_id}`">
                  {{ org.org_name_snapshot }}
                </a-tag>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :bordered="false" class="section-card" title="已完成题目">
          <a-table
            :columns="USER_DETAIL_ITEM_COLUMNS as any"
            :data-source="detail.completed_items"
            :pagination="false"
            row-key="task_item_id"
            size="middle"
            :scroll="{ x: 1280 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'platform'">
                <a-tag color="geekblue">{{ getPlatformLabel(record.platform) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'resolution_status'">
                <a-tag :color="getResolutionStatusMeta(record.resolution_status).color">
                  {{ getResolutionStatusMeta(record.resolution_status).label }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'resolved_question_code'">
                <span class="mono-text">{{ record.resolved_question_code || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'resolved_title_snapshot'">
                {{ record.resolved_title_snapshot || '-' }}
              </template>
              <template v-else-if="column.key === 'result_status'">
                <a-tag color="success">已完成</a-tag>
              </template>
              <template v-else-if="column.key === 'reason_note'">
                {{ getTaskItemReasonNote(record as OJTaskExecutionUserItem) }}
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card :bordered="false" class="section-card" title="待完成题目">
          <a-table
            :columns="USER_DETAIL_ITEM_COLUMNS as any"
            :data-source="detail.pending_items"
            :pagination="false"
            row-key="task_item_id"
            size="middle"
            :scroll="{ x: 1280 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'platform'">
                <a-tag color="geekblue">{{ getPlatformLabel(record.platform) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'resolution_status'">
                <a-tag :color="getResolutionStatusMeta(record.resolution_status).color">
                  {{ getResolutionStatusMeta(record.resolution_status).label }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'resolved_question_code'">
                <span class="mono-text">{{ record.resolved_question_code || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'resolved_title_snapshot'">
                {{ record.resolved_title_snapshot || '-' }}
              </template>
              <template v-else-if="column.key === 'result_status'">
                <a-tag color="warning">待完成</a-tag>
              </template>
              <template v-else-if="column.key === 'reason_note'">
                {{ getTaskItemReasonNote(record as OJTaskExecutionUserItem) }}
              </template>
            </template>
          </a-table>
        </a-card>
      </template>
    </a-spin>
  </a-drawer>
</template>

<style scoped>
.detail-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-title-main {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.detail-title-sub {
  color: #64748b;
  font-size: 13px;
}

.page-alert {
  margin-bottom: 16px;
}

.section-card {
  margin-bottom: 16px;
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.detail-descriptions {
  background: #fff;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}
</style>

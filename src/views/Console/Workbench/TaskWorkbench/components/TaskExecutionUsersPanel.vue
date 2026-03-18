<script setup lang="ts">
import { ReloadOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons-vue'
import type { OJTaskExecutionUserSummary } from '@/types'
import { USER_COLUMNS, USER_TABLE_LOCALE } from '../constants'
import { getUserStatusLabel } from '../formatters'
import type { ExecutionUserFilters } from '../local.types'

defineProps<{
  filters: ExecutionUserFilters
  users: OJTaskExecutionUserSummary[]
  loading: boolean
  error: string
  pagination: Record<string, unknown>
}>()

const emit = defineEmits<{
  search: []
  reset: []
  change: [pagination: { current?: number; pageSize?: number }]
  viewUser: [record: OJTaskExecutionUserSummary]
}>()

function handleTableChange(pagination: { current?: number; pageSize?: number }) {
  emit('change', pagination)
}

function handleViewUser(record: OJTaskExecutionUserSummary) {
  emit('viewUser', record)
}
</script>

<template>
  <a-card :bordered="false" class="search-card users-search-card" :body-style="{ padding: '16px 16px 0 16px' }">
    <a-form layout="inline">
      <a-form-item label="用户">
        <a-input
          v-model:value="filters.username"
          allow-clear
          placeholder="搜索用户名"
          @pressEnter="emit('search')"
        />
      </a-form-item>
      <a-form-item label="完成范围">
        <a-select v-model:value="filters.completion_scope" style="width: 160px">
          <a-select-option value="all">全部用户</a-select-option>
          <a-select-option value="completed">仅已全部完成</a-select-option>
          <a-select-option value="pending">仅未全部完成</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="emit('search')">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button @click="emit('reset')">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-card>

  <a-alert
    v-if="error"
    type="error"
    show-icon
    class="page-alert"
    :message="error"
  />

  <a-table
    :columns="USER_COLUMNS as any"
    :data-source="users"
    :loading="loading"
    :pagination="pagination"
    :locale="USER_TABLE_LOCALE"
    row-key="user_id"
    size="middle"
    :scroll="{ x: 920 }"
    @change="handleTableChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'username_snapshot'">
        <div class="user-name-cell">
          <a-avatar :src="record.avatar_snapshot" size="small">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <div>
            <div class="user-name-main">{{ record.username_snapshot }}</div>
            <div class="user-name-sub">
              #{{ record.user_id }} · {{ getUserStatusLabel(record.user_status_snapshot) }}
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="column.key === 'orgs'">
        <a-space wrap>
          <a-tag v-for="org in record.orgs" :key="`${record.user_id}-${org.org_id}`">
            {{ org.org_name_snapshot }}
          </a-tag>
        </a-space>
      </template>
      <template v-else-if="column.key === 'all_completed'">
        <a-tag :color="record.all_completed ? 'success' : 'warning'">
          {{ record.all_completed ? '已完成' : '待补题' }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button type="link" size="small" @click="handleViewUser(record as OJTaskExecutionUserSummary)">
          查看
        </a-button>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.users-search-card {
  margin-bottom: 16px;
}

.page-alert {
  margin-bottom: 16px;
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name-main {
  font-weight: 600;
  color: #111827;
}

.user-name-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}
</style>

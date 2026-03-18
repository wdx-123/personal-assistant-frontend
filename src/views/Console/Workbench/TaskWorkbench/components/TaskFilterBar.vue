<script setup lang="ts">
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { TASK_MODE_OPTIONS, TASK_STATUS_OPTIONS } from '../constants'
import type { TaskListFilters } from '../local.types'

defineProps<{
  filters: TaskListFilters
  orgLoading: boolean
  orgSelectOptions: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>

<template>
  <a-form layout="inline" class="search-form">
    <a-form-item label="关键词">
      <a-input
        v-model:value="filters.keyword"
        placeholder="搜索任务标题或描述"
        allow-clear
        @pressEnter="emit('search')"
      >
        <template #prefix>
          <SearchOutlined style="color: rgba(0, 0, 0, 0.25)" />
        </template>
      </a-input>
    </a-form-item>
    <a-form-item label="组织">
      <a-select
        v-model:value="filters.org_id"
        placeholder="全部组织"
        style="width: 180px"
        allow-clear
        :loading="orgLoading"
        :options="orgSelectOptions"
      />
    </a-form-item>
    <a-form-item label="模式">
      <a-select
        v-model:value="filters.mode"
        placeholder="全部模式"
        style="width: 150px"
        allow-clear
        :options="TASK_MODE_OPTIONS"
      />
    </a-form-item>
    <a-form-item label="状态">
      <a-select
        v-model:value="filters.status"
        placeholder="全部状态"
        style="width: 160px"
        allow-clear
        :options="TASK_STATUS_OPTIONS"
      />
    </a-form-item>
    <a-form-item label="版本视图">
      <a-radio-group v-model:value="filters.only_latest" button-style="solid">
        <a-radio-button value="latest">仅最新</a-radio-button>
        <a-radio-button value="all">全部版本</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item>
      <a-space>
        <a-button type="primary" @click="emit('search')">
          <template #icon><SearchOutlined /></template>
          搜索
        </a-button>
        <a-button @click="emit('reset')">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

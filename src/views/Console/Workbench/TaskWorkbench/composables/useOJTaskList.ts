import { computed, reactive, ref } from 'vue'
import { listVisibleOJTasks } from '@/services/ojTask.service'
import { useAuthStore } from '@/stores/auth'
import type { OJTaskListItem } from '@/types'
import { collectMenuCodes } from '@/utils/menuPermission'
import { WORKBENCH_CODES } from '../constants'
import {
  buildTaskActionState,
  canDeleteTask,
  canEditTask,
  canExecuteTask,
  canRetryTask,
  canReviseTask,
} from '../formatters'
import type { PaginationState, TaskListFilters } from '../local.types'

export function useOJTaskList() {
  const authStore = useAuthStore()

  const taskFilters = reactive<TaskListFilters>({
    keyword: '',
    org_id: undefined,
    mode: undefined,
    status: undefined,
    only_latest: 'latest',
  })

  const taskPagination = reactive<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const tasks = ref<OJTaskListItem[]>([])
  const taskLoading = ref(false)
  const taskError = ref('')

  const menuCodeSet = computed(() => collectMenuCodes(authStore.myMenus))
  const canCreate = computed(() => menuCodeSet.value.has(WORKBENCH_CODES.create))
  const canRevise = computed(() => canReviseTask(menuCodeSet.value))

  const taskPaginationConfig = computed(() => ({
    current: taskPagination.current,
    pageSize: taskPagination.pageSize,
    total: taskPagination.total,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: (total: number) => `共 ${total} 条`,
  }))

  async function fetchTasks(options: { silent?: boolean } = {}): Promise<void> {
    taskLoading.value = true
    taskError.value = ''

    try {
      const data = await listVisibleOJTasks(
        {
          page: taskPagination.current,
          page_size: taskPagination.pageSize,
          keyword: taskFilters.keyword.trim() || undefined,
          org_id: taskFilters.org_id,
          mode: taskFilters.mode,
          status: taskFilters.status,
          only_latest: taskFilters.only_latest === 'latest',
        },
        {
          skipSuccTip: true,
          skipErrTip: true,
        }
      )

      tasks.value = data.list || []
      taskPagination.total = data.total || 0
      taskPagination.current = data.page || taskPagination.current
      taskPagination.pageSize = data.page_size || taskPagination.pageSize
    } catch (error) {
      taskError.value = '任务列表加载失败，请稍后重试。'
      tasks.value = []
      taskPagination.total = 0
      if (!options.silent) {
        throw error
      }
    } finally {
      taskLoading.value = false
    }
  }

  function searchTasks(): void {
    taskPagination.current = 1
    void fetchTasks()
  }

  function resetTaskFilters(): void {
    taskFilters.keyword = ''
    taskFilters.org_id = undefined
    taskFilters.mode = undefined
    taskFilters.status = undefined
    taskFilters.only_latest = 'latest'
    taskPagination.current = 1
    void fetchTasks()
  }

  function refreshTasks(options: { silent?: boolean } = {}): void {
    void fetchTasks(options)
  }

  function handleTaskTableChange(pagination: { current?: number; pageSize?: number }): void {
    taskPagination.current = pagination.current || 1
    taskPagination.pageSize = pagination.pageSize || 10
    void fetchTasks()
  }

  function canEditRecord(record: OJTaskListItem): boolean {
    return canEditTask(menuCodeSet.value, buildTaskActionState(record))
  }

  function canDeleteRecord(record: OJTaskListItem): boolean {
    return canDeleteTask(menuCodeSet.value, buildTaskActionState(record))
  }

  function canExecuteRecord(record: OJTaskListItem): boolean {
    return canExecuteTask(menuCodeSet.value, buildTaskActionState(record))
  }

  function canRetryRecord(record: OJTaskListItem): boolean {
    return canRetryTask(menuCodeSet.value, buildTaskActionState(record))
  }

  return {
    taskFilters,
    taskPagination,
    taskPaginationConfig,
    tasks,
    taskLoading,
    taskError,
    canCreate,
    canRevise,
    fetchTasks,
    searchTasks,
    resetTaskFilters,
    refreshTasks,
    handleTaskTableChange,
    canEditRecord,
    canDeleteRecord,
    canExecuteRecord,
    canRetryRecord,
  }
}

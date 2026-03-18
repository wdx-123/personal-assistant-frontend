import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  deleteOJTask,
  executeOJTaskNow,
  getOJTaskDetail,
  getOJTaskExecutionDetail,
  getOJTaskExecutionUserDetail,
  getOJTaskVersions,
  listOJTaskExecutionUsers,
  retryOJTask,
} from '@/services/ojTask.service'
import { useAuthStore } from '@/stores/auth'
import type {
  OJTaskCreateResponse,
  OJTaskDetail,
  OJTaskExecutionDetail,
  OJTaskExecutionUserDetail,
  OJTaskExecutionUserSummary,
  OJTaskVersionItem,
} from '@/types'
import { collectMenuCodes } from '@/utils/menuPermission'
import {
  DETAIL_POLL_INTERVAL,
  DETAIL_POLL_TIMEOUT,
  STABLE_EXECUTION_STATUS,
} from '../constants'
import {
  canDeleteTask,
  canEditTask,
  canExecuteTask,
  canRetryTask,
  canReviseTask,
} from '../formatters'
import type {
  ExecutionUserFilters,
  PaginationState,
  TaskActionState,
} from '../local.types'

interface UseOJTaskDetailOptions {
  onTasksChanged: () => Promise<void>
}

export function useOJTaskDetail(options: UseOJTaskDetailOptions) {
  const authStore = useAuthStore()

  const detailDrawerOpen = ref(false)
  const detailActiveTab = ref('overview')
  const detailLoading = ref(false)
  const detailError = ref('')
  const detailTask = ref<OJTaskDetail | null>(null)
  const detailExecution = ref<OJTaskExecutionDetail | null>(null)

  const versionLoading = ref(false)
  const versionError = ref('')
  const taskVersions = ref<OJTaskVersionItem[]>([])

  const userFilters = reactive<ExecutionUserFilters>({
    username: '',
    completion_scope: 'all',
  })

  const userPagination = reactive<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  const executionUsers = ref<OJTaskExecutionUserSummary[]>([])
  const executionUsersLoading = ref(false)
  const executionUsersError = ref('')

  const userDetailDrawerOpen = ref(false)
  const userDetailLoading = ref(false)
  const userDetailError = ref('')
  const executionUserDetail = ref<OJTaskExecutionUserDetail | null>(null)

  const detailPolling = reactive({
    active: false,
    taskId: 0,
    executionId: 0,
    startedAt: 0,
  })

  let detailPollTimer: number | null = null

  const menuCodeSet = computed(() => collectMenuCodes(authStore.myMenus))
  const currentExecution = computed(() => detailExecution.value || detailTask.value?.current_execution || null)

  const detailActionState = computed<TaskActionState | null>(() => {
    if (!detailTask.value) {
      return null
    }

    return {
      task_id: detailTask.value.task_id,
      mode: detailTask.value.mode,
      status: detailTask.value.status,
      execution_status: currentExecution.value?.status ?? null,
    }
  })

  const canEditCurrent = computed(() => canEditTask(menuCodeSet.value, detailActionState.value))
  const canDeleteCurrent = computed(() => canDeleteTask(menuCodeSet.value, detailActionState.value))
  const canExecuteCurrent = computed(() => canExecuteTask(menuCodeSet.value, detailActionState.value))
  const canRetryCurrent = computed(() => canRetryTask(menuCodeSet.value, detailActionState.value))
  const canRevise = computed(() => canReviseTask(menuCodeSet.value))

  const isDetailPolling = computed(
    () =>
      detailPolling.active &&
      detailDrawerOpen.value &&
      detailTask.value?.task_id === detailPolling.taskId &&
      currentExecution.value?.execution_id === detailPolling.executionId
  )

  const executionUserPaginationConfig = computed(() => ({
    current: userPagination.current,
    pageSize: userPagination.pageSize,
    total: userPagination.total,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: (total: number) => `共 ${total} 位用户`,
  }))

  function clearDetailPollTimer(): void {
    if (detailPollTimer !== null) {
      window.clearTimeout(detailPollTimer)
      detailPollTimer = null
    }
  }

  function stopDetailPolling(): void {
    clearDetailPollTimer()
    detailPolling.active = false
    detailPolling.taskId = 0
    detailPolling.executionId = 0
    detailPolling.startedAt = 0
  }

  function resetExecutionUsersState(): void {
    userPagination.current = 1
    userPagination.total = 0
    executionUsers.value = []
    executionUsersError.value = ''
  }

  function resetUserDetailState(): void {
    userDetailDrawerOpen.value = false
    userDetailLoading.value = false
    userDetailError.value = ''
    executionUserDetail.value = null
  }

  async function fetchTaskDetailBundle(
    taskId: number,
    executionId: number,
    optionsParam: { silent?: boolean } = {}
  ): Promise<void> {
    try {
      const [detail, execution] = await Promise.all([
        getOJTaskDetail(taskId, {
          skipSuccTip: true,
          skipErrTip: true,
        }),
        executionId
          ? getOJTaskExecutionDetail(taskId, executionId, {
              skipSuccTip: true,
              skipErrTip: true,
            }).catch(() => null)
          : Promise.resolve(null),
      ])

      detailTask.value = detail
      detailExecution.value = execution || detail.current_execution || null
      detailError.value = ''
    } catch (error) {
      detailError.value = '任务详情加载失败，请稍后重试。'
      if (!optionsParam.silent) {
        message.error('任务详情加载失败，请稍后重试')
      }
      throw error
    }
  }

  async function loadTaskVersions(taskId: number, optionsParam: { silent?: boolean } = {}): Promise<void> {
    versionLoading.value = true
    versionError.value = ''
    try {
      const data = await getOJTaskVersions(taskId, {
        skipSuccTip: true,
        skipErrTip: true,
      })
      taskVersions.value = data.versions || []
    } catch (error) {
      taskVersions.value = []
      versionError.value = '版本链加载失败，请稍后重试。'
      if (!optionsParam.silent) {
        message.error('版本链加载失败，请稍后重试')
      }
    } finally {
      versionLoading.value = false
    }
  }

  async function refreshTaskDetail(optionsParam: { silent?: boolean } = {}): Promise<void> {
    if (!detailTask.value) {
      return
    }

    await fetchTaskDetailBundle(
      detailTask.value.task_id,
      currentExecution.value?.execution_id || detailTask.value.current_execution?.execution_id || 0,
      optionsParam
    )
  }

  async function openTaskDetail(taskId: number, executionId: number): Promise<void> {
    if (!taskId) {
      return
    }

    stopDetailPolling()
    resetUserDetailState()
    resetExecutionUsersState()
    detailDrawerOpen.value = true
    detailActiveTab.value = 'overview'
    detailLoading.value = true
    detailError.value = ''

    try {
      await Promise.all([
        fetchTaskDetailBundle(taskId, executionId, { silent: false }),
        loadTaskVersions(taskId, { silent: true }),
      ])
    } finally {
      detailLoading.value = false
    }
  }

  async function refreshDetailPanel(optionsParam: { silent?: boolean } = {}): Promise<void> {
    if (!detailTask.value) {
      return
    }

    detailLoading.value = !optionsParam.silent
    try {
      await Promise.all([
        refreshTaskDetail({ silent: optionsParam.silent }),
        loadTaskVersions(detailTask.value.task_id, { silent: true }),
      ])

      if (detailActiveTab.value === 'users') {
        await loadExecutionUsers({ silent: true })
      }
    } finally {
      detailLoading.value = false
    }
  }

  async function refreshIfCurrentTask(taskId: number): Promise<void> {
    if (detailDrawerOpen.value && detailTask.value?.task_id === taskId) {
      await refreshDetailPanel({ silent: true })
    }
  }

  function scheduleNextDetailPoll(): void {
    clearDetailPollTimer()
    detailPollTimer = window.setTimeout(() => {
      void pollTaskExecution()
    }, DETAIL_POLL_INTERVAL)
  }

  async function pollTaskExecution(): Promise<void> {
    if (!detailPolling.active || !detailDrawerOpen.value) {
      stopDetailPolling()
      return
    }

    if (Date.now() - detailPolling.startedAt > DETAIL_POLL_TIMEOUT) {
      stopDetailPolling()
      await options.onTasksChanged()
      message.warning('任务状态仍在更新中，可稍后手动刷新')
      return
    }

    try {
      await refreshTaskDetail({ silent: true })

      if (detailActiveTab.value === 'users') {
        await loadExecutionUsers({ silent: true })
      }

      const execution = currentExecution.value
      if (!execution || execution.execution_id !== detailPolling.executionId) {
        stopDetailPolling()
        return
      }

      if (STABLE_EXECUTION_STATUS.has(execution.status)) {
        stopDetailPolling()
        await options.onTasksChanged()
        if (execution.status === 'succeeded') {
          message.success('任务执行完成，结果已同步更新。')
        } else if (execution.status === 'failed') {
          message.warning('任务执行失败，请查看错误信息或发起重试。')
        } else {
          message.info('任务执行已取消。')
        }
        return
      }
    } catch (error) {
      if (Date.now() - detailPolling.startedAt > DETAIL_POLL_TIMEOUT) {
        stopDetailPolling()
        await options.onTasksChanged()
        message.warning('任务状态仍在更新中，可稍后手动刷新')
        return
      }
    }

    scheduleNextDetailPoll()
  }

  function startDetailPolling(taskId: number, executionId: number): void {
    stopDetailPolling()
    detailPolling.active = true
    detailPolling.taskId = taskId
    detailPolling.executionId = executionId
    detailPolling.startedAt = Date.now()
    scheduleNextDetailPoll()
  }

  async function loadExecutionUsers(optionsParam: { silent?: boolean } = {}): Promise<void> {
    const taskId = detailTask.value?.task_id
    const executionId = currentExecution.value?.execution_id

    if (!taskId || !executionId) {
      executionUsers.value = []
      executionUsersError.value = ''
      userPagination.total = 0
      return
    }

    executionUsersLoading.value = true
    executionUsersError.value = ''

    let allCompleted: boolean | undefined
    if (userFilters.completion_scope === 'completed') {
      allCompleted = true
    } else if (userFilters.completion_scope === 'pending') {
      allCompleted = false
    }

    try {
      const data = await listOJTaskExecutionUsers(
        taskId,
        executionId,
        {
          page: userPagination.current,
          page_size: userPagination.pageSize,
          username: userFilters.username.trim() || undefined,
          all_completed: allCompleted,
        },
        {
          skipSuccTip: true,
          skipErrTip: true,
        }
      )

      executionUsers.value = data.list || []
      userPagination.total = data.total || 0
      userPagination.current = data.page || userPagination.current
      userPagination.pageSize = data.page_size || userPagination.pageSize
    } catch (error) {
      executionUsers.value = []
      userPagination.total = 0
      executionUsersError.value = '执行用户加载失败，请稍后重试。'
      if (!optionsParam.silent) {
        message.error('执行用户加载失败，请稍后重试')
      }
    } finally {
      executionUsersLoading.value = false
    }
  }

  async function switchToVersion(record: OJTaskVersionItem): Promise<void> {
    await openTaskDetail(record.task_id, record.execution_id)
  }

  function handleExecutionUserSearch(): void {
    userPagination.current = 1
    void loadExecutionUsers()
  }

  function resetExecutionUserFilters(): void {
    userFilters.username = ''
    userFilters.completion_scope = 'all'
    userPagination.current = 1
    void loadExecutionUsers()
  }

  function handleExecutionUserTableChange(pagination: { current?: number; pageSize?: number }): void {
    userPagination.current = pagination.current || 1
    userPagination.pageSize = pagination.pageSize || 10
    void loadExecutionUsers()
  }

  async function openExecutionUserDetail(summary: OJTaskExecutionUserSummary): Promise<void> {
    const taskId = detailTask.value?.task_id
    const executionId = currentExecution.value?.execution_id
    if (!taskId || !executionId) {
      return
    }

    userDetailDrawerOpen.value = true
    userDetailLoading.value = true
    userDetailError.value = ''

    try {
      executionUserDetail.value = await getOJTaskExecutionUserDetail(
        taskId,
        executionId,
        summary.user_id,
        {
          skipSuccTip: true,
          skipErrTip: true,
        }
      )
    } catch (error) {
      executionUserDetail.value = null
      userDetailError.value = '用户快照加载失败，请稍后重试。'
      message.error('用户快照加载失败，请稍后重试')
    } finally {
      userDetailLoading.value = false
    }
  }

  function closeUserDetailDrawer(): void {
    resetUserDetailState()
  }

  function closeDetailDrawer(): void {
    detailDrawerOpen.value = false
  }

  function handleMutationWithConfirm(optionsParam: {
    title: string
    content: string
    onOk: () => Promise<void>
  }): void {
    Modal.confirm({
      title: optionsParam.title,
      content: optionsParam.content,
      okText: '确定',
      cancelText: '取消',
      onOk: optionsParam.onOk,
    })
  }

  function confirmDeleteTask(state: TaskActionState | null): void {
    if (!state) {
      return
    }

    handleMutationWithConfirm({
      title: '删除任务版本',
      content: '删除后版本会保留审计痕迹，但不会再被调度执行。确认继续吗？',
      onOk: async () => {
        await deleteOJTask(state.task_id, {
          skipSuccTip: true,
        })
        await options.onTasksChanged()
        if (detailDrawerOpen.value && detailTask.value?.task_id === state.task_id) {
          await refreshDetailPanel({ silent: true })
        }
        message.success('任务已删除')
      },
    })
  }

  function confirmExecuteTask(state: TaskActionState | null): void {
    if (!state) {
      return
    }

    handleMutationWithConfirm({
      title: '提前执行任务',
      content: '任务将立即转为排队状态并异步执行，确认继续吗？',
      onOk: async () => {
        const result: OJTaskCreateResponse = await executeOJTaskNow(state.task_id, {
          skipSuccTip: true,
        })
        await options.onTasksChanged()
        await openTaskDetail(result.task_id, result.execution_id)
        message.success('任务已提前入队，正在跟踪执行进度。')
        startDetailPolling(result.task_id, result.execution_id)
      },
    })
  }

  function confirmRetryTask(state: TaskActionState | null): void {
    if (!state) {
      return
    }

    handleMutationWithConfirm({
      title: '重试任务版本',
      content: '重试会派生一个新版本并重新入队执行，确认继续吗？',
      onOk: async () => {
        const result: OJTaskCreateResponse = await retryOJTask(state.task_id, {
          skipSuccTip: true,
        })
        await options.onTasksChanged()
        await openTaskDetail(result.task_id, result.execution_id)
        if (result.status === 'queued') {
          message.success('重试版本已创建并入队，正在跟踪执行进度。')
          startDetailPolling(result.task_id, result.execution_id)
        } else {
          message.success('重试版本已创建')
        }
      },
    })
  }

  watch(
    () => detailActiveTab.value,
    (activeKey) => {
      if (activeKey === 'users' && detailDrawerOpen.value && currentExecution.value) {
        void loadExecutionUsers({ silent: true })
      }
    }
  )

  watch(
    () => detailDrawerOpen.value,
    (open) => {
      if (!open) {
        stopDetailPolling()
        detailActiveTab.value = 'overview'
        detailLoading.value = false
        detailError.value = ''
        detailTask.value = null
        detailExecution.value = null
        taskVersions.value = []
        versionError.value = ''
        resetExecutionUsersState()
        resetUserDetailState()
      }
    }
  )

  onBeforeUnmount(() => {
    stopDetailPolling()
  })

  return {
    detailDrawerOpen,
    detailActiveTab,
    detailLoading,
    detailError,
    detailTask,
    currentExecution,
    detailActionState,
    canEditCurrent,
    canDeleteCurrent,
    canExecuteCurrent,
    canRetryCurrent,
    canRevise,
    isDetailPolling,
    versionLoading,
    versionError,
    taskVersions,
    executionUsers,
    executionUsersLoading,
    executionUsersError,
    userFilters,
    executionUserPaginationConfig,
    userDetailDrawerOpen,
    userDetailLoading,
    userDetailError,
    executionUserDetail,
    openTaskDetail,
    closeDetailDrawer,
    refreshDetailPanel,
    refreshIfCurrentTask,
    startDetailPolling,
    switchToVersion,
    handleExecutionUserSearch,
    resetExecutionUserFilters,
    handleExecutionUserTableChange,
    openExecutionUserDetail,
    closeUserDetailDrawer,
    confirmDeleteTask,
    confirmExecuteTask,
    confirmRetryTask,
  }
}

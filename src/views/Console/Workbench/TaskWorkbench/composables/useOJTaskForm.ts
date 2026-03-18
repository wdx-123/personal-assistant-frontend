import { computed, reactive, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { message } from 'ant-design-vue'
import { getMyOrgs } from '@/services/permission.service'
import {
  analyzeOJTaskTitles,
  createOJTask,
  getOJTaskDetail,
  reviseOJTask,
  updateOJTask,
} from '@/services/ojTask.service'
import { useAuthStore } from '@/stores/auth'
import type {
  CreateOJTaskRequest,
  MyOrgItem,
  OJTaskAnalyzeCandidate,
  OJTaskCreateResponse,
  OJTaskDetail,
  OJTaskItem,
  OJTaskItemRequest,
  ReviseOJTaskRequest,
  UpdateOJTaskRequest,
} from '@/types'
import { PLATFORM_OPTIONS } from '../constants'
import { buildAnalysisFeedbackMessage, buildSubmitBlockedMessage } from '../formatters'
import type {
  FormItemAnalysisStatus,
  TaskAnalysisSummary,
  TaskFormItem,
  TaskFormMode,
  TaskFormState,
} from '../local.types'

dayjs.extend(utc)

interface UseOJTaskFormOptions {
  onMutationResult: (result: OJTaskCreateResponse, successMessage: string) => Promise<void>
  onUpdateSuccess: (taskId: number, successMessage: string) => Promise<void>
}

export function useOJTaskForm(options: UseOJTaskFormOptions) {
  const authStore = useAuthStore()

  const orgLoading = ref(false)
  const orgOptions = ref<MyOrgItem[]>([])

  const taskDrawerOpen = ref(false)
  const taskDrawerMode = ref<TaskFormMode>('create')
  const taskDrawerLoading = ref(false)
  const taskSubmitting = ref(false)
  const taskAnalyzing = ref(false)
  const editingTaskId = ref<number | null>(null)

  const taskForm = reactive<TaskFormState>({
    title: '',
    description: '',
    mode: 'immediate',
    executeAt: undefined,
    orgIds: [],
    items: [],
  })

  let taskItemSeed = 0

  const taskDrawerTitle = computed(() => {
    if (taskDrawerMode.value === 'create') {
      return '新建 OJ 任务'
    }
    if (taskDrawerMode.value === 'edit') {
      return '编辑定时任务'
    }
    return '派生新版本'
  })

  const taskDrawerOkText = computed(() => {
    if (taskDrawerMode.value === 'create') {
      return '创建任务'
    }
    if (taskDrawerMode.value === 'edit') {
      return '保存修改'
    }
    return '创建新版本'
  })

  const taskDrawerShowExecuteAt = computed(() => taskForm.mode === 'scheduled')

  const orgSelectOptions = computed(() =>
    orgOptions.value.map((item) => ({
      label: item.name,
      value: item.id,
    }))
  )

  const taskFormAnalysisSummary = computed<TaskAnalysisSummary>(() =>
    taskForm.items.reduce<TaskAnalysisSummary>(
      (summary, item) => {
        summary[item.status] += 1
        return summary
      },
      {
        idle: 0,
        analyzing: 0,
        resolved: 0,
        ambiguous: 0,
        missing: 0,
        invalid: 0,
      }
    )
  )

  const taskFormBlockingCount = computed(
    () =>
      taskFormAnalysisSummary.value.idle +
      taskFormAnalysisSummary.value.analyzing +
      taskFormAnalysisSummary.value.ambiguous +
      taskFormAnalysisSummary.value.missing +
      taskFormAnalysisSummary.value.invalid
  )

  const taskFormAnalysisMessage = computed(() => {
    if (taskForm.items.length === 0) {
      return '至少添加 1 道题目，录入标题后再进行本地分析。'
    }

    if (taskFormBlockingCount.value === 0) {
      return '题单已全部完成解析，可以直接提交。'
    }

    const parts: string[] = []
    if (taskFormAnalysisSummary.value.idle) {
      parts.push(`${taskFormAnalysisSummary.value.idle} 道待分析`)
    }
    if (taskFormAnalysisSummary.value.analyzing) {
      parts.push(`${taskFormAnalysisSummary.value.analyzing} 道分析中`)
    }
    if (taskFormAnalysisSummary.value.ambiguous) {
      parts.push(`${taskFormAnalysisSummary.value.ambiguous} 道待选择候选`)
    }
    if (taskFormAnalysisSummary.value.missing) {
      parts.push(`${taskFormAnalysisSummary.value.missing} 道未命中本地题库`)
    }
    if (taskFormAnalysisSummary.value.invalid) {
      parts.push(`${taskFormAnalysisSummary.value.invalid} 道需要修正输入`)
    }
    return `当前仍有未完成解析的题目：${parts.join('，')}。`
  })

  const canManualAnalyze = computed(
    () => !taskAnalyzing.value && taskForm.items.some((item) => item.title.trim())
  )

  const taskFormReady = computed(() => {
    if (!taskForm.title.trim()) {
      return false
    }

    if (Array.from(new Set(taskForm.orgIds.filter((id) => id > 0))).length === 0) {
      return false
    }

    if (taskForm.items.length === 0 || !taskForm.items.every((item) => item.status === 'resolved')) {
      return false
    }

    if (taskForm.mode === 'scheduled') {
      if (!taskForm.executeAt || !taskForm.executeAt.isValid()) {
        return false
      }
      if (taskForm.executeAt.valueOf() <= Date.now()) {
        return false
      }
    }

    return true
  })

  function buildDefaultOrgIds(): number[] {
    const orgId = authStore.browsingOrgId || authStore.user?.current_org_id || 0
    return orgId ? [orgId] : []
  }

  function createTaskFormItem(seed: Partial<TaskFormItem> = {}): TaskFormItem {
    taskItemSeed += 1
    return {
      key: `task-item-${taskItemSeed}`,
      platform: seed.platform ?? PLATFORM_OPTIONS.find((option) => option.value === 'leetcode')?.value ?? 'luogu',
      title: seed.title || '',
      analysisToken: seed.analysisToken,
      status: seed.status || 'idle',
      candidates: seed.candidates ? [...seed.candidates] : [],
      resolvedQuestionCode: seed.resolvedQuestionCode,
      resolvedTitle: seed.resolvedTitle,
      resolutionNote: seed.resolutionNote,
      errorText: seed.errorText,
    }
  }

  function resetTaskFormItemAnalysis(item: TaskFormItem, nextStatus: FormItemAnalysisStatus = 'idle'): void {
    item.status = nextStatus
    item.analysisToken = undefined
    item.candidates = []
    item.resolvedQuestionCode = undefined
    item.resolvedTitle = undefined
    item.resolutionNote = undefined
    item.errorText = undefined
  }

  function applyResolvedCandidate(
    item: TaskFormItem,
    candidate: Pick<OJTaskAnalyzeCandidate, 'analysis_token' | 'resolved_question_code' | 'resolved_title'>
  ): void {
    item.status = 'resolved'
    item.analysisToken = candidate.analysis_token
    item.candidates = []
    item.resolvedQuestionCode = candidate.resolved_question_code
    item.resolvedTitle = candidate.resolved_title
    item.resolutionNote = undefined
    item.errorText = undefined
  }

  function mapTaskItemToFormItem(taskItem: OJTaskItem): TaskFormItem {
    return createTaskFormItem({
      platform: taskItem.platform,
      title: taskItem.input_title,
      status:
        taskItem.resolution_status === 'resolved'
          ? 'resolved'
          : taskItem.resolution_status === 'pending_resolution'
            ? 'missing'
            : 'invalid',
      resolvedQuestionCode: taskItem.resolved_question_code,
      resolvedTitle: taskItem.resolved_title_snapshot,
      resolutionNote: taskItem.resolution_note,
    })
  }

  function resetTaskForm(): void {
    taskForm.title = ''
    taskForm.description = ''
    taskForm.mode = 'immediate'
    taskForm.executeAt = undefined
    taskForm.orgIds = buildDefaultOrgIds()
    taskForm.items = [createTaskFormItem()]
  }

  function fillTaskForm(detail: OJTaskDetail, mode: TaskFormMode): void {
    taskForm.title = detail.title
    taskForm.description = detail.description
    taskForm.mode = mode === 'edit' ? 'scheduled' : detail.mode
    taskForm.executeAt = detail.execute_at ? dayjs(detail.execute_at) : undefined
    taskForm.orgIds = detail.orgs.map((item) => item.org_id)
    taskForm.items = detail.items.length ? detail.items.map(mapTaskItemToFormItem) : [createTaskFormItem()]
  }

  async function fetchOrgOptions(): Promise<void> {
    orgLoading.value = true
    try {
      orgOptions.value = await getMyOrgs({
        skipSuccTip: true,
        skipErrTip: true,
      })
    } catch (error) {
      orgOptions.value = []
      message.error('获取组织列表失败，请稍后重试')
    } finally {
      orgLoading.value = false
    }
  }

  function handleTaskItemPlatformChange(item: TaskFormItem, value: TaskFormItem['platform']): void {
    item.platform = value
    resetTaskFormItemAnalysis(item)
  }

  function handleTaskItemTitleChange(item: TaskFormItem, value: string): void {
    item.title = value
    resetTaskFormItemAnalysis(item)
  }

  function addTaskItem(seed: Partial<TaskFormItem> = {}): void {
    taskForm.items.push(createTaskFormItem(seed))
  }

  function removeTaskItem(index: number): void {
    const target = taskForm.items[index]
    if (!target) {
      return
    }

    if (taskForm.items.length === 1) {
      resetTaskFormItemAnalysis(target)
      target.title = ''
      return
    }

    taskForm.items.splice(index, 1)
  }

  async function analyzeTaskItems(optionsParam: {
    indexes?: number[]
    source?: 'manual' | 'auto' | 'submit'
  } = {}): Promise<boolean> {
    const source = optionsParam.source || 'manual'
    const targetIndexes = Array.from(
      new Set(
        (optionsParam.indexes?.length ? optionsParam.indexes : taskForm.items.map((_, index) => index))
          .filter((index) => index >= 0 && index < taskForm.items.length)
      )
    )

    if (targetIndexes.length === 0) {
      return taskForm.items.every((item) => item.status === 'resolved')
    }

    const requestItemIndexes: number[] = []
    const requestItems: OJTaskItemRequest[] = []

    targetIndexes.forEach((index) => {
      const item = taskForm.items[index]
      if (!item) {
        return
      }

      const title = item.title.trim()
      if (!title) {
        if (source === 'manual' || source === 'submit') {
          resetTaskFormItemAnalysis(item, 'invalid')
          item.errorText = source === 'submit' ? '请输入题目标题后再提交' : '请输入题目标题后再分析'
        } else {
          resetTaskFormItemAnalysis(item, 'idle')
        }
        return
      }

      item.status = 'analyzing'
      item.errorText = undefined
      item.candidates = []
      requestItemIndexes.push(index)
      requestItems.push({
        platform: item.platform,
        title,
      })
    })

    if (requestItems.length === 0) {
      if (source === 'manual') {
        message.warning('请先输入题目标题后再分析')
      }
      return taskForm.items.every((item) => item.status === 'resolved')
    }

    try {
      const analysis = await analyzeOJTaskTitles(
        { items: requestItems },
        {
          skipSuccTip: true,
          skipErrTip: true,
        }
      )

      requestItemIndexes.forEach((index) => {
        const target = taskForm.items[index]
        if (!target) {
          return
        }
        resetTaskFormItemAnalysis(target, 'invalid')
        target.errorText = '分析失败，请稍后重试'
      })

      analysis.resolved.forEach((resolvedItem) => {
        const formIndex = requestItemIndexes[resolvedItem.input_index]
        if (formIndex === undefined) {
          return
        }
        const target = taskForm.items[formIndex]
        if (!target) {
          return
        }
        applyResolvedCandidate(target, {
          analysis_token: resolvedItem.analysis_token,
          resolved_question_code: resolvedItem.resolved_question_code,
          resolved_title: resolvedItem.resolved_title,
        })
      })

      analysis.ambiguous.forEach((ambiguousItem) => {
        const formIndex = requestItemIndexes[ambiguousItem.input_index]
        if (formIndex === undefined) {
          return
        }
        const target = taskForm.items[formIndex]
        if (!target) {
          return
        }
        resetTaskFormItemAnalysis(target, 'ambiguous')
        target.candidates = ambiguousItem.options || []
        target.errorText = '匹配到多个候选，请明确选择'
        target.resolutionNote = 'multiple_candidates'
      })

      analysis.missing.forEach((missingItem) => {
        const formIndex = requestItemIndexes[missingItem.input_index]
        if (formIndex === undefined) {
          return
        }
        const target = taskForm.items[formIndex]
        if (!target) {
          return
        }
        resetTaskFormItemAnalysis(target, 'missing')
        target.errorText = '本地题库未命中，请修正标题后重新分析'
        target.resolutionNote = 'not_found'
      })

      const summary = taskFormAnalysisSummary.value
      const allResolved = taskForm.items.every((item) => item.status === 'resolved')

      if (source === 'manual') {
        if (allResolved) {
          message.success('题单解析完成，所有题目已锁定。')
        } else {
          message.warning(buildAnalysisFeedbackMessage(summary))
        }
      } else if (source === 'auto' && !allResolved) {
        message.warning(`历史题单已回填，但仍有未解析项：${buildAnalysisFeedbackMessage(summary)}`)
      }

      return allResolved
    } catch (error) {
      requestItemIndexes.forEach((index) => {
        const target = taskForm.items[index]
        if (!target) {
          return
        }
        resetTaskFormItemAnalysis(target, 'invalid')
        target.errorText = '分析失败，请稍后重试'
      })

      if (source === 'manual' || source === 'submit') {
        message.error('题目分析失败，请稍后重试')
      }
      return false
    }
  }

  async function analyzeAllTaskItems(source: 'manual' | 'auto' | 'submit' = 'manual'): Promise<boolean> {
    return analyzeTaskItems({ source })
  }

  async function runManualAnalysis(): Promise<void> {
    if (taskAnalyzing.value) {
      return
    }
    taskAnalyzing.value = true
    try {
      await analyzeAllTaskItems('manual')
    } finally {
      taskAnalyzing.value = false
    }
  }

  async function analyzeSingleTaskItem(item: TaskFormItem): Promise<void> {
    const index = taskForm.items.findIndex((candidate) => candidate.key === item.key)
    if (index === -1) {
      return
    }

    taskAnalyzing.value = true
    try {
      await analyzeTaskItems({
        indexes: [index],
        source: 'manual',
      })
    } finally {
      taskAnalyzing.value = false
    }
  }

  function selectTaskItemCandidate(item: TaskFormItem, candidate: OJTaskAnalyzeCandidate): void {
    applyResolvedCandidate(item, candidate)
  }

  function validateTaskFormBase(): boolean {
    if (!taskForm.title.trim()) {
      message.warning('请输入任务标题')
      return false
    }

    if (Array.from(new Set(taskForm.orgIds.filter((id) => id > 0))).length === 0) {
      message.warning('请至少选择一个组织')
      return false
    }

    if (taskForm.items.length === 0) {
      message.warning('请至少添加一道题目')
      return false
    }

    if (taskForm.mode === 'scheduled') {
      if (!taskForm.executeAt || !taskForm.executeAt.isValid()) {
        message.warning('请选择执行时间')
        return false
      }

      if (taskForm.executeAt.valueOf() <= Date.now()) {
        message.warning('定时执行时间必须晚于当前时间')
        return false
      }
    }

    return true
  }

  async function ensureTaskItemsReadyForSubmit(): Promise<boolean> {
    taskForm.items.forEach((item) => {
      if (!item.title.trim()) {
        resetTaskFormItemAnalysis(item, 'invalid')
        item.errorText = '请输入题目标题后再提交'
      }
    })

    const idleIndexes = taskForm.items
      .map((item, index) => (item.status === 'idle' && item.title.trim() ? index : -1))
      .filter((index) => index >= 0)

    if (idleIndexes.length) {
      const readyAfterAnalyze = await analyzeTaskItems({
        indexes: idleIndexes,
        source: 'submit',
      })

      if (!readyAfterAnalyze) {
        message.warning(buildSubmitBlockedMessage(taskFormAnalysisSummary.value))
        return false
      }
    }

    if (!taskForm.items.every((item) => item.status === 'resolved')) {
      message.warning(buildSubmitBlockedMessage(taskFormAnalysisSummary.value))
      return false
    }

    return true
  }

  function buildTaskPayload(): CreateOJTaskRequest | UpdateOJTaskRequest | ReviseOJTaskRequest {
    const uniqueOrgIds = Array.from(new Set(taskForm.orgIds.filter((id) => id > 0)))
    const items: OJTaskItemRequest[] = taskForm.items.map((item) => ({
      platform: item.platform,
      title: item.title.trim(),
      analysis_token: item.analysisToken,
    }))

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      mode: taskForm.mode,
      org_ids: uniqueOrgIds,
      items,
    } as CreateOJTaskRequest

    if (taskForm.mode === 'scheduled' && taskForm.executeAt) {
      payload.execute_at = taskForm.executeAt.utc().format()
    }

    if (taskDrawerMode.value === 'edit') {
      return payload as UpdateOJTaskRequest
    }

    return payload
  }

  async function openCreateDrawer(): Promise<void> {
    editingTaskId.value = null
    taskDrawerMode.value = 'create'
    taskDrawerOpen.value = true
    taskDrawerLoading.value = false
    resetTaskForm()
  }

  async function openEditDrawer(taskId: number): Promise<void> {
    if (!taskId) {
      return
    }

    editingTaskId.value = taskId
    taskDrawerMode.value = 'edit'
    taskDrawerOpen.value = true
    taskDrawerLoading.value = true
    resetTaskForm()

    try {
      const detail = await getOJTaskDetail(taskId, {
        skipSuccTip: true,
        skipErrTip: true,
      })
      fillTaskForm(detail, 'edit')
      await analyzeAllTaskItems('auto')
    } catch (error) {
      taskDrawerOpen.value = false
      message.error('加载任务详情失败，请稍后重试')
    } finally {
      taskDrawerLoading.value = false
    }
  }

  async function openReviseDrawer(taskId: number): Promise<void> {
    if (!taskId) {
      return
    }

    editingTaskId.value = taskId
    taskDrawerMode.value = 'revise'
    taskDrawerOpen.value = true
    taskDrawerLoading.value = true
    resetTaskForm()

    try {
      const detail = await getOJTaskDetail(taskId, {
        skipSuccTip: true,
        skipErrTip: true,
      })
      fillTaskForm(detail, 'revise')
      await analyzeAllTaskItems('auto')
    } catch (error) {
      taskDrawerOpen.value = false
      message.error('加载任务详情失败，请稍后重试')
    } finally {
      taskDrawerLoading.value = false
    }
  }

  function closeTaskDrawer(): void {
    taskDrawerOpen.value = false
  }

  async function submitTaskForm(): Promise<void> {
    if (taskDrawerLoading.value || taskSubmitting.value || taskAnalyzing.value) {
      return
    }

    if (!validateTaskFormBase()) {
      return
    }

    taskSubmitting.value = true
    try {
      const ready = await ensureTaskItemsReadyForSubmit()
      if (!ready) {
        return
      }

      const payload = buildTaskPayload()

      if (taskDrawerMode.value === 'create') {
        const result = await createOJTask(payload as CreateOJTaskRequest, {
          skipSuccTip: true,
        })
        taskDrawerOpen.value = false
        await options.onMutationResult(result, '任务已创建')
        return
      }

      if (!editingTaskId.value) {
        message.error('缺少任务 ID，无法提交')
        return
      }

      if (taskDrawerMode.value === 'edit') {
        await updateOJTask(editingTaskId.value, payload as UpdateOJTaskRequest, {
          skipSuccTip: true,
        })
        taskDrawerOpen.value = false
        await options.onUpdateSuccess(editingTaskId.value, '任务已更新')
        return
      }

      const reviseResult = await reviseOJTask(editingTaskId.value, payload as ReviseOJTaskRequest, {
        skipSuccTip: true,
      })
      taskDrawerOpen.value = false
      await options.onMutationResult(reviseResult, '新版本已创建')
    } finally {
      taskSubmitting.value = false
    }
  }

  function disablePastDate(current: Dayjs): boolean {
    return current.endOf('day').valueOf() < dayjs().startOf('day').valueOf()
  }

  async function initialize(): Promise<void> {
    resetTaskForm()
    await fetchOrgOptions()
  }

  watch(
    () => taskDrawerOpen.value,
    (open) => {
      if (!open) {
        taskDrawerLoading.value = false
        taskSubmitting.value = false
        taskAnalyzing.value = false
        editingTaskId.value = null
        resetTaskForm()
      }
    }
  )

  watch(
    () => taskForm.mode,
    (mode) => {
      if (mode !== 'scheduled') {
        taskForm.executeAt = undefined
      }
    }
  )

  return {
    orgLoading,
    orgSelectOptions,
    taskDrawerOpen,
    taskDrawerMode,
    taskDrawerLoading,
    taskSubmitting,
    taskAnalyzing,
    taskDrawerTitle,
    taskDrawerOkText,
    taskDrawerShowExecuteAt,
    taskForm,
    taskFormAnalysisSummary,
    taskFormBlockingCount,
    taskFormAnalysisMessage,
    canManualAnalyze,
    taskFormReady,
    initialize,
    openCreateDrawer,
    openEditDrawer,
    openReviseDrawer,
    closeTaskDrawer,
    submitTaskForm,
    runManualAnalysis,
    addTaskItem,
    removeTaskItem,
    analyzeSingleTaskItem,
    handleTaskItemPlatformChange,
    handleTaskItemTitleChange,
    selectTaskItemCandidate,
    disablePastDate,
  }
}

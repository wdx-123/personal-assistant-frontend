import dayjs from 'dayjs'
import type {
  OJPlatform,
  OJTaskExecutionStatus,
  OJTaskExecutionUserItem,
  OJTaskItemResolutionStatus,
  OJTaskListItem,
  OJTaskMode,
  OJTaskStatus,
} from '@/types'
import {
  EXECUTION_STATUS_META,
  EXECUTION_TRIGGER_META,
  FORM_ANALYSIS_META,
  PENDING_REASON_META,
  PLATFORM_OPTIONS,
  RESOLUTION_NOTE_META,
  RESOLUTION_STATUS_META,
  TASK_STATUS_META,
  USER_STATUS_META,
  WORKBENCH_CODES,
} from './constants'
import type {
  FormItemAnalysisStatus,
  TaskActionState,
  TaskAnalysisSummary,
} from './local.types'

export function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const parsed = dayjs(value)
  if (!parsed.isValid()) {
    return value
  }

  return parsed.format('YYYY-MM-DD HH:mm:ss')
}

export function getTaskStatusMeta(status: OJTaskStatus) {
  return TASK_STATUS_META[status]
}

export function getExecutionStatusMeta(status: OJTaskExecutionStatus) {
  return EXECUTION_STATUS_META[status]
}

export function getFormItemStatusMeta(status: FormItemAnalysisStatus) {
  return FORM_ANALYSIS_META[status]
}

export function getResolutionStatusMeta(status: OJTaskItemResolutionStatus) {
  return RESOLUTION_STATUS_META[status]
}

export function getModeLabel(mode: OJTaskMode): string {
  return mode === 'immediate' ? '立即执行' : '定时执行'
}

export function getPlatformLabel(platform: OJPlatform): string {
  const hit = PLATFORM_OPTIONS.find((item) => item.value === platform)
  return hit?.label || platform
}

export function getPendingReasonLabel(reason?: string): string {
  if (!reason) {
    return '-'
  }
  return PENDING_REASON_META[reason] || reason
}

export function getResolutionNoteLabel(note?: string): string {
  if (!note) {
    return '-'
  }
  return RESOLUTION_NOTE_META[note] || note
}

export function getExecutionTriggerLabel(triggerType?: string): string {
  if (!triggerType) {
    return '-'
  }
  return EXECUTION_TRIGGER_META[triggerType] || triggerType
}

export function getUserStatusLabel(status: number): string {
  return USER_STATUS_META[status] || `状态 ${status}`
}

export function getTaskItemReasonNote(item: OJTaskExecutionUserItem): string {
  const parts: string[] = []
  if (item.reason) {
    parts.push(getPendingReasonLabel(item.reason))
  }
  if (item.resolution_note) {
    parts.push(getResolutionNoteLabel(item.resolution_note))
  }
  return parts.length ? parts.join(' / ') : '-'
}

export function buildTaskActionState(record: OJTaskListItem): TaskActionState {
  return {
    task_id: record.task_id,
    mode: record.mode,
    status: record.status,
    execution_status: record.execution_status,
  }
}

export function hasActionPermission(menuCodeSet: Set<string>, code: string): boolean {
  return menuCodeSet.has(code)
}

export function canEditTask(menuCodeSet: Set<string>, state: TaskActionState | null): boolean {
  return !!state &&
    hasActionPermission(menuCodeSet, WORKBENCH_CODES.edit) &&
    state.mode === 'scheduled' &&
    state.status === 'scheduled' &&
    state.execution_status === 'scheduled'
}

export function canDeleteTask(menuCodeSet: Set<string>, state: TaskActionState | null): boolean {
  return !!state &&
    hasActionPermission(menuCodeSet, WORKBENCH_CODES.delete) &&
    state.mode === 'scheduled' &&
    state.status === 'scheduled' &&
    state.execution_status === 'scheduled'
}

export function canExecuteTask(menuCodeSet: Set<string>, state: TaskActionState | null): boolean {
  return !!state &&
    hasActionPermission(menuCodeSet, WORKBENCH_CODES.execute) &&
    state.mode === 'scheduled' &&
    state.status === 'scheduled' &&
    state.execution_status === 'scheduled'
}

export function canReviseTask(menuCodeSet: Set<string>): boolean {
  return hasActionPermission(menuCodeSet, WORKBENCH_CODES.revise)
}

export function canRetryTask(menuCodeSet: Set<string>, state: TaskActionState | null): boolean {
  return !!state &&
    hasActionPermission(menuCodeSet, WORKBENCH_CODES.retry) &&
    (state.execution_status === 'succeeded' || state.execution_status === 'failed')
}

export function buildAnalysisFeedbackMessage(summary: TaskAnalysisSummary): string {
  const parts: string[] = []
  if (summary.resolved) {
    parts.push(`${summary.resolved} 道已解析`)
  }
  if (summary.ambiguous) {
    parts.push(`${summary.ambiguous} 道待选择候选`)
  }
  if (summary.missing) {
    parts.push(`${summary.missing} 道未命中`)
  }
  if (summary.invalid) {
    parts.push(`${summary.invalid} 道输入无效`)
  }
  if (summary.idle) {
    parts.push(`${summary.idle} 道待分析`)
  }
  if (summary.analyzing) {
    parts.push(`${summary.analyzing} 道分析中`)
  }
  return parts.length ? parts.join('，') : '题单已全部解析完成。'
}

export function buildSubmitBlockedMessage(summary: TaskAnalysisSummary): string {
  const parts: string[] = []
  if (summary.ambiguous) {
    parts.push(`${summary.ambiguous} 道题需要选择候选`)
  }
  if (summary.missing) {
    parts.push(`${summary.missing} 道题未命中本地题库`)
  }
  if (summary.invalid) {
    parts.push(`${summary.invalid} 道题输入需要修正`)
  }
  if (summary.idle) {
    parts.push(`${summary.idle} 道题尚未分析`)
  }
  if (summary.analyzing) {
    parts.push(`${summary.analyzing} 道题仍在分析`)
  }

  return parts.length
    ? `提交前请先完成题单解析：${parts.join('，')}。`
    : '提交前请先完成题单解析。'
}

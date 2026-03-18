import type { Dayjs } from 'dayjs'
import type {
  OJPlatform,
  OJTaskAnalyzeCandidate,
  OJTaskExecutionStatus,
  OJTaskMode,
  OJTaskStatus,
} from '@/types'

export type TaskFormMode = 'create' | 'edit' | 'revise'

export type FormItemAnalysisStatus =
  | 'idle'
  | 'analyzing'
  | 'resolved'
  | 'ambiguous'
  | 'missing'
  | 'invalid'

export interface TaskFormItem {
  key: string
  platform: OJPlatform
  title: string
  analysisToken?: string
  status: FormItemAnalysisStatus
  candidates: OJTaskAnalyzeCandidate[]
  resolvedQuestionCode?: string
  resolvedTitle?: string
  resolutionNote?: string
  errorText?: string
}

export interface TaskFormState {
  title: string
  description: string
  mode: OJTaskMode
  executeAt?: Dayjs
  orgIds: number[]
  items: TaskFormItem[]
}

export interface TaskActionState {
  task_id: number
  mode: OJTaskMode
  status: OJTaskStatus
  execution_status?: OJTaskExecutionStatus | null
}

export interface TaskAnalysisSummary {
  idle: number
  analyzing: number
  resolved: number
  ambiguous: number
  missing: number
  invalid: number
}

export interface TaskListFilters {
  keyword: string
  org_id?: number
  mode?: OJTaskMode
  status?: OJTaskStatus
  only_latest: 'latest' | 'all'
}

export interface ExecutionUserFilters {
  username: string
  completion_scope: 'all' | 'completed' | 'pending'
}

export interface PaginationState {
  current: number
  pageSize: number
  total: number
}

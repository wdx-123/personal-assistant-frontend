import type { OJPlatform } from './common.types'

export type OJTaskMode = 'immediate' | 'scheduled'

export type OJTaskStatus =
  | 'scheduled'
  | 'queued'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'deleted'

export type OJTaskExecutionStatus =
  | 'scheduled'
  | 'queued'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type OJTaskExecutionTriggerType =
  | 'create_immediate'
  | 'schedule_due'
  | 'execute_now'
  | 'retry'

export type OJTaskItemResolutionStatus = 'resolved' | 'pending_resolution' | 'invalid'

export type OJTaskItemInputMode = 'title'

export type OJTaskExecutionUserItemResultStatus = 'completed' | 'pending'

export type OJTaskExecutionUserItemPendingReason = 'account_unbound' | 'unsolved'

export interface OJTaskAnalyzeItemInput {
  platform: OJPlatform
  title: string
}

export interface OJTaskItemRequest extends OJTaskAnalyzeItemInput {
  analysis_token?: string
}

export interface AnalyzeOJTaskTitlesRequest {
  items: OJTaskAnalyzeItemInput[]
}

export interface CreateOJTaskRequest {
  title: string
  description: string
  mode: OJTaskMode
  execute_at?: string
  org_ids: number[]
  items: OJTaskItemRequest[]
}

export interface UpdateOJTaskRequest {
  title: string
  description: string
  mode: 'scheduled'
  execute_at: string
  org_ids: number[]
  items: OJTaskItemRequest[]
}

export interface ReviseOJTaskRequest {
  title: string
  description: string
  mode: OJTaskMode
  execute_at?: string
  org_ids: number[]
  items: OJTaskItemRequest[]
}

export interface ListVisibleOJTasksParams {
  page?: number
  page_size?: number
  keyword?: string
  org_id?: number
  root_task_id?: number
  only_latest?: boolean
  mode?: OJTaskMode
  status?: OJTaskStatus
}

export interface ListOJTaskExecutionUsersParams {
  page?: number
  page_size?: number
  all_completed?: boolean
  username?: string
}

export interface OJTaskAnalyzeCandidate {
  analysis_token: string
  resolved_question_id: number
  resolved_question_code: string
  resolved_title: string
}

export interface OJTaskAnalyzeResolvedItem {
  input_index: number
  platform: OJPlatform
  title: string
  analysis_token: string
  resolved_question_id: number
  resolved_question_code: string
  resolved_title: string
}

export interface OJTaskAnalyzeAmbiguousItem {
  input_index: number
  platform: OJPlatform
  title: string
  options: OJTaskAnalyzeCandidate[]
}

export interface OJTaskAnalyzeMissingItem {
  input_index: number
  platform: OJPlatform
  title: string
}

export interface OJTaskAnalyzeResponse {
  resolved: OJTaskAnalyzeResolvedItem[]
  ambiguous: OJTaskAnalyzeAmbiguousItem[]
  missing: OJTaskAnalyzeMissingItem[]
}

export interface OJTaskCreateResponse {
  task_id: number
  execution_id: number
  status: OJTaskStatus | OJTaskExecutionStatus
}

export interface OJTaskOrgItem {
  org_id: number
  org_name: string
}

export interface OJTaskItem {
  id: number
  sort_no: number
  platform: OJPlatform
  input_title: string
  input_mode: OJTaskItemInputMode
  resolution_status: OJTaskItemResolutionStatus
  resolution_note?: string
  resolved_question_id?: number
  resolved_question_code?: string
  resolved_title_snapshot?: string
}

export interface OJTaskListItem {
  task_id: number
  root_task_id: number
  parent_task_id?: number | null
  version_no: number
  title: string
  description: string
  mode: OJTaskMode
  status: OJTaskStatus
  execute_at?: string
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
  execution_id: number
  execution_status: OJTaskExecutionStatus
  total_user_count: number
  completed_user_count: number
  pending_user_count: number
  total_item_count: number
  completed_item_count: number
  pending_item_count: number
  org_count: number
  item_count: number
}

export interface OJTaskExecutionDetail {
  execution_id: number
  task_id: number
  trigger_type: OJTaskExecutionTriggerType
  requested_by: number
  status: OJTaskExecutionStatus
  planned_at: string
  started_at?: string
  finished_at?: string
  error_message?: string
  total_user_count: number
  completed_user_count: number
  pending_user_count: number
  total_item_count: number
  completed_item_count: number
  pending_item_count: number
}

export interface OJTaskDetail {
  task_id: number
  root_task_id: number
  parent_task_id?: number | null
  version_no: number
  title: string
  description: string
  mode: OJTaskMode
  status: OJTaskStatus
  execute_at?: string
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
  orgs: OJTaskOrgItem[]
  items: OJTaskItem[]
  current_execution?: OJTaskExecutionDetail
}

export interface OJTaskVersionItem {
  task_id: number
  root_task_id: number
  parent_task_id?: number | null
  version_no: number
  title: string
  mode: OJTaskMode
  status: OJTaskStatus
  execute_at?: string
  created_at: string
  execution_id: number
  execution_status: OJTaskExecutionStatus
}

export interface OJTaskVersionListResponse {
  root_task_id: number
  versions: OJTaskVersionItem[]
}

export interface OJTaskExecutionUserOrg {
  org_id: number
  org_name_snapshot: string
}

export interface OJTaskExecutionUserSummary {
  user_id: number
  user_uuid_snapshot: string
  username_snapshot: string
  avatar_snapshot: string
  user_status_snapshot: number
  completed_item_count: number
  pending_item_count: number
  all_completed: boolean
  orgs: OJTaskExecutionUserOrg[]
}

export interface OJTaskExecutionUserItem {
  task_item_id: number
  sort_no: number
  platform: OJPlatform
  input_title: string
  resolution_status: OJTaskItemResolutionStatus
  resolution_note?: string
  resolved_question_id?: number
  resolved_question_code?: string
  resolved_title_snapshot?: string
  result_status: OJTaskExecutionUserItemResultStatus
  reason?: OJTaskExecutionUserItemPendingReason | string
}

export interface OJTaskExecutionUserDetail {
  user_id: number
  user_uuid_snapshot: string
  username_snapshot: string
  avatar_snapshot: string
  user_status_snapshot: number
  completed_item_count: number
  pending_item_count: number
  all_completed: boolean
  orgs: OJTaskExecutionUserOrg[]
  completed_items: OJTaskExecutionUserItem[]
  pending_items: OJTaskExecutionUserItem[]
}

export interface OJTaskListPageData {
  list: OJTaskListItem[]
  total: number
  page: number
  page_size: number
}

export interface OJTaskExecutionUsersPageData {
  list: OJTaskExecutionUserSummary[]
  total: number
  page: number
  page_size: number
}

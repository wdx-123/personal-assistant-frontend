import type {
  OJPlatform,
  OJTaskExecutionStatus,
  OJTaskItemResolutionStatus,
  OJTaskMode,
  OJTaskStatus,
} from '@/types'
import type { FormItemAnalysisStatus } from './local.types'

export const DETAIL_POLL_INTERVAL = 2000
export const DETAIL_POLL_TIMEOUT = 60000

export const WORKBENCH_CODES = {
  create: 'workbench_task_create',
  edit: 'workbench_task_edit',
  delete: 'workbench_task_delete',
  execute: 'workbench_task_execute',
  revise: 'workbench_task_revise',
  retry: 'workbench_task_retry',
} as const

export const STABLE_EXECUTION_STATUS = new Set<OJTaskExecutionStatus>(['succeeded', 'failed', 'cancelled'])

export const TASK_MODE_OPTIONS: Array<{ label: string; value: OJTaskMode }> = [
  { label: '立即执行', value: 'immediate' },
  { label: '定时执行', value: 'scheduled' },
]

export const TASK_STATUS_OPTIONS: Array<{ label: string; value: OJTaskStatus }> = [
  { label: '待定时', value: 'scheduled' },
  { label: '已入队', value: 'queued' },
  { label: '执行中', value: 'executing' },
  { label: '执行成功', value: 'succeeded' },
  { label: '执行失败', value: 'failed' },
  { label: '已删除', value: 'deleted' },
]

export const EXECUTION_STATUS_META: Record<OJTaskExecutionStatus, { label: string; color: string }> = {
  scheduled: { label: '待定时', color: 'gold' },
  queued: { label: '排队中', color: 'processing' },
  executing: { label: '执行中', color: 'blue' },
  succeeded: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
}

export const TASK_STATUS_META: Record<OJTaskStatus, { label: string; color: string }> = {
  scheduled: { label: '待定时', color: 'gold' },
  queued: { label: '已入队', color: 'processing' },
  executing: { label: '执行中', color: 'blue' },
  succeeded: { label: '执行成功', color: 'success' },
  failed: { label: '执行失败', color: 'error' },
  deleted: { label: '已删除', color: 'default' },
}

export const FORM_ANALYSIS_META: Record<FormItemAnalysisStatus, { label: string; color: string }> = {
  idle: { label: '待分析', color: 'default' },
  analyzing: { label: '分析中', color: 'processing' },
  resolved: { label: '已解析', color: 'success' },
  ambiguous: { label: '待选择', color: 'warning' },
  missing: { label: '未命中', color: 'error' },
  invalid: { label: '无效', color: 'error' },
}

export const RESOLUTION_STATUS_META: Record<OJTaskItemResolutionStatus, { label: string; color: string }> = {
  resolved: { label: '已解析', color: 'success' },
  pending_resolution: { label: '待解析', color: 'warning' },
  invalid: { label: '无效', color: 'error' },
}

export const EXECUTION_TRIGGER_META: Record<string, string> = {
  create_immediate: '创建即执行',
  schedule_due: '定时触发',
  execute_now: '手动提前执行',
  retry: '重试派生',
}

export const PLATFORM_OPTIONS: Array<{ label: string; value: OJPlatform }> = [
  { label: '洛谷', value: 'luogu' },
  { label: '力扣', value: 'leetcode' },
  { label: '蓝桥杯', value: 'lanqiao' },
]

export const USER_STATUS_META: Record<number, string> = {
  1: '活跃',
  2: '禁用',
  3: '已删除',
}

export const PENDING_REASON_META: Record<string, string> = {
  account_unbound: '未绑定对应 OJ 账号',
  unsolved: '题目尚未完成',
}

export const RESOLUTION_NOTE_META: Record<string, string> = {
  awaiting_question_sync: '等待题库同步',
  preflight_resolution_failed: '执行前解析失败',
}

export const LIST_COLUMNS = [
  { title: '任务标题', dataIndex: 'title', key: 'title', width: 240 },
  { title: '版本', dataIndex: 'version_no', key: 'version_no', width: 88, align: 'center' as const },
  { title: '模式', dataIndex: 'mode', key: 'mode', width: 96, align: 'center' as const },
  { title: '任务状态', dataIndex: 'status', key: 'status', width: 108, align: 'center' as const },
  { title: '执行状态', dataIndex: 'execution_status', key: 'execution_status', width: 108, align: 'center' as const },
  { title: '组织数', dataIndex: 'org_count', key: 'org_count', width: 88, align: 'center' as const },
  { title: '题目数', dataIndex: 'item_count', key: 'item_count', width: 88, align: 'center' as const },
  { title: '完成用户', dataIndex: 'completed_user_count', key: 'completed_user_count', width: 108, align: 'center' as const },
  { title: '待完成用户', dataIndex: 'pending_user_count', key: 'pending_user_count', width: 116, align: 'center' as const },
  { title: '执行时间', dataIndex: 'execute_at', key: 'execute_at', width: 176 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 176 },
  { title: '操作', key: 'action', width: 340, fixed: 'right' as const },
]

export const TASK_ITEM_COLUMNS = [
  { title: '序号', dataIndex: 'sort_no', key: 'sort_no', width: 72, align: 'center' as const },
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 96, align: 'center' as const },
  { title: '输入标题', dataIndex: 'input_title', key: 'input_title', width: 220 },
  { title: '解析状态', dataIndex: 'resolution_status', key: 'resolution_status', width: 116, align: 'center' as const },
  { title: '已解析题号', dataIndex: 'resolved_question_code', key: 'resolved_question_code', width: 150 },
  { title: '权威标题', dataIndex: 'resolved_title_snapshot', key: 'resolved_title_snapshot', width: 220 },
  { title: '解析备注', dataIndex: 'resolution_note', key: 'resolution_note', width: 180 },
]

export const USER_COLUMNS = [
  { title: '用户', dataIndex: 'username_snapshot', key: 'username_snapshot' },
  { title: '组织', dataIndex: 'orgs', key: 'orgs', width: 220 },
  { title: '完成题数', dataIndex: 'completed_item_count', key: 'completed_item_count', width: 110, align: 'center' as const },
  { title: '待完成题数', dataIndex: 'pending_item_count', key: 'pending_item_count', width: 110, align: 'center' as const },
  { title: '状态', dataIndex: 'all_completed', key: 'all_completed', width: 100, align: 'center' as const },
  { title: '操作', key: 'action', width: 100, align: 'center' as const },
]

export const USER_DETAIL_ITEM_COLUMNS = [
  { title: '序号', dataIndex: 'sort_no', key: 'sort_no', width: 72, align: 'center' as const },
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 96, align: 'center' as const },
  { title: '输入标题', dataIndex: 'input_title', key: 'input_title', width: 220 },
  { title: '解析状态', dataIndex: 'resolution_status', key: 'resolution_status', width: 116, align: 'center' as const },
  { title: '已解析题号', dataIndex: 'resolved_question_code', key: 'resolved_question_code', width: 150 },
  { title: '权威标题', dataIndex: 'resolved_title_snapshot', key: 'resolved_title_snapshot', width: 220 },
  { title: '结果', dataIndex: 'result_status', key: 'result_status', width: 96, align: 'center' as const },
  { title: '原因 / 备注', dataIndex: 'reason_note', key: 'reason_note', width: 220 },
]

export const TABLE_LOCALE = { emptyText: '暂无任务数据' }
export const USER_TABLE_LOCALE = { emptyText: '暂无执行用户数据' }

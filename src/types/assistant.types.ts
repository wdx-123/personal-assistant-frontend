export type AssistantShellMode = 'launcher' | 'floating' | 'expanded'

export type AssistantConversationGroup = '今天' | '最近' | '更早'

export type AssistantMessageRole = 'user' | 'assistant' | 'system'

export type AssistantMessageStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'stopped'

export type AssistantStructuredCardType =
  | 'task_report'
  | 'scoped_report'
  | 'progress_insight'
  | 'project_doc'
  | 'general'

export type AssistantTraceStatus =
  | 'pending'
  | 'success'
  | 'error'
  | 'awaiting_confirmation'
  | 'skipped'
export type AssistantTraceActionType = 'confirm' | 'skip' | 'view_detail'

export type AssistantStreamEventType =
  | 'conversation_started'
  | 'assistant_token'
  | 'tool_call_started'
  | 'tool_call_finished'
  | 'tool_call_waiting_confirmation'
  | 'tool_call_confirmation_result'
  | 'structured_block'
  | 'message_completed'
  | 'error'
  | 'done'

export interface AssistantMetric {
  label: string
  value: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}

export interface AssistantStructuredCard {
  key: string
  type: AssistantStructuredCardType
  title: string
  summary: string
  metrics: AssistantMetric[]
  bullets: string[]
  extra?: string
}

export interface AssistantScopeInfo {
  user_name: string
  org_name: string
  scope_label: string
  task_name?: string
  doc_scope_label?: string
}

export interface AssistantTraceAction {
  key: string
  label: string
  action: AssistantTraceActionType
  style?: 'primary' | 'default' | 'danger'
}

export interface AssistantTraceItem {
  key: string
  title: string
  description: string
  status: AssistantTraceStatus
  duration_ms?: number
  content?: string
  detail_markdown?: string
  requires_confirmation?: boolean
  confirmation_title?: string
  confirmation_description?: string
  actions?: AssistantTraceAction[]
}

export interface AssistantMessage {
  id: string
  conversation_id: string
  role: AssistantMessageRole
  content: string
  created_at: string
  status: AssistantMessageStatus
  cards: AssistantStructuredCard[]
  trace_items: AssistantTraceItem[]
  scope?: AssistantScopeInfo
  error_text?: string
}

export interface AssistantConversation {
  id: string
  title: string
  preview: string
  updated_at: string
  timestamp: number
  group: AssistantConversationGroup
  is_generating: boolean
}

export interface AssistantLauncherPosition {
  x: number
  y: number
}

export interface CreateAssistantConversationRequest {
  title?: string
}

export interface StreamAssistantMessageRequest {
  conversation_id: string
  content: string
  context_user_name: string
  context_org_name: string
}

export interface AssistantToolDecisionRequest {
  conversation_id: string
  message_id: string
  tool_key: string
  decision: Extract<AssistantTraceActionType, 'confirm' | 'skip'>
}

export interface AssistantConversationStartedPayload {
  title: string
}

export interface AssistantTokenPayload {
  token: string
}

export interface AssistantToolCallStartedPayload {
  key: string
  title: string
  description: string
}

export interface AssistantToolCallFinishedPayload {
  key: string
  description: string
  duration_ms: number
  status: AssistantTraceStatus
  content?: string
  detail_markdown?: string
}

export interface AssistantToolCallWaitingConfirmationPayload {
  key: string
  title: string
  description: string
  detail_markdown?: string
  confirmation_title: string
  confirmation_description: string
  actions: AssistantTraceAction[]
}

export interface AssistantToolCallConfirmationResultPayload {
  key: string
  decision: Extract<AssistantTraceActionType, 'confirm' | 'skip'>
  status: 'pending' | 'skipped'
  description: string
  detail_markdown?: string
}

export interface AssistantStructuredBlockPayload {
  card?: AssistantStructuredCard
  scope?: AssistantScopeInfo
}

export interface AssistantMessageCompletedPayload {
  content: string
}

export interface AssistantErrorPayload {
  message: string
}

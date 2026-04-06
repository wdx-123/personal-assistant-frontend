import type {
  AssistantConversation,
  AssistantMessage,
  AssistantToolDecisionRequest,
  CreateAssistantConversationRequest,
  StreamAssistantMessageRequest,
} from '@/types'
import type { RequestOptions } from '@/utils/request'
import {
  createMockConversation,
  deleteMockConversation,
  getMockConversationMessages,
  listMockConversations,
  openMockAssistantStream,
  openMockAssistantToolDecisionStream,
} from './assistantMock.service'

export async function createConversation(
  data?: CreateAssistantConversationRequest,
  _config?: RequestOptions,
): Promise<AssistantConversation> {
  return createMockConversation(data?.title)
}

export async function listConversations(
  _config?: RequestOptions,
): Promise<AssistantConversation[]> {
  return listMockConversations()
}

export async function getConversationMessages(
  conversationId: string,
  _config?: RequestOptions,
): Promise<AssistantMessage[]> {
  return getMockConversationMessages(conversationId)
}

export async function deleteConversation(
  conversationId: string,
  _config?: RequestOptions,
): Promise<void> {
  return deleteMockConversation(conversationId)
}

export async function streamConversationMessage(
  request: StreamAssistantMessageRequest,
) {
  return openMockAssistantStream(request)
}

export async function submitToolDecision(
  request: AssistantToolDecisionRequest,
) {
  return openMockAssistantToolDecisionStream(request)
}

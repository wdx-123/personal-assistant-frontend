import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  ASSISTANT_INITIAL_SHELL_MODE,
  ASSISTANT_SHELL_LAUNCHER_POSITION_STORAGE_KEY,
  ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSED_STORAGE_KEY,
  ASSISTANT_WORKBENCH_SIDEBAR_DEFAULT_WIDTH,
  ASSISTANT_WORKBENCH_SIDEBAR_WIDTH_STORAGE_KEY,
} from '@/constants/assistant'
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  streamConversationMessage,
  submitToolDecision,
} from '@/services/assistant.service'
import { useAuthStore } from '@/stores/auth'
import type {
  AssistantConversation,
  AssistantLauncherPosition,
  AssistantMessage,
  AssistantShellMode,
  AssistantStreamEventType,
  AssistantStructuredBlockPayload,
  AssistantToolCallConfirmationResultPayload,
  AssistantToolCallFinishedPayload,
  AssistantToolCallStartedPayload,
  AssistantToolCallWaitingConfirmationPayload,
  AssistantToolDecisionRequest,
  AssistantTraceItem,
} from '@/types'

const canUseLocalStorage = () => typeof window !== 'undefined'

const readStoredNumber = (key: string, fallback: number) => {
  if (!canUseLocalStorage()) return fallback

  const value = Number(window.localStorage.getItem(key))
  return Number.isFinite(value) ? value : fallback
}

const readStoredBoolean = (key: string, fallback: boolean) => {
  if (!canUseLocalStorage()) return fallback

  const value = window.localStorage.getItem(key)
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const readStoredLauncherPosition = (): AssistantLauncherPosition | null => {
  if (!canUseLocalStorage()) return null

  const raw = window.localStorage.getItem(
    ASSISTANT_SHELL_LAUNCHER_POSITION_STORAGE_KEY,
  )
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AssistantLauncherPosition>
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return null
    }

    return {
      x: parsed.x,
      y: parsed.y,
    }
  } catch {
    return null
  }
}

const parseChunkData = <T>(data?: string): T | null => {
  if (!data) return null

  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

const sortMessages = (messages: AssistantMessage[]) =>
  [...messages].sort(
    (left, right) =>
      dayjs(left.created_at).valueOf() - dayjs(right.created_at).valueOf(),
  )

export const useAssistantStore = defineStore('assistant', () => {
  const authStore = useAuthStore()

  const shellMode = ref<AssistantShellMode>(ASSISTANT_INITIAL_SHELL_MODE)
  const conversations = ref<AssistantConversation[]>([])
  const messageMap = ref<Record<string, AssistantMessage[]>>({})
  const activeConversationId = ref('')
  const draft = ref('')
  const initialized = ref(false)
  const loading = ref(false)
  const isStreaming = ref(false)
  const currentAbortController = ref<AbortController | null>(null)
  const decisionLoadingKey = ref('')
  const composerFocusToken = ref(0)
  const sidebarWidth = ref(
    readStoredNumber(
      ASSISTANT_WORKBENCH_SIDEBAR_WIDTH_STORAGE_KEY,
      ASSISTANT_WORKBENCH_SIDEBAR_DEFAULT_WIDTH,
    ),
  )
  const lastExpandedSidebarWidth = ref(sidebarWidth.value)
  const sidebarCollapsed = ref(
    readStoredBoolean(ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSED_STORAGE_KEY, false),
  )
  const launcherPosition = ref<AssistantLauncherPosition | null>(
    readStoredLauncherPosition(),
  )

  const activeConversation = computed(() =>
    conversations.value.find((item) => item.id === activeConversationId.value),
  )

  const activeMessages = computed(() =>
    sortMessages(messageMap.value[activeConversationId.value] || []),
  )

  const detailMessage = computed(() =>
    [...activeMessages.value]
      .reverse()
      .find((item) => item.role === 'assistant'),
  )

  const detailCards = computed(() => detailMessage.value?.cards || [])
  const detailTraceItems = computed(() => detailMessage.value?.trace_items || [])
  const detailScope = computed(() => detailMessage.value?.scope)
  const awaitingConfirmationItem = computed(() =>
    [...detailTraceItems.value]
      .reverse()
      .find((item) => item.status === 'awaiting_confirmation'),
  )

  const requestComposerFocus = () => {
    composerFocusToken.value += 1
  }

  const ensureConversationMessagesLoaded = async (conversationId: string) => {
    if (!conversationId) return []

    if (messageMap.value[conversationId]) {
      return messageMap.value[conversationId]
    }

    const messages = await getConversationMessages(conversationId, {
      skipErrTip: true,
      skipSuccTip: true,
    })

    messageMap.value = {
      ...messageMap.value,
      [conversationId]: messages,
    }

    return messages
  }

  const isConversationBlank = async (conversationId: string) => {
    const messages = await ensureConversationMessagesLoaded(conversationId)
    return messages.length === 0
  }

  const findBlankConversation = async (excludeConversationId?: string) => {
    for (const conversation of conversations.value) {
      if (!conversation?.id || conversation.id === excludeConversationId) {
        continue
      }

      if (await isConversationBlank(conversation.id)) {
        return conversation
      }
    }

    return null
  }

  const persistSidebarLayout = () => {
    if (!canUseLocalStorage()) return

    window.localStorage.setItem(
      ASSISTANT_WORKBENCH_SIDEBAR_WIDTH_STORAGE_KEY,
      String(sidebarWidth.value),
    )
    window.localStorage.setItem(
      ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(sidebarCollapsed.value),
    )
  }

  const setSidebarWidth = (width: number) => {
    sidebarWidth.value = width
    lastExpandedSidebarWidth.value = width
    persistSidebarLayout()
  }

  const collapseSidebar = () => {
    sidebarCollapsed.value = true
    persistSidebarLayout()
  }

  const restoreSidebar = (width = lastExpandedSidebarWidth.value) => {
    sidebarCollapsed.value = false
    sidebarWidth.value = width
    lastExpandedSidebarWidth.value = width
    persistSidebarLayout()
  }

  const setLauncherPosition = (position: AssistantLauncherPosition | null) => {
    launcherPosition.value = position

    if (!canUseLocalStorage()) return

    if (!position) {
      window.localStorage.removeItem(
        ASSISTANT_SHELL_LAUNCHER_POSITION_STORAGE_KEY,
      )
      return
    }

    window.localStorage.setItem(
      ASSISTANT_SHELL_LAUNCHER_POSITION_STORAGE_KEY,
      JSON.stringify(position),
    )
  }

  const ensureInitialized = async () => {
    if (initialized.value) return

    loading.value = true
    try {
      const conversationList = await listConversations({
        skipErrTip: true,
        skipSuccTip: true,
      })
      conversations.value = conversationList

      if (conversationList[0]) {
        activeConversationId.value = conversationList[0].id
        messageMap.value[conversationList[0].id] =
          await getConversationMessages(conversationList[0].id, {
            skipErrTip: true,
            skipSuccTip: true,
          })
      }

      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  const syncConversationMeta = (
    conversationId: string,
    updater: Partial<AssistantConversation>,
  ) => {
    conversations.value = conversations.value.map((item) =>
      item.id === conversationId ? { ...item, ...updater } : item,
    )
  }

  const appendMessage = (message: AssistantMessage) => {
    const currentMessages = messageMap.value[message.conversation_id] || []
    messageMap.value = {
      ...messageMap.value,
      [message.conversation_id]: [...currentMessages, message],
    }
  }

  const updateLastAssistantMessage = (
    conversationId: string,
    updater: (message: AssistantMessage) => AssistantMessage,
  ) => {
    const currentMessages = messageMap.value[conversationId] || []
    const reverseIndex = [...currentMessages]
      .reverse()
      .findIndex((item) => item.role === 'assistant')

    if (reverseIndex < 0) return

    const targetIndex = currentMessages.length - 1 - reverseIndex
    const nextMessages = [...currentMessages]
    const targetMessage = nextMessages[targetIndex]
    if (!targetMessage) return

    nextMessages[targetIndex] = updater(targetMessage)
    messageMap.value = {
      ...messageMap.value,
      [conversationId]: nextMessages,
    }
  }

  const upsertTraceItem = (
    traceItems: AssistantTraceItem[],
    nextItem: AssistantTraceItem,
  ) => {
    const index = traceItems.findIndex((item) => item.key === nextItem.key)
    if (index < 0) return [...traceItems, nextItem]

    const nextTraceItems = [...traceItems]
    nextTraceItems[index] = {
      ...nextTraceItems[index],
      ...nextItem,
    }
    return nextTraceItems
  }

  const processStream = async (
    conversationId: string,
    streamHandle: Awaited<ReturnType<typeof streamConversationMessage>>,
  ) => {
    currentAbortController.value = streamHandle.abortController
    isStreaming.value = true
    syncConversationMeta(conversationId, {
      is_generating: true,
      updated_at: new Date().toISOString(),
      timestamp: dayjs().valueOf(),
    })

    try {
      for await (const chunk of streamHandle.stream) {
        const eventType =
          typeof chunk.event === 'string'
            ? (chunk.event.trim() as AssistantStreamEventType)
            : undefined

        if (!eventType) continue

        if (eventType === 'conversation_started') {
          const payload = parseChunkData<{ title: string }>(chunk.data)
          if (payload?.title) {
            syncConversationMeta(conversationId, { title: payload.title })
          }
          continue
        }

        if (eventType === 'assistant_token') {
          const payload = parseChunkData<{ token: string }>(chunk.data)
          if (!payload?.token) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            content: `${message.content}${payload.token}`,
            status: message.status === 'idle' ? 'loading' : message.status,
          }))
          continue
        }

        if (eventType === 'tool_call_started') {
          const payload =
            parseChunkData<AssistantToolCallStartedPayload>(chunk.data)
          if (!payload) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            trace_items: upsertTraceItem(message.trace_items, {
              key: payload.key,
              title: payload.title,
              description: payload.description,
              status: 'pending',
            }),
          }))
          continue
        }

        if (eventType === 'tool_call_finished') {
          const payload =
            parseChunkData<AssistantToolCallFinishedPayload>(chunk.data)
          if (!payload) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            trace_items: upsertTraceItem(message.trace_items, {
              key: payload.key,
              title:
                message.trace_items.find((item) => item.key === payload.key)
                  ?.title || payload.key,
              description: payload.description,
              status: payload.status,
              duration_ms: payload.duration_ms,
              content: payload.content,
              detail_markdown: payload.detail_markdown,
              requires_confirmation: false,
              confirmation_title: undefined,
              confirmation_description: undefined,
              actions: undefined,
            }),
          }))
          continue
        }

        if (eventType === 'tool_call_waiting_confirmation') {
          const payload =
            parseChunkData<AssistantToolCallWaitingConfirmationPayload>(
              chunk.data,
            )
          if (!payload) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            status: 'idle',
            trace_items: upsertTraceItem(message.trace_items, {
              key: payload.key,
              title: payload.title,
              description: payload.description,
              status: 'awaiting_confirmation',
              detail_markdown: payload.detail_markdown,
              requires_confirmation: true,
              confirmation_title: payload.confirmation_title,
              confirmation_description: payload.confirmation_description,
              actions: payload.actions,
            }),
          }))
          continue
        }

        if (eventType === 'tool_call_confirmation_result') {
          const payload =
            parseChunkData<AssistantToolCallConfirmationResultPayload>(
              chunk.data,
            )
          if (!payload) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            status: payload.status === 'pending' ? 'loading' : message.status,
            trace_items: upsertTraceItem(message.trace_items, {
              key: payload.key,
              title:
                message.trace_items.find((item) => item.key === payload.key)
                  ?.title || payload.key,
              description: payload.description,
              status: payload.status,
              detail_markdown: payload.detail_markdown,
              requires_confirmation: false,
              confirmation_title: undefined,
              confirmation_description: undefined,
              actions: undefined,
            }),
          }))
          continue
        }

        if (eventType === 'structured_block') {
          const payload =
            parseChunkData<AssistantStructuredBlockPayload>(chunk.data)
          if (!payload) continue

          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            cards:
              payload.card && !message.cards.some((item) => item.key === payload.card?.key)
                ? [...message.cards, payload.card]
                : message.cards,
            scope: payload.scope || message.scope,
          }))
          continue
        }

        if (eventType === 'message_completed') {
          const payload = parseChunkData<{ content: string }>(chunk.data)
          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            content: payload?.content || message.content,
            status: 'success',
          }))
          continue
        }

        if (eventType === 'error') {
          const payload = parseChunkData<{ message: string }>(chunk.data)
          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            status: 'error',
            error_text: payload?.message || '生成失败，请稍后重试。',
          }))
          continue
        }

        if (eventType === 'done') {
          updateLastAssistantMessage(conversationId, (message) => ({
            ...message,
            status:
              message.status === 'error' || message.status === 'stopped'
                ? message.status
                : 'success',
          }))
        }
      }
    } finally {
      currentAbortController.value = null
      isStreaming.value = false
      decisionLoadingKey.value = ''
      syncConversationMeta(conversationId, {
        is_generating: false,
        updated_at: new Date().toISOString(),
        timestamp: dayjs().valueOf(),
      })
    }
  }

  const setShellMode = (mode: AssistantShellMode) => {
    shellMode.value = mode
  }

  const openFloating = async () => {
    await ensureInitialized()
    shellMode.value = 'floating'
  }

  const expandFloating = () => {
    shellMode.value = 'expanded'
  }

  const collapseFloating = () => {
    shellMode.value = 'floating'
  }

  const closeFloating = () => {
    shellMode.value = 'launcher'
  }

  const createConversationRecord = async () => {
    const conversation = await createConversation(
      {
        title: '新建会话',
      },
      {
        skipErrTip: true,
        skipSuccTip: true,
      },
    )
    conversations.value = [conversation, ...conversations.value]
    messageMap.value[conversation.id] = []
    activeConversationId.value = conversation.id
    return conversation
  }

  const ensureBlankConversation = async (
    options: {
      focus?: boolean
    } = {},
  ) => {
    const { focus = true } = options

    await ensureInitialized()

    if (
      activeConversationId.value
      && await isConversationBlank(activeConversationId.value)
    ) {
      if (focus) {
        requestComposerFocus()
      }

      return activeConversation.value
    }

    const blankConversation = await findBlankConversation(
      activeConversationId.value,
    )

    if (blankConversation) {
      await setActiveConversation(blankConversation.id)

      if (focus) {
        requestComposerFocus()
      }

      return blankConversation
    }

    const conversation = await createConversationRecord()

    if (focus) {
      requestComposerFocus()
    }

    return conversation
  }

  const createNewConversation = async () => ensureBlankConversation()

  const setActiveConversation = async (conversationId: string) => {
    if (!conversationId || activeConversationId.value === conversationId) return

    activeConversationId.value = conversationId
    await ensureConversationMessagesLoaded(conversationId)
  }

  const deleteCurrentConversation = async (conversationId: string) => {
    await deleteConversation(conversationId, {
      skipErrTip: true,
      skipSuccTip: true,
    })

    conversations.value = conversations.value.filter(
      (item) => item.id !== conversationId,
    )
    delete messageMap.value[conversationId]

    if (activeConversationId.value === conversationId) {
      const nextConversation = conversations.value[0]
      activeConversationId.value = nextConversation?.id || ''

      if (nextConversation?.id) {
        await ensureConversationMessagesLoaded(nextConversation.id)
      }
    }
  }

  const stopStreaming = () => {
    if (!currentAbortController.value) return

    currentAbortController.value.abort()
    currentAbortController.value = null
    isStreaming.value = false
    decisionLoadingKey.value = ''

    if (activeConversationId.value) {
      updateLastAssistantMessage(activeConversationId.value, (message) => ({
        ...message,
        status: 'stopped',
        error_text: '已停止生成',
      }))
      syncConversationMeta(activeConversationId.value, {
        is_generating: false,
      })
    }
  }

  const normalizeUserMessageContent = (value: string) => {
    const normalized = value.replace(/\r\n/g, '\n')
    if (!normalized.trim()) return ''

    return normalized.replace(/^\n+|\n+$/g, '')
  }

  const sendMessage = async (rawContent?: string) => {
    const content = normalizeUserMessageContent(rawContent ?? draft.value)
    if (!content || isStreaming.value) return

    await ensureInitialized()

    let conversationId = activeConversationId.value
    if (!conversationId) {
      const conversation = await ensureBlankConversation({
        focus: false,
      })
      if (!conversation) return
      conversationId = conversation.id
    }

    draft.value = ''

    const now = new Date().toISOString()
    appendMessage({
      id: `user_${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: now,
      status: 'success',
      cards: [],
      trace_items: [],
    })

    appendMessage({
      id: `assistant_${Date.now()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: now,
      status: 'loading',
      cards: [],
      trace_items: [],
    })

    syncConversationMeta(conversationId, {
      preview: content,
      updated_at: now,
      timestamp: dayjs(now).valueOf(),
      group: '今天',
      is_generating: true,
    })

    const streamHandle = await streamConversationMessage({
      conversation_id: conversationId,
      content,
      context_user_name: authStore.user?.username || '当前用户',
      context_org_name: authStore.user?.current_org?.name || '默认组织',
    })

    await processStream(conversationId, streamHandle)
  }

  const resolveToolDecision = async (
    toolKey: string,
    decision: Extract<AssistantToolDecisionRequest['decision'], 'confirm' | 'skip'>,
  ) => {
    if (!activeConversationId.value || !detailMessage.value || isStreaming.value) return

    decisionLoadingKey.value = toolKey
    updateLastAssistantMessage(activeConversationId.value, (message) => ({
      ...message,
      status: 'loading',
    }))

    const streamHandle = await submitToolDecision({
      conversation_id: activeConversationId.value,
      message_id: detailMessage.value.id,
      tool_key: toolKey,
      decision,
    })

    await processStream(activeConversationId.value, streamHandle)
  }

  return {
    shellMode,
    conversations,
    activeConversationId,
    activeConversation,
    activeMessages,
    detailCards,
    detailTraceItems,
    detailScope,
    awaitingConfirmationItem,
    sidebarWidth,
    lastExpandedSidebarWidth,
    sidebarCollapsed,
    launcherPosition,
    draft,
    loading,
    initialized,
    isStreaming,
    decisionLoadingKey,
    composerFocusToken,
    ensureInitialized,
    setShellMode,
    openFloating,
    expandFloating,
    collapseFloating,
    closeFloating,
    setSidebarWidth,
    collapseSidebar,
    restoreSidebar,
    setLauncherPosition,
    ensureBlankConversation,
    createNewConversation,
    setActiveConversation,
    deleteCurrentConversation,
    stopStreaming,
    sendMessage,
    resolveToolDecision,
  }
})

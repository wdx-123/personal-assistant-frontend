<script setup lang="ts">
import { Button } from 'ant-design-vue'
import dayjs from 'dayjs'
import { BubbleList, type BubbleListProps, Sender } from 'ant-design-x-vue'
import { computed, h, nextTick, ref, watch } from 'vue'
import AssistantMessageContent from './AssistantMessageContent.vue'
import AssistantUserMessageContent from './AssistantUserMessageContent.vue'
import { ASSISTANT_PROMPTS } from '@/constants/assistant'
import { useAssistantStore } from '@/stores'
import type { AssistantMessage, AssistantTraceAction } from '@/types'

interface Props {
  compact?: boolean
}

interface SenderExposed {
  focus: (options?: FocusOptions) => void
}

withDefaults(defineProps<Props>(), {
  compact: false,
})

const assistantStore = useAssistantStore()
const senderRef = ref<SenderExposed | null>(null)

type DecisionAction = Extract<AssistantTraceAction['action'], 'confirm' | 'skip'>

const isDecisionAction = (
  action: AssistantTraceAction,
): action is AssistantTraceAction & { action: DecisionAction } =>
  action.action === 'confirm' || action.action === 'skip'

const isEmptyConversation = computed(
  () => assistantStore.activeMessages.length === 0,
)
const promptItems = computed(() => ASSISTANT_PROMPTS.slice(0, 4))
const awaitingConfirmationItem = computed(
  () => assistantStore.awaitingConfirmationItem,
)
const confirmationActions = computed(() =>
  awaitingConfirmationItem.value?.actions?.filter(
    isDecisionAction,
  ) || [],
)
const bubbleItems = computed<NonNullable<BubbleListProps['items']>>(() =>
  assistantStore.activeMessages.map((item) => ({
    key: item.id,
    role: item.role,
    content: item,
    typing: false,
    messageRender: (content: AssistantMessage) => {
      if (item.role === 'assistant') {
        return h(AssistantMessageContent, {
          message: content,
        })
      }

      return h(AssistantUserMessageContent, {
        content: content.content || '',
      })
    },
    footer: item.error_text
      ? h('span', { class: 'assistant-chat__error-text' }, item.error_text)
      : undefined,
    header: h(
      'span',
      { class: 'assistant-chat__bubble-header' },
      `${item.role === 'user' ? '你' : '助手'} · ${dayjs(item.created_at).format('HH:mm')}`,
    ),
  })),
)

const bubbleRoles: NonNullable<BubbleListProps['roles']> = {
  assistant: {
    placement: 'start' as const,
    variant: 'outlined' as const,
    shape: 'round' as const,
  },
  user: {
    placement: 'end' as const,
    variant: 'filled' as const,
    shape: 'round' as const,
  },
}

const handleSubmit = async (message: string) => {
  await assistantStore.sendMessage(message)
}

const handlePromptClick = async (message: string) => {
  if (!message) return
  await assistantStore.sendMessage(message)
}

const handleDecision = async (action: DecisionAction) => {
  if (!awaitingConfirmationItem.value) return
  await assistantStore.resolveToolDecision(awaitingConfirmationItem.value.key, action)
}

watch(
  () => assistantStore.composerFocusToken,
  async () => {
    await nextTick()
    senderRef.value?.focus()
  },
)
</script>

<template>
  <section
    class="assistant-chat"
    :class="{
      'assistant-chat--compact': compact,
      'assistant-chat--empty': isEmptyConversation,
    }"
  >
    <template v-if="isEmptyConversation">
      <div class="assistant-chat__empty-shell">
        <div class="assistant-chat__empty-stage">
          <div class="assistant-chat__empty-copy">
            <h1 class="assistant-chat__empty-title">准备好了，随时开始</h1>
            <p class="assistant-chat__empty-description">
              输入任务、文档或问题，直接开始。
            </p>
          </div>

          <div class="assistant-chat__empty-composer">
            <Sender
              ref="senderRef"
              class="assistant-chat__sender assistant-chat__sender--empty"
              :value="assistantStore.draft"
              :loading="assistantStore.isStreaming"
              :send-disabled="!assistantStore.draft.trim()"
              :auto-size="{ minRows: 1, maxRows: compact ? 4 : 5 }"
              placeholder="输入任务、文档或问题"
              @change="(value: string) => (assistantStore.draft = value)"
              @submit="handleSubmit"
              @cancel="assistantStore.stopStreaming"
            />
          </div>

          <div class="assistant-chat__prompt-row">
            <button
              v-for="item in promptItems"
              :key="item.key"
              class="assistant-chat__prompt-item"
              type="button"
              :title="item.description"
              @click="handlePromptClick(item.label)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="assistant-chat__body">
        <div class="assistant-chat__content-column">
          <div class="assistant-chat__conversation-head">
            <span class="assistant-chat__conversation-label">当前会话</span>
            <strong class="assistant-chat__conversation-title">
              {{ assistantStore.activeConversation?.title || '新建会话' }}
            </strong>
          </div>

          <BubbleList
            :items="bubbleItems"
            :roles="bubbleRoles"
            auto-scroll
            class="assistant-chat__bubble-list"
          />
        </div>
      </div>

      <footer class="assistant-chat__footer">
        <div class="assistant-chat__composer">
          <div
            v-if="awaitingConfirmationItem"
            class="assistant-chat__decision-bar"
          >
            <div class="assistant-chat__decision-copy">
              <span class="assistant-chat__decision-eyebrow">待确认操作</span>
              <strong class="assistant-chat__decision-title">
                {{ awaitingConfirmationItem.confirmation_title || awaitingConfirmationItem.title }}
              </strong>
              <p class="assistant-chat__decision-description">
                {{ awaitingConfirmationItem.confirmation_description || awaitingConfirmationItem.description }}
              </p>
            </div>

            <div class="assistant-chat__decision-actions">
              <Button
                v-for="action in confirmationActions"
                :key="action.key"
                :type="action.style === 'primary' ? 'primary' : 'default'"
                :loading="assistantStore.decisionLoadingKey === awaitingConfirmationItem.key"
                size="middle"
                @click="handleDecision(action.action)"
              >
                {{ action.label }}
              </Button>
            </div>
          </div>

          <Sender
            ref="senderRef"
            class="assistant-chat__sender"
            :value="assistantStore.draft"
            :loading="assistantStore.isStreaming"
            :send-disabled="!assistantStore.draft.trim()"
            :auto-size="{ minRows: 1, maxRows: compact ? 4 : 5 }"
            placeholder="继续补充问题"
            @change="(value: string) => (assistantStore.draft = value)"
            @submit="handleSubmit"
            @cancel="assistantStore.stopStreaming"
          />
        </div>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.assistant-chat {
  display: grid;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  font-family: var(--assistant-font-family-sans);
  background: #ffffff;
}

.assistant-chat--empty {
  grid-template-rows: minmax(0, 1fr);
}

.assistant-chat:not(.assistant-chat--empty) {
  grid-template-rows: minmax(0, 1fr) auto;
}

.assistant-chat__empty-shell {
  display: grid;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 0 32px;
}

.assistant-chat__content-column {
  width: min(1040px, 100%);
  margin: 0 auto;
}

.assistant-chat__empty-stage {
  display: grid;
  height: 100%;
  min-height: 100%;
  align-content: center;
  justify-items: center;
  gap: 16px;
  width: min(1020px, 100%);
  margin: 0 auto;
  padding: 24px 18px 24px;
  transform: translateY(-28px);
}

.assistant-chat__empty-copy {
  display: grid;
  gap: 8px;
  justify-items: center;
  max-width: 640px;
  text-align: center;
}

.assistant-chat__empty-title {
  margin: 0;
  color: #0f172a;
  font-size: clamp(32px, 3.4vw, 44px);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: -0.025em;
}

.assistant-chat__empty-description {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

.assistant-chat__empty-composer {
  width: min(860px, 100%);
}

.assistant-chat__prompt-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  width: min(860px, 100%);
}

.assistant-chat__prompt-item {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 9px 13px;
  cursor: pointer;
  color: #334155;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  font-family: inherit;
  background: #ffffff;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.assistant-chat__prompt-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
}

.assistant-chat__body {
  min-height: 0;
  overflow: auto;
  padding: 18px 40px 10px;
}

.assistant-chat__content-column {
  display: grid;
  gap: 18px;
}

.assistant-chat__conversation-head {
  display: grid;
  gap: 4px;
  padding-top: 8px;
}

.assistant-chat__conversation-label {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.04em;
}

.assistant-chat__conversation-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.assistant-chat__bubble-list {
  width: 100%;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble) {
  width: 100%;
  max-width: 100%;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-avatar) {
  display: none !important;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-start .ant-x-vue-bubble-content) {
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-end .ant-x-vue-bubble-content) {
  border: 0;
  border-radius: 20px;
  background: #f3f4f6;
  box-shadow: none;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-list) {
  display: grid;
  gap: 14px;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-content-wrapper) {
  min-width: 0;
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-start .ant-x-vue-bubble-content-wrapper) {
  width: fit-content;
  max-width: min(920px, calc(100% - 16px));
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-start .ant-x-vue-bubble-content) {
  max-width: min(920px, calc(100% - 16px));
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-end .ant-x-vue-bubble-content-wrapper) {
  width: fit-content;
  max-width: min(720px, calc(100% - 16px));
}

.assistant-chat__bubble-list:deep(.ant-x-vue-bubble-end .ant-x-vue-bubble-content) {
  max-width: min(720px, calc(100% - 16px));
}

.assistant-chat__footer {
  padding: 12px 40px 24px;
  background: #ffffff;
}

.assistant-chat__composer {
  width: min(1040px, 100%);
  margin: 0 auto;
}

.assistant-chat__decision-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  box-shadow: none;
}

.assistant-chat__decision-copy {
  display: grid;
  gap: 4px;
}

.assistant-chat__decision-eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.assistant-chat__decision-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.assistant-chat__decision-description {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

.assistant-chat__decision-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}

.assistant-chat__sender {
  border: 1px solid #cbd5e1;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.assistant-chat__sender--empty {
  border-radius: 30px;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-content) {
  align-items: flex-end;
  gap: 10px;
  padding: 13px 15px 13px 20px;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-input) {
  min-height: 0;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-input textarea) {
  min-height: 30px !important;
  max-height: 160px;
  padding: 11px 0;
  color: #0f172a;
  font-size: var(--assistant-type-input-size);
  font-weight: var(--assistant-type-input-weight);
  line-height: var(--assistant-type-input-line-height);
  letter-spacing: -0.005em;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-input textarea::placeholder) {
  color: #94a3b8;
  font-weight: var(--assistant-type-input-weight);
}

.assistant-chat__sender:deep(.ant-x-vue-sender-actions-list) {
  padding-bottom: 0;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-actions-btn.ant-btn) {
  width: 42px;
  min-width: 42px;
  height: 42px;
  border: 0;
  box-shadow: none;
}

.assistant-chat__sender:deep(.ant-x-vue-sender-actions-btn.ant-btn-primary) {
  background: #0f172a;
}

.assistant-chat__bubble-header {
  font-size: 12px;
  line-height: 1.4;
  color: #94a3b8;
}

.assistant-chat__error-text {
  color: #dc2626;
}

.assistant-chat--compact .assistant-chat__empty-shell {
  padding: 0 14px;
}

.assistant-chat--compact .assistant-chat__empty-stage {
  gap: 16px;
  padding: 12px 8px 18px;
  transform: translateY(-14px);
}

.assistant-chat--compact .assistant-chat__empty-title {
  font-size: clamp(24px, 5vw, 32px);
}

.assistant-chat--compact .assistant-chat__empty-description {
  font-size: 14px;
}

.assistant-chat--compact .assistant-chat__prompt-row {
  gap: 8px;
}

.assistant-chat--compact .assistant-chat__prompt-item {
  padding: 9px 12px;
}

@media (min-width: 1280px) {
  .assistant-chat__body,
  .assistant-chat__footer {
    padding-left: 46px;
    padding-right: 46px;
  }
}

@media (max-width: 960px) {
  .assistant-chat__empty-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .assistant-chat__decision-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .assistant-chat__body,
  .assistant-chat__footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .assistant-chat__composer,
  .assistant-chat__content-column,
  .assistant-chat__empty-stage,
  .assistant-chat__empty-composer {
    width: min(100%, calc(100% - 4px));
  }

  .assistant-chat__empty-stage {
    transform: translateY(-14px);
  }

  .assistant-chat__sender:deep(.ant-x-vue-sender-content) {
    padding: 10px 12px 10px 14px;
  }
}

@media (max-width: 640px) {
  .assistant-chat__empty-shell {
    padding: 0 14px;
  }

  .assistant-chat__empty-stage {
    padding: 8px 0 14px;
    transform: none;
  }

  .assistant-chat__empty-title {
    font-size: 28px;
  }

  .assistant-chat__prompt-row {
    justify-content: flex-start;
  }

  .assistant-chat__prompt-item {
    width: fit-content;
    padding: 9px 12px;
  }

  .assistant-chat__body,
  .assistant-chat__footer {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>

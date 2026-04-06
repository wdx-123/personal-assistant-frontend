<script setup lang="ts">
import { EditOutlined } from '@ant-design/icons-vue'
import type { ConversationsProps } from 'ant-design-x-vue'
import { Conversations } from 'ant-design-x-vue'
import type { MenuProps } from 'ant-design-vue'
import { computed, h } from 'vue'
import AssistantConversationLabel from './AssistantConversationLabel.vue'
import { useAssistantStore } from '@/stores'

interface Props {
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
})

const emit = defineEmits<{
  (event: 'conversation-select', conversationId: string): void
  (event: 'conversation-created', conversationId: string): void
}>()

const assistantStore = useAssistantStore()

const conversationItems = computed<NonNullable<ConversationsProps['items']>>(() =>
  assistantStore.conversations.map((item) => ({
    key: item.id,
    group: item.group,
    timestamp: item.timestamp,
    label: h(AssistantConversationLabel, {
      title: item.title,
    }),
  })),
)

const menuConfig = (conversationId: string): MenuProps => ({
  items: [
    {
      key: 'delete',
      label: '删除会话',
      danger: true,
    },
  ],
  onClick: async ({ key }) => {
    if (key !== 'delete') return
    await assistantStore.deleteCurrentConversation(conversationId)
  },
})

const handleCreateConversation = async () => {
  const conversation = await assistantStore.ensureBlankConversation()
  if (conversation?.id) {
    emit('conversation-created', conversation.id)
  }
}

const handleConversationChange = async (conversationId: string) => {
  await assistantStore.setActiveConversation(conversationId)
  emit('conversation-select', conversationId)
}
</script>

<template>
  <section class="assistant-conversations" :class="{ compact }">
    <header class="assistant-conversations__header">
      <button class="assistant-conversations__create" type="button" @click="handleCreateConversation">
        <EditOutlined class="assistant-conversations__create-icon" />
        <span>新建会话</span>
      </button>
    </header>

    <div class="assistant-conversations__body">
      <span class="assistant-conversations__section-title">最近会话</span>
      <Conversations
        :items="conversationItems"
        :active-key="assistantStore.activeConversationId"
        :menu="(conversation) => menuConfig(String(conversation.key))"
        groupable
        @active-change="handleConversationChange"
      />
    </div>
  </section>
</template>

<style scoped>
.assistant-conversations {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--assistant-font-family-sans);
  background: transparent;
}

.assistant-conversations.compact {
  background: #ffffff;
}

.assistant-conversations__header {
  padding: 16px 12px 8px;
}

.assistant-conversations__create {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 1px solid #e7ebf0;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.assistant-conversations__create:hover {
  border-color: #d7dee6;
  color: #0f172a;
  background: #f7f9fb;
}

.assistant-conversations__create-icon {
  font-size: var(--assistant-type-sidebar-item-size);
  color: currentColor;
}

.assistant-conversations__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 8px 14px 10px;
}

.assistant-conversations__section-title {
  display: block;
  margin: 0 8px 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.04em;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-item) {
  margin-right: 0;
  margin-bottom: 2px;
  border-radius: 14px;
  padding: 10px 14px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-item:hover) {
  background: #f4f6f8;
  color: #0f172a;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-item.ant-x-vue-conversations-item-active) {
  background: #eceff3;
  color: #0f172a;
  font-weight: 600;
  box-shadow: none;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-item-label) {
  width: 100%;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-item-menu) {
  color: #a3afbf;
}

.assistant-conversations__body:deep(.ant-x-vue-conversations-group-title) {
  display: none;
}

@media (max-width: 900px) {
  .assistant-conversations {
    border-right: 0;
  }

  .assistant-conversations__header {
    padding-right: 12px;
    padding-left: 12px;
  }

  .assistant-conversations__body {
    padding-right: 10px;
    padding-left: 10px;
  }
}
</style>

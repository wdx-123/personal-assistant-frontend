<script setup lang="ts">
import { EditOutlined, MenuOutlined } from '@ant-design/icons-vue'
import { Drawer } from 'ant-design-vue'
import { XProvider } from 'ant-design-x-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AssistantChatPanel,
  AssistantConversationList,
} from '@/components/business/Assistant'
import { useAssistantStore } from '@/stores'

const assistantStore = useAssistantStore()
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const mobileDrawerOpen = ref(false)

const xTheme = {
  token: {
    colorPrimary: '#2563eb',
    borderRadius: 12,
  },
}

const initializeWorkbench = async () => {
  await assistantStore.ensureInitialized()
  await assistantStore.ensureBlankConversation({
    focus: false,
  })
}

onMounted(() => {
  void initializeWorkbench()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize)
    handleWindowResize()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResize)
  }
})

const isDesktopWorkbench = computed(() => viewportWidth.value > 900)
const isBlankConversation = computed(() => assistantStore.activeMessages.length === 0)

const handleWindowResize = () => {
  viewportWidth.value = window.innerWidth
}

const openMobileDrawer = () => {
  mobileDrawerOpen.value = true
}

const closeMobileDrawer = () => {
  mobileDrawerOpen.value = false
}

const handleCreateConversation = async () => {
  await assistantStore.ensureBlankConversation()
  closeMobileDrawer()
}

const handleConversationSelect = () => {
  closeMobileDrawer()
}

watch(isDesktopWorkbench, (isDesktop) => {
  if (isDesktop) {
    closeMobileDrawer()
  }
})
</script>

<template>
  <XProvider :theme="xTheme">
    <section
      class="assistant-workbench"
      :class="{
        'assistant-workbench--mobile': !isDesktopWorkbench,
        'assistant-workbench--blank': isBlankConversation,
      }"
    >
      <header v-if="!isDesktopWorkbench" class="assistant-workbench__mobile-bar">
        <button class="assistant-workbench__mobile-action" type="button" @click="openMobileDrawer">
          <MenuOutlined />
          <span>会话</span>
        </button>

        <strong class="assistant-workbench__mobile-title">助手</strong>

        <button class="assistant-workbench__mobile-action" type="button" @click="handleCreateConversation">
          <EditOutlined />
          <span>新建</span>
        </button>
      </header>

      <div
        class="assistant-workbench__layout"
        :class="{ 'assistant-workbench__layout--blank': isBlankConversation }"
      >
        <aside v-if="isDesktopWorkbench" class="assistant-workbench__rail">
          <AssistantConversationList
            @conversation-select="handleConversationSelect"
            @conversation-created="handleConversationSelect"
          />
        </aside>

        <main
          class="assistant-workbench__stage"
          :class="{ 'assistant-workbench__stage--blank': isBlankConversation }"
        >
          <AssistantChatPanel />
        </main>
      </div>

      <Drawer
        v-model:open="mobileDrawerOpen"
        class="assistant-workbench__drawer"
        placement="left"
        :width="300"
        title="会话记录"
        :body-style="{ padding: '0' }"
      >
        <AssistantConversationList
          @conversation-select="handleConversationSelect"
          @conversation-created="handleConversationSelect"
        />
      </Drawer>
    </section>
  </XProvider>
</template>

<style scoped>
.assistant-workbench {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
  font-family: var(--assistant-font-family-sans);
  background: #ffffff;
  overflow: hidden;
}

.assistant-workbench--mobile {
  grid-template-rows: auto minmax(0, 1fr);
}

.assistant-workbench__mobile-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #edf1f5;
  background: #ffffff;
}

.assistant-workbench__mobile-action {
  display: inline-flex;
  min-width: 92px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 9px 12px;
  cursor: pointer;
  color: #334155;
  font-size: var(--assistant-type-sidebar-item-size);
  font-weight: var(--assistant-type-chip-weight);
  line-height: var(--assistant-type-sidebar-item-line-height);
  font-family: inherit;
  background: #ffffff;
}

.assistant-workbench__mobile-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.assistant-workbench__layout {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: 264px minmax(0, 1fr);
  align-items: stretch;
}

.assistant-workbench__layout--blank {
  min-height: 100%;
}

.assistant-workbench__rail,
.assistant-workbench__stage {
  min-height: 0;
}

.assistant-workbench__rail {
  overflow: hidden;
  border-right: 1px solid #edf1f5;
  background: #fafafa;
}

.assistant-workbench__stage {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.assistant-workbench__stage--blank {
  display: flex;
}

.assistant-workbench__stage--blank :deep(.assistant-chat) {
  flex: 1;
}

.assistant-workbench__drawer:deep(.ant-drawer-body) {
  padding: 0;
  background: #ffffff;
}

.assistant-workbench__drawer:deep(.ant-drawer-title) {
  font-family: var(--assistant-font-family-sans);
  font-size: var(--assistant-type-sidebar-title-size);
  font-weight: var(--assistant-type-sidebar-title-weight);
  line-height: var(--assistant-type-sidebar-title-line-height);
}

@media (max-width: 1080px) {
  .assistant-workbench__layout {
    grid-template-columns: 244px minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .assistant-workbench__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .assistant-workbench__mobile-bar {
    padding-left: 10px;
    padding-right: 10px;
  }

  .assistant-workbench__mobile-action {
    min-width: 80px;
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>

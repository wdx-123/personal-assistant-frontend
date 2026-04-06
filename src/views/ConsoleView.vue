<script setup lang="ts">
import { Layout } from 'ant-design-vue'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ASSISTANT_ROUTE_PATH } from '@/constants/assistant'

const LayoutHeader = Layout.Header
const LayoutContent = Layout.Content

const HeaderBar = defineAsyncComponent(() => import('@/components/layout/HeaderBar.vue'))
const ConsoleSidebar = defineAsyncComponent(() => import('@/components/layout/ConsoleSidebar.vue'))
const AssistantShell = defineAsyncComponent(() => import('@/components/layout/AssistantShell.vue'))

const route = useRoute()
const isAssistantWorkbench = computed(() => route.path.startsWith(ASSISTANT_ROUTE_PATH))
const isTeamMembersCompact = computed(() => route.path.startsWith('/console/team/members'))
const isManagementCanvas = computed(() =>
  route.path.startsWith('/console/permission')
  || route.path.startsWith('/console/workbench/task')
  || route.path.startsWith('/console/team/members'),
)
const isSiderBroken = ref(false)
const desktopCollapsed = ref(false)
const mobileCollapsed = ref(true)

const siderCollapsed = computed(() =>
  isSiderBroken.value ? mobileCollapsed.value : desktopCollapsed.value,
)

const setSiderCollapsed = (nextCollapsed: boolean) => {
  if (isSiderBroken.value) {
    mobileCollapsed.value = nextCollapsed
    return
  }

  desktopCollapsed.value = nextCollapsed
}

const toggleSider = () => {
  setSiderCollapsed(!siderCollapsed.value)
}

const closeMobileSider = () => {
  if (!isSiderBroken.value) return
  mobileCollapsed.value = true
}

const handleSiderBreakpoint = (broken: boolean) => {
  isSiderBroken.value = broken

  if (broken) {
    mobileCollapsed.value = true
  }
}

watch(
  () => route.path,
  () => {
    if (isSiderBroken.value) {
      mobileCollapsed.value = true
    }
  },
)
</script>

<template>
  <Layout class="console-layout" has-sider>
    <ConsoleSidebar
      :collapsed="siderCollapsed"
      :broken="isSiderBroken"
      @breakpoint="handleSiderBreakpoint"
    />

    <div
      v-if="isSiderBroken && !siderCollapsed"
      class="console-layout__mask"
      @click="closeMobileSider"
    />

    <Layout class="console-layout__main">
      <LayoutHeader class="console-layout__header">
        <HeaderBar
          :collapsed="siderCollapsed"
          :is-broken="isSiderBroken"
          @toggle-sider="toggleSider"
        />
      </LayoutHeader>

      <LayoutContent class="console-layout__content">
        <div
          class="content-container"
          :class="{
            'content-container--assistant': isAssistantWorkbench,
            'content-container--surface': isManagementCanvas,
            'content-container--team-members': isTeamMembersCompact,
          }"
        >
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </LayoutContent>
    </Layout>

    <AssistantShell />
  </Layout>
</template>

<style scoped>
.console-layout {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #f3f6fb;
}

.console-layout__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f3f6fb;
}

.console-layout__header {
  padding: 0;
  height: 64px;
  line-height: normal;
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
  z-index: 95;
}

.console-layout__content {
  min-height: 0;
  background: #f3f6fb;
}

.console-layout__mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.36);
  z-index: 94;
}

.content-container {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.26) transparent;
  scrollbar-gutter: stable;
}

.content-container--surface {
  min-height: 100%;
  background: #ffffff;
}

.content-container--team-members {
  padding-top: 16px;
  padding-bottom: 16px;
}

.content-container::-webkit-scrollbar {
  width: 4px;
}

.content-container::-webkit-scrollbar-track {
  background: transparent;
}

.content-container::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.18);
  border-radius: 999px;
}

.content-container:hover::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
}

.content-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.4);
}

.content-container--assistant {
  max-width: none;
  min-height: 100%;
  padding: 0;
  background: #ffffff;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 991px) {
  .content-container {
    padding: 18px 16px;
  }

  .content-container--assistant {
    padding: 0;
  }

  .content-container--team-members {
    padding-top: 14px;
    padding-bottom: 14px;
  }
}
</style>

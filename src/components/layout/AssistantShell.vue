<script setup lang="ts">
import { XProvider } from 'ant-design-x-vue'
import type { CSSProperties } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AssistantChatPanel } from '@/components/business/Assistant'
import {
  ASSISTANT_ROUTE_PATH,
  ASSISTANT_SHELL_EDGE_MARGIN,
  ASSISTANT_SHELL_LAUNCHER_SIZE,
  ASSISTANT_SHELL_PANEL_HEIGHT,
  ASSISTANT_SHELL_PANEL_OFFSET,
  ASSISTANT_SHELL_PANEL_WIDTH,
} from '@/constants/assistant'
import { useAssistantStore } from '@/stores'
import type { AssistantLauncherPosition } from '@/types'

const router = useRouter()
const route = useRoute()
const assistantStore = useAssistantStore()
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const viewportHeight = ref(typeof window === 'undefined' ? 900 : window.innerHeight)
const dragLauncherPosition = ref<AssistantLauncherPosition | null>(null)
const launcherPointerId = ref<number | null>(null)
const suppressLauncherClick = ref(false)
const launcherDragState = ref<{
  offsetX: number
  offsetY: number
  originX: number
  originY: number
  moved: boolean
} | null>(null)

const isOpen = computed(() => assistantStore.shellMode !== 'launcher')
const isWorkbenchRoute = computed(() =>
  route.path.startsWith(ASSISTANT_ROUTE_PATH),
)
const shouldShowLauncher = computed(() =>
  !isOpen.value && !isWorkbenchRoute.value,
)
const shouldShowPanel = computed(() =>
  isOpen.value && !isWorkbenchRoute.value,
)

const xTheme = {
  token: {
    colorPrimary: '#2563eb',
    borderRadius: 12,
  },
}

const getDefaultLauncherPosition = (): AssistantLauncherPosition => ({
  x:
    viewportWidth.value
    - ASSISTANT_SHELL_LAUNCHER_SIZE
    - ASSISTANT_SHELL_EDGE_MARGIN,
  y:
    viewportHeight.value
    - ASSISTANT_SHELL_LAUNCHER_SIZE
    - ASSISTANT_SHELL_EDGE_MARGIN,
})

const clampLauncherPosition = (
  position: AssistantLauncherPosition,
): AssistantLauncherPosition => ({
  x: Math.min(
    Math.max(ASSISTANT_SHELL_EDGE_MARGIN, position.x),
    viewportWidth.value
      - ASSISTANT_SHELL_LAUNCHER_SIZE
      - ASSISTANT_SHELL_EDGE_MARGIN,
  ),
  y: Math.min(
    Math.max(ASSISTANT_SHELL_EDGE_MARGIN, position.y),
    viewportHeight.value
      - ASSISTANT_SHELL_LAUNCHER_SIZE
      - ASSISTANT_SHELL_EDGE_MARGIN,
  ),
})

const launcherPosition = computed(() =>
  clampLauncherPosition(
    dragLauncherPosition.value
    || assistantStore.launcherPosition
    || getDefaultLauncherPosition(),
  ),
)

const launcherStyle = computed<CSSProperties>(() => ({
  left: `${launcherPosition.value.x}px`,
  top: `${launcherPosition.value.y}px`,
}))

const panelStyle = computed<CSSProperties>(() => {
  const width = Math.min(
    ASSISTANT_SHELL_PANEL_WIDTH,
    viewportWidth.value - ASSISTANT_SHELL_EDGE_MARGIN * 2,
  )
  const height = Math.min(
    ASSISTANT_SHELL_PANEL_HEIGHT,
    viewportHeight.value - ASSISTANT_SHELL_EDGE_MARGIN * 2,
  )

  let left =
    launcherPosition.value.x + ASSISTANT_SHELL_LAUNCHER_SIZE - width
  let top =
    launcherPosition.value.y - height - ASSISTANT_SHELL_PANEL_OFFSET

  if (left < ASSISTANT_SHELL_EDGE_MARGIN) {
    left = Math.min(
      launcherPosition.value.x,
      viewportWidth.value - width - ASSISTANT_SHELL_EDGE_MARGIN,
    )
  }

  if (top < ASSISTANT_SHELL_EDGE_MARGIN) {
    top = launcherPosition.value.y
      + ASSISTANT_SHELL_LAUNCHER_SIZE
      + ASSISTANT_SHELL_PANEL_OFFSET
  }

  left = Math.min(
    Math.max(ASSISTANT_SHELL_EDGE_MARGIN, left),
    viewportWidth.value - width - ASSISTANT_SHELL_EDGE_MARGIN,
  )
  top = Math.min(
    Math.max(ASSISTANT_SHELL_EDGE_MARGIN, top),
    viewportHeight.value - height - ASSISTANT_SHELL_EDGE_MARGIN,
  )

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})

const handleViewportResize = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  assistantStore.setLauncherPosition(launcherPosition.value)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('resize', handleViewportResize)
  handleViewportResize()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', handleViewportResize)
  window.removeEventListener('pointermove', handleLauncherPointerMove)
  window.removeEventListener('pointerup', stopLauncherDrag)
  window.removeEventListener('pointercancel', stopLauncherDrag)
})

const openFloatingShell = async () => {
  await assistantStore.openFloating()
}

const handleLauncherClick = async () => {
  if (suppressLauncherClick.value) {
    suppressLauncherClick.value = false
    return
  }

  await openFloatingShell()
}

const openWorkbench = async () => {
  await assistantStore.ensureInitialized()
  assistantStore.setShellMode('floating')
  await router.push(ASSISTANT_ROUTE_PATH)
}

const createConversation = async () => {
  await assistantStore.ensureBlankConversation()
}

const startLauncherDrag = (event: PointerEvent) => {
  launcherPointerId.value = event.pointerId
  launcherDragState.value = {
    offsetX: event.clientX - launcherPosition.value.x,
    offsetY: event.clientY - launcherPosition.value.y,
    originX: event.clientX,
    originY: event.clientY,
    moved: false,
  }

  window.addEventListener('pointermove', handleLauncherPointerMove)
  window.addEventListener('pointerup', stopLauncherDrag)
  window.addEventListener('pointercancel', stopLauncherDrag)
}

const handleLauncherPointerMove = (event: PointerEvent) => {
  if (!launcherDragState.value || launcherPointerId.value !== event.pointerId) {
    return
  }

  const nextPosition = clampLauncherPosition({
    x: event.clientX - launcherDragState.value.offsetX,
    y: event.clientY - launcherDragState.value.offsetY,
  })

  dragLauncherPosition.value = nextPosition

  if (
    Math.abs(event.clientX - launcherDragState.value.originX) > 4
    || Math.abs(event.clientY - launcherDragState.value.originY) > 4
  ) {
    launcherDragState.value.moved = true
  }
}

const stopLauncherDrag = (event: PointerEvent) => {
  if (launcherPointerId.value !== event.pointerId) return

  const nextPosition = clampLauncherPosition(
    dragLauncherPosition.value || launcherPosition.value,
  )
  assistantStore.setLauncherPosition(nextPosition)
  suppressLauncherClick.value = Boolean(launcherDragState.value?.moved)
  dragLauncherPosition.value = null
  launcherPointerId.value = null
  launcherDragState.value = null

  window.removeEventListener('pointermove', handleLauncherPointerMove)
  window.removeEventListener('pointerup', stopLauncherDrag)
  window.removeEventListener('pointercancel', stopLauncherDrag)
}
</script>

<template>
  <XProvider :theme="xTheme">
    <div class="assistant-shell">
      <transition name="assistant-shell-launcher">
        <button
          v-if="shouldShowLauncher"
          class="assistant-shell__launcher"
          :style="launcherStyle"
          type="button"
          aria-label="打开 AI 助手"
          @pointerdown.prevent="startLauncherDrag"
          @click="handleLauncherClick"
        >
          <span class="assistant-shell__launcher-badge">AI</span>
          <span class="assistant-shell__launcher-core" aria-hidden="true" />
        </button>
      </transition>

      <transition name="assistant-shell-panel">
        <section v-if="shouldShowPanel" class="assistant-shell__panel" :style="panelStyle">
          <header class="assistant-shell__header">
            <div class="assistant-shell__title-wrap">
              <span class="assistant-shell__eyebrow">快速助手</span>
              <strong class="assistant-shell__title">
                {{ assistantStore.activeConversation?.title || '新建会话' }}
              </strong>
            </div>

            <div class="assistant-shell__actions">
              <button class="assistant-shell__action" type="button" @click="createConversation">
                新建
              </button>
              <button class="assistant-shell__action" type="button" @click="openWorkbench">
                工作台
              </button>
              <button class="assistant-shell__action" type="button" @click="assistantStore.closeFloating">
                关闭
              </button>
            </div>
          </header>

          <div class="assistant-shell__content">
            <AssistantChatPanel compact />
          </div>
        </section>
      </transition>
    </div>
  </XProvider>
</template>

<style scoped>
.assistant-shell {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2200;
  font-family: var(--assistant-font-family-sans);
}

.assistant-shell__launcher {
  position: fixed;
  display: inline-grid;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background: transparent;
  box-shadow: none;
  pointer-events: auto;
  touch-action: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.assistant-shell__launcher:hover {
  transform: translateY(-1px);
}

.assistant-shell__launcher-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 18px;
  padding: 0 7px;
  border: 1px solid #dbe4ee;
  border-radius: 999px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.08em;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

.assistant-shell__launcher-core {
  display: block;
  width: 48px;
  height: 48px;
  border: 1px solid #dbe4ee;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.assistant-shell__launcher:hover .assistant-shell__launcher-core {
  border-color: #cbd5e1;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
}

.assistant-shell__panel {
  position: fixed;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: min(640px, calc(100vh - 32px));
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  pointer-events: auto;
}

.assistant-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.assistant-shell__title-wrap {
  display: grid;
  gap: 4px;
}

.assistant-shell__eyebrow {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: #64748b;
}

.assistant-shell__title {
  color: #0f172a;
  font-size: var(--assistant-type-sidebar-title-size);
  font-weight: var(--assistant-type-sidebar-title-weight);
  line-height: var(--assistant-type-sidebar-title-line-height);
}

.assistant-shell__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-shell__action {
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: var(--assistant-type-sidebar-item-size);
  font-weight: var(--assistant-type-chip-weight);
  line-height: var(--assistant-type-sidebar-item-line-height);
  font-family: inherit;
  color: #334155;
  background: #ffffff;
}

.assistant-shell__content {
  min-height: 0;
  padding: 0;
}

.assistant-shell-launcher-enter-active,
.assistant-shell-launcher-leave-active,
.assistant-shell-panel-enter-active,
.assistant-shell-panel-leave-active {
  transition: all 0.24s ease;
}

.assistant-shell-launcher-enter-from,
.assistant-shell-launcher-leave-to,
.assistant-shell-panel-enter-from,
.assistant-shell-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 640px) {
  .assistant-shell__panel {
    min-height: 0;
  }

  .assistant-shell__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .assistant-shell__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>

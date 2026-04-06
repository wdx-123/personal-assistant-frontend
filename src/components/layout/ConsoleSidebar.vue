<template>
  <LayoutSider
    class="console-sider"
    :class="{
      'console-sider--collapsed': collapsed && !broken,
      'console-sider--broken': broken,
      'console-sider--open': broken && !collapsed,
    }"
    theme="dark"
    :width="SIDER_WIDTH"
    :collapsed-width="collapsedWidth"
    :collapsed="collapsed"
    :trigger="null"
    collapsible
    breakpoint="lg"
    @breakpoint="handleBreakpoint"
  >
    <div class="console-sider__brand" @click="navigateTo('/console/dashboard')">
      <div class="console-sider__brand-icon">
        <img :src="projectIcon" alt="项目图标" />
      </div>
      <div class="console-sider__brand-copy">
        <span class="console-sider__brand-title">个人助手</span>
        <span class="console-sider__brand-subtitle">控制台</span>
      </div>
    </div>

    <div class="console-sider__menu-shell">
      <Menu
        mode="inline"
        theme="dark"
        :items="menuItems"
        :selected-keys="selectedKeys"
        :open-keys="effectiveOpenKeys"
        :inline-collapsed="collapsed && !broken"
        @openChange="handleOpenChange"
        @click="handleMenuClick"
      />
    </div>
  </LayoutSider>
</template>

<script setup lang="ts">
import * as AntdIcons from '@ant-design/icons-vue'
import { Layout, Menu } from 'ant-design-vue'
import type { ItemType } from 'ant-design-vue'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import projectIcon from '@/assets/branding/project-icon.svg'

const LayoutSider = Layout.Sider

const SIDER_WIDTH = 248
const DESKTOP_COLLAPSED_WIDTH = 80
type MenuKey = string | number

const props = defineProps<{
  collapsed: boolean
  broken: boolean
}>()

const emit = defineEmits<{
  breakpoint: [broken: boolean]
}>()

type MenuRouteRecord = RouteRecordRaw & {
  children?: MenuRouteRecord[]
}

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const openKeys = ref<MenuKey[]>([])

const collapsedWidth = computed(() => (props.broken ? 0 : DESKTOP_COLLAPSED_WIDTH))

const getFallbackIcon = (name: string) => {
  if (name.includes('Dashboard')) return AntdIcons.DashboardOutlined
  if (name.includes('Workbench')) return AntdIcons.AppstoreOutlined
  if (name.includes('Permission')) return AntdIcons.SafetyCertificateOutlined
  if (name.includes('Team')) return AntdIcons.TeamOutlined
  if (name.includes('Settings')) return AntdIcons.SettingOutlined
  return AntdIcons.AppstoreOutlined
}

const getIconComponent = (menu: MenuRouteRecord): Component => {
  const iconName = String(menu.meta?.icon || '').trim()
  const matchedIcon = iconName
    ? AntdIcons[iconName as keyof typeof AntdIcons]
    : null

  if (matchedIcon) return matchedIcon as Component
  return getFallbackIcon(String(menu.name || ''))
}

const withConsolePath = (basePath: string, nextPath: string) => {
  if (nextPath.startsWith('/')) return nextPath
  return `${basePath}/${nextPath}`.replace(/\/+/g, '/')
}

const menuState = computed(() => {
  const routeToAncestorKeys: Record<string, string[]> = {}
  const routeToSelectedKey: Record<string, string> = {}

  const buildMenuItems = (
    records: MenuRouteRecord[],
    basePath: string,
    parentKeys: string[] = [],
    nearestVisibleKey?: string,
  ): ItemType[] => {
    return records.flatMap((record) => {
      const fullPath = withConsolePath(basePath, record.path)
      const title = String(record.meta?.title || '').trim()
      const hidden = Boolean(record.meta?.hideInMenu)
      const nextNearestVisibleKey = hidden ? nearestVisibleKey : fullPath
      const visibleChildren = buildMenuItems(
        Array.isArray(record.children) ? record.children : [],
        fullPath,
        hidden ? parentKeys : [...parentKeys, fullPath],
        nextNearestVisibleKey,
      )

      routeToAncestorKeys[fullPath] = parentKeys
      routeToSelectedKey[fullPath] = nearestVisibleKey || parentKeys[parentKeys.length - 1] || fullPath

      if (hidden) {
        return visibleChildren
      }

      const menuItem: ItemType = {
        key: fullPath,
        icon: h(getIconComponent(record)),
        label: title || String(record.name || fullPath),
      }

      routeToSelectedKey[fullPath] = fullPath

      if (visibleChildren.length > 0) {
        return [
          {
            ...menuItem,
            children: visibleChildren,
          },
        ]
      }

      if (record.component) {
        return [menuItem]
      }

      return []
    })
  }

  const consoleRoute = permissionStore.dynamicRoutes.find(
    (record) => record.path === '/console' || record.name === 'Console',
  ) as MenuRouteRecord | undefined

  const items = buildMenuItems(
    Array.isArray(consoleRoute?.children) ? consoleRoute.children : [],
    '/console',
  )

  return {
    items,
    routeToAncestorKeys,
    routeToSelectedKey,
  }
})

const menuItems = computed(() => menuState.value.items)

const selectedKeys = computed(() => {
  const selectedKey =
    menuState.value.routeToSelectedKey[route.path] ||
    menuState.value.routeToSelectedKey[route.matched[route.matched.length - 1]?.path || '']

  return selectedKey ? [selectedKey] : []
})

const currentRouteAncestorKeys = computed(
  () => menuState.value.routeToAncestorKeys[route.path] || [],
)

const effectiveOpenKeys = computed(() => (props.collapsed ? [] : openKeys.value))

watch(
  currentRouteAncestorKeys,
  (keys) => {
    if (!keys.length) return
    openKeys.value = Array.from(new Set([...openKeys.value, ...keys]))
  },
  { immediate: true },
)

const handleOpenChange = (keys: MenuKey[]) => {
  openKeys.value = keys
}

const navigateTo = (path: string) => {
  if (route.path === path) return
  void router.push(path)
}

const handleMenuClick = ({ key }: { key: MenuKey }) => {
  navigateTo(String(key))
}

const handleBreakpoint = (broken: boolean) => {
  emit('breakpoint', broken)
}
</script>

<style scoped>
.console-sider {
  z-index: 110;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04), 6px 0 24px rgba(15, 23, 42, 0.18);
}

.console-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.console-sider__brand {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.console-sider__brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.console-sider__brand-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.console-sider__brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.console-sider__brand-title {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.1;
}

.console-sider__brand-subtitle {
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
  line-height: 1.1;
}

.console-sider__menu-shell {
  flex: 1;
  min-height: 0;
  padding: 14px 10px 18px;
  overflow-y: auto;
}

.console-sider__menu-shell :deep(.ant-menu) {
  background: transparent;
  border-inline-end: none;
}

.console-sider__menu-shell :deep(.ant-menu-item),
.console-sider__menu-shell :deep(.ant-menu-submenu-title) {
  border-radius: 10px;
  margin-inline: 0;
  width: 100%;
}

.console-sider__menu-shell :deep(.ant-menu-inline-collapsed > .ant-menu-item),
.console-sider__menu-shell :deep(.ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title) {
  padding-inline: calc(50% - 16px);
}

.console-sider__menu-shell :deep(.ant-menu-dark .ant-menu-item-selected) {
  background: linear-gradient(90deg, #1677ff 0%, #3b82f6 100%);
  box-shadow: 0 8px 18px rgba(22, 119, 255, 0.24);
}

.console-sider__menu-shell :deep(.ant-menu-dark .ant-menu-sub.ant-menu-inline) {
  background: rgba(2, 12, 27, 0.32);
  border-radius: 12px;
  margin-top: 6px;
  margin-bottom: 8px;
}

.console-sider__menu-shell :deep(.ant-menu-dark .ant-menu-item:hover),
.console-sider__menu-shell :deep(.ant-menu-dark .ant-menu-submenu-title:hover) {
  background: rgba(255, 255, 255, 0.08);
}

.console-sider__menu-shell :deep(.ant-menu-dark.ant-menu-inline .ant-menu-sub.ant-menu-inline .ant-menu-item) {
  margin-inline: 8px;
  width: calc(100% - 16px);
}

.console-sider--collapsed .console-sider__brand {
  padding-inline: 20px;
}

.console-sider--collapsed .console-sider__brand-copy {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.console-sider--broken {
  position: fixed !important;
  inset: 0 auto 0 0;
  height: 100vh;
  box-shadow: none;
}

.console-sider--open {
  box-shadow: 12px 0 32px rgba(15, 23, 42, 0.28);
}

@media (max-width: 991px) {
  .console-sider__menu-shell {
    padding-bottom: 28px;
  }
}
</style>

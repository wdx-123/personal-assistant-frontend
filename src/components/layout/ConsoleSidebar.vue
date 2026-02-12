<template>
  <div class="console-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="sidebar-header">
      <div class="logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
        </svg>
      </div>
      <span class="logo-text">用户平台</span>
    </div>

    <!-- 菜单列表 -->
    <div class="sidebar-menu">
      <!-- 主页 -->
      <div class="menu-item" :class="{ active: isActive('/console/dashboard') }" @click="navigateTo('/console/dashboard')">
        <div class="menu-title" title="主页">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="menu-text">主页</span>
          </div>
        </div>
      </div>

      <!-- 权限管理（带子菜单） -->
      <div class="menu-item" :class="{ active: isActive('/console/permission') }">
        <div class="menu-title" title="权限管理" @click="toggleSubmenu('permission')">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span class="menu-text">权限管理</span>
          </div>
          <svg class="submenu-arrow" :class="{ rotated: isSubmenuOpen('permission') }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <!-- 子菜单：使用 max-height 实现平滑展开/收起 -->
        <div class="submenu" :class="{ open: isSubmenuOpen('permission') }">
          <div class="submenu-item" :class="{ active: isActive('/console/permission/role') }" @click.stop="navigateTo('/console/permission/role')">
            角色管理
          </div>
          <div class="submenu-item" :class="{ active: isActive('/console/permission/api') }" @click.stop="navigateTo('/console/permission/api')">
            API管理
          </div>
          <div class="submenu-item" :class="{ active: isActive('/console/permission/menu') }" @click.stop="navigateTo('/console/permission/menu')">
            菜单管理
          </div>
        </div>
      </div>

      <!-- 人员管理 -->
      <div class="menu-item" :class="{ active: isActive('/console/user') }" @click="navigateTo('/console/user')">
        <div class="menu-title" title="人员管理">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="menu-text">人员管理</span>
          </div>
        </div>
      </div>

      <!-- 组织管理 -->
      <div class="menu-item" :class="{ active: isActive('/console/org') }" @click="navigateTo('/console/org')">
        <div class="menu-title" title="组织管理">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M4 21V7a2 2 0 012-2h3V3h6v2h3a2 2 0 012 2v14M9 21V9h6v12" />
            </svg>
            <span class="menu-text">组织管理</span>
          </div>
        </div>
      </div>

      <!-- 我的团队 -->
      <div class="menu-item" :class="{ active: isActive('/console/team') }" @click="navigateTo('/console/team')">
        <div class="menu-title" title="我的团队">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="menu-text">我的团队</span>
          </div>
        </div>
      </div>

      <!-- 设置 -->
      <div class="menu-item" :class="{ active: isActive('/console/settings') }" @click="navigateTo('/console/settings')">
        <div class="menu-title" title="设置">
          <div class="title-content">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="menu-text">设置</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部收缩按钮 -->
    <div class="sidebar-footer" @click="toggleCollapse">
      <svg class="collapse-icon" :class="{ rotated: isCollapsed }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
      <span class="footer-text">收起侧边栏</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const SUBMENU_CLOSE_MS = 220;
const SIDEBAR_WIDTH_MS = 250;

const isCollapsed = ref(false);
const targetCollapsed = ref(false);
const submenuForceClosed = ref(false);
const transitionEpoch = ref(0);
const openSubmenus = ref<Set<string>>(new Set(['permission'])); // 默认展开权限管理
const route = useRoute();
const router = useRouter();
const timerIds: number[] = [];

const clearTimers = () => {
  while (timerIds.length > 0) {
    const timerId = timerIds.pop();
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  }
};

const scheduleWithEpoch = (epoch: number, delay: number, cb: () => void) => {
  const timerId = window.setTimeout(() => {
    const timerIndex = timerIds.indexOf(timerId);
    if (timerIndex >= 0) {
      timerIds.splice(timerIndex, 1);
    }

    if (transitionEpoch.value !== epoch) {
      return;
    }
    cb();
  }, delay);
  timerIds.push(timerId);
};

const setCollapsedTarget = (next: boolean) => {
  targetCollapsed.value = next;
  transitionEpoch.value += 1;
  const epoch = transitionEpoch.value;
  clearTimers();

  if (next) {
    // Step 1: 先收子菜单（保留 openSubmenus 记忆）
    submenuForceClosed.value = true;
    // Step 2: 子菜单收起后再收窄侧边栏
    scheduleWithEpoch(epoch, SUBMENU_CLOSE_MS, () => {
      isCollapsed.value = true;
    });
    return;
  }

  // Step 1: 先展开侧边栏宽度
  isCollapsed.value = false;
  // Step 2: 宽度展开后再按记忆恢复子菜单显示
  scheduleWithEpoch(epoch, SIDEBAR_WIDTH_MS, () => {
    submenuForceClosed.value = false;
  });
};

// 切换侧边栏收起/展开
const toggleCollapse = () => {
  setCollapsedTarget(!targetCollapsed.value);
};

// 切换子菜单展开/收起
const toggleSubmenu = (key: string) => {
  // 如果侧边栏是收起状态，先展开侧边栏
  if (targetCollapsed.value) {
    setCollapsedTarget(false);
  }
  
  // 切换子菜单状态
  if (openSubmenus.value.has(key)) {
    openSubmenus.value.delete(key);
  } else {
    openSubmenus.value.add(key);
  }
};

// 检查子菜单是否展开
const isSubmenuOpen = (key: string) => {
  return openSubmenus.value.has(key) && !isCollapsed.value && !submenuForceClosed.value;
};

// 路由跳转
const navigateTo = (path: string) => {
  router.push(path);
};

// 检查当前路由是否激活
const isActive = (path: string) => {
  return route.path.startsWith(path);
};

onBeforeUnmount(() => {
  transitionEpoch.value += 1;
  clearTimers();
});
</script>

<style scoped>
/* ============================================
   侧边栏容器
   ============================================ */
.console-sidebar {
  --sidebar-width-duration: 250ms;
  --submenu-duration: var(--ui-duration-expand, 220ms);
  --sidebar-ease: var(--ui-ease-standard, cubic-bezier(0.4, 0, 0.2, 1));

  width: 240px;
  height: 100%;
  background: #f2f3f5;
  color: #333;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 1px 0 14px rgba(15, 23, 42, 0.06), 1px 0 4px rgba(15, 23, 42, 0.03);
  transition: width var(--sidebar-width-duration) var(--sidebar-ease),
              box-shadow var(--sidebar-width-duration) var(--sidebar-ease);
}

.console-sidebar.collapsed {
  width: 64px;
  box-shadow: none;
}

/* ============================================
   Header 区域
   ============================================ */
.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #fff;
  font-size: 18px;
  font-weight: 600;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  transition: padding var(--sidebar-width-duration) var(--sidebar-ease),
              gap var(--sidebar-width-duration) var(--sidebar-ease);
}

/* 收起时 Header：Logo 图标完全居中 */
.collapsed .sidebar-header {
  gap: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.logo-icon svg {
  width: 18px;
  height: 18px;
}

.logo-text {
  color: #1a1a1a;
  font-weight: 600;
  opacity: 1;
  overflow: hidden;
  transition: opacity 0.15s ease 0.1s,
              width var(--sidebar-width-duration) var(--sidebar-ease),
              margin var(--sidebar-width-duration) var(--sidebar-ease);
}

/* 收起时文字完全隐藏，不占空间 */
.collapsed .logo-text {
  opacity: 0;
  width: 0;
  margin: 0;
  transition: opacity 0.1s ease,
              width var(--sidebar-width-duration) var(--sidebar-ease),
              margin var(--sidebar-width-duration) var(--sidebar-ease);
}

/* ============================================
   菜单区域
   ============================================ */
.sidebar-menu {
  padding: 12px 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}

.menu-item {
  margin-bottom: 2px;
  position: relative;
}

.menu-title {
  margin: 0 8px;
  padding: 0 12px;
  height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #595959;
  font-size: 14px;
  justify-content: space-between;
  border-radius: 8px;
  position: relative;
  transition: margin 0.2s ease,
              padding 0.2s ease,
              color 0.2s ease,
              background-color 0.2s ease;
}

/* 收起时菜单项居中 */
.collapsed .menu-title {
  margin: 0 8px;
  padding: 0 14px;
}

.menu-title:hover {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.08);
}

.menu-item.active > .menu-title {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  font-weight: 500;
}

/* 激活指示器 - 固定挂在菜单标题行，避免父项展开后错位 */
.menu-item.active > .menu-title::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #1890ff;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* 收起时 title-content 也居中 */
.collapsed .title-content {
  gap: 0;
}

.menu-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke-width: 1.8;
}

/* 菜单文字 */
.menu-text {
  opacity: 1;
  white-space: nowrap;
  transition: opacity 0.15s ease 0.1s;
}

.collapsed .menu-text {
  opacity: 0;
  width: 0;
  transition: opacity 0.1s ease;
}

/* ============================================
   子菜单箭头
   ============================================ */
.submenu-arrow {
  width: 14px;
  height: 14px;
  color: #8c8c8c;
  flex-shrink: 0;
  opacity: 1;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.15s ease 0.1s;
}

.submenu-arrow.rotated {
  transform: rotate(180deg);
}

.collapsed .submenu-arrow {
  opacity: 0;
  width: 0;
  transition: opacity 0.1s ease;
}

/* ============================================
   子菜单
   ============================================ */
.submenu {
  background: rgba(0, 0, 0, 0.03);
  margin: 0 8px;
  padding: 0 6px;
  border-radius: 10px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  pointer-events: none;
  transition: max-height var(--submenu-duration) var(--sidebar-ease),
              opacity var(--submenu-duration) ease,
              margin var(--submenu-duration) ease,
              padding var(--submenu-duration) ease;
}

.submenu.open {
  max-height: 220px;
  opacity: 1;
  margin-top: 4px;
  padding: 6px;
  pointer-events: auto;
  transition: max-height var(--submenu-duration) var(--sidebar-ease),
              opacity var(--submenu-duration) ease,
              margin var(--submenu-duration) ease,
              padding var(--submenu-duration) ease;
}

.collapsed .submenu {
  max-height: 0;
  opacity: 0;
  margin: 0 8px;
  padding-top: 0;
  padding-bottom: 0;
  pointer-events: none;
}

.submenu-item {
  padding: 0 12px 0 12px;
  height: 34px;
  margin: 2px 0;
  border-radius: 9px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  color: #595959;
  font-size: 13px;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.submenu-item::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
  transform: scale(0.8);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.submenu-item:hover {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.06);
}

.submenu-item.active {
  color: #1677ff;
  background: rgba(24, 144, 255, 0.1);
  border-color: rgba(24, 144, 255, 0.18);
  font-weight: 500;
}

/* 子菜单激活指示器（预留位置，避免激活时文字位移） */
.submenu-item.active::before {
  background: #1677ff;
  transform: scale(1);
}

/* ============================================
   底部收缩按钮
   ============================================ */
.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  cursor: pointer;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);
  color: #8c8c8c;
  font-size: 13px;
  gap: 10px;
  background: #fff;
  position: relative;
  z-index: 1;
  transition: padding 0.2s ease,
              gap 0.2s ease,
              color 0.2s ease,
              background-color 0.2s ease;
}

/* 收起时底部居中 */
.collapsed .sidebar-footer {
  justify-content: center;
  padding: 0;
  gap: 0;
}

.sidebar-footer:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.06);
}

.collapse-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.footer-text {
  display: inline-block;
  opacity: 1;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.15s ease 0.1s;
}

.collapsed .footer-text {
  opacity: 0;
  width: 0;
  transition: opacity 0.1s ease;
}

/* ============================================
   滚动条样式
   ============================================ */
.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

.sidebar-menu::-webkit-scrollbar-track {
  background: transparent;
}
</style>

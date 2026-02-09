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
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const isCollapsed = ref(false);
const openSubmenus = ref<Set<string>>(new Set(['permission'])); // 默认展开权限管理
const route = useRoute();
const router = useRouter();

// 切换侧边栏收起/展开
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 切换子菜单展开/收起
const toggleSubmenu = (key: string) => {
  // 如果侧边栏是收起状态，先展开侧边栏
  if (isCollapsed.value) {
    isCollapsed.value = false;
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
  return openSubmenus.value.has(key) && !isCollapsed.value;
};

// 路由跳转
const navigateTo = (path: string) => {
  router.push(path);
};

// 检查当前路由是否激活
const isActive = (path: string) => {
  return route.path.startsWith(path);
};
</script>

<style scoped>
/* ============================================
   侧边栏容器
   ============================================ */
.console-sidebar {
  width: 240px;
  height: 100%;
  background: #f2f3f5;
  color: #333;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 1px 0 24px rgba(0, 0, 0, 0.06), 1px 0 8px rgba(0, 0, 0, 0.04);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.console-sidebar.collapsed {
  width: 64px;
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收起时 Header：Logo 图标完全居中 */
.collapsed .sidebar-header {
  padding: 0;
  justify-content: center;
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
              width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              margin 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 收起时文字完全隐藏，不占空间 */
.collapsed .logo-text {
  opacity: 0;
  width: 0;
  margin: 0;
  transition: opacity 0.1s ease, 
              width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              margin 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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

/* 激活指示器 - 左边蓝条（收起时也能看到） */
.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #1890ff;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
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
  transition: all 0.2s ease;
}

/* 收起时菜单项居中 */
.collapsed .menu-title {
  margin: 0 8px;
  padding: 0;
  justify-content: center;
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
  border-radius: 8px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease,
              margin 0.2s ease;
}

.submenu.open {
  max-height: 200px;
  opacity: 1;
  margin-top: 4px;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease 0.05s,
              margin 0.2s ease;
}

.collapsed .submenu {
  max-height: 0 !important;
  opacity: 0 !important;
  margin: 0 8px !important;
}

.submenu-item {
  padding: 0 12px 0 44px;
  height: 38px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #595959;
  font-size: 13px;
  position: relative;
  transition: all 0.2s ease;
}

.submenu-item:first-child {
  padding-top: 4px;
}

.submenu-item:last-child {
  padding-bottom: 4px;
}

.submenu-item:hover {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.08);
}

.submenu-item.active {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.12);
  font-weight: 500;
}

/* 子菜单激活指示器 */
.submenu-item.active::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
}

/* ============================================
   底部收缩按钮
   ============================================ */
.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);
  color: #8c8c8c;
  font-size: 13px;
  gap: 10px;
  background: #fff;
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;
}

/* 收起时底部居中 */
.collapsed .sidebar-footer {
  justify-content: center;
  padding: 0;
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
  opacity: 1;
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

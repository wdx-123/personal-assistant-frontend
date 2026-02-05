<script setup lang="ts">
/**
 * 控制台页面
 * 背景透明，保留全局背景图
 */
import { defineAsyncComponent, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

const HeaderBar = defineAsyncComponent(() => import("@/components/layout/HeaderBar.vue"));
const ConsoleSidebar = defineAsyncComponent(() => import("@/components/layout/ConsoleSidebar.vue"));

const isExiting = ref(false);

// 路由离开前的守卫
onBeforeRouteLeave((to, from, next) => {
  // 如果是去首页，执行收起动画
  if (to.path === '/home' || to.path === '/') {
    isExiting.value = true;
    setTimeout(() => {
      next();
    }, 500);
  } else {
    next();
  }
});
</script>

<template>
  <div class="console-view">
    <!-- 左侧导航栏 -->
    <div class="sidebar-wrapper" :class="{ 'slide-out': isExiting }">
      <ConsoleSidebar />
    </div>
    
    <!-- 右侧内容区域 -->
    <div class="main-content" :class="{ 'fade-out': isExiting }">
      <HeaderBar class="console-header-bar" />
      <div class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row; /* 改为行布局 */
}

.sidebar-wrapper {
  height: 100%;
  /* 初始进场动画 */
  animation: slide-in-left 0.5s ease-out backwards;
  transition: transform 0.5s ease-in-out;
  z-index: 10;
}

.sidebar-wrapper.slide-out {
  transform: translateX(-100%);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  /* 统一右侧半透明样式 */
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  /* 进场动画延迟，等侧边栏出来后再渐显 */
  animation: fade-in 0.8s ease-out backwards;
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
}

.main-content.fade-out {
  opacity: 0;
  transform: translateX(20px);
}

@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.content-container {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Transition for router-view */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 覆盖 HeaderBar 样式使其适应控制台布局 */
:deep(.header-bar-wrapper) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

:deep(.header-bar) {
  background: transparent !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
</style>

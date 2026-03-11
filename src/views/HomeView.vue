<script setup lang="ts">
/**
 * 首页
 */
import { defineAsyncComponent, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type LeaderboardCardComponent from "@/components/business/LeaderboardCard/LeaderboardCard.vue";
import type { OJStatsResponse, OJPlatform } from "@/types";

const HeaderBar = defineAsyncComponent(() => import("@/components/layout/HeaderBar.vue"));
const OJCard = defineAsyncComponent(() => import("@/components/business/OJCard/OJCard.vue"));
const LeaderboardCard = defineAsyncComponent(
  () => import("@/components/business/LeaderboardCard/LeaderboardCard.vue")
);

const authStore = useAuthStore();

// 动画状态
const isExiting = ref(false);

// 当前选中的平台
const selectedPlatform = ref<OJPlatform>('luogu');

// 平台选项
const platformOptions = [
  { label: '洛谷', value: 'luogu' },
  { label: '蓝桥杯', value: 'lanqiao' },
  { label: '力扣', value: 'leetcode' }
];

// 排行榜组件引用
const leaderboardRef = ref<InstanceType<typeof LeaderboardCardComponent> | null>(null);

// 路由离开前的守卫
onBeforeRouteLeave((to, from, next) => {
  if (to.path.startsWith('/console')) {
    isExiting.value = true;
    // 等待动画完成
    setTimeout(() => {
      next();
    }, 600); // 略长于 CSS transition 时间 (500ms)
  } else {
    next();
  }
});

/**
 * 处理绑定成功
 */
const handleBound = (_data: OJStatsResponse) => {
  // 刷新排行榜
  leaderboardRef.value?.refresh();
};
</script>

<template>
  <div class="home-view">
    <!-- Header Bar -->
    <HeaderBar />

    <!-- 平台选择器 -->
    <div class="platform-selector-wrapper" :class="{ 'slide-out-left': isExiting }">
      <div class="selector-left">
        <div class="platform-selector">
          <div 
            v-for="option in platformOptions" 
            :key="option.value"
            class="platform-item"
            :class="{ active: selectedPlatform === option.value }"
            @click="selectedPlatform = option.value as OJPlatform"
          >
            {{ option.label }}
          </div>
        </div>
        
        <div class="switch-org-btn">
          切换组织
        </div>
      </div>

      <div class="current-org-btn">
        当前组织
      </div>
    </div>

    <!-- 卡片容器 -->
    <div class="cards-container">
      <!-- 左侧列：OJ 卡片 + 刷题曲线 -->
      <div class="left-column" :class="{ 'slide-out-left': isExiting }">
        <!-- 绑定卡片 (根据选择的平台渲染) -->
        <div class="card-wrapper">
          <OJCard 
            :key="selectedPlatform" 
            :platform="selectedPlatform" 
            @bound="handleBound" 
          />
        </div>

        <!-- 刷题曲线卡片 (占位，稍后实现) -->
        <div class="card-wrapper chart-card-placeholder">
          <div class="placeholder-content">
            <h3>{{ platformOptions.find(p => p.value === selectedPlatform)?.label }}近30天刷题数量曲线</h3>
            <p>（图表功能开发中）</p>
          </div>
        </div>
      </div>

      <div class="right-column" :class="{ 'slide-out-right': isExiting }">
        <!-- 右侧列：排行榜卡片 (传递当前平台) -->
        <LeaderboardCard 
          ref="leaderboardRef" 
          :platform="selectedPlatform" 
        />
      </div>

    </div>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 平台选择器样式 */
.platform-selector-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.selector-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.switch-org-btn, .current-org-btn {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch-org-btn:hover, .current-org-btn:hover {
  color: #1890ff;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.platform-selector {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.platform-item {
  padding: 8px 24px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.platform-item:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.platform-item.active {
  color: #fff;
  background: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.cards-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  align-content: start;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* height: 100%;  已经移到下面了 */
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.1s;
}

.right-column {
  animation: slide-in-right 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.2s;
  height: 100%; /* 确保右侧高度撑满 */
}

/* 卡片容器，统一高度 */
.card-wrapper {
  background: rgba(255, 255, 255, 0.95); /* 提高不透明度，匹配上面的卡片 */
  backdrop-filter: blur(10px);
  border-radius: 12px; /* 统一圆角 */
  border: none; /* 移除边框，使用阴影 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 统一阴影 */
  overflow: hidden;
  height: 280px; /* 固定高度 */
  flex: 1; /* 让两个卡片平分高度 */
}

/* 调整左侧列布局，确保高度撑满 */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%; /* 关键：撑满高度 */
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.1s;
}
.chart-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.placeholder-content {
  text-align: center;
}

.placeholder-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

/* 离开动画 */
.slide-out-left {
  transform: translateX(-100px);
  opacity: 0;
  transition: all 0.5s ease-in;
}

.slide-out-right {
  transform: translateX(100px);
  opacity: 0;
  transition: all 0.5s ease-in;
}

/* 进场动画 */
@keyframes slide-in-left {
  from {
    transform: translateX(-60px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(60px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
  
  .left-column, .right-column {
    height: auto;
  }
}
</style>

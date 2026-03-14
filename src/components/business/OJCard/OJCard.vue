<template>
  <div class="oj-card-wrapper">
    <!-- 3D 翻转卡片容器 -->
    <div class="flip-card" :class="{ flipped: isBound }">
      <!-- 正面：绑定输入 -->
      <div class="flip-card-front">
        <OJCardFront
          :platform="platform"
          :platform-name="platformName"
          :description="description"
          :placeholder="placeholder"
          :identifier="identifier"
          :secret="secret"
          :loading="loading"
          :is-rebinding="isRebinding"
          @update:identifier="identifier = $event"
          @update:secret="secret = $event"
          @bind="handleBind"
          @flip-back="handleFlipBack"
        />
      </div>

      <!-- 反面：用户信息 -->
      <div class="flip-card-back" @click="handleCardClick">
        <OJCardBack
          :platform-name="platformName"
          :user-info="userInfo"
          :is-loading="isLoading"
          @rebind="handleStartRebind"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OJ 卡片组件
 * 支持绑定/换绑功能
 */
import type { OJPlatform, OJStatsResponse } from '@/types'
import OJCardFront from './OJCardFront.vue'
import OJCardBack from './OJCardBack.vue'
import { useOJCard } from './useOJCard'

interface Props {
  platform: OJPlatform
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'bound', data: OJStatsResponse): void
}>()

const {
  identifier,
  secret,
  loading,
  isLoading,
  isBound,
  userInfo,
  isRebinding,
  platformName,
  description,
  placeholder,
  handleBind,
  handleStartRebind,
  handleFlipBack,
  loadOJStats,
} = useOJCard({
  platform: props.platform,
  onBound: (data) => emit('bound', data),
})

/**
 * 点击卡片任意位置翻转
 */
const handleCardClick = () => {
  // 只有在已绑定状态且不在加载中时才能点击翻转
  if (isBound.value && !isLoading.value) {
    handleStartRebind()
  }
}

// 暴露刷新方法
defineExpose({
  refresh: loadOJStats,
})
</script>

<style scoped>
.oj-card-wrapper {
  width: 100%;
  height: 100%;
  min-height: 280px;
  position: relative;
  perspective: 1000px;
  overflow: hidden;
}

/* 3D 翻转容器 */
.flip-card {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card-front,
.flip-card-back {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: absolute;
  top: 0;
  left: 0;
  backface-visibility: hidden;
}

.flip-card-front {
  transform: rotateY(0deg);
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}

/* 翻转状态 */
.flip-card.flipped {
  transform: rotateY(180deg);
}
</style>

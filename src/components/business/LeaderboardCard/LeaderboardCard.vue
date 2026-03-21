<template>
  <div class="leaderboard-card-wrapper">
    <!-- SVG 渐变定义 -->
    <svg width="0" height="0" style="position: absolute">
      <defs>
        <!-- 金色渐变 -->
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #ffd700; stop-opacity: 1" />
          <stop offset="50%" style="stop-color: #ffed4e; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #daa520; stop-opacity: 1" />
        </linearGradient>
        <!-- 银色渐变 -->
        <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #e8e8e8; stop-opacity: 1" />
          <stop offset="50%" style="stop-color: #c0c0c0; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #a8a8a8; stop-opacity: 1" />
        </linearGradient>
        <!-- 铜色渐变 -->
        <linearGradient id="bronze-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #e6a55c; stop-opacity: 1" />
          <stop offset="50%" style="stop-color: #cd7f32; stop-opacity: 1" />
          <stop offset="100%" style="stop-color: #a87232; stop-opacity: 1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 3D 翻转卡片容器 -->
    <div class="flip-card" :class="{ flipped: isFlipped }">
      <!-- 正面：排行榜 -->
      <div class="flip-card-front">
        <div class="leaderboard-card">
          <div class="card-header">
            <div class="header-left">
              <h2>算法排行榜 - {{ platformName }}</h2>
              <span class="scope-tag scope-org">{{ orgScopeTagText }}</span>
            </div>
            <div class="flip-hint" @click="handleFlip">
              查看全部组织排名 →
            </div>
          </div>
          <div class="card-content">
            <!-- 加载状态 -->
            <div v-if="orgLoading" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="orgRankList.length === 0" class="empty-state">
              <p>暂无排行榜数据</p>
              <p class="hint">绑定{{ platformName }}账号后即可查看</p>
            </div>

            <!-- 数据列表 -->
            <div v-else>
              <!-- 前三名颁奖台 -->
              <RankingPodium :items="orgRankList.slice(0, 3)" />

              <!-- 第四名及以后 -->
              <RankingList
                :items="orgRankList.slice(3)"
                :start-index="3"
                :loading-more="orgLoadingMore"
                :has-more="orgHasMore"
                @load-more="loadMoreCurrent"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 反面：排行榜（用于翻转效果，显示另一种排名范围） -->
      <div class="flip-card-back">
        <div class="leaderboard-card">
          <div class="card-header">
            <div class="header-left">
              <h2>算法排行榜 - {{ platformName }}</h2>
              <span class="scope-tag scope-all">全部组织</span>
            </div>
            <div class="flip-hint" @click="handleFlip">
              ← 查看我的组织排名
            </div>
          </div>
          <div class="card-content">
            <!-- 加载状态 -->
            <div v-if="allLoading" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="allRankList.length === 0" class="empty-state">
              <p>暂无排行榜数据</p>
              <p class="hint">绑定{{ platformName }}账号后即可查看</p>
            </div>

            <!-- 数据列表 -->
            <div v-else>
              <!-- 前三名颁奖台 -->
              <RankingPodium :items="allRankList.slice(0, 3)" :show-current-org="true" />

              <!-- 第四名及以后 -->
              <RankingList
                :items="allRankList.slice(3)"
                :start-index="3"
                :loading-more="allLoadingMore"
                :has-more="allHasMore"
                :show-current-org="true"
                @load-more="loadMoreCurrent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 排行榜卡片组件
 * 支持3D翻转切换 全网/本组织 排名
 */
import { ref, computed, watch } from 'vue'
import type { OJPlatform } from '@/types'
import RankingPodium from './RankingPodium.vue'
import RankingList from './RankingList.vue'
import { useRankingData } from './useRankingData'

interface Props {
  platform?: OJPlatform
  orgId?: number
  orgName?: string
}

const props = withDefaults(defineProps<Props>(), {
  platform: 'luogu'
})

// 使用数据逻辑
const {
  getState,
  loadMore,
  preparePlatform,
  ensureScopeReady,
} = useRankingData()

// 翻转状态
const isFlipped = ref(false)

// 平台名称映射
const platformNames: Record<OJPlatform, string> = {
  luogu: '洛谷',
  leetcode: '力扣',
  lanqiao: '蓝桥杯'
}

const platformName = computed(() => platformNames[props.platform])

const orgScopeTagText = computed(() => {
  const name = (props.orgName || '').trim()
  return name ? `主组织 · ${name}` : '主组织未设置'
})

const orgState = computed(() => getState(props.platform, 'org', props.orgId))
const allState = computed(() => getState(props.platform, 'all_members'))
const activeScope = computed<'org' | 'all_members'>(() => (isFlipped.value ? 'all_members' : 'org'))

const orgLoading = computed(() => orgState.value.loading)
const orgLoadingMore = computed(() => orgState.value.loadingMore)
const orgHasMore = computed(() => orgState.value.hasMore)
const orgRankList = computed(() => orgState.value.list)

const allLoading = computed(() => allState.value.loading)
const allLoadingMore = computed(() => allState.value.loadingMore)
const allHasMore = computed(() => allState.value.hasMore)
const allRankList = computed(() => allState.value.list)

const prepareCurrentPlatform = async () => {
  isFlipped.value = false
  await preparePlatform(props.platform, props.orgId)
}

const loadMoreCurrent = () => {
  const scope = activeScope.value
  const orgId = scope === 'org' ? props.orgId : undefined
  void loadMore(props.platform, scope, orgId)
}

/**
 * 切换翻转状态 (切换 Scope)
 */
const handleFlip = () => {
  isFlipped.value = !isFlipped.value

  if (isFlipped.value && !allState.value.initialized && !allState.value.loading) {
    void ensureScopeReady(props.platform, 'all_members')
  }
}

watch(
  () => [props.platform, props.orgId],
  () => {
    void prepareCurrentPlatform()
  },
  { immediate: true }
)

// 暴露刷新方法
defineExpose({
  refresh: prepareCurrentPlatform,
})
</script>

<style scoped>
.leaderboard-card-wrapper {
  width: 100%;
  height: 100%;
  min-height: 560px;
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

.leaderboard-card {
  height: 100%;
  min-height: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.scope-all {
  color: #1677ff;
  background: rgba(22, 119, 255, 0.08);
  border: 1px solid rgba(22, 119, 255, 0.25);
}

.scope-org {
  color: #2f6b79;
  background: rgba(47, 107, 121, 0.08);
  border: 1px solid rgba(47, 107, 121, 0.18);
}

.flip-hint {
  font-size: 14px;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.flip-hint:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.card-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 16px 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c8c8c;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c8c8c;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 12px;
  color: #bfbfbf;
}

/* 滚动条样式 */
.card-content::-webkit-scrollbar {
  width: 6px;
}

.card-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.card-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>

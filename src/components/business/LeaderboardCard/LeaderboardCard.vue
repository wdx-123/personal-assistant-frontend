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
              <span class="scope-tag" :class="scopeTagClass">{{ scopeTagText }}</span>
            </div>
            <div class="flip-hint" @click="handleFlip">
              {{ currentScope === 'all' ? '查看我的组织排名' : '查看全部组织排名' }} →
            </div>
          </div>
          <div class="card-content">
            <!-- 加载状态 -->
            <div v-if="currentLoading" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="currentRankList.length === 0" class="empty-state">
              <p>暂无排行榜数据</p>
              <p class="hint">绑定{{ platformName }}账号后即可查看</p>
            </div>

            <!-- 数据列表 -->
            <div v-else>
              <!-- 前三名颁奖台 -->
              <RankingPodium :items="currentRankList.slice(0, 3)" />

              <!-- 第四名及以后 -->
              <RankingList
                :items="currentRankList.slice(3)"
                :start-index="3"
                :loading-more="currentLoadingMore"
                :has-more="currentHasMore"
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
              <span class="scope-tag" :class="scopeTagClass">{{ scopeTagText }}</span>
            </div>
            <div class="flip-hint" @click="handleFlip">
              ← {{ currentScope === 'all' ? '查看我的组织排名' : '查看全部组织排名' }}
            </div>
          </div>
          <!-- 这里不需要渲染内容，因为翻转瞬间我们会切换 scope 并重新渲染正面 -->
          <!-- 或者我们可以简单复用上面的结构，但为了简化逻辑，我们让翻转只是一个视觉效果 -->
          <!-- 实际上，为了平滑过渡，反面应该显示“即将切换到...”的状态 -->
          <div class="card-content">
            <!-- 加载状态 -->
            <div v-if="currentLoading" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="currentRankList.length === 0" class="empty-state">
              <p>暂无排行榜数据</p>
              <p class="hint">绑定{{ platformName }}账号后即可查看</p>
            </div>

            <!-- 数据列表 -->
            <div v-else>
              <!-- 前三名颁奖台 -->
              <RankingPodium :items="currentRankList.slice(0, 3)" />

              <!-- 第四名及以后 -->
              <RankingList
                :items="currentRankList.slice(3)"
                :start-index="3"
                :loading-more="currentLoadingMore"
                :has-more="currentHasMore"
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
import { ref, computed, onMounted, watch } from 'vue'
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
  luoguLoading,
  leetcodeLoading,
  lanqiaoLoading,
  luoguLoadingMore,
  leetcodeLoadingMore,
  lanqiaoLoadingMore,
  luoguHasMore,
  leetcodeHasMore,
  lanqiaoHasMore,
  luoguRankList,
  leetcodeRankList,
  lanqiaoRankList,
  loadMoreLuogu,
  loadMoreLeetcode,
  loadMoreLanqiao,
  refreshPlatform,
} = useRankingData()

// 当前查看的范围：'all' | 'org'
const currentScope = ref<'all' | 'org'>('org')

// 翻转状态
const isFlipped = ref(false)

// 平台名称映射
const platformNames: Record<OJPlatform, string> = {
  luogu: '洛谷',
  leetcode: '力扣',
  lanqiao: '蓝桥杯'
}

const platformName = computed(() => platformNames[props.platform])

const scopeTagText = computed(() => {
  if (currentScope.value === 'all') return '全部组织'
  const name = (props.orgName || '').trim()
  return name ? `${name}` : '我的组织'
})

const scopeTagClass = computed(() => {
  return currentScope.value === 'all' ? 'scope-all' : 'scope-org'
})

const currentLoading = computed(() => {
  if (props.platform === 'luogu') return luoguLoading.value
  if (props.platform === 'leetcode') return leetcodeLoading.value
  if (props.platform === 'lanqiao') return lanqiaoLoading.value
  return false
})

const currentLoadingMore = computed(() => {
  if (props.platform === 'luogu') return luoguLoadingMore.value
  if (props.platform === 'leetcode') return leetcodeLoadingMore.value
  if (props.platform === 'lanqiao') return lanqiaoLoadingMore.value
  return false
})

const currentHasMore = computed(() => {
  if (props.platform === 'luogu') return luoguHasMore.value
  if (props.platform === 'leetcode') return leetcodeHasMore.value
  if (props.platform === 'lanqiao') return lanqiaoHasMore.value
  return false
})

const currentRankList = computed(() => {
  if (props.platform === 'luogu') return luoguRankList.value
  if (props.platform === 'leetcode') return leetcodeRankList.value
  if (props.platform === 'lanqiao') return lanqiaoRankList.value
  return []
})

const refreshCurrent = () => {
  const apiScope = currentScope.value === 'all' ? 'all_members' : 'org'
  refreshPlatform(props.platform, apiScope, apiScope === 'org' ? props.orgId : undefined)
}

const loadMoreCurrent = () => {
  const apiScope = currentScope.value === 'all' ? 'all_members' : 'org'
  const orgId = apiScope === 'org' ? props.orgId : undefined
  if (props.platform === 'luogu') loadMoreLuogu(apiScope, orgId)
  if (props.platform === 'leetcode') loadMoreLeetcode(apiScope, orgId)
  if (props.platform === 'lanqiao') loadMoreLanqiao(apiScope, orgId)
}

/**
 * 切换翻转状态 (切换 Scope)
 */
const handleFlip = () => {
  isFlipped.value = !isFlipped.value
  // 延迟切换 scope，等待翻转动画过半
  setTimeout(() => {
    currentScope.value = currentScope.value === 'all' ? 'org' : 'all'
    refreshCurrent()
  }, 300)
}

// 监听平台变化，自动刷新数据
watch(() => props.platform, () => {
  refreshCurrent()
})

watch(() => props.orgId, () => {
  refreshCurrent()
})

// 组件挂载时获取数据
onMounted(() => {
  refreshCurrent()
})

// 暴露刷新方法
defineExpose({
  refresh: refreshCurrent,
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
  color: #389e0d;
  background: rgba(82, 196, 26, 0.08);
  border: 1px solid rgba(82, 196, 26, 0.25);
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

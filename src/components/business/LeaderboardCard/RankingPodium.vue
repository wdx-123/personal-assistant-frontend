<template>
  <div v-if="items.length > 0" class="podium">
    <!-- 第二名（左侧） -->
    <div v-if="items[1]" class="podium-item rank-2" :class="{ 'is-current-user': isCurrentUser(items[1]) }">
      <!-- 皇冠 -->
      <div class="crown silver">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4l3 12h14l3-12-6 7-4-10-4 10-6-7zm3 16h14v2H5v-2z" />
        </svg>
      </div>
      <div class="avatar-wrapper">
        <div class="rank-badge silver">2</div>
        <RankingAvatar
          :src="items[1].avatar"
          :name="items[1].real_name"
          :user-id="items[1].user_id"
          size="podium"
          accent="silver"
        />
      </div>
      <div class="podium-meta">
        <div class="podium-name">
          {{ items[1].real_name }}
        </div>
        <div
          v-if="showCurrentOrg"
          class="podium-org-tag"
          :class="{ 'is-fallback': isFallbackCurrentOrg(items[1]) }"
        >
          {{ resolveCurrentOrgName(items[1]) }}
        </div>
      </div>
      <div class="podium-count">
        {{ items[1].total_passed }}题
      </div>
    </div>

    <!-- 第一名（中间） -->
    <div v-if="items[0]" class="podium-item rank-1" :class="{ 'is-current-user': isCurrentUser(items[0]) }">
      <!-- 皇冠 -->
      <div class="crown gold">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4l3 12h14l3-12-6 7-4-10-4 10-6-7zm3 16h14v2H5v-2z" />
        </svg>
      </div>
      <div class="avatar-wrapper">
        <div class="rank-badge gold">1</div>
        <RankingAvatar
          :src="items[0].avatar"
          :name="items[0].real_name"
          :user-id="items[0].user_id"
          size="podium"
          accent="gold"
        />
      </div>
      <div class="podium-meta">
        <div class="podium-name">
          {{ items[0].real_name }}
        </div>
        <div
          v-if="showCurrentOrg"
          class="podium-org-tag"
          :class="{ 'is-fallback': isFallbackCurrentOrg(items[0]) }"
        >
          {{ resolveCurrentOrgName(items[0]) }}
        </div>
      </div>
      <div class="podium-count">
        {{ items[0].total_passed }}题
      </div>
    </div>

    <!-- 第三名（右侧） -->
    <div v-if="items[2]" class="podium-item rank-3" :class="{ 'is-current-user': isCurrentUser(items[2]) }">
      <!-- 皇冠 -->
      <div class="crown bronze">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4l3 12h14l3-12-6 7-4-10-4 10-6-7zm3 16h14v2H5v-2z" />
        </svg>
      </div>
      <div class="avatar-wrapper">
        <div class="rank-badge bronze">3</div>
        <RankingAvatar
          :src="items[2].avatar"
          :name="items[2].real_name"
          :user-id="items[2].user_id"
          size="podium"
          accent="bronze"
        />
      </div>
      <div class="podium-meta">
        <div class="podium-name">
          {{ items[2].real_name }}
        </div>
        <div
          v-if="showCurrentOrg"
          class="podium-org-tag"
          :class="{ 'is-fallback': isFallbackCurrentOrg(items[2]) }"
        >
          {{ resolveCurrentOrgName(items[2]) }}
        </div>
      </div>
      <div class="podium-count">
        {{ items[2].total_passed }}题
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RankingItem } from '@/types'
import { useAuthStore } from '@/stores/auth'
import RankingAvatar from './RankingAvatar.vue'

interface Props {
  items: RankingItem[]
  showCurrentOrg?: boolean
}

withDefaults(defineProps<Props>(), {
  showCurrentOrg: false,
})

// 获取 auth store
const authStore = useAuthStore()

/**
 * 判断排行榜项是否是当前用户
 */
const isCurrentUser = (item: RankingItem) => {
  const user = authStore.user
  return user?.id === item.user_id
}

const resolveCurrentOrgName = (item?: RankingItem) => {
  const name = item?.current_org?.name?.trim()
  return name || '全体成员'
}

const isFallbackCurrentOrg = (item?: RankingItem) => {
  return !item?.current_org?.name?.trim()
}
</script>

<style scoped>
/* 颁奖台容器 */
.podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
  flex-shrink: 0;
  overflow: hidden;
}

/* 颁奖台项 */
.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* 当前用户高亮 */
.podium-item.is-current-user {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.podium-item.rank-1 {
  /* height: 130px; */
}

.podium-item.rank-2,
.podium-item.rank-3 {
  /* height: 105px; */
}

/* 皇冠 */
.podium-item .crown {
  width: 32px;
  height: 28px;
  margin-bottom: 3px;
  animation: float 2s ease-in-out infinite;
  flex-shrink: 0;
}

.podium-item.rank-1 .crown {
  width: 40px;
  height: 34px;
}

.podium-item .crown svg {
  width: 100%;
  height: 100%;
}

.podium-item .crown.gold svg {
  fill: url(#gold-gradient);
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
}

.podium-item .crown.silver svg {
  fill: url(#silver-gradient);
  filter: drop-shadow(0 2px 4px rgba(192, 192, 192, 0.3));
}

.podium-item .crown.bronze svg {
  fill: url(#bronze-gradient);
  filter: drop-shadow(0 2px 4px rgba(205, 127, 50, 0.3));
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* 头像容器 */
.podium-item .avatar-wrapper {
  position: relative;
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
}

.podium-item.rank-1 .avatar-wrapper {
  width: 70px;
  height: 70px;
}

/* 排名徽章 - 右上角角标 */
.rank-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.podium-item.rank-1 .rank-badge {
  min-width: 32px;
  height: 32px;
  font-size: 18px;
  top: -10px;
  right: -10px;
}

.rank-badge.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b6914;
}

.rank-badge.silver {
  background: linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 100%);
  color: #666;
}

.rank-badge.bronze {
  background: linear-gradient(135deg, #e6a55c 0%, #cd7f32 100%);
  color: white;
}

/* 用户名 */
.podium-meta {
  margin-top: 8px;
  width: 104px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.podium-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.podium-org-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.88);
  color: #5f6b7a;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-org-tag.is-fallback {
  min-height: 18px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 400;
  color: #7b8797;
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.18);
}

/* 题目数 */
.podium-count {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  flex-shrink: 0;
}
</style>

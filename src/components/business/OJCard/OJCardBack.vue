<template>
  <div class="oj-card bound">
    <!-- 右上角翻转按钮 -->
    <div
      class="flip-trigger"
      @click="onRebind"
      title="点击翻转卡片"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </div>

    <div class="card-header">
      <h2>{{ platformName }}</h2>
    </div>

    <div class="card-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 用户信息 -->
      <template v-else-if="userInfo">
        <div class="user-info">
          <div class="avatar">
            <img
              v-if="userInfo.user_avatar"
              :src="userInfo.user_avatar"
              :alt="userInfo.real_name"
            />
            <div v-else class="avatar-placeholder">
              {{ userInfo.real_name?.charAt(0) || "U" }}
            </div>
          </div>
          <div class="info">
            <div class="name">{{ userInfo.real_name || "未知用户" }}</div>
            <div class="id">@{{ userInfo.identifier || "" }}</div>
          </div>
          <span class="status-inline bound">已绑定</span>
        </div>

        <!-- 统计数据（如果有） -->
        <div v-if="userInfo.passed_number !== undefined" class="stats">
          <div class="stat-item">
            <span class="label">通过</span>
            <span class="value">{{ userInfo.passed_number }}</span>
          </div>
        </div>
      </template>
    </div>

    <div class="card-footer">
      <button class="rebind-button" @click="onRebind">
        重新绑定
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OJ 卡片反面 - 用户信息展示
 */
import type { OJStatsResponse } from '@/types'

interface Props {
  platformName: string
  userInfo: OJStatsResponse | null
  isLoading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'rebind'): void
}>()

const onRebind = () => {
  emit('rebind')
}
</script>

<style scoped>
.oj-card {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
  position: relative;
}

.oj-card.bound {
  position: relative;
}

/* 右上角翻转按钮 */
.flip-trigger {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.flip-trigger:hover {
  background: white;
  transform: rotate(90deg);
}

.flip-trigger svg {
  width: 18px;
  height: 18px;
  color: #8c8c8c;
  transition: color 0.3s ease;
}

.flip-trigger:hover svg {
  color: #1890ff;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.card-content {
  flex: 1;
  min-height: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}

/* 内联状态标签 */
.status-inline {
  font-size: 13px;
  color: #52c41a;
  padding: 4px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  margin-left: auto;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.info {
  flex: 1;
  text-align: left;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.id {
  font-size: 14px;
  color: #8c8c8c;
}

/* 统计数据 */
.stats {
  display: flex;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-item .label {
  font-size: 12px;
  color: #8c8c8c;
}

.stat-item .value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.rebind-button {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #faad14;
  color: white;
}

.rebind-button:hover {
  background: #ffc53d;
}

/* 响应式 */
@media (max-width: 768px) {
  .card-header {
    padding: 16px;
  }

  .card-content {
    padding: 16px;
  }

  .card-footer {
    padding: 12px 16px;
  }

  .avatar {
    width: 48px;
    height: 48px;
  }

  .avatar-placeholder {
    font-size: 18px;
  }
}
</style>

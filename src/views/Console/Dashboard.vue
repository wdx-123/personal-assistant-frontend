<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '2024-01-01';
  return new Date(dateStr).toLocaleDateString();
};
</script>

<template>
  <div class="dashboard-grid">
    <!-- Left Column -->
    <div class="left-panel">
      <!-- User Info Card -->
      <div class="dashboard-card user-info-card">
        <div class="user-info-header">控制台</div>
        <div class="user-info-content">
          <div class="user-avatar-large">
            <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
            <div v-else class="avatar-placeholder-large">
              {{ user?.username?.charAt(0) || "U" }}
            </div>
          </div>
          <div class="user-details-text">
            <div class="welcome-text">欢迎来到控制台</div>
            <div class="username-text">{{ user?.username || '用户' }}</div>
            <div class="join-time">加入时间：{{ formatDate(user?.created_at) }}</div>
          </div>
        </div>
      </div>

      <!-- Personal Details Card -->
      <div class="dashboard-card details-card">
        <div class="card-title">个人详情</div>
        <div class="card-content-placeholder">
          <!-- Content will go here -->
          <p>暂无详细信息</p>
        </div>
      </div>

      <!-- My Team Card -->
      <div class="dashboard-card team-card">
        <div class="card-title">我的团队</div>
        <div class="card-content-placeholder">
          <!-- Content will go here -->
          <p>暂无团队信息</p>
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div class="right-panel">
      <!-- Luogu Chart Card -->
      <div class="dashboard-card chart-card">
        <div class="card-title">洛谷近30天刷题数量曲线</div>
        <div class="chart-placeholder">
          <svg viewBox="0 0 400 150" class="placeholder-chart">
            <path d="M0,150 C50,100 100,120 150,80 C200,40 250,100 300,50 C350,0 400,100 400,150 L400,150 L0,150 Z" fill="rgba(24, 144, 255, 0.1)" />
            <path d="M0,150 C50,100 100,120 150,80 C200,40 250,100 300,50 C350,0 400,100 400,150" fill="none" stroke="#1890ff" stroke-width="2" />
          </svg>
          <div class="chart-label">数据加载中...</div>
        </div>
      </div>

      <!-- Lanqiao Cup Chart Card -->
      <div class="dashboard-card chart-card no-blur">
        <div class="card-title">蓝桥杯近30天刷题数量曲线</div>
        <div class="chart-placeholder">
          <svg viewBox="0 0 400 150" class="placeholder-chart">
            <path d="M0,150 C40,120 80,140 120,90 C160,110 200,60 240,80 C280,40 320,100 360,50 C380,30 400,150 400,150 L0,150 Z" fill="rgba(82, 196, 26, 0.1)" />
            <path d="M0,150 C40,120 80,140 120,90 C160,110 200,60 240,80 C280,40 320,100 360,50 C380,30 400,150 400,150" fill="none" stroke="#52c41a" stroke-width="2" />
          </svg>
          <div class="chart-label">数据加载中...</div>
        </div>
      </div>

      <!-- LeetCode Chart Card -->
      <div class="dashboard-card chart-card">
        <div class="card-title">力扣近30天刷题数量曲线</div>
        <div class="chart-placeholder">
          <svg viewBox="0 0 400 150" class="placeholder-chart">
            <path d="M0,150 C60,130 120,80 180,100 C240,120 300,40 360,60 C380,70 400,150 400,150 L0,150 Z" fill="rgba(250, 173, 20, 0.1)" />
            <path d="M0,150 C60,130 120,80 180,100 C240,120 300,40 360,60 C380,70 400,150 400,150" fill="none" stroke="#faad14" stroke-width="2" />
          </svg>
          <div class="chart-label">数据加载中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dashboard Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 24px;
  height: 100%;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Common Card Styles */
.dashboard-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 移除毛玻璃效果的特殊类 */
.dashboard-card.no-blur {
  backdrop-filter: none;
  background: rgba(255, 255, 255, 0.9); /* 不透明度稍微高一点，因为没有毛玻璃了 */
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.8);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
  line-height: 1.2;
}

/* User Info Card */
.user-info-card {
  /* display: flex; */
  /* flex-direction: column; */
}

.user-info-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1f2937;
}

.user-info-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.user-details-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.welcome-text {
  font-size: 14px;
  color: #666;
}

.username-text {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.join-time {
  font-size: 12px;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}

/* Specific Card Sizes */
.details-card {
  flex: 1; /* 占据剩余高度或固定高度 */
  min-height: 150px;
}

.team-card {
  min-height: 120px;
}

.chart-card {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.card-content-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  min-height: 80px;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.placeholder-chart {
  width: 100%;
  height: 100%;
  max-height: 150px;
}

.chart-label {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .left-panel, .right-panel {
    width: 100%;
  }
}
</style>

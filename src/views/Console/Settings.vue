<script setup lang="ts">
/**
 * 设置页面
 * 个人资料卡片 + 账号安全卡片，纵向排列
 */
import { defineAsyncComponent } from 'vue'

const ProfileCard = defineAsyncComponent(
  () => import('@/components/business/SettingsCard/ProfileCard.vue')
)
const SecurityCard = defineAsyncComponent(
  () => import('@/components/business/SettingsCard/SecurityCard.vue')
)
</script>

<template>
  <div class="console-page">
    <div class="page-header">
      <h2>设置</h2>
      <p>管理您的个人资料与账号安全</p>
    </div>
    <div class="settings-content">
      <ProfileCard />
      <SecurityCard />
    </div>
  </div>
</template>

<style scoped>
.console-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-header p {
  color: #6b7280;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>

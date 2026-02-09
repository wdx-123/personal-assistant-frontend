<script setup lang="ts">
/**
 * 账号安全卡片
 * 手机号行 + 密码行，各带「修改」按钮
 */
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/common'
import ChangePasswordModal from './ChangePasswordModal.vue'
import ChangePhoneModal from './ChangePhoneModal.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const isPasswordModalVisible = ref(false)
const isPhoneModalVisible = ref(false)

/** 手机号脱敏 */
const maskedPhone = computed(() => {
  const phone = user.value?.phone || ''
  if (!phone || phone.length < 7) return phone || '未绑定'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
})

/** 手机号换绑成功回调 */
const handlePhoneChanged = (newPhone: string) => {
  if (user.value) {
    authStore.setUser({ ...user.value, phone: newPhone })
  }
}
</script>

<template>
  <div class="settings-card">
    <h3 class="card-title">账号安全</h3>

    <div class="security-list">
      <!-- 手机号 -->
      <div class="security-item">
        <span class="item-label">手机号</span>
        <span class="item-value">{{ maskedPhone }}</span>
        <Button type="default" size="small" @click="isPhoneModalVisible = true">
          修改
        </Button>
      </div>

      <div class="security-divider" />

      <!-- 登录密码 -->
      <div class="security-item">
        <span class="item-label">登录密码</span>
        <span class="item-value">已设置</span>
        <Button type="default" size="small" @click="isPasswordModalVisible = true">
          修改
        </Button>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ChangePasswordModal v-model:visible="isPasswordModalVisible" />

    <!-- 修改手机号弹窗 -->
    <ChangePhoneModal
      v-model:visible="isPhoneModalVisible"
      :current-phone="user?.phone || ''"
      @changed="handlePhoneChanged"
    />
  </div>
</template>

<style scoped>
.settings-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  padding: 28px 32px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
}

.security-list {
  display: flex;
  flex-direction: column;
}

.security-item {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.security-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.item-label {
  width: 100px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  flex-shrink: 0;
}

.item-value {
  flex: 1;
  font-size: 14px;
  color: #595959;
}

.security-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0 8px;
}
</style>

        <script setup lang="ts">
/**
 * 个人资料卡片
 * 头像(左) + 表单(右：真实姓名 + 签名) + 保存按钮
 */
import { reactive, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Button, Input, message } from '@/components/common'
import { updateProfile } from '@/services/user.service'
import type { ValidationResult } from '@/utils/validate'
import AvatarUpload from './AvatarUpload.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const DEFAULT_SIGNATURE = '签名是空白的，这位用户似乎比较低调。'
const SIGNATURE_MAX_LENGTH = 100

/** 真实姓名校验：2-5 个汉字 */
const REAL_NAME_REGEX = /^[\u4e00-\u9fa5]{2,5}$/
const validateRealName = (name: string): ValidationResult => {
  if (!name) return { valid: false, message: '请输入真实姓名' }
  if (!REAL_NAME_REGEX.test(name)) return { valid: false, message: '请输入 2-5 个汉字' }
  return { valid: true }
}

const form = reactive({
  username: user.value?.username || '',
  signature: user.value?.signature || '',
})

const errors = reactive({
  username: '',
})

const isSaving = ref(false)

/** 真实姓名失焦校验 */
const handleUsernameBlur = () => {
  const result = validateRealName(form.username)
  errors.username = result.valid ? '' : (result.message || '')
}

/** 是否有内容变更 */
const hasChanges = computed(() => {
  if (!user.value) return false
  return (
    form.username !== user.value.username ||
    form.signature !== (user.value.signature || '')
  )
})

/** 保存个人资料 */
const handleSave = async () => {
  // 校验真实姓名
  const nameResult = validateRealName(form.username)
  if (!nameResult.valid) {
    errors.username = nameResult.message || ''
    return
  }

  if (!hasChanges.value) {
    message.info('没有需要保存的修改')
    return
  }

  try {
    isSaving.value = true
    const updatedUser = await updateProfile({
      username: form.username,
      signature: form.signature,
    })
    authStore.setUser(updatedUser)
    message.success('个人资料已更新')
  } catch (error) {
    // 错误提示由 request.ts 拦截器处理
  } finally {
    isSaving.value = false
  }
}

/** 头像上传成功 */
const handleAvatarUploaded = (avatarUrl: string) => {
  if (user.value) {
    authStore.setUser({ ...user.value, avatar: avatarUrl })
  }
}
</script>

<template>
  <div class="settings-card">
    <h3 class="card-title">个人资料</h3>

    <div class="profile-content">
      <!-- 左侧：头像 -->
      <AvatarUpload
        :avatar="user?.avatar || ''"
        :username="user?.username || ''"
        @uploaded="handleAvatarUploaded"
      />

      <!-- 右侧：表单 -->
      <div class="profile-form">
        <div class="form-item">
          <label class="form-label">真实姓名</label>
          <Input
            v-model="form.username"
            placeholder="请输入真实姓名（2-5个汉字）"
            :error="!!errors.username"
            :error-text="errors.username"
            clearable
            @blur="handleUsernameBlur"
          />
        </div>

        <div class="form-item">
          <label class="form-label">个性签名</label>
          <textarea
            v-model="form.signature"
            class="signature-textarea"
            :placeholder="DEFAULT_SIGNATURE"
            :maxlength="SIGNATURE_MAX_LENGTH"
            rows="3"
          />
          <div class="signature-count">{{ form.signature.length }}/{{ SIGNATURE_MAX_LENGTH }}</div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="card-footer">
      <Button
        type="primary"
        :loading="isSaving"
        :disabled="!hasChanges"
        @click="handleSave"
      >
        保存修改
      </Button>
    </div>
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
  margin: 0 0 24px 0;
}

.profile-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.profile-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.signature-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #262626;
  background: #fff;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.signature-textarea::placeholder {
  color: #8c8c8c;
}

.signature-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.signature-count {
  text-align: right;
  font-size: 12px;
  color: #8c8c8c;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 响应式：小屏幕头像在上，表单在下 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
  }

  .profile-form {
    width: 100%;
  }
}
</style>

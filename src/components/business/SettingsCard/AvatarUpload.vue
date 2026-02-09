<script setup lang="ts">
/**
 * 头像上传组件
 * 96px 圆形头像，hover 显示更换遮罩，点击上传
 */
import { ref } from 'vue'
import { message } from '@/components/common'
import { uploadImage, updateProfile } from '@/services/user.service'

interface Props {
  /** 当前头像 URL */
  avatar: string
  /** 用户名（无头像时显示首字母） */
  username: string
}

interface Emits {
  (e: 'uploaded', avatarUrl: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const previewUrl = ref('')

/** 触发文件选择 */
const handleClick = () => {
  if (isUploading.value) return
  fileInputRef.value?.click()
}

/** 文件选中后处理 */
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 重置 input 以便重复选择同一文件
  target.value = ''

  // 本地预览
  previewUrl.value = URL.createObjectURL(file)

  try {
    isUploading.value = true
    // 第一步：上传图片到图片服务
    const images = await uploadImage(file, { skipSuccTip: true })
    const imageUrl = images?.[0]?.url
    if (!imageUrl) {
      message.error('图片上传失败')
      previewUrl.value = ''
      return
    }
    // 第二步：更新用户头像字段
    await updateProfile({ avatar: imageUrl }, { skipSuccTip: true })
    message.success('头像更新成功')
    emit('uploaded', imageUrl)
  } catch (error) {
    // 上传失败，清除预览
    previewUrl.value = ''
  } finally {
    isUploading.value = false
  }
}

/** 显示的头像 URL（优先预览） */
const displayAvatar = () => previewUrl.value || props.avatar
</script>

<template>
  <div class="avatar-upload" @click="handleClick">
    <div class="avatar-container">
      <!-- 头像图片 -->
      <img
        v-if="displayAvatar()"
        :src="displayAvatar()"
        :alt="username"
        class="avatar-image"
      />
      <!-- 无头像占位 -->
      <div v-else class="avatar-placeholder">
        {{ username?.charAt(0) || 'U' }}
      </div>

      <!-- hover 遮罩 -->
      <div class="avatar-overlay" :class="{ uploading: isUploading }">
        <!-- 上传中 loading -->
        <svg v-if="isUploading" class="loading-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.3" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <!-- 相机图标 -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>

    <span class="avatar-tip">更换头像</span>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="file-input"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-container {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-image {
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
  font-size: 32px;
  font-weight: 600;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-overlay svg {
  width: 28px;
  height: 28px;
  color: white;
}

.avatar-overlay.uploading {
  opacity: 1;
}

.avatar-upload:hover .avatar-overlay {
  opacity: 1;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-tip {
  font-size: 12px;
  color: #8c8c8c;
  transition: color 0.2s;
}

.avatar-upload:hover .avatar-tip {
  color: #1890ff;
}

.file-input {
  display: none;
}
</style>

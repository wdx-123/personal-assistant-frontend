<template>
  <div class="oj-card">
    <div class="card-header">
      <h2>
        <div
          v-if="isRebinding"
          class="flip-trigger-front"
          @click="onFlipBack"
          title="返回查看信息"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </div>
        {{ platformName }}
      </h2>
      <span class="status">{{
        isRebinding ? "重新绑定" : "未绑定"
      }}</span>
    </div>

    <div class="card-content">
      <p class="description">{{ displayDescription }}</p>
      <div class="input-group">
        <input
          :value="identifier"
          type="text"
          :placeholder="platform === 'lanqiao' ? '请输入蓝桥杯登录手机号' : placeholder"
          @input="handleIdentifierInput"
          @keydown.enter="onBind"
          :disabled="loading"
        />
      </div>
      <div v-if="platform === 'lanqiao'" class="input-group">
        <input
          :value="secret"
          type="password"
          placeholder="请输入蓝桥杯登录密码"
          @input="handleSecretInput"
          @keydown.enter="onBind"
          :disabled="loading"
        />
      </div>
    </div>

    <div class="card-footer">
      <button
        class="bind-button"
        :disabled="loading || !canSubmit"
        @click="onBind"
      >
        {{
          loading
            ? "绑定中..."
            : isRebinding
              ? "确认重新绑定"
              : "立即绑定"
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OJ 卡片正面 - 绑定输入
 */
import { computed } from 'vue'
import type { OJPlatform } from '@/types'

interface Props {
  platform: OJPlatform
  platformName: string
  description: string
  placeholder: string
  identifier: string
  secret: string
  loading: boolean
  isRebinding: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:identifier', value: string): void
  (e: 'update:secret', value: string): void
  (e: 'bind'): void
  (e: 'flipBack'): void
}>()

const displayDescription = computed(() => {
  if (!props.isRebinding) return props.description
  return props.platform === 'lanqiao'
    ? '输入手机号和密码完成重新绑定'
    : '输入新的用户ID完成重新绑定'
})

const canSubmit = computed(() => {
  if (props.platform !== 'lanqiao') return !!props.identifier
  return !!props.identifier && !!props.secret
})

const handleIdentifierInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:identifier', target.value)
}

const handleSecretInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:secret', target.value)
}

const onBind = () => {
  emit('bind')
}

const onFlipBack = () => {
  emit('flipBack')
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

.oj-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 正面左上角翻转按钮 */
.flip-trigger-front {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  margin-right: 10px;
}

.flip-trigger-front:hover {
  transform: translateX(-3px);
}

.flip-trigger-front svg {
  width: 18px;
  height: 18px;
  color: #8c8c8c;
  transition: color 0.3s ease;
}

.flip-trigger-front:hover svg {
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.status {
  font-size: 14px;
  color: #8c8c8c;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.status.bound {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
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

.description {
  margin: 0 0 20px 0;
  color: #595959;
  font-size: 14px;
  text-align: center;
}

/* 输入框 */
.input-group {
  margin-top: 16px;
}

.input-group input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.input-group input::placeholder {
  color: #bfbfbf;
}

.input-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.bind-button {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #1890ff;
  color: white;
}

.bind-button:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
}

.bind-button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
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
}
</style>

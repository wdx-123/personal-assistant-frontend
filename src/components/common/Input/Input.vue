<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InputProps } from './types'

interface Props extends InputProps {}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'medium',
  disabled: false,
  readonly: false,
  placeholder: '',
  clearable: false,
  showPassword: false,
  autofocus: false,
  error: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'change', value: string | number): void
  (e: 'clear'): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const inputRef = ref<HTMLInputElement>()
const isPasswordVisible = ref(false)
const isFocused = ref(false)

// 计算当前输入类型
const currentType = computed(() => {
  if (props.type === 'password' && props.showPassword) {
    return isPasswordVisible.value ? 'text' : 'password'
  }
  return props.type
})

// 是否显示清除按钮
const showClear = computed(() => {
  return props.clearable && !props.disabled && !props.readonly && props.modelValue && isFocused.value
})

// 计算输入框样式类
const inputClass = computed(() => {
  const classes: string[] = ['input-wrapper', `input-${props.size}`]

  if (props.disabled) {
    classes.push('input-disabled')
  }

  if (props.error) {
    classes.push('input-error')
  }

  if (isFocused.value) {
    classes.push('input-focused')
  }

  return classes.join(' ')
})

// 处理输入事件
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

// 处理聚焦事件
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

// 处理失焦事件
const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  if (props.modelValue !== undefined) {
    emit('change', props.modelValue)
  }
}

// 处理清除事件
const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

// 自动聚焦
if (props.autofocus) {
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}
</script>

<template>
  <div class="input-container">
    <div :class="inputClass">
      <!-- 前缀图标 -->
      <span v-if="prefixIcon" class="input-prefix-icon">
        {{ prefixIcon }}
      </span>

      <!-- 输入框 -->
      <input
        ref="inputRef"
        :type="currentType"
        :class="['input-field', { 'has-prefix': prefixIcon, 'has-suffix': suffixIcon || showClear || showPassword }]"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :minlength="minlength"
        :name="name"
        :value="modelValue"
        :autofocus="autofocus"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- 清除按钮 -->
      <span v-if="showClear" class="input-clear" @mousedown.prevent @click="handleClear">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>

      <!-- 密码切换按钮 -->
      <span v-if="showPassword" class="input-password" @click="togglePasswordVisibility">
        <svg v-if="isPasswordVisible" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      </span>

      <!-- 后缀图标 -->
      <span v-if="suffixIcon" class="input-suffix-icon">
        {{ suffixIcon }}
      </span>
    </div>

    <!-- 错误提示 -->
    <div v-if="error && errorText" class="input-error-text">
      {{ errorText }}
    </div>
  </div>
</template>

<style scoped>
.input-container {
  display: inline-block;
  width: 100%;
}

/* 输入框包装器 */
.input-wrapper {
  display: inline-flex;
  align-items: center;
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: #ffffff;
  transition: all 0.2s ease-in-out;
}

/* 尺寸 */
.input-small {
  height: 28px;
}

.input-small .input-field {
  font-size: 12px;
  padding: 0.25rem 0.5rem;
}

.input-medium {
  height: 36px;
}

.input-medium .input-field {
  font-size: 14px;
  padding: 0.375rem 0.75rem;
}

.input-large {
  height: 44px;
}

.input-large .input-field {
  font-size: 16px;
  padding: 0.5rem 1rem;
}

/* 输入框 */
.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #262626;
  width: 100%;
}

.input-field.has-prefix {
  padding-left: 0;
}

.input-field.has-suffix {
  padding-right: 0;
}

.input-field::placeholder {
  color: #8c8c8c;
}

.input-field:disabled {
  cursor: not-allowed;
  background-color: #f5f5f5;
}

/* 隐藏浏览器原生密码显示按钮（Edge/Chrome） */
.input-field::-ms-reveal,
.input-field::-ms-clear {
  display: none;
}

.input-field::-webkit-credentials-auto-fill-button {
  display: none;
}

/* 前缀图标 */
.input-prefix-icon {
  display: inline-flex;
  align-items: center;
  padding-left: 0.75rem;
  padding-right: 0.5rem;
  color: #8c8c8c;
  font-size: 14px;
}

/* 后缀图标 */
.input-suffix-icon {
  display: inline-flex;
  align-items: center;
  padding-left: 0.5rem;
  padding-right: 0.75rem;
  color: #8c8c8c;
  font-size: 14px;
}

/* 清除按钮 */
.input-clear {
  display: inline-flex;
  align-items: center;
  padding: 0 0.5rem;
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s;
}

.input-clear:hover {
  color: #262626;
}

.input-clear svg {
  width: 14px;
  height: 14px;
}

/* 密码切换按钮 */
.input-password {
  display: inline-flex;
  align-items: center;
  padding: 0 0.5rem;
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s;
}

.input-password:hover {
  color: #262626;
}

.input-password svg {
  width: 16px;
  height: 16px;
}

/* 聚焦状态 */
.input-focused {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 禁用状态 */
.input-disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 错误状态 */
.input-error {
  border-color: #f5222d;
}

.input-error.input-focused {
  border-color: #f5222d;
  box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.1);
}

/* 错误提示文本 */
.input-error-text {
  margin-top: 0.25rem;
  font-size: 12px;
  color: #f5222d;
  line-height: 1.5;
}
</style>

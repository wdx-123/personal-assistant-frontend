<script setup lang="ts">
/**
 * 修改密码弹窗
 * 旧密码 + 新密码 + 确认密码
 */
import { reactive, ref, watch } from 'vue'
import { Input, Modal, message } from '@/components/common'
import { changePassword } from '@/services/user.service'
import { validatePasswordDetail, validatePasswordMatch } from '@/utils/validate'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', val: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)

/** 重置表单 */
const resetForm = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  errors.oldPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
}

/** 弹窗关闭时重置 */
watch(() => props.visible, (val) => {
  if (!val) resetForm()
})

/** 校验所有字段 */
const validate = (): boolean => {
  let isValid = true

  if (!form.oldPassword) {
    errors.oldPassword = '请输入当前密码'
    isValid = false
  } else {
    errors.oldPassword = ''
  }

  const pwdResult = validatePasswordDetail(form.newPassword)
  if (!pwdResult.valid) {
    errors.newPassword = pwdResult.message || ''
    isValid = false
  } else {
    errors.newPassword = ''
  }

  const matchResult = validatePasswordMatch(form.newPassword, form.confirmPassword)
  if (!matchResult.valid) {
    errors.confirmPassword = matchResult.message || ''
    isValid = false
  } else {
    errors.confirmPassword = ''
  }

  return isValid
}

/** 提交修改密码 */
const handleOk = async () => {
  if (!validate()) return

  try {
    isSubmitting.value = true
    await changePassword({
      old_password: form.oldPassword,
      new_password: form.newPassword,
    })
    message.success('密码修改成功')
    emit('update:visible', false)
  } catch (error) {
    // 错误提示由 request.ts 拦截器处理
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Modal
    :visible="visible"
    title="修改密码"
    size="small"
    centered
    :ok-loading="isSubmitting"
    ok-text="确认修改"
    @ok="handleOk"
    @cancel="handleClose"
    @close="handleClose"
  >
    <div class="password-form">
      <div class="form-item">
        <label class="form-label">当前密码</label>
        <Input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          :error="!!errors.oldPassword"
          :error-text="errors.oldPassword"
        />
      </div>

      <div class="form-item">
        <label class="form-label">新密码</label>
        <Input
          v-model="form.newPassword"
          type="password"
          placeholder="8-16 位，包含字母和数字"
          show-password
          :error="!!errors.newPassword"
          :error-text="errors.newPassword"
        />
      </div>

      <div class="form-item">
        <label class="form-label">确认新密码</label>
        <Input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          :error="!!errors.confirmPassword"
          :error-text="errors.confirmPassword"
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.password-form {
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
</style>

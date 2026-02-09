<script setup lang="ts">
/**
 * 换绑手机号弹窗
 * 展示当前手机(脱敏) + 新手机号 + 图形验证码
 */
import { reactive, ref, watch } from 'vue'
import { Input, Modal, message } from '@/components/common'
import { changePhone } from '@/services/user.service'
import { getCaptcha } from '@/services/auth.service'
import { validatePhoneDetail } from '@/utils/validate'

interface Props {
  visible: boolean
  /** 当前手机号（完整） */
  currentPhone: string
}

interface Emits {
  (e: 'update:visible', val: boolean): void
  (e: 'changed', phone: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = reactive({
  password: '',
  newPhone: '',
  captcha: '',
})

const errors = reactive({
  password: '',
  newPhone: '',
  captcha: '',
})

const captchaId = ref('')
const captchaImage = ref('')
const isSubmitting = ref(false)
const isCaptchaLoading = ref(false)

/** 手机号脱敏 */
const maskedPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

/** 获取图形验证码 */
const fetchCaptcha = async () => {
  try {
    isCaptchaLoading.value = true
    const data = await getCaptcha({ skipTip: true })
    captchaId.value = data.captcha_id
    captchaImage.value = data.pic_path
  } catch (error) {
    message.error('获取验证码失败')
  } finally {
    isCaptchaLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  form.password = ''
  form.newPhone = ''
  form.captcha = ''
  errors.password = ''
  errors.newPhone = ''
  errors.captcha = ''
  captchaId.value = ''
  captchaImage.value = ''
}

/** 弹窗打开时加载验证码，关闭时重置 */
watch(() => props.visible, (val) => {
  if (val) {
    fetchCaptcha()
  } else {
    resetForm()
  }
})

/** 校验所有字段 */
const validate = (): boolean => {
  let isValid = true

  if (!form.password) {
    errors.password = '请输入当前密码'
    isValid = false
  } else {
    errors.password = ''
  }

  const phoneResult = validatePhoneDetail(form.newPhone)
  if (!phoneResult.valid) {
    errors.newPhone = phoneResult.message || ''
    isValid = false
  } else if (form.newPhone === props.currentPhone) {
    errors.newPhone = '新手机号不能与当前手机号相同'
    isValid = false
  } else {
    errors.newPhone = ''
  }

  if (!form.captcha) {
    errors.captcha = '请输入验证码'
    isValid = false
  } else {
    errors.captcha = ''
  }

  return isValid
}

/** 提交换绑 */
const handleOk = async () => {
  if (!validate()) return

  try {
    isSubmitting.value = true
    await changePhone({
      password: form.password,
      new_phone: form.newPhone,
      captcha: form.captcha,
      captcha_id: captchaId.value,
    })
    message.success('手机号换绑成功')
    emit('changed', form.newPhone)
    emit('update:visible', false)
  } catch (error) {
    // 换绑失败，刷新验证码
    fetchCaptcha()
    form.captcha = ''
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
    title="修改手机号"
    size="small"
    centered
    :ok-loading="isSubmitting"
    ok-text="确认修改"
    @ok="handleOk"
    @cancel="handleClose"
    @close="handleClose"
  >
    <div class="phone-form">
      <!-- 当前手机号 -->
      <div class="current-phone">
        <span class="current-label">当前手机号</span>
        <span class="current-value">{{ maskedPhone(currentPhone) }}</span>
      </div>

      <!-- 当前密码 -->
      <div class="form-item">
        <label class="form-label">当前密码</label>
        <Input
          v-model="form.password"
          type="password"
          placeholder="请输入当前密码以验证身份"
          show-password
          :error="!!errors.password"
          :error-text="errors.password"
        />
      </div>

      <!-- 新手机号 -->
      <div class="form-item">
        <label class="form-label">新手机号</label>
        <Input
          v-model="form.newPhone"
          type="tel"
          placeholder="请输入新手机号"
          :error="!!errors.newPhone"
          :error-text="errors.newPhone"
          clearable
        />
      </div>

      <!-- 图形验证码 -->
      <div class="form-item">
        <label class="form-label">验证码</label>
        <div class="captcha-row">
          <Input
            v-model="form.captcha"
            placeholder="请输入验证码"
            :error="!!errors.captcha"
            :error-text="errors.captcha"
          />
          <div class="captcha-image" @click="fetchCaptcha">
            <img
              v-if="captchaImage"
              :src="captchaImage"
              alt="验证码"
            />
            <span v-else class="captcha-placeholder">
              {{ isCaptchaLoading ? '加载中...' : '点击获取' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.phone-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-phone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.current-label {
  font-size: 14px;
  color: #8c8c8c;
  flex-shrink: 0;
}

.current-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
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

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.captcha-row > :first-child {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 36px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  transition: border-color 0.2s;
}

.captcha-image:hover {
  border-color: #1890ff;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-placeholder {
  font-size: 12px;
  color: #8c8c8c;
}
</style>

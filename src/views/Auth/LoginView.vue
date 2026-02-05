<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Button, Input, message } from "@/components/common";
import { Captcha } from "@/components/business";
import { useAuthStore } from "@/stores/auth";
import {
  validatePhoneDetail,
  validatePasswordDetail,
  validateCaptchaDetail,
} from "@/utils/validate";

const router = useRouter();
const authStore = useAuthStore();

// 表单数据
const phone = ref("");
const password = ref("");
const captcha = ref("");
const captchaId = ref("");

// 状态
const loading = ref(false);//当true时显示加载并禁用
const agreeTerms = ref(false);
const showSkeleton = ref(true);//是否显示骨架屏，用于过渡

// 验证码组件引用
const captchaRef = ref<InstanceType<typeof Captcha>>();

// 表单验证
const validateForm = () => {
  const phoneResult = validatePhoneDetail(phone.value);
  if (!phoneResult.valid) {
    message.warning(phoneResult.message || "验证失败");
    return false;
  }

  const passwordResult = validatePasswordDetail(password.value);
  if (!passwordResult.valid) {
    message.warning(passwordResult.message || "验证失败");
    return false;
  }

  const captchaResult = validateCaptchaDetail(captcha.value);
  if (!captchaResult.valid) {
    message.warning(captchaResult.message || "验证失败");
    return false;
  }

  return true;
};

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    loading.value = true;

    // ✅ 登录成功弹提示，失败不自动弹提示（在catch中手动处理）
    const result = await authStore.login(
      phone.value,
      password.value,
      captcha.value,
      captchaId.value,
      {
        skipErrTip: true, // 失败不自动弹提示，在catch中手动处理
      },
    );

    if (result.success) {
      router.push("/home");
    } else {
      captchaRef.value?.refresh();
    }
  } catch (error: unknown) {
    const err = error as { code?: number; error?: string };
    if(err?.code === 5000) {
      message.warning("请检查网络或联系工作人员");
      return;
    }
    const errorMsg = err?.error || "登录失败，请检查手机号、密码、验证码是否有误";
    message.error(errorMsg);

    captchaRef.value?.refresh();
  } finally {
    loading.value = false;
  }
};

// 跳转到注册页
const goToRegister = () => {
  router.push("/register");
};

// 验证码变化
const handleCaptchaChange = (id: string) => {
  captchaId.value = id;
};

// 忘记密码
const handleForgotPassword = () => {
  message.info("忘记密码功能开发中");
};

onMounted(() => {
  setTimeout(() => {
    showSkeleton.value = false;
  }, 200);
});
</script>

<template>
  <div class="login-view">
    <!-- 登录框 -->
    <div class="login-container">
      <div class="login-box">
        <div v-if="showSkeleton" class="login-skeleton">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
          <div class="skeleton-field"></div>
          <div class="skeleton-field"></div>
          <div class="skeleton-field"></div>
          <div class="skeleton-actions"></div>
          <div class="skeleton-button"></div>
          <div class="skeleton-link"></div>
        </div>
        <div v-else>
          <div class="login-header">
            <h1 class="login-title">个人助手</h1>
            <p class="login-subtitle">登录您的账户</p>
          </div>

          <div class="login-form">
            <div class="form-item">
              <div class="form-label">手机号</div>
              <Input
                v-model="phone"
                type="tel"
                placeholder="请输入手机号"
                :maxlength="11"
                clearable
              />
            </div>

            <div class="form-item">
              <div class="form-label">密码</div>
              <Input
                v-model="password"
                type="password"
                placeholder="请输入密码（8-16位）"
                show-password
                @keydown.enter="handleLogin"
              />
            </div>

            <div class="form-item">
              <div class="form-label">验证码</div>
              <Captcha
                ref="captchaRef"
                v-model="captcha"
                @change="handleCaptchaChange"
              />
            </div>

            <div class="form-actions">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreeTerms" />
                <span>我已阅读并同意</span>
                <a href="#" class="link">《用户协议》</a>
                <span>和</span>
                <a href="#" class="link">《隐私政策》</a>
              </label>
              <a
                href="#"
                class="link forgot-link"
                @click.prevent="handleForgotPassword"
                >忘记密码？</a
              >
            </div>

            <Button
              type="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!agreeTerms"
              @click="handleLogin"
            >
              登录
            </Button>

            <div class="register-link">
              还没有账户？
              <a href="#" class="link" @click.prevent="goToRegister">立即注册</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 登录容器 */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

/* 登录框 */
.login-box {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-skeleton > div {
  background: linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
  border-radius: 8px;
}

.skeleton-title {
  height: 28px;
  width: 50%;
  margin: 0 auto;
}

.skeleton-subtitle {
  height: 16px;
  width: 60%;
  margin: 0 auto 8px;
}

.skeleton-field {
  height: 44px;
  width: 100%;
}

.skeleton-actions {
  height: 16px;
  width: 100%;
}

.skeleton-button {
  height: 48px;
  width: 100%;
}

.skeleton-link {
  height: 16px;
  width: 40%;
  margin: 0 auto;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #8c8c8c;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* 表单操作 */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #595959;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.link {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.2s;
}

.link:hover {
  color: #40a9ff;
}

.forgot-link {
  color: #595959;
  text-decoration: none;
}

.forgot-link:hover {
  color: #1890ff;
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: #595959;
  margin-top: 8px;
}
</style>

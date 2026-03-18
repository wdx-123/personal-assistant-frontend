<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Button, Input, message } from "@/components/common";
import { Captcha } from "@/components/business";
import { register as registerApi, getOrgList } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth";
import { VALIDATION_MESSAGES } from "@/constants/validation";
import {
  validateRealNameDetail,
  validatePhoneDetail,
  validatePasswordDetail,
  validatePasswordMatch,
  validateCaptchaDetail,
} from "@/utils/validate";

const router = useRouter();
const authStore = useAuthStore();

// 表单数据
const realName = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const inviteCode = ref("");
const captcha = ref("");
const captchaId = ref("");
// 状态
const loading = ref(false);
const agreeTerms = ref(false);
const orgList = ref<Array<{ id: number; name: string }>>([]);

// 验证码组件引用
const captchaRef = ref<InstanceType<typeof Captcha>>();

// 表单验证
const validateForm = () => {
  const realNameResult = validateRealNameDetail(realName.value);
  if (!realNameResult.valid) {
    message.warning(realNameResult.message || "验证失败");
    return false;
  }

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

  const confirmResult = validatePasswordMatch(
    password.value,
    confirmPassword.value,
  );
  if (!confirmResult.valid) {
    message.warning(confirmResult.message || "验证失败");
    return false;
  }

  if (!inviteCode.value.trim()) {
    message.warning("请输入团队邀请码");
    return false;
  }

  const captchaResult = validateCaptchaDetail(captcha.value);
  if (!captchaResult.valid) {
    message.warning(captchaResult.message || "验证失败");
    return false;
  }

  if (!agreeTerms.value) {
    message.warning(VALIDATION_MESSAGES.AGREEMENT_REQUIRED);
    return false;
  }

  return true;
};

// 处理注册
const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    loading.value = true;

    // ✅ 注册并获取用户信息
    const {
      user: userData,
      access_token,
      access_token_expires_at,
      refresh_token,
    } = await registerApi(
      {
        username: realName.value,
        phone: phone.value,
        password: password.value,
        captcha: captcha.value,
        captcha_id: captchaId.value,
        invite_code: inviteCode.value.trim(),
        org_id: 0, // 强制使用邀请码，不传org_id
      },
      {
        customSuccTip: "注册成功！正在自动登录...", // 自定义成功提示
      },
    );

    // ✅ 保存用户信息和 Token（自动登录）
    authStore.setUser(userData);
    authStore.setToken(access_token, access_token_expires_at);
    if (refresh_token) {
      authStore.setRefreshToken(refresh_token);
    }

    // ✅ 注册成功后跳转到首页
    setTimeout(() => {
      router.push("/home");
    }, 1000);
  } catch (error) {
    // ✅ 失败已由拦截器自动处理并弹提示
    captchaRef.value?.refresh();
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push("/login");
};

// 验证码变化
const handleCaptchaChange = (id: string) => {
  captchaId.value = id;
};

// 加载组织列表（可选，静默请求）
const loadOrgList = async () => {
  try {
    // ✅ 静默请求，不弹任何提示
    const response = await getOrgList(0, 0, {
      skipTip: true,
    });

    // ✅ 优化：直接使用返回数据，无需判断 code
    orgList.value = response.list || [];
  } catch (error) {
    // 组织列表加载失败不影响注册流程
    orgList.value = [];
  }
};

// 组件挂载时加载组织列表
import { onMounted } from "vue";
onMounted(() => {
  loadOrgList();
});
</script>

<template>
  <div class="register-view">
    <!-- 注册框 -->
    <div class="register-container">
      <div class="register-box">
        <!-- Logo 和标题 -->
        <div class="register-header">
          <h1 class="register-title">个人助手</h1>
          <p class="register-subtitle">创建新账户</p>
        </div>

        <!-- 注册表单 -->
        <div class="register-form">
          <!-- 姓名 -->
          <div class="form-item">
            <div class="form-label">姓名</div>
            <Input
              v-model="realName"
              type="text"
              placeholder="请输入真实姓名"
              :maxlength="20"
              clearable
            />
          </div>

          <!-- 手机号 -->
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

          <!-- 密码 -->
          <div class="form-item">
            <div class="form-label">密码</div>
            <Input
              v-model="password"
              type="password"
              placeholder="请输入密码（8-16位）"
              show-password
            />
          </div>

          <!-- 确认密码 -->
          <div class="form-item">
            <div class="form-label">确认密码</div>
            <Input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </div>

          <!-- 团队邀请码 -->
          <div class="form-item">
            <div class="form-label">团队邀请码</div>
            <Input
              v-model="inviteCode"
              type="text"
              placeholder="请输入团队邀请码（必填）"
              clearable
            />
          </div>

          <!-- 验证码 -->
          <div class="form-item">
            <div class="form-label">验证码</div>
            <Captcha
              ref="captchaRef"
              v-model="captcha"
              @change="handleCaptchaChange"
            />
          </div>

          <!-- 用户协议 -->
          <div class="form-actions">
            <label class="checkbox-label">
              <input type="checkbox" v-model="agreeTerms" />
              <span>我已阅读并同意</span>
              <a href="#" class="link">《用户协议》</a>
              <span>和</span>
              <a href="#" class="link">《隐私政策》</a>
            </label>
          </div>

          <!-- 注册按钮 -->
          <Button
            type="primary"
            size="large"
            block
            :loading="loading"
            :disabled="!agreeTerms"
            @click="handleRegister"
          >
            注册
          </Button>

          <!-- 登录链接 -->
          <div class="login-link">
            已有账户？
            <a href="#" class="link" @click.prevent="goToLogin">立即登录</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
}

/* 注册容器 */
.register-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
}

/* 注册框 */
.register-box {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

/* 注册头部 */
.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.register-subtitle {
  font-size: 14px;
  color: #8c8c8c;
}

/* 表单 */
.register-form {
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

/* 组织选择 */
.org-select {
  width: 100%;
  height: 36px;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #262626;
  background-color: #ffffff;
  transition: all 0.2s;
}

.org-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 表单操作 */
.form-actions {
  font-size: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #595959;
  cursor: pointer;
  flex-wrap: wrap;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.link {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}

.link:hover {
  color: #40a9ff;
}

/* 登录链接 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: #595959;
  margin-top: 8px;
}
</style>

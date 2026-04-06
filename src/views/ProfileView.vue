<script setup lang="ts">
import { computed, reactive, watch, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button, Input, message } from "@/components/common";

const HeaderBar = defineAsyncComponent(() => import("@/components/layout/HeaderBar.vue"));
const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

type FormState = {
  username: string;
  phone: string;
  email: string;
  signature: string;
  organization: string;
  address: string;
  created_at: string;
  updated_at: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const createFormState = (data: typeof user.value): FormState => ({
  username: data?.username || "",
  phone: data?.phone || "",
  email: data?.email || "",
  signature: data?.signature || "",
  organization: data?.current_org?.name || (data?.current_org_id ? String(data.current_org_id) : ""),
  address: data?.address || "",
  created_at: formatDate(data?.created_at),
  updated_at: formatDate(data?.updated_at),
});

const form = reactive<FormState>(createFormState(user.value));

watch(
  user,
  (next) => {
    Object.assign(form, createFormState(next));
  },
  { immediate: true }
);

const goBack = () => {
  router.push("/home");
};

const handleSave = () => {
  message.info("该功能开发中");
};
</script>

<template>
  <div class="profile-view">
    <HeaderBar />
    <div class="profile-container">
      <div class="content">
        <div class="profile-card">
          <div class="profile-card-header">
            <div class="profile-title">个人信息</div>
            <div class="profile-actions">
              <button class="back-button" @click="goBack">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>返回</span>
              </button>
              <Button type="primary" size="medium" @click="handleSave">保存</Button>
            </div>
          </div>
          <div class="profile-form">
            <div class="form-item">
              <div class="form-label">用户名</div>
              <Input v-model="form.username" placeholder="请输入用户名" />
            </div>
            <div class="form-item">
              <div class="form-label">手机号</div>
              <Input v-model="form.phone" type="tel" placeholder="请输入手机号" />
            </div>
            <div class="form-item">
              <div class="form-label">邮箱</div>
              <Input v-model="form.email" type="email" placeholder="请输入邮箱" />
            </div>
            <div class="form-item">
              <div class="form-label">签名</div>
              <Input v-model="form.signature" placeholder="请输入签名" />
            </div>
            <div class="form-item">
              <div class="form-label">组织</div>
              <Input v-model="form.organization" placeholder="请输入组织" />
            </div>
            <div class="form-item">
              <div class="form-label">地址</div>
              <Input v-model="form.address" placeholder="请输入地址" />
            </div>
            <div class="form-item">
              <div class="form-label">创建时间</div>
              <Input v-model="form.created_at" readonly placeholder="-" />
            </div>
            <div class="form-item">
              <div class="form-label">更新时间</div>
              <Input v-model="form.updated_at" readonly placeholder="-" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.profile-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.profile-container {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 28px;
  box-sizing: border-box;
  overflow-y: auto;
}
.content{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button svg {
  width: 18px;
  height: 18px;
  color: #595959;
}

.back-button span {
  font-size: 14px;
  color: #262626;
}

.back-button:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.profile-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.profile-card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 56px 50px 72px;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
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

@media (max-width: 1200px) {
  .profile-container {
    max-width: 800px;
  }
}

@media (max-width: 800px) {
  .profile-container {
    max-width: none;
    padding: 20px 16px 16px;
  }

  .profile-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-card-header {
    align-items: flex-start;
  }

  .profile-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

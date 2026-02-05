<template>
  <div class="header-bar-wrapper">
    <!-- 触发按钮 -->
    <button
      class="trigger-button"
      @click="toggleHeaderBar"
      :class="{ active: isVisible }"
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
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
    <a
      v-show="showNoticeButton"
      class="notice-button"
      :href="noticeLink"
      target="_blank"
      rel="noopener noreferrer"
      title="公告"
      aria-label="公告"
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
          d="M12 3a7 7 0 00-4 12.743V19a1 1 0 001 1h6a1 1 0 001-1v-3.257A7 7 0 0012 3zm-2 18h4m-3-4h2"
        />
      </svg>
    </a>

    <!-- Header Bar -->
    <transition name="slide-down">
      <div v-if="isVisible" class="header-bar" :class="{ 'console-mode': isConsolePage }">
        <div class="header-bar-content">
          <!-- Logo -->
          <div class="logo">
            <h1>个人助手</h1>
          </div>

          <!-- 用户信息区域 -->
          <div class="user-section">
            <!-- 昵称和手机号 -->
            <div class="user-details">
              <div class="user-name">{{ user?.username || "未登录" }}</div>
              <div class="user-phone">{{ user?.phone || "" }}</div>
            </div>

            <!-- 用户头像（可点击） -->
            <div class="user-dropdown-wrapper" ref="dropdownRef">
              <button
                class="user-avatar-button"
                @click.stop="toggleDropdown"
                :class="{ active: isDropdownVisible }"
              >
                <div class="user-avatar">
                  <img
                    v-if="user?.avatar"
                    :src="user.avatar"
                    :alt="user.username"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ user?.username?.charAt(0) || "U" }}
                  </div>
                </div>
                <!-- 下拉箭头 -->
                <svg
                  class="dropdown-arrow"
                  :class="{ rotated: isDropdownVisible }"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- 下拉菜单 -->
              <transition name="dropdown-fade">
                <div v-if="isDropdownVisible" class="user-dropdown">
                  <!-- 个人信息 -->
                  <button class="dropdown-item" @click.stop="handleProfile">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>个人信息</span>
                  </button>

                  <!-- 退出登录 -->
                  <button
                    class="dropdown-item dropdown-logout"
                    @click.stop="handleLogout"
                    :disabled="isLoggingOut"
                  >
                    <svg
                      v-if="!isLoggingOut"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <svg
                      v-else
                      class="logout-loading"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="loading-circle"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                    </svg>
                    <span>{{ isLoggingOut ? "退出中..." : "退出登录" }}</span>
                  </button>
                </div>
              </transition>
            </div>

            <!-- 控制台/首页按钮 -->
            <button class="console-button" @click="handleNavigation" :title="isConsolePage ? '返回首页' : '控制台'">
              <span>{{ isConsolePage ? '首页' : '控制台' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * HeaderBar 组件
 * 默认隐藏，通过顶部小按钮触发显示
 * 用户头像在右侧，点击显示下拉菜单
 */
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { message } from "@/components/common";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 判断是否在控制台页面
const isConsolePage = computed(() => route.path.startsWith('/console'));

// 是否显示 Header Bar
const isVisible = ref(false);

// 监听路由变化，切换页面时默认隐藏
import { watch } from 'vue';
watch(() => route.path, () => {
  isVisible.value = false;
});

// 是否显示下拉菜单
const isDropdownVisible = ref(false);

// 是否正在登出（防止重复点击）
const isLoggingOut = ref(false);

// 下拉菜单容器的引用
const dropdownRef = ref<HTMLElement | null>(null);

// 用户信息
const user = computed(() => authStore.user);
const noticeLink =
  "https://blog.csdn.net/2302_80067378/article/details/157281818?spm=1001.2014.3001.5501";
const showNoticeButton = computed(() => !isVisible.value);

/**
 * 切换 HeaderBar 显示/隐藏
 */
const toggleHeaderBar = () => {
  isVisible.value = !isVisible.value;
  if (!isVisible.value) {
    isDropdownVisible.value = false;
  }
};

/**
 * 切换下拉菜单
 */
const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value;
};

/**
 * 关闭下拉菜单
 */
const closeDropdown = () => {
  isDropdownVisible.value = false;
};

/**
 * 处理点击外部区域
 */
const handleClickOutside = (event: MouseEvent) => {
  if (isDropdownVisible.value && dropdownRef.value) {
    // 检查点击是否在下拉菜单外部
    if (!dropdownRef.value.contains(event.target as Node)) {
      closeDropdown();
    }
  }
};

/**
 * 点击个人信息
 */
const handleProfile = () => {
  router.push("/profile");
  closeDropdown();
};

/**
 * 跳转到控制台或首页
 */
const handleNavigation = () => {
  // 先收起 HeaderBar
  isVisible.value = false;
  isDropdownVisible.value = false;
  
  // 等待动画结束后跳转
  setTimeout(() => {
    if (isConsolePage.value) {
      router.push("/home");
    } else {
      router.push("/console");
    }
  }, 300);
};

/**
 * 退出登录
 * 1. 调用后端接口将RefreshToken加入黑名单
 * 2. 清除本地状态（无论接口成功与否）
 * 3. 跳转到登录页
 */
const handleLogout = async () => {
  // 防止重复点击
  if (isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;

  try {
    // 调用 authStore 的 logout 方法
    // 该方法会：
    // 1. 调用后端 /user/logout 接口（将 RefreshToken 加入黑名单）
    // 2. 清除本地状态（Pinia store + localStorage）
    await authStore.logout();

    // 显示成功提示
    message.success("已退出登录");

    // 关闭下拉菜单
    closeDropdown();

    // 跳转到登录页
    router.push("/login");
  } catch (error) {
    // 理论上不会进入这里，因为 authStore.logout 已经捕获了所有错误
    // 但为了代码健壮性，保留错误处理
    message.error("退出登录失败，请重试");
  } finally {
    isLoggingOut.value = false;
  }
};

// 组件挂载时添加全局点击监听
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

// 组件卸载时移除监听
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.header-bar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* 触发按钮 */
.trigger-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
}

.trigger-button:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.trigger-button.active {
  background: #1890ff;
  border-color: #1890ff;
}

.trigger-button.active svg {
  color: white;
}

.trigger-button svg {
  width: 24px;
  height: 24px;
  color: #595959;
  transition: color 0.3s ease;
}

.notice-button {
  position: absolute;
  top: 64px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  text-decoration: none;
}

.notice-button:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.notice-button svg {
  width: 22px;
  height: 22px;
  color: #595959;
  transition: color 0.3s ease;
}

/* Header Bar */
.header-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-bar-content {
  max-width: 1200px;
  height: 64px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* Logo */
.logo h1 {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

/* 用户信息区域 */
.user-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 用户详细信息 */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

.user-phone {
  font-size: 13px;
  color: #8c8c8c;
}

/* 用户下拉容器 */
.user-dropdown-wrapper {
  position: relative;
}

/* 用户头像按钮 */
.user-avatar-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-avatar-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-avatar-button.active {
  background: rgba(24, 144, 255, 0.1);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
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
  font-size: 16px;
  font-weight: 600;
}

/* 下拉箭头 */
.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: #8c8c8c;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 1000;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #262626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
  color: #595959;
}

.dropdown-item.dropdown-logout {
  color: #ff4d4f;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
  padding-top: 12px;
}

.dropdown-item.dropdown-logout svg {
  color: #ff4d4f;
}

.dropdown-item.dropdown-logout:hover {
  background: #fff1f0;
}

/* 退出登录按钮禁用状态 */
.dropdown-item.dropdown-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropdown-item.dropdown-logout:disabled:hover {
  background: transparent;
}

/* 退出登录加载动画 */
.logout-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-circle {
  stroke-dasharray: 40;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 下拉菜单淡入淡出动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 滑动动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.header-bar.console-mode {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 控制台按钮 */
.console-button {
  height: 40px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #595959;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  font-weight: 500;
}

.console-button:hover {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
  transform: scale(1.05);
}

.console-button span {
  line-height: 1;
}

/* 响应式 */
@media (max-width: 1200px) {
  .header-bar-content {
    max-width: 800px;
  }
}

@media (max-width: 800px) {
  .header-bar-content {
    max-width: none;
  }
}

@media (max-width: 768px) {
  .header-bar-content {
    height: 64px;
    padding: 0 16px;
  }

  .logo h1 {
    font-size: 16px;
  }

  .user-phone {
    display: none;
  }
}
</style>

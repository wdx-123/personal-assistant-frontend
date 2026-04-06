<template>
  <header class="header-bar" :class="{ 'header-bar--console': isConsolePage }">
    <div class="header-bar__left">
      <template v-if="isConsolePage">
        <Button
          type="text"
          class="header-bar__collapse"
          @click="emit('toggleSider')"
        >
          <template #icon>
            <MenuUnfoldOutlined v-if="collapsed" />
            <MenuFoldOutlined v-else />
          </template>
        </Button>

        <Breadcrumb class="header-bar__breadcrumb">
          <BreadcrumbItem
            v-for="item in breadcrumbItems"
            :key="item.path"
          >
            <button
              v-if="item.path && item.path !== route.path"
              type="button"
              class="header-bar__breadcrumb-link"
              @click="navigateTo(item.path)"
            >
              {{ item.title }}
            </button>
            <span v-else>{{ item.title }}</span>
          </BreadcrumbItem>
        </Breadcrumb>
      </template>

      <template v-else>
        <RouterLink to="/home" class="header-bar__brand">
          <div class="header-bar__brand-icon">
            <img :src="projectIcon" alt="项目图标" />
          </div>
          <div class="header-bar__brand-copy">
            <span class="header-bar__brand-title">个人助手</span>
            <span class="header-bar__brand-subtitle">{{ currentPageTitle }}</span>
          </div>
        </RouterLink>
      </template>
    </div>

    <div class="header-bar__right">
      <Button class="header-bar__switch" @click="handleNavigation">
        <template #icon>
          <HomeOutlined v-if="isConsolePage" />
          <AppstoreOutlined v-else />
        </template>
        {{ isConsolePage ? '首页' : '控制台' }}
      </Button>

      <Dropdown placement="bottomRight" trigger="click">
        <button type="button" class="header-bar__user-trigger">
          <Avatar
            class="header-bar__avatar"
            :src="user?.avatar || undefined"
          >
            {{ userInitial }}
          </Avatar>
          <div class="header-bar__user-copy">
            <span class="header-bar__user-name">{{ user?.username || '未登录' }}</span>
            <span class="header-bar__user-meta">{{ user?.phone || currentPageTitle }}</span>
          </div>
          <DownOutlined class="header-bar__user-arrow" />
        </button>

        <template #overlay>
          <Menu :items="userMenuItems" @click="handleUserMenuClick" />
        </template>
      </Dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  AppstoreOutlined,
  DownOutlined,
  HomeOutlined,
  LoadingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { Avatar, Breadcrumb, Button, Dropdown, Menu } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { h, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from '@/components/common'
import projectIcon from '@/assets/branding/project-icon.svg'
import { useAuthStore } from '@/stores/auth'

const BreadcrumbItem = Breadcrumb.Item

withDefaults(
  defineProps<{
    collapsed?: boolean
    isBroken?: boolean
  }>(),
  {
    collapsed: false,
    isBroken: false,
  },
)

const emit = defineEmits<{
  toggleSider: []
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isConsolePage = computed(() => route.path.startsWith('/console'))
const isLoggingOut = ref(false)
const user = computed(() => authStore.user)
const userInitial = computed(() => user.value?.username?.charAt(0)?.toUpperCase() || 'U')
const currentPageTitle = computed(() => String(route.meta?.title || '个人助手'))

const breadcrumbItems = computed(() =>
  route.matched
    .filter(
      (record) =>
        record.path.startsWith('/console') &&
        typeof record.meta?.title === 'string' &&
        record.meta.title.trim().length > 0,
    )
    .map((record) => ({
      path: record.path,
      title: String(record.meta?.title || ''),
    })),
)

const userMenuItems = computed<MenuProps['items']>(() => [
  {
    key: 'profile',
    icon: h(UserOutlined),
    label: '个人信息',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    danger: true,
    disabled: isLoggingOut.value,
    icon: h(isLoggingOut.value ? LoadingOutlined : LogoutOutlined),
    label: isLoggingOut.value ? '退出中...' : '退出登录',
  },
])

const navigateTo = (path: string) => {
  if (route.path === path) return
  void router.push(path)
}

const handleNavigation = () => {
  navigateTo(isConsolePage.value ? '/home' : '/console')
}

const handleProfile = () => {
  navigateTo('/profile')
}

const handleLogout = async () => {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await authStore.logout()
    message.success('已退出登录')
    navigateTo('/login')
  } catch (error) {
    message.error('退出登录失败，请重试')
  } finally {
    isLoggingOut.value = false
  }
}

const handleUserMenuClick = ({ key }: { key: string | number }) => {
  if (key === 'profile') {
    handleProfile()
    return
  }

  if (key === 'logout') {
    void handleLogout()
  }
}
</script>

<style scoped>
.header-bar {
  width: 100%;
  min-width: 0;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.header-bar--console {
  padding-inline: 20px 24px;
}

.header-bar__left,
.header-bar__right {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-bar__left {
  flex: 1;
}

.header-bar__right {
  flex-shrink: 0;
}

.header-bar__collapse {
  width: 40px;
  height: 40px;
  color: #334155;
  border-radius: 10px;
}

.header-bar__collapse:hover {
  background: #f1f5f9;
}

.header-bar__breadcrumb {
  min-width: 0;
}

.header-bar__breadcrumb-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #1677ff;
  cursor: pointer;
}

.header-bar__breadcrumb-link:hover {
  color: #4096ff;
}

.header-bar__brand {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.header-bar__brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #dbeafe;
  flex-shrink: 0;
}

.header-bar__brand-icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.header-bar__brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-bar__brand-title {
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.1;
}

.header-bar__brand-subtitle {
  color: #64748b;
  font-size: 12px;
  line-height: 1.1;
}

.header-bar__switch {
  height: 38px;
  border-radius: 10px;
}

.header-bar__user-trigger {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 6px;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease;
}

.header-bar__user-trigger:hover {
  background: #f8fafc;
}

.header-bar__avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #1677ff 0%, #3b82f6 100%);
}

.header-bar__user-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.header-bar__user-name {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.1;
}

.header-bar__user-meta {
  color: #64748b;
  font-size: 12px;
  line-height: 1.1;
}

.header-bar__user-arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

@media (max-width: 991px) {
  .header-bar {
    padding-inline: 16px;
  }

  .header-bar__user-copy {
    display: none;
  }
}

@media (max-width: 640px) {
  .header-bar__switch span {
    display: none;
  }

  .header-bar__breadcrumb :deep(.ant-breadcrumb-link),
  .header-bar__breadcrumb :deep(.ant-breadcrumb-separator) {
    font-size: 12px;
  }
}
</style>

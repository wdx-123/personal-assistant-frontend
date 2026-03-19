import type { RouteRecordRaw } from 'vue-router'

export const basicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/LoginView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      guest: true,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/RegisterView.vue'),
    meta: {
      title: '注册',
      requiresAuth: false,
      guest: true,
    },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {
      title: '个人信息',
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '404',
      hidden: true,
    },
  },
]

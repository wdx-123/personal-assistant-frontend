/**
 * 路由配置
 */

import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Auth/LoginView.vue"),
    meta: {
      title: "登录",
      requiresAuth: false,
      guest: true, // 标记为游客页面
    },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Auth/RegisterView.vue"),
    meta: {
      title: "注册",
      requiresAuth: false,
      guest: true, // 标记为游客页面
    },
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
    meta: {
      title: "首页",
      requiresAuth: true,
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("@/views/ProfileView.vue"),
    meta: {
      title: "个人信息",
      requiresAuth: true,
    },
  },
  {
    path: "/console",
    name: "Console",
    component: () => import("@/views/ConsoleView.vue"),
    redirect: "/console/dashboard",
    meta: {
      title: "控制台",
      requiresAuth: true,
    },
    children: [
      {
        path: "dashboard",
        name: "ConsoleDashboard",
        component: () => import("@/views/Console/Dashboard.vue"),
        meta: { title: "控制台 - 主页" }
      },
      {
        path: "permission",
        name: "ConsolePermission",
        component: () => import("@/views/Console/Permission.vue"),
        meta: { title: "控制台 - 权限管理" },
        redirect: "/console/permission/role",
        children: [
          {
            path: "role",
            name: "PermissionRole",
            component: () => import("@/views/Console/Permission/RoleManagement.vue"),
            meta: { title: "权限管理 - 角色管理" }
          },
          {
            path: "api",
            name: "PermissionApi",
            component: () => import("@/views/Console/Permission/ApiManagement.vue"),
            meta: { title: "权限管理 - API管理" }
          },
          {
            path: "menu",
            name: "PermissionMenu",
            component: () => import("@/views/Console/Permission/MenuManagement.vue"),
            meta: { title: "权限管理 - 菜单管理" }
          }
        ]
      },
      {
        path: "team",
        name: "ConsoleTeam",
        component: () => import("@/views/Console/Team.vue"),
        meta: { title: "控制台 - 团队管理" },
        redirect: "/console/team/list",
        children: [
          {
            path: "list",
            name: "TeamList",
            component: () => import("@/views/Console/Team/MyTeam.vue"),
            meta: { title: "我的团队" }
          },
          {
            path: "members",
            name: "TeamMembers",
            component: () => import("@/views/Console/Team/TeamMembers.vue"),
            meta: { title: "团队成员" }
          }
        ]
      },
      {
        path: "settings",
        name: "ConsoleSettings",
        component: () => import("@/views/Console/Settings.vue"),
        meta: { title: "控制台 - 设置" }
      }
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // 恢复认证信息
  if (!authStore.isLoggedIn) {
    authStore.restoreAuth();
  }

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 个人助手`;
  }

  const requiresAuth = to.meta.requiresAuth;
  const isGuestRoute = to.meta.guest;
  const isLoggedIn = authStore.isLoggedIn;

  if (requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    next({
      path: "/login",
      query: { redirect: to.fullPath }, // 保存原始路径
    });
  } else if (isGuestRoute && isLoggedIn) {
    // 已登录用户访问游客页面，跳转到首页
    next("/home");
  } else {
    next();
  }
});

export default router;

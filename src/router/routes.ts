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

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/console',
    name: 'Console',
    component: () => import('@/views/ConsoleView.vue'),
    redirect: '/console/dashboard',
    meta: {
      title: '控制台',
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'ConsoleDashboard',
        component: () => import('@/views/Console/Dashboard.vue'),
        meta: { title: '主页' }
      },
      {
        path: 'workbench',
        name: 'ConsoleWorkbench',
        component: () => import('@/views/Console/Workbench.vue'),
        meta: { title: '工作台' },
        redirect: '/console/workbench/task',
        children: [
          {
            path: 'task',
            name: 'WorkbenchTask',
            component: () => import('@/views/Console/Workbench/TaskWorkbench.vue'),
            meta: { title: 'OJ任务' }
          }
        ]
      },
      {
        path: 'permission',
        name: 'ConsolePermission',
        component: () => import('@/views/Console/Permission.vue'),
        meta: { title: '权限管理' },
        redirect: '/console/permission/role',
        children: [
          {
            path: 'role',
            name: 'PermissionRole',
            component: () => import('@/views/Console/Permission/RoleManagement.vue'),
            meta: { title: '角色管理' }
          },
          {
            path: 'api',
            name: 'PermissionApi',
            component: () => import('@/views/Console/Permission/ApiManagement.vue'),
            meta: { title: 'API管理' }
          },
          {
            path: 'menu',
            name: 'PermissionMenu',
            component: () => import('@/views/Console/Permission/MenuManagement.vue'),
            meta: { title: '菜单管理' }
          }
        ]
      },
      {
        path: 'team',
        name: 'ConsoleTeam',
        component: () => import('@/views/Console/Team.vue'),
        meta: { title: '团队管理' },
        redirect: '/console/team/list',
        children: [
          {
            path: 'list',
            name: 'TeamList',
            component: () => import('@/views/Console/Team/MyTeam.vue'),
            meta: { title: '我的团队' }
          },
          {
            path: 'members',
            name: 'TeamMembers',
            component: () => import('@/views/Console/Team/TeamMembers.vue'),
            meta: { title: '团队成员' }
          }
        ]
      },
      {
        path: 'settings',
        name: 'ConsoleSettings',
        component: () => import('@/views/Console/Settings.vue'),
        meta: { title: '设置' },
      }
    ]
  }
]

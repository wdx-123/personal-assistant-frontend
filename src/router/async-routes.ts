import type { RouteRecordRaw } from 'vue-router'

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
        meta: {
          title: '主页',
          icon: 'DashboardOutlined',
        }
      },
      {
        path: 'assistant',
        name: 'ConsoleAssistant',
        component: () => import('@/views/Console/Workbench/AssistantWorkbench.vue'),
        meta: {
          title: 'AI助手',
          icon: 'RobotOutlined',
        }
      },
      {
        path: 'workbench',
        name: 'ConsoleWorkbench',
        component: () => import('@/views/Console/Workbench.vue'),
        meta: {
          title: '工作台',
          icon: 'AppstoreOutlined',
        },
        redirect: '/console/assistant',
        children: [
          {
            path: 'task',
            name: 'WorkbenchTask',
            component: () => import('@/views/Console/Workbench/TaskWorkbench.vue'),
            meta: { title: 'OJ任务' }
          },
          {
            path: 'assistant',
            name: 'WorkbenchAssistantLegacy',
            redirect: '/console/assistant',
            meta: {
              title: 'AI助手',
              hideInMenu: true,
            }
          }
        ]
      },
      {
        path: 'permission',
        name: 'ConsolePermission',
        component: () => import('@/views/Console/Permission.vue'),
        meta: {
          title: '权限管理',
          icon: 'SafetyCertificateOutlined',
        },
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
        meta: {
          title: '团队管理',
          icon: 'TeamOutlined',
        },
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
        meta: {
          title: '设置',
          icon: 'SettingOutlined',
        },
      }
    ]
  }
]

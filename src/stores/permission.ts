import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { asyncRoutes } from '@/router/routes'
import { reverseRouteMap } from '@/router/route-map'
import { useAuthStore } from '@/stores/auth'
import type { MenuItem } from '@/types/permission.types'

export const usePermissionStore = defineStore('permission', () => {
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  const isRoutesAdded = ref(false)

  // 核心功能：生成你有权访问的路由
  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const authStore = useAuthStore()
    const myMenus = authStore.myMenus // 后端返回的菜单列表
    console.log(myMenus)

    // 第一步：把所有“允许访问的路径”都整理到一个白名单里
    const allowedPathList = getAllowedPaths(myMenus)
    console.log(allowedPathList)
    // 第二步：拿着白名单，去过滤前端写好的所有路由
    const accessedRoutes = filterAsyncRoutes(asyncRoutes, allowedPathList)
    // 保存结果
    dynamicRoutes.value = accessedRoutes
    isRoutesAdded.value = true
    return accessedRoutes
  }

  // --- 辅助函数：提取白名单 ---
  // 获取所有的路径
  const getAllowedPaths = (menus: MenuItem[]): Set<string> => {
    const paths = new Set<string>()
    
    // 递归函数：把树形结构的菜单拍平，提取 route_path
    const traverse = (items: MenuItem[]) => {
      items.forEach(item => {
        if (item.route_path) {
          paths.add(item.route_path)
        }
        if (item.children?.length) {
          traverse(item.children)
        }
      })
    }
    
    traverse(menus)
    return paths
  }

  // --- 辅助函数：过滤路由 ---
  const filterAsyncRoutes = (routes: RouteRecordRaw[], allowedPaths: Set<string>, parentPath = '/'): RouteRecordRaw[] => {
    const filtered: RouteRecordRaw[] = []

    routes.forEach(route => {
      // 1. 算出当前路由的完整路径（比如 /console/dashboard）
      const fullPath = resolveFullPath(route.path, parentPath)
      
      // 2. 复制一份路由配置（避免修改原版）
      const tmpRoute = { ...route }

      // 3. 判断当前路由是否在白名单里
      // 先查直接路径
      let isAllowed = allowedPaths.has(fullPath)
      
      // 如果没查到，再查查它的“映射路径”（后端路径）
      if (!isAllowed && reverseRouteMap[fullPath]) {
        const backendPath = reverseRouteMap[fullPath]
        isAllowed = allowedPaths.has(backendPath)
      }

      // 4. 如果有子路由，递归去过滤子路由
      if (tmpRoute.children) {
        tmpRoute.children = filterAsyncRoutes(tmpRoute.children, allowedPaths, fullPath)
        
        // 关键逻辑：如果子路由里有能访问的，那父路由也得留着
        if (tmpRoute.children.length > 0) {
          isAllowed = true
          // 自动修正重定向：如果有 redirect，让它指向第一个能访问的子路由
          if (tmpRoute.redirect && tmpRoute.children[0]) {
             // 优先用 name 跳转，更稳
             if (tmpRoute.children[0].name) {
               tmpRoute.redirect = { name: tmpRoute.children[0].name as string }
             } else {
               tmpRoute.redirect = tmpRoute.children[0].path
             }
          }
        }
      }

      // 5. 最终决定：能访问就加入结果
      if (isAllowed) {
        filtered.push(tmpRoute)
      }
    })
    return filtered
  }

  // --- 工具函数：拼接路径 ---
  const resolveFullPath = (routePath: string, basePath: string): string => {
    // 如果是绝对路径（以 / 开头），直接用
    if (routePath.startsWith('/')) {
      return routePath
    }
    // 否则拼接到父路径后面
    // 注意处理一下双斜杠的问题
    const cleanBasePath = basePath === '/' ? '' : basePath
    return `${cleanBasePath}/${routePath}`
  }

  return {
    dynamicRoutes,
    isRoutesAdded,
    generateRoutes
  }
})

import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import type { RouteLocationNormalized } from 'vue-router'
import { StatusCode } from '@/constants/status'
import { BizCode } from '@/constants/biz-code'
import { message } from '@/components/common'

// White list (routes that don't need auth) - usually covered by meta.requiresAuth: false
// But we can check here too if needed.

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()

  // 1. Check Token & Restore Auth
  // We assume if token exists in store or localStorage, user is logged in (or attempting to)
  if (!authStore.accessToken) {
    authStore.restoreAuth()
  }

  const token = authStore.accessToken

  // 2. Set Page Title
  if (to.meta.title) {
    document.title = `${to.meta.title} - 个人助手`
  }

  if (token) {
    if (to.path === '/login') {
      // If logged in, redirect to home
      next({ path: '/' })
    } else {
      // Check if dynamic routes are added
      if (permissionStore.isRoutesAdded) {
        next()
      } else {
        try {
          const cachedMenus = authStore.myMenus.slice()
          const browsingOrgId = authStore.browsingOrgId || authStore.user?.current_org_id

          try {
            await authStore.fetchMyMenus(browsingOrgId || undefined, {
              skipSuccTip: true,
              skipErrTip: true
            })
          } catch (error: any) {
            const code = error.response?.data?.code || error.code
            const isAuthError = [
              StatusCode.UNAUTHORIZED,
              StatusCode.TOKEN_EXPIRED,
              StatusCode.TOKEN_INVALID,
              StatusCode.TOKEN_MALFORMED,
              BizCode.CodeUnauthorized,
              BizCode.CodeTokenExpired,
              BizCode.CodeTokenInvalid,
              BizCode.CodeTokenMalformed,
              BizCode.CodeLoginRequired
            ].includes(code)

            if (isAuthError) {
              throw error
            }

            // 非认证错误（如服务器错误、网络错误）时回退到本地缓存菜单，避免整页不可用
            console.warn('Failed to refresh menus, falling back to cached menus:', error)
            authStore.setMyMenus(cachedMenus)
            message.warning(cachedMenus.length > 0 ? '最新菜单加载失败，已使用本地缓存菜单' : '菜单加载失败，部分功能可能不可用')
          }

          // Generate accessible routes
          const accessRoutes = await permissionStore.generateRoutes()

          // Add routes to router
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })

          // Hack to ensure addRoutes is complete
          // replace: true is important, it ensures the navigation history is correct
          // However, if we are already at the target route, we might need to handle it.
          // For dynamic routing, "to" might be a route that didn't exist when we started navigation (hence 404 potentially)
          // But since we caught it in beforeEach, the router hasn't decided it's 404 yet (unless it matched the catch-all).
          
          // If the user refreshed on /console/settings, "to" matched NotFound (catch-all) because /console/settings wasn't added yet.
          // Now we added it.
          
          // We need to redirect to "to.fullPath" to force a new match against the newly added routes.
          next({ path: to.path, query: to.query, hash: to.hash, replace: true })
        } catch (error) {
          console.error('Error generating routes:', error)
          // Failed to generate routes (e.g. token expired or api error)
          authStore.clearAuth()
          next(`/login?redirect=${to.path}`)
        }
      }
    }
  } else {
    // No token
    if (to.meta.requiresAuth === false || to.name === 'Login' || to.name === 'Register' || to.name === 'NotFound') {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

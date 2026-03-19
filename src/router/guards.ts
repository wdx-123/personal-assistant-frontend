import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import type { RouteLocationNormalized } from 'vue-router'
import { StatusCode } from '@/constants/status'
import { BizCode } from '@/constants/biz-code'
import { message } from '@/components/common'

let pendingMenuRefresh: Promise<void> | null = null

const authErrorCodes = [
  StatusCode.UNAUTHORIZED,
  StatusCode.TOKEN_EXPIRED,
  StatusCode.TOKEN_INVALID,
  StatusCode.TOKEN_MALFORMED,
  BizCode.CodeUnauthorized,
  BizCode.CodeTokenExpired,
  BizCode.CodeTokenInvalid,
  BizCode.CodeTokenMalformed,
  BizCode.CodeLoginRequired
]

const isAuthError = (error: any) => {
  const code = error?.response?.data?.code || error?.code
  return authErrorCodes.includes(code)
}

const addAccessRoutes = async () => {
  const permissionStore = usePermissionStore()
  const accessRoutes = await permissionStore.generateRoutes()

  accessRoutes.forEach((route) => {
    if (route.name && router.hasRoute(route.name)) {
      return
    }

    router.addRoute(route)
  })
}

const needsRouteRematch = (to: RouteLocationNormalized) => {
  return to.path.startsWith('/console') || to.name === 'NotFound'
}

const continueAfterRouteSetup = (
  to: RouteLocationNormalized,
  next: (value?: string | object | boolean | void) => void
) => {
  if (needsRouteRematch(to)) {
    next({ path: to.path, query: to.query, hash: to.hash, replace: true })
    return
  }

  next()
}

const refreshMenusInBackground = (
  authStore: ReturnType<typeof useAuthStore>,
  permissionStore: ReturnType<typeof usePermissionStore>,
  cachedMenus: typeof authStore.myMenus,
  browsingOrgId?: number
) => {
  if (pendingMenuRefresh) {
    return pendingMenuRefresh
  }

  pendingMenuRefresh = (async () => {
    try {
      await authStore.fetchMyMenus(browsingOrgId || undefined, {
        skipSuccTip: true,
        skipErrTip: true,
        dedupeKey: `auth:menus:${browsingOrgId || 0}`,
        cancelPrevious: true
      })

      if (!permissionStore.isRoutesAdded && authStore.myMenus.length > 0) {
        await addAccessRoutes()
      }
    } catch (error) {
      if (isAuthError(error)) {
        authStore.clearAuth()
        await router.replace(`/login?redirect=${router.currentRoute.value.fullPath}`)
        return
      }

      authStore.setMyMenus(cachedMenus)
      message.warning(cachedMenus.length > 0 ? '最新菜单加载失败，已使用本地缓存菜单' : '菜单加载失败，部分功能可能不可用')
    } finally {
      pendingMenuRefresh = null
    }
  })()

  return pendingMenuRefresh
}

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
      if (permissionStore.isRoutesAdded) {
        next()
      } else {
        const cachedMenus = authStore.myMenus.slice()
        const browsingOrgId = authStore.browsingOrgId || authStore.user?.current_org_id

        try {
          if (cachedMenus.length > 0) {
            await addAccessRoutes()
            continueAfterRouteSetup(to, next)
            void refreshMenusInBackground(authStore, permissionStore, cachedMenus, browsingOrgId || undefined)
            return
          }

          if (!to.path.startsWith('/console')) {
            next()
            void refreshMenusInBackground(authStore, permissionStore, cachedMenus, browsingOrgId || undefined)
            return
          }

          await authStore.fetchMyMenus(browsingOrgId || undefined, {
            skipSuccTip: true,
            skipErrTip: true,
            dedupeKey: `auth:menus:${browsingOrgId || 0}`,
            cancelPrevious: true
          })

          await addAccessRoutes()
          continueAfterRouteSetup(to, next)
        } catch (error) {
          if (isAuthError(error)) {
            authStore.clearAuth()
            next(`/login?redirect=${to.path}`)
            return
          }

          authStore.setMyMenus(cachedMenus)
          message.warning(cachedMenus.length > 0 ? '菜单加载失败，已使用本地缓存菜单' : '菜单加载失败，已先返回首页')
          next(cachedMenus.length > 0 ? to.fullPath : '/home')
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

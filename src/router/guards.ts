import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import type { RouteLocationNormalized } from 'vue-router'

// White list (routes that don't need auth) - usually covered by meta.requiresAuth: false
// But we can check here too if needed.

router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next) => {
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
          // Fetch user info/menus if missing
          // Note: restoreAuth recovers myMenus from localStorage.
          // If you want to force fetch on refresh, you can check if myMenus is empty.
          if (authStore.myMenus.length === 0) {
            await authStore.fetchMyMenus()
          }

          // Generate accessible routes
          const accessRoutes = await permissionStore.generateRoutes()

          // Add routes to router
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })

          // Hack to ensure addRoutes is complete
          next({ ...to, replace: true })
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

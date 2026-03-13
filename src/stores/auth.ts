import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, MenuItem } from '@/types'
import type { RequestOptions } from '@/utils/request'
import { login as loginApi, logout as logoutApi } from '@/services/auth.service'
import { getMyMenus } from '@/services/permission.service'
import { usePermissionStore } from '@/stores/permission'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string>('')
  const accessTokenExpiresAt = ref<number>(0)
  const refreshToken = ref<string>('')
  const myMenus = ref<MenuItem[]>([])

  const isLoggedIn = computed(() => !!user.value && !!accessToken.value)
  const isTokenExpired = computed(() => {
    if (!accessTokenExpiresAt.value) return true
    return Date.now() > accessTokenExpiresAt.value
  })

  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const setToken = (token: string, expiresAt: number) => {
    accessToken.value = token
    accessTokenExpiresAt.value = expiresAt
    localStorage.setItem('access_token', token)
    localStorage.setItem('access_token_expires_at', String(expiresAt))
  }

  const setRefreshToken = (token: string) => {
    refreshToken.value = token
    localStorage.setItem('refresh_token', token)
  }

  const setMyMenus = (menus: MenuItem[]) => {
    myMenus.value = menus
    localStorage.setItem('my_menus', JSON.stringify(menus))
  }

  const fetchMyMenus = async (orgId?: number, config?: RequestOptions) => {
    const menus = await getMyMenus(orgId, config)
    setMyMenus(Array.isArray(menus) ? menus : [])
    return myMenus.value
  }

  const login = async (
    phone: string,
    password: string,
    captcha: string,
    captchaId: string,
    config?: RequestOptions
  ) => {
    const { user: userData, access_token, access_token_expires_at, refresh_token } = await loginApi(
      { phone, password, captcha, captcha_id: captchaId },
      config
    )

    setUser(userData)
    setToken(access_token, access_token_expires_at)

    if (refresh_token) {
      setRefreshToken(refresh_token)
    }

    try {
      await fetchMyMenus(userData.current_org_id, {
        skipSuccTip: true,
        skipErrTip: true
      })
    } catch (error) {
      setMyMenus([])
    }

    return { success: true }
  }

  const logout = async (config?: RequestOptions) => {
    try {
      await logoutApi({
        skipSuccTip: true,
        skipErrTip: true,
        ...config
      })
    } catch (error) {
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = ''
    accessTokenExpiresAt.value = 0
    refreshToken.value = ''
    myMenus.value = []

    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('access_token_expires_at')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('my_menus')
    
    // 清除权限路由状态
    const permissionStore = usePermissionStore()
    permissionStore.resetRoutes()
  }

  const restoreAuth = () => {
    try {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')
      const expiresAt = localStorage.getItem('access_token_expires_at')
      const refreshTkn = localStorage.getItem('refresh_token')
      const myMenusStr = localStorage.getItem('my_menus')

      if (userStr && token && expiresAt) {
        user.value = JSON.parse(userStr)
        accessToken.value = token
        accessTokenExpiresAt.value = Number(expiresAt)
        refreshToken.value = refreshTkn || ''
        myMenus.value = myMenusStr ? JSON.parse(myMenusStr) : []
      }
    } catch (error) {
      clearAuth()
    }
  }

  const checkTokenExpiring = () => {
    if (!accessTokenExpiresAt.value) return false
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() + fiveMinutes > accessTokenExpiresAt.value
  }

  return {
    user,
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    myMenus,

    isLoggedIn,
    isTokenExpired,

    setUser,
    setToken,
    setRefreshToken,
    setMyMenus,
    fetchMyMenus,
    login,
    logout,
    clearAuth,
    restoreAuth,
    checkTokenExpiring
  }
})

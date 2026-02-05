import axios, { AxiosHeaders, type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'
import {
  StatusCode,
  isSuccessStatusCode,
  getFriendlyErrorMessage
} from '@/constants/status'
import { message } from '@/components/common'
import { useAuthStore } from '@/stores/auth'

export interface RequestConfig extends InternalAxiosRequestConfig {
  skipTip?: boolean
  skipErrTip?: boolean
  skipSuccTip?: boolean
  customErrTip?: string
  customSuccTip?: string
  _retry?: boolean
}

export type RequestOptions = Partial<Pick<RequestConfig, 'skipTip' | 'skipErrTip' | 'skipSuccTip' | 'customErrTip' | 'customSuccTip'>> & {
  params?: Record<string, unknown>
}

const apiBaseURL =
  import.meta.env.DEV && import.meta.env.VITE_API_PREFIX
    ? import.meta.env.VITE_API_PREFIX
    : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClientRaw: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
})

apiClientRaw.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/refreshToken')) {
      return config
    }

    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false

type RefreshQueueItem = {
  config: RequestConfig
  resolve: (value: AxiosResponse) => void
  reject: (reason?: unknown) => void
}
let refreshQueue: RefreshQueueItem[] = []

const refreshAccessToken = async (): Promise<string> => {
  const authStore = useAuthStore()
  const refreshTokenValue = authStore.refreshToken || localStorage.getItem('refresh_token')
  if (!refreshTokenValue) {
    throw new Error('refresh token not found')
  }

  const { refreshToken } = await import('@/services/auth.service')
  const { access_token, access_token_expires_at } = await refreshToken(refreshTokenValue, {
    skipTip: true,
    skipSuccTip: true,
    skipErrTip: true
  })

  authStore.setToken(access_token, access_token_expires_at)
  return access_token
}

const handleLogout = async () => {
  const authStore = useAuthStore()
  await authStore.logout({
    customSuccTip: '退出登录成功',
    skipErrTip: true
  })
  const { default: router } = await import('@/router')
  await router.replace('/login')
}
const handleTokenExpired = async (_response: AxiosResponse, config: RequestConfig): Promise<AxiosResponse> => {
  if (config._retry) {
    await handleLogout()
    return Promise.reject(new Error('Token 刷新失败'))
  }

  config._retry = true

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({
        config,
        resolve,
        reject
      })
    })
  }

  isRefreshing = true

  try {
    const newToken = await refreshAccessToken()

    refreshQueue.forEach((item) => {
      if (!item.config.headers) {
        item.config.headers = new AxiosHeaders()
      }
      item.config.headers.Authorization = `Bearer ${newToken}`
      item.resolve(apiClientRaw.request(item.config))
    })
    refreshQueue = []

    if (!config.headers) {
      config.headers = new AxiosHeaders()
    }
    config.headers.Authorization = `Bearer ${newToken}`

    return apiClientRaw.request(config)
  } catch (error) {
    refreshQueue.forEach((item) => item.reject(error))
    refreshQueue = []
    await handleLogout()
    return Promise.reject(error)
  } finally {
    isRefreshing = false
  }
}

const responseInterceptor = (
  response: AxiosResponse
): unknown => {
  const res = response.data as ApiResponse
  const config = response.config as RequestConfig

  const { skipTip, skipSuccTip, skipErrTip, customSuccTip, customErrTip } = config

  if (isSuccessStatusCode(res.code)) {
    if (!skipTip && !skipSuccTip) {
      const succText = customSuccTip || res.tip || res.message || res.messages || '操作成功'
      message.success(succText)
    }
    return res.data
  }

  if (res.code === StatusCode.UNAUTHORIZED) {
    const shouldRefreshToken =
      !config.url?.includes('/user/login') &&
      !config.url?.includes('/user/register') &&
      !config.url?.includes('/refreshToken') &&
      !!localStorage.getItem('access_token')

    if (shouldRefreshToken) {
      return handleTokenExpired(response, config)
    }

    if (config.url?.includes('/refreshToken')) {
      handleLogout()
      return Promise.reject(new Error('RefreshToken 已失效，请重新登录'))
    }
  }

  const errText = customErrTip || getFriendlyErrorMessage(res.code, res.error, res.message || res.messages)

  if (!skipTip && !skipErrTip) {
    if (res.code === StatusCode.FORBIDDEN) {
      message.warning(errText)
    } else {
      message.error(errText)
    }
  }

  return Promise.reject(res)
}

const errorInterceptor = async (
  error: AxiosError<ApiResponse>
): Promise<never> => {
  const originalRequest = error.config as RequestConfig

  const config = originalRequest

  if (!config?.skipTip && !config?.skipErrTip) {
    const errText =
      config?.customErrTip ||
      error.response?.data?.message ||
      error.response?.data?.messages ||
      error.message ||
      '网络请求失败，请稍后重试'
    message.error(errText)
  }

  return Promise.reject(error)
}

apiClientRaw.interceptors.response.use(responseInterceptor, errorInterceptor)

const apiClient = {
  get<T = unknown>(url: string, config?: RequestOptions): Promise<T> {
    return apiClientRaw.get(url, config as InternalAxiosRequestConfig)
  },
  post<T = unknown>(url: string, data?: Record<string, unknown> | unknown, config?: RequestOptions): Promise<T> {
    return apiClientRaw.post(url, data, config as InternalAxiosRequestConfig)
  },
  put<T = unknown>(url: string, data?: Record<string, unknown> | unknown, config?: RequestOptions): Promise<T> {
    return apiClientRaw.put(url, data, config as InternalAxiosRequestConfig)
  },
  delete<T = unknown>(url: string, config?: RequestOptions): Promise<T> {
    return apiClientRaw.delete(url, config as InternalAxiosRequestConfig)
  },
  patch<T = unknown>(url: string, data?: Record<string, unknown> | unknown, config?: RequestOptions): Promise<T> {
    return apiClientRaw.patch(url, data, config as InternalAxiosRequestConfig)
  },
}

export default apiClient

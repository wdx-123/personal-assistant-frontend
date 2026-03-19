import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosError,
  type GenericAbortSignal,
  type InternalAxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import type { ApiResponse } from '@/types'
import {
  StatusCode,
  isSuccessStatusCode,
  getFriendlyErrorMessage
} from '@/constants/status'
import { BizCode, BizCodeMessages } from '@/constants/biz-code'
import { message } from '@/components/common'
import { useAuthStore } from '@/stores/auth'

export interface RequestConfig extends InternalAxiosRequestConfig {
  skipTip?: boolean
  skipErrTip?: boolean
  skipSuccTip?: boolean
  customErrTip?: string
  customSuccTip?: string
  dedupeKey?: string
  cancelPrevious?: boolean
  _retry?: boolean
  _dedupeController?: AbortController
}

export type RequestOptions = Partial<
  Pick<
    RequestConfig,
    'skipTip' | 'skipErrTip' | 'skipSuccTip' | 'customErrTip' | 'customSuccTip' | 'dedupeKey' | 'cancelPrevious'
  >
> & {
  params?: Record<string, unknown>
}

const pendingRequestControllers = new Map<string, AbortController>()

export const isRequestCanceled = (error: unknown): boolean => {
  if (axios.isCancel(error)) {
    return true
  }

  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_CANCELED'
}

const syncAbortSignals = (sourceSignal: GenericAbortSignal | undefined, controller: AbortController) => {
  if (!sourceSignal) return

  if (sourceSignal.aborted) {
    controller.abort()
    return
  }

  sourceSignal.addEventListener?.(
    'abort',
    () => {
      controller.abort()
    },
    { once: true }
  )
}

const bindRequestController = (config: RequestConfig) => {
  if (!config.dedupeKey) return

  const existingController = pendingRequestControllers.get(config.dedupeKey)
  if (config.cancelPrevious && existingController) {
    existingController.abort()
  }

  const controller = new AbortController()
  syncAbortSignals(config.signal, controller)

  config.signal = controller.signal
  config._dedupeController = controller
  pendingRequestControllers.set(config.dedupeKey, controller)
}

const cleanupRequestController = (config?: RequestConfig) => {
  if (!config?.dedupeKey) return

  const currentController = pendingRequestControllers.get(config.dedupeKey)
  if (!currentController || currentController === config._dedupeController) {
    pendingRequestControllers.delete(config.dedupeKey)
  }
}

const apiBaseURL = import.meta.env.PROD
  ? import.meta.env.VITE_API_PREFIX?.trim() || '/proxy-api'
  : ''

const apiClientRaw: AxiosInstance = axios.create({
  baseURL: apiBaseURL,  
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
})

apiClientRaw.interceptors.request.use(
  (config) => {
    const requestConfig = config as RequestConfig
    bindRequestController(requestConfig)

    if (isRefreshTokenRequest(config.url)) {
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
  resolve: (value: AxiosResponse | Promise<AxiosResponse>) => void
  reject: (reason?: unknown) => void
}
let refreshQueue: RefreshQueueItem[] = []

const isLoginRequest = (url?: string) => !!url?.includes('/user/login')
const isRegisterRequest = (url?: string) => !!url?.includes('/user/register')
const isRefreshTokenRequest = (url?: string) => !!url?.includes('/refreshToken')
const isLogoutRequest = (url?: string) => !!url?.includes('/user/logout')

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
): AxiosResponse | Promise<AxiosResponse> => {
  const res = response.data as ApiResponse & {
    success?: boolean
    msg?: string
    code?: number | string
  }
  const config = response.config as RequestConfig
  cleanupRequestController(config)

  const { skipTip, skipSuccTip, skipErrTip, customSuccTip, customErrTip } = config
  const normalizedCode = typeof res.code === 'string' ? Number(res.code) : res.code

  if (isSuccessStatusCode(normalizedCode) || res.success === true) {
    if (!skipTip && !skipSuccTip) {
      const succText = customSuccTip || res.tip || res.message || res.messages || res.msg || '操作成功'
      message.success(succText)
    }
    return res.data as unknown as AxiosResponse
  }

  if (normalizedCode === StatusCode.UNAUTHORIZED ||
    normalizedCode === BizCode.CodeUnauthorized ||
    normalizedCode === BizCode.CodeTokenExpired) {
    const shouldRefreshToken =
      !isLoginRequest(config.url) &&
      !isRegisterRequest(config.url) &&
      !isRefreshTokenRequest(config.url) &&
      !isLogoutRequest(config.url) &&
      !!localStorage.getItem('access_token')

    if (shouldRefreshToken) {
      return handleTokenExpired(response, config)
    }

    if (isRefreshTokenRequest(config.url)) {
      return Promise.reject(new Error('RefreshToken 已失效，请重新登录'))
    }
  }

  let errText = customErrTip
  if (!errText) {
    // 优先使用 BizCode 定义的错误消息
    // 这里使用 any 强制转换，因为 keyof number 索引签名问题
    if (Object.prototype.hasOwnProperty.call(BizCodeMessages, normalizedCode)) {
      errText = BizCodeMessages[normalizedCode as number]
    } else {
      errText = getFriendlyErrorMessage(
        Number.isNaN(normalizedCode) ? StatusCode.SERVER_ERROR : Number(normalizedCode),
        res.error,
        res.message || res.messages || res.msg
      )
    }
  }

  if (!skipTip && !skipErrTip) {
    if (normalizedCode === StatusCode.FORBIDDEN || normalizedCode === BizCode.CodePermissionDenied) {
      message.warning('您没有权限执行此操作')
    } else {
      message.error(errText || '操作失败')
    }
  }

  return Promise.reject(res)
}

const errorInterceptor = async (
  error: AxiosError<ApiResponse>
): Promise<never> => {
  const originalRequest = error.config as RequestConfig

  const config = originalRequest
  cleanupRequestController(config)

  if (isRequestCanceled(error)) {
    return Promise.reject(error)
  }

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

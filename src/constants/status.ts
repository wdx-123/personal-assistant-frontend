/**
 * 业务状态码常量
 * 统一管理后端返回的业务状态码
 */

/**
 * 业务状态码枚举
 */
export enum StatusCode {
  /** 操作成功 */
  SUCCESS = 2000,

  /** 请求参数错误 */
  BAD_REQUEST = 4000,

  /** 服务器内部错误 */
  SERVER_ERROR = 5000,

  /** 未授权（未登录或 Token 无效） */
  UNAUTHORIZED = 4010,

  /** Token 已过期 */
  TOKEN_EXPIRED = 4011,

  /** Token 格式错误 */
  TOKEN_MALFORMED = 4012,

  /** Token 无效 */
  TOKEN_INVALID = 4013,

  /** 用户不存在 */
  USER_NOT_FOUND = 4014,

  /** 用户已被冻结 */
  USER_FROZEN = 4015,

  /** 验证码错误 */
  CAPTCHA_ERROR = 4020,

  /** 验证码已过期 */
  CAPTCHA_EXPIRED = 4021,

  /** 验证码不存在 */
  CAPTCHA_NOT_FOUND = 4022,

  /** 手机号已存在 */
  PHONE_ALREADY_EXISTS = 4029,

  /** 用户名已存在 */
  USERNAME_ALREADY_EXISTS = 4030,

  /** 手机号不存在 */
  PHONE_NOT_EXISTS = 4031,

  /** 密码错误 */
  PASSWORD_ERROR = 4032,

  /** 账号或密码错误 */
  ACCOUNT_OR_PASSWORD_ERROR = 4033,

  /** OJ 账号已绑定 */
  OJ_ALREADY_BOUND = 4040,

  /** OJ 账号不存在 */
  OJ_NOT_FOUND = 4041,

  /** OJ 账号绑定失败 */
  OJ_BIND_FAILED = 4042,

  /** 禁止访问（权限不足） */
  FORBIDDEN = 4230,

  /** 请求过于频繁（限流） */
  TOO_MANY_REQUESTS = 4290
}

/**
 * 状态码对应的中文描述（技术文档/调试用）
 */
export const StatusCodeMessages: Record<StatusCode, string> = {
  [StatusCode.SUCCESS]: '操作成功',
  [StatusCode.BAD_REQUEST]: '请求参数错误',
  [StatusCode.SERVER_ERROR]: '服务器内部错误',
  [StatusCode.UNAUTHORIZED]: '未授权，请先登录',
  [StatusCode.TOKEN_EXPIRED]: 'Token 已过期，请重新登录',
  [StatusCode.TOKEN_MALFORMED]: 'Token 格式错误',
  [StatusCode.TOKEN_INVALID]: 'Token 无效',
  [StatusCode.USER_NOT_FOUND]: '用户不存在',
  [StatusCode.USER_FROZEN]: '用户已被冻结',
  [StatusCode.CAPTCHA_ERROR]: '验证码错误',
  [StatusCode.CAPTCHA_EXPIRED]: '验证码已过期',
  [StatusCode.CAPTCHA_NOT_FOUND]: '验证码不存在',
  [StatusCode.PHONE_ALREADY_EXISTS]: '该手机号已被注册',
  [StatusCode.USERNAME_ALREADY_EXISTS]: '该用户名已被使用',
  [StatusCode.PHONE_NOT_EXISTS]: '手机号不存在',
  [StatusCode.PASSWORD_ERROR]: '密码错误',
  [StatusCode.ACCOUNT_OR_PASSWORD_ERROR]: '账号或密码错误',
  [StatusCode.OJ_ALREADY_BOUND]: '该 OJ 账号已绑定',
  [StatusCode.OJ_NOT_FOUND]: 'OJ 账号不存在',
  [StatusCode.OJ_BIND_FAILED]: 'OJ 账号绑定失败',
  [StatusCode.FORBIDDEN]: '权限不足，禁止访问',
  [StatusCode.TOO_MANY_REQUESTS]: '请求过于频繁，请稍后再试'
}

/**
 * ✅ 核心：【业务码 → 用户友好提示文案】映射表
 * 专门给前端弹窗展示给用户看的友好文案
 * 优先级：当后端未提供 tip 字段时，使用此预设文案库
 *
 * 特点：
 * - 集中管理、统一维护、一处修改全局生效
 * - 拒绝硬编码，所有文案统一在这里管理
 * - 如果后端已提供 tip 字段，此映射表作为兜底
 */
export const FriendlyMessageMap: Record<number, string> = {
  // ===== 基础通用业务码 =====
  [StatusCode.SUCCESS]: '操作成功',
  [StatusCode.BAD_REQUEST]: '您输入的信息有误，请检查后重试',
  [StatusCode.SERVER_ERROR]: '系统繁忙，请稍后再试',
  [StatusCode.UNAUTHORIZED]: '登录状态已失效，请重新登录',
  [StatusCode.TOKEN_EXPIRED]: '登录状态已失效，请重新登录',
  [StatusCode.TOKEN_MALFORMED]: '登录状态异常，请重新登录',
  [StatusCode.TOKEN_INVALID]: '登录状态无效，请重新登录',
  [StatusCode.USER_NOT_FOUND]: '登录状态失效，请重新登录',
  [StatusCode.USER_FROZEN]: '您的账号已被冻结，请联系管理员',

  // ===== 验证码相关 =====
  [StatusCode.CAPTCHA_ERROR]: '验证码错误，请重新输入',
  [StatusCode.CAPTCHA_EXPIRED]: '验证码已过期，请重新获取',
  [StatusCode.CAPTCHA_NOT_FOUND]: '验证码无效，请重新获取',

  // ===== 用户注册/登录相关 =====
  [StatusCode.PHONE_ALREADY_EXISTS]: '该手机号已被注册，请直接登录',
  [StatusCode.USERNAME_ALREADY_EXISTS]: '该用户名已被使用，请换一个试试',
  [StatusCode.PHONE_NOT_EXISTS]: '手机号不存在，请检查后重试',
  [StatusCode.PASSWORD_ERROR]: '密码错误，请重新输入',
  [StatusCode.ACCOUNT_OR_PASSWORD_ERROR]: '账号或密码错误，请核对后重新输入',

  // ===== OJ 账号绑定相关 =====
  [StatusCode.OJ_ALREADY_BOUND]: '该 OJ 账号已绑定，无需重复操作',
  [StatusCode.OJ_NOT_FOUND]: '未找到该 OJ 账号，请检查后重试',
  [StatusCode.OJ_BIND_FAILED]: 'OJ 账号绑定失败，请稍后重试',

  // ===== 权限相关 =====
  [StatusCode.FORBIDDEN]: '您暂无权限执行此操作',
  [StatusCode.TOO_MANY_REQUESTS]: '操作过于频繁，请稍后再试'
}

/**
 * 获取状态码对应的错误消息
 * @param code 业务状态码
 * @param fallbackMessage 未找到对应消息时的默认提示
 * @returns 状态码描述或默认消息
 */
export function getStatusMessage(
  code: number,
  fallbackMessage?: string
): string | undefined {
  return StatusCodeMessages[code as StatusCode] || fallbackMessage
}

/**
 * 判断是否为成功状态码
 */
export function isSuccessStatusCode(code: number | string | undefined | null): boolean {
  const normalizedCode = typeof code === 'string' ? Number(code) : code
  return normalizedCode === StatusCode.SUCCESS || normalizedCode === 200 || normalizedCode === 0
}

/**
 * 判断是否需要重新登录
 */
export function shouldReLogin(code: number): boolean {
  return [
    StatusCode.UNAUTHORIZED,
    StatusCode.TOKEN_EXPIRED,
    StatusCode.TOKEN_INVALID,
    StatusCode.USER_NOT_FOUND,
    StatusCode.USER_FROZEN
  ].includes(code as StatusCode)
}

/**
 * ✅ 文案清洗/格式化函数（治标方案）
 * 对后端返回的技术文案进行关键词替换，转成友好文案
 *
 * @param code 业务状态码
 * @param message 后端返回的原始消息
 * @returns 格式化后的友好消息
 */
export function formatTechnicalMessage(code: number, message?: string): string {
  // 优先使用预设的友好文案映射
  if (FriendlyMessageMap[code]) {
    return FriendlyMessageMap[code]
  }

  // 如果没有原始消息，返回默认文案
  if (!message) {
    return '操作失败，请稍后重试'
  }

  // 对后端的技术 message 做关键词替换，转成友好文案
  const msg = message.toLowerCase()

  // Token 相关错误
  if (msg.includes('token') || msg.includes('authorization')) {
    if (msg.includes('expired') || msg.includes('过期')) {
      return '登录状态已失效，请重新登录'
    }
    if (msg.includes('invalid') || msg.includes('无效')) {
      return '登录状态无效，请重新登录'
    }
    if (msg.includes('malformed') || msg.includes('格式')) {
      return '登录状态异常，请重新登录'
    }
    return '登录状态异常，请重新登录'
  }

  // 参数校验相关
  if (msg.includes('param') || msg.includes('参数') || msg.includes('valid')) {
    return '您输入的信息有误，请检查后重试'
  }

  // 手机号相关
  if (msg.includes('手机') || msg.includes('phone')) {
    if (msg.includes('存在') || msg.includes('exist')) {
      return '该手机号已被注册，请直接登录'
    }
    if (msg.includes('不存在') || msg.includes('not exist')) {
      return '手机号不存在，请检查后重试'
    }
    if (msg.includes('格式') || msg.includes('format')) {
      return '手机号格式不正确，请重新输入'
    }
  }

  // 用户名相关
  if (msg.includes('用户名') || msg.includes('username')) {
    if (msg.includes('存在') || msg.includes('exist')) {
      return '该用户名已被使用，请换一个试试'
    }
  }

  // 密码相关
  if (msg.includes('密码') || msg.includes('password')) {
    if (msg.includes('错误') || msg.includes('error')) {
      return '密码错误，请重新输入'
    }
  }

  // 账号密码相关
  if (msg.includes('账号') || msg.includes('account')) {
    if (msg.includes('密码') || msg.includes('password')) {
      return '账号或密码错误，请核对后重新输入'
    }
  }

  // 验证码相关
  if (msg.includes('验证码') || msg.includes('captcha')) {
    if (msg.includes('过期') || msg.includes('expir')) {
      return '验证码已过期，请重新获取'
    }
    if (msg.includes('错误') || msg.includes('error')) {
      return '验证码错误，请重新输入'
    }
    return '验证码无效，请重新获取'
  }

  // 权限相关
  if (msg.includes('权限') || msg.includes('permission') || msg.includes('forbidden')) {
    return '您暂无权限执行此操作'
  }

  // 频率限制
  if (msg.includes('频繁') || msg.includes('rate') || msg.includes('too many')) {
    return '操作过于频繁，请稍后再试'
  }

  // 服务器错误
  if (msg.includes('服务器') || msg.includes('server') || msg.includes('internal')) {
    return '系统繁忙，请稍后再试'
  }

  // 兜底：返回原始消息
  return message
}

/**
 * ✅ 获取用户友好的错误消息（三层优先级）
 * 优先级：后端 tip > 前端预设友好文案 > 格式化后的技术文案
 *
 * @param code 业务状态码
 * @param backendTip 后端返回的用户友好提示（tip 字段）
 * @param backendMessage 后端返回的技术消息（message 字段）
 * @returns 用户友好的错误消息
 */
export function getFriendlyErrorMessage(
  code: number,
  backendTip?: string,
  backendMessage?: string
): string {
  // 第一优先级：后端提供的用户友好提示
  if (backendTip && backendTip.trim()) {
    return backendTip
  }

  // 第二优先级：前端预设的友好文案映射
  if (FriendlyMessageMap[code]) {
    return FriendlyMessageMap[code]
  }

  // 第三优先级：格式化后的技术文案
  return formatTechnicalMessage(code, backendMessage)
}

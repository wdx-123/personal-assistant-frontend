/**
 * 认证相关类型定义
 */

// 用户角色
export type UserRole = 'admin' | 'teacher' | 'student'

// 用户信息
export interface User {
  id: number
  uuid: string
  username: string
  phone: string
  email: string
  openid: string
  avatar: string
  address: string
  signature: string
  register: number
  freeze: boolean
  is_super_admin: boolean
  current_org_id: number
  current_org?: Organization
  created_at: string
  updated_at: string
}

// 登录请求
export interface LoginRequest {
  phone: string
  password: string
  captcha: string
  captcha_id: string
}

// 登录响应
export interface LoginResponse {
  user: User
  access_token: string
  access_token_expires_at: number
  refresh_token: string
}

// 注册请求
export interface RegisterRequest {
  username: string
  password: string
  phone: string
  captcha: string
  captcha_id: string
  org_id?: number
  invite_code?: string
}

// 注册响应
export interface RegisterResponse {
  user: User
  access_token: string
  access_token_expires_at: number
  refresh_token: string
}

// 图形验证码响应
export interface CaptchaResponse {
  captcha_id: string
  pic_path: string // 验证码图片的 base64 编码
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  access_token: string
  access_token_expires_at: number
}

// 组织信息
export interface Organization {
  id: number
  name: string
  description: string
  code: string // 加入邀请码
  owner_id: number // 创建者 ID
  is_builtin?: boolean
  builtin_key?: string
  created_at: string
  updated_at: string
}

// 组织列表响应
export interface OrgListResponse {
  list: Organization[]
  total: number
}

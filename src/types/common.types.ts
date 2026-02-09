/**
 * 通用类型定义
 */

// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message?: string      // 【技术文案】后端原始消息，用于调试和日志
  messages?: string
  data: T
  error?: string       // 错误详情字段
  tip?: string         // 【用户友好提示】专门给前端弹窗展示的友好文案
}

// 分页请求参数
export interface PageParams {
  page: number
  pageSize: number
}

// 分页响应数据
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 难度等级
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// OJ 平台类型
export type OJPlatform = 'luogu' | 'leetcode'

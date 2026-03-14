/**
 * OJ（Online Judge）相关类型定义
 */
import type { OJPlatform } from './common.types'

// OJ 绑定/换绑请求
export interface OJBindRequest {
  platform: OJPlatform
  identifier: string
}

// OJ 绑定响应
export interface OJBindResponse {
  platform: OJPlatform
  identifier: string
  real_name: string
  user_avatar: string
  easy_number?: number
  medium_number?: number
  hard_number?: number
  total_number?: number
  passed_number?: number
}

export interface LanqiaoBindRequest {
  phone: string
  password: string
}

export interface LanqiaoBindResponse {
  identifier: string
  passed_number: number
  submit_success_count?: number
  submit_failed_count?: number
}

// OJ 统计信息响应（GET /oj/stats）
export interface OJStatsResponse {
  platform: OJPlatform
  identifier: string
  real_name: string
  user_avatar: string
  passed_number: number
}

export interface OJCurvePoint {
  date: string
  solved_count?: number
  solved_total?: number
  value?: number
}

export interface OJCurveResponse {
  bound: boolean
  points: OJCurvePoint[]
  current_total: number
  last_sync_at: string
}

// 排行榜项详情
export interface RankingItem {
  rank: number
  user_id: number
  real_name: string
  avatar: string
  total_passed: number
  platform_details: {
    [key: string]: number
  }
}

// 当前用户排名信息
export interface MyRank {
  rank: number
  total_passed: number
}

// 排行榜列表响应（GET /oj/luogu/ranking_list）
export interface RankingListResponse {
  list: RankingItem[]
  my_rank: MyRank
  total: number
}

// 兼容旧类型（待移除）
export interface OJUserInfo {
  id: number
  user_id: number
  platform: OJPlatform
  oj_username: string
  oj_nickname?: string
  oj_avatar?: string
  ranking?: number
  rating?: number
  passed_count?: number
  easy_count?: number
  medium_count?: number
  hard_count?: number
  score?: number
  submitted_count?: number
  created_at: string
  updated_at: string
}

export interface OJLeaderboardItem {
  ranking: number
  user: {
    id: number
    uuid: string
    username: string
    avatar?: string
  }
  oj_username: string
  oj_nickname?: string
  oj_avatar?: string
  passed_count?: number
  score?: number
  rating?: number
  is_current_user: boolean
}

// 难度分布
export interface DifficultyDistribution {
  easy: number
  medium: number
  hard: number
}

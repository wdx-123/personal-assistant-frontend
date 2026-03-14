/**
 * OJ（Online Judge）相关 API 服务
 * 注意：Service 层只负责调用 API，不处理业务逻辑
 * ✅ 优化：直接返回业务数据类型，无需解包
 */

import apiClient, { type RequestOptions } from '@/utils/request'
import type {
  LanqiaoBindRequest,
  LanqiaoBindResponse,
  OJBindRequest,
  OJBindResponse,
  OJCurveResponse,
  OJStatsResponse,
  RankingListResponse,
  OJPlatform
} from '@/types'

/**
 * 绑定/换绑 OJ 账号
 * @param data OJ 绑定信息
 * @param config 自定义请求配置
 */
export function bindOJ(
  data: OJBindRequest,
  config?: RequestOptions
): Promise<OJBindResponse> {
  return apiClient.post('/oj/bind', data, config)
}

/**
 * 获取用户 OJ 卡片信息
 * @param data 请求数据（包含 platform）
 * @param config 自定义请求配置
 */
export function getOJStats(
  data: { platform: OJPlatform },
  config?: RequestOptions
): Promise<OJStatsResponse> {
  return apiClient.post('/oj/stats', data, config)
}

export function getOJCurve(
  data: { platform: OJPlatform },
  config?: RequestOptions
): Promise<OJCurveResponse> {
  return apiClient.post('/oj/curve', data, config)
}

export function bindLanqiao(
  data: LanqiaoBindRequest,
  config?: RequestOptions
): Promise<LanqiaoBindResponse> {
  return apiClient.post('/oj/lanqiao/bind', data, config)
}

/**
 * 获取组织内做题排行榜
 * @param data 请求数据（包含 platform, page, page_size, scope, org_id）
 * @param config 自定义请求配置
 */
export function getRankingList(
  data: { 
    platform: OJPlatform; 
    page?: number; 
    page_size?: number; 
    scope?: 'current_org' | 'all_members' | 'org'; 
    org_id?: number; 
  },
  config?: RequestOptions
): Promise<RankingListResponse> {
  return apiClient.post('/oj/ranking_list', data, config)
}

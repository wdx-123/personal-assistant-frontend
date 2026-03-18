import apiClient, { type RequestOptions } from '@/utils/request'
import type {
  AnalyzeOJTaskTitlesRequest,
  CreateOJTaskRequest,
  ListOJTaskExecutionUsersParams,
  ListVisibleOJTasksParams,
  OJTaskAnalyzeResponse,
  OJTaskCreateResponse,
  OJTaskDetail,
  OJTaskExecutionDetail,
  OJTaskExecutionUserDetail,
  OJTaskExecutionUsersPageData,
  OJTaskListPageData,
  OJTaskVersionListResponse,
  ReviseOJTaskRequest,
  UpdateOJTaskRequest,
} from '@/types'

export function analyzeOJTaskTitles(
  data: AnalyzeOJTaskTitlesRequest,
  config?: RequestOptions
): Promise<OJTaskAnalyzeResponse> {
  return apiClient.post('/oj/task/analyze', data, config)
}

export function createOJTask(
  data: CreateOJTaskRequest,
  config?: RequestOptions
): Promise<OJTaskCreateResponse> {
  return apiClient.post('/oj/task', data, config)
}

export function updateOJTask(
  id: number,
  data: UpdateOJTaskRequest,
  config?: RequestOptions
): Promise<null> {
  return apiClient.put(`/oj/task/${id}`, data, config)
}

export function deleteOJTask(
  id: number,
  config?: RequestOptions
): Promise<null> {
  return apiClient.delete(`/oj/task/${id}`, config)
}

export function executeOJTaskNow(
  id: number,
  config?: RequestOptions
): Promise<OJTaskCreateResponse> {
  return apiClient.post(`/oj/task/${id}/execute-now`, {}, config)
}

export function reviseOJTask(
  id: number,
  data: ReviseOJTaskRequest,
  config?: RequestOptions
): Promise<OJTaskCreateResponse> {
  return apiClient.post(`/oj/task/${id}/revise`, data, config)
}

export function retryOJTask(
  id: number,
  config?: RequestOptions
): Promise<OJTaskCreateResponse> {
  return apiClient.post(`/oj/task/${id}/retry`, {}, config)
}

export function listVisibleOJTasks(
  params: ListVisibleOJTasksParams,
  config?: RequestOptions
): Promise<OJTaskListPageData> {
  return apiClient.get('/oj/task/list', {
    ...config,
    params,
  } as any)
}

export function getOJTaskDetail(
  id: number,
  config?: RequestOptions
): Promise<OJTaskDetail> {
  return apiClient.get(`/oj/task/${id}`, config)
}

export function getOJTaskVersions(
  id: number,
  config?: RequestOptions
): Promise<OJTaskVersionListResponse> {
  return apiClient.get(`/oj/task/${id}/versions`, config)
}

export function getOJTaskExecutionDetail(
  id: number,
  executionId: number,
  config?: RequestOptions
): Promise<OJTaskExecutionDetail> {
  return apiClient.get(`/oj/task/${id}/executions/${executionId}`, config)
}

export function listOJTaskExecutionUsers(
  id: number,
  executionId: number,
  params: ListOJTaskExecutionUsersParams,
  config?: RequestOptions
): Promise<OJTaskExecutionUsersPageData> {
  return apiClient.get(`/oj/task/${id}/executions/${executionId}/users`, {
    ...config,
    params,
  } as any)
}

export function getOJTaskExecutionUserDetail(
  id: number,
  executionId: number,
  userId: number,
  config?: RequestOptions
): Promise<OJTaskExecutionUserDetail> {
  return apiClient.get(`/oj/task/${id}/executions/${executionId}/users/${userId}`, config)
}

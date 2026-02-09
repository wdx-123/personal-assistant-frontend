/**
 * 用户设置相关 API 服务
 * 注意：Service 层只负责调用 API，不处理业务逻辑
 */

import apiClient, { type RequestOptions } from '@/utils/request'
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  ChangePhoneRequest,
  ImageItem,
  User,
} from '@/types'

/** 图片分类：头像 */
const IMAGE_CATEGORY_AVATAR = 7

/**
 * 更新个人资料（用户名、签名、头像）
 * @param data 更新数据
 * @param config 自定义请求配置
 */
export function updateProfile(
  data: UpdateProfileRequest,
  config?: RequestOptions
): Promise<User> {
  return apiClient.put('/user/profile', data, config)
}

/**
 * 上传图片（通用图片上传接口）
 * @param file 图片文件
 * @param config 自定义请求配置
 */
export function uploadImage(
  file: File,
  config?: RequestOptions
): Promise<ImageItem[]> {
  const formData = new FormData()
  formData.append('files', file)
  formData.append('category', String(IMAGE_CATEGORY_AVATAR))
  formData.append('driver', 'qiniu')
  return apiClient.post('/system/image/upload', formData, config)
}

/**
 * 修改密码
 * @param data 旧密码和新密码
 * @param config 自定义请求配置
 */
export function changePassword(
  data: ChangePasswordRequest,
  config?: RequestOptions
): Promise<null> {
  return apiClient.put('/user/password', data, config)
}

/**
 * 换绑手机号
 * @param data 新手机号和验证码
 * @param config 自定义请求配置
 */
export function changePhone(
  data: ChangePhoneRequest,
  config?: RequestOptions
): Promise<User> {
  return apiClient.put('/user/phone', data, config)
}

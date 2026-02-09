/**
 * 用户设置相关类型定义
 */

/** 更新个人资料请求 */
export interface UpdateProfileRequest {
  username?: string
  signature?: string
  avatar?: string
}

/** 修改密码请求 */
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

/** 换绑手机号请求 */
export interface ChangePhoneRequest {
  password: string
  new_phone: string
  captcha: string
  captcha_id: string
}

/** 图片上传响应项 */
export interface ImageItem {
  id: number
  url: string
  name: string
  type: string
  size: number
  category: number
  category_label: string
}

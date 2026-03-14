/**
 * 业务错误码定义
 * 对应后端 package errors 中的 BizCode
 */

export enum BizCode {
  // ==================== 成功 ====================
  CodeSuccess = 0,

  // ==================== 通用错误 1xxxx ====================
  CodeUnknown = 10000, // 未知错误
  CodeInvalidParams = 10001, // 参数错误
  CodeBindFailed = 10002, // 参数绑定失败
  CodeValidateFailed = 10003, // 参数校验失败
  CodeInternalError = 10004, // 服务器内部错误
  CodeDBError = 10005, // 数据库错误
  CodeRedisError = 10006, // Redis错误
  CodeThirdPartyError = 10007, // 第三方服务错误
  CodeTooManyRequests = 10008, // 请求过于频繁

  // ==================== 认证相关 11xxx ====================
  CodeUnauthorized = 11000, // 未授权
  CodeTokenExpired = 11001, // Token已过期
  CodeTokenMalformed = 11002, // Token格式错误
  CodeTokenInvalid = 11003, // Token无效
  CodeTokenBlacklisted = 11004, // Token已被加入黑名单
  CodeLoginRequired = 11005, // 需要登录
  CodePermissionDenied = 11006, // 权限不足

  // ==================== 用户模块 2xxxx ====================
  CodeUserNotFound = 20001, // 用户不存在
  CodeUserAlreadyExists = 20002, // 用户已存在
  CodePasswordError = 20003, // 密码错误
  CodeUserFrozen = 20004, // 用户已被冻结
  CodeUserDisabled = 20005, // 用户已被禁用
  CodePhoneAlreadyUsed = 20006, // 手机号已被使用
  CodeEmailAlreadyUsed = 20007, // 邮箱已被使用
  CodeCaptchaError = 20008, // 验证码错误
  CodeCaptchaExpired = 20009, // 验证码已过期
  CodeEmailSendFailed = 20010, // 邮件发送失败
  CodeUserStatusConflict = 20011, // 用户状态冲突

  // ==================== 组织与权限模块 3xxxx ====================
  CodeOrgNotFound = 30001, // 组织不存在
  CodeOrgAlreadyExists = 30002, // 组织已存在
  CodeOrgNameDuplicate = 30003, // 组织名称重复
  CodeNotOrgMember = 30004, // 非组织成员
  CodeOrgHasMembers = 30005, // 组织下有成员，无法删除
  CodeOrgOwnerOnly = 30006, // 仅组织所有者可操作
  CodeInviteCodeInvalid = 30007, // 邀请码无效
  CodeOrgBuiltinProtected = 30008, // 系统内置组织受保护
  CodeOrgMemberStatusConflict = 30009, // 成员状态冲突
  CodeOrgMemberRemoved = 30010, // 成员已被移除
  CodeOrgOwnerTransferRequired = 30011, // 组织所有者需先移交
  CodeOrgCannotLeaveBuiltin = 30012, // 内置组织不可退出
  CodeRoleNotFound = 30101, // 角色不存在
  CodeRoleAlreadyExists = 30102, // 角色已存在
  CodeMenuNotFound = 30201, // 菜单不存在
  CodeMenuCodeDuplicate = 30202, // 菜单code重复
  CodeMenuHasChildren = 30203, // 菜单存在子菜单，无法删除
  CodeAPINotFound = 30301, // API不存在
  CodeAPIAlreadyExists = 30302, // API已存在（path+method重复）

  // ==================== OJ模块 4xxxx ====================
  CodeOJAccountNotBound = 40001, // OJ账号未绑定
  CodeOJAccountBound = 40002, // OJ账号已绑定
  CodeOJPlatformInvalid = 40003, // OJ平台无效
  CodeOJIdentifierInvalid = 40004, // OJ账号标识无效
  CodeOJBindCoolDown = 40005, // 绑定冷却中
  CodeOJSyncFailed = 40006, // OJ数据同步失败
  CodeOJRemoteAuthFailed = 40007, // OJ远端鉴权失败
}

export const BizCodeMessages: Record<number, string> = {
  [BizCode.CodeSuccess]: "操作成功",

  // 通用错误
  [BizCode.CodeUnknown]: "未知错误",
  [BizCode.CodeInvalidParams]: "参数错误",
  [BizCode.CodeBindFailed]: "参数绑定失败",
  [BizCode.CodeValidateFailed]: "参数校验失败",
  [BizCode.CodeInternalError]: "服务器内部错误",
  [BizCode.CodeDBError]: "数据库错误",
  [BizCode.CodeRedisError]: "缓存服务错误",
  [BizCode.CodeThirdPartyError]: "第三方服务错误",
  [BizCode.CodeTooManyRequests]: "请求过于频繁，请稍后再试",

  // 认证相关
  [BizCode.CodeUnauthorized]: "未授权访问",
  [BizCode.CodeTokenExpired]: "登录已过期，请重新登录",
  [BizCode.CodeTokenMalformed]: "Token格式错误",
  [BizCode.CodeTokenInvalid]: "Token无效",
  [BizCode.CodeTokenBlacklisted]: "Token已失效，请重新登录",
  [BizCode.CodeLoginRequired]: "请先登录",
  [BizCode.CodePermissionDenied]: "权限不足",

  // 用户模块
  [BizCode.CodeUserNotFound]: "用户不存在",
  [BizCode.CodeUserAlreadyExists]: "用户已存在",
  [BizCode.CodePasswordError]: "用户名或密码错误",
  [BizCode.CodeUserFrozen]: "用户已被冻结",
  [BizCode.CodeUserDisabled]: "用户已被禁用",
  [BizCode.CodePhoneAlreadyUsed]: "手机号已被使用",
  [BizCode.CodeEmailAlreadyUsed]: "邮箱已被使用",
  [BizCode.CodeCaptchaError]: "验证码错误",
  [BizCode.CodeCaptchaExpired]: "验证码已过期",
  [BizCode.CodeEmailSendFailed]: "邮件发送失败",
  [BizCode.CodeUserStatusConflict]: "账号状态不允许该操作",

  // 组织与权限
  [BizCode.CodeOrgNotFound]: "组织不存在",
  [BizCode.CodeOrgAlreadyExists]: "组织已存在",
  [BizCode.CodeOrgNameDuplicate]: "组织名称已存在",
  [BizCode.CodeNotOrgMember]: "您不是该组织成员",
  [BizCode.CodeOrgHasMembers]: "组织下还有成员，无法删除",
  [BizCode.CodeOrgOwnerOnly]: "仅组织所有者可操作",
  [BizCode.CodeInviteCodeInvalid]: "邀请码无效",
  [BizCode.CodeOrgBuiltinProtected]: "系统内置组织不允许该操作",
  [BizCode.CodeOrgMemberStatusConflict]: "成员状态冲突",
  [BizCode.CodeOrgMemberRemoved]: "成员已被移除，需管理员恢复",
  [BizCode.CodeOrgOwnerTransferRequired]: "组织所有者请先移交后再操作",
  [BizCode.CodeOrgCannotLeaveBuiltin]: "系统内置组织不可退出",
  [BizCode.CodeRoleNotFound]: "角色不存在",
  [BizCode.CodeRoleAlreadyExists]: "角色已存在",
  [BizCode.CodeMenuNotFound]: "菜单不存在",
  [BizCode.CodeMenuCodeDuplicate]: "菜单权限标识已存在",
  [BizCode.CodeMenuHasChildren]: "该菜单下存在子菜单，无法删除",
  [BizCode.CodeAPINotFound]: "API不存在",
  [BizCode.CodeAPIAlreadyExists]: "API已存在（路径与方法组合重复）",

  // OJ模块
  [BizCode.CodeOJAccountNotBound]: "OJ账号未绑定",
  [BizCode.CodeOJAccountBound]: "OJ账号已绑定",
  [BizCode.CodeOJPlatformInvalid]: "不支持的OJ平台",
  [BizCode.CodeOJIdentifierInvalid]: "OJ账号标识无效",
  [BizCode.CodeOJBindCoolDown]: "操作过于频繁，请稍后再试",
  [BizCode.CodeOJSyncFailed]: "OJ数据同步失败",
  [BizCode.CodeOJRemoteAuthFailed]: "远端鉴权失败，请检查账号与密码",
}

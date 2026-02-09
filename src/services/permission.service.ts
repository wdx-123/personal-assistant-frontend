import apiClient, { type RequestOptions } from '@/utils/request'
import type {
  MenuItem,
  PageDataMenu,
  CreateMenuRequest,
  UpdateMenuRequest,
  BindMenuApiRequest,
  RoleItem,
  PageDataRole,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleMenuRequest,
  ApiItem,
  PageDataApi,
  CreateApiRequest,
  UpdateApiRequest,
  SyncApiRequest,
  SyncApiResponse,
  UserListItem,
  PageDataUser,
  UserDetailItem,
  AssignUserRoleRequest,
  OrgItem,
  PageDataOrg,
  CreateOrgRequest,
  UpdateOrgRequest,
  SetCurrentOrgRequest,
  MyOrgItem
} from '@/types'

export function getMenuTree(config?: RequestOptions): Promise<MenuItem[]> {
  return apiClient.get('/system/menu/tree', config)
}

export function getMenuList(
  params: {
    page?: number
    page_size?: number
    type?: number
    status?: number
    parent_id?: number
    keyword?: string
  },
  config?: RequestOptions
): Promise<PageDataMenu> {
  return apiClient.get('/system/menu/list', {
    ...config,
    params
  } as any)
}

export function getMenuDetail(id: number, config?: RequestOptions): Promise<MenuItem> {
  return apiClient.get(`/system/menu/${id}`, config)
}

export function createMenu(data: CreateMenuRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/menu', data, config)
}

export function updateMenu(id: number, data: UpdateMenuRequest, config?: RequestOptions): Promise<null> {
  return apiClient.put(`/system/menu/${id}`, data, config)
}

export function deleteMenu(id: number, config?: RequestOptions): Promise<null> {
  return apiClient.delete(`/system/menu/${id}`, config)
}

export function bindMenuApis(data: BindMenuApiRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/menu/bind_api', data, config)
}

export function getRoleList(
  params: { page?: number; page_size?: number; status?: number; keyword?: string },
  config?: RequestOptions
): Promise<PageDataRole> {
  return apiClient.get('/system/role/list', {
    ...config,
    params
  } as any)
}

export function createRole(data: CreateRoleRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/role', data, config)
}

export function updateRole(id: number, data: UpdateRoleRequest, config?: RequestOptions): Promise<null> {
  return apiClient.put(`/system/role/${id}`, data, config)
}

export function deleteRole(id: number, config?: RequestOptions): Promise<null> {
  return apiClient.delete(`/system/role/${id}`, config)
}

export function getRoleMenuIds(id: number, config?: RequestOptions): Promise<number[]> {
  return apiClient.get(`/system/role/${id}/menus`, config)
}

export function assignRoleMenu(data: AssignRoleMenuRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/role/assign_menu', data, config)
}

export function getApiList(
  params: { page?: number; page_size?: number; status?: number; group_id?: number; method?: string; keyword?: string },
  config?: RequestOptions
): Promise<PageDataApi> {
  return apiClient.get('/system/api/list', {
    ...config,
    params
  } as any)
}

export function getApiDetail(id: number, config?: RequestOptions): Promise<ApiItem> {
  return apiClient.get(`/system/api/${id}`, config)
}

export function createApi(data: CreateApiRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/api', data, config)
}

export function updateApi(id: number, data: UpdateApiRequest, config?: RequestOptions): Promise<null> {
  return apiClient.put(`/system/api/${id}`, data, config)
}

export function deleteApi(id: number, config?: RequestOptions): Promise<null> {
  return apiClient.delete(`/system/api/${id}`, config)
}

export function syncApi(data?: SyncApiRequest, config?: RequestOptions): Promise<SyncApiResponse> {
  return apiClient.post('/system/api/sync', data || {}, config)
}

export function getUserList(
  params: { page?: number; page_size?: number; org_id?: number; keyword?: string },
  config?: RequestOptions
): Promise<PageDataUser> {
  return apiClient.get('/system/user/list', {
    ...config,
    params
  } as any)
}

export function getUserDetail(id: number, config?: RequestOptions): Promise<UserDetailItem> {
  return apiClient.get(`/system/user/${id}`, config)
}

export function getUserRoles(id: number, orgId: number, config?: RequestOptions): Promise<RoleItem[]> {
  return apiClient.get(`/system/user/${id}/roles`, {
    ...config,
    params: { org_id: orgId }
  } as any)
}

export function assignUserRole(data: AssignUserRoleRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/user/assign_role', data, config)
}

export function getOrgList(
  params: { page?: number; page_size?: number; keyword?: string },
  config?: RequestOptions
): Promise<PageDataOrg> {
  return apiClient.get('/system/org/list', {
    ...config,
    params
  } as any)
}

export function getOrgDetail(id: number, config?: RequestOptions): Promise<OrgItem> {
  return apiClient.get(`/system/org/${id}`, config)
}

export function createOrg(data: CreateOrgRequest, config?: RequestOptions): Promise<null> {
  return apiClient.post('/system/org', data, config)
}

export function updateOrg(id: number, data: UpdateOrgRequest, config?: RequestOptions): Promise<null> {
  return apiClient.put(`/system/org/${id}`, data, config)
}

export function setCurrentOrg(data: SetCurrentOrgRequest, config?: RequestOptions): Promise<null> {
  return apiClient.put('/system/org/current', data, config)
}

export function getMyOrgs(config?: RequestOptions): Promise<MyOrgItem[]> {
  return apiClient.get('/system/org/my', config)
}

export interface ApiItemSimple {
  id: number
  path: string
  method: string
}

export interface MenuItem {
  id: number
  parent_id: number
  name: string
  code: string
  type: number
  icon: string
  route_name: string
  route_path: string
  route_param: string
  component_path: string
  status: number
  sort: number
  desc: string
  created_at: string
  updated_at: string
  children?: MenuItem[]
  apis?: ApiItemSimple[]
}

export interface PageDataMenu {
  list: MenuItem[]
  total: number
  page: number
  page_size: number
}

export interface CreateMenuRequest {
  parent_id?: number
  name: string
  code: string
  type: number
  icon?: string
  route_name?: string
  route_path?: string
  route_param?: string
  component_path?: string
  status?: number
  sort?: number
  desc?: string
}

export interface UpdateMenuRequest {
  parent_id?: number
  name?: string
  code?: string
  type?: number
  icon?: string
  route_name?: string
  route_path?: string
  route_param?: string
  component_path?: string
  status?: number
  sort?: number
  desc?: string
}

export interface BindMenuApiRequest {
  menu_id: number
  api_ids: number[]
}

export interface RoleItem {
  id: number
  name: string
  code: string
  desc: string
  status: number
  created_at: string
  updated_at: string
}

export interface PageDataRole {
  list: RoleItem[]
  total: number
  page: number
  page_size: number
}

export interface CreateRoleRequest {
  name: string
  code: string
  desc?: string
}

export interface UpdateRoleRequest {
  name?: string
  code?: string
  desc?: string
  status?: number
}

export interface AssignRoleMenuRequest {
  role_id: number
  menu_ids: number[]
}

export interface AssignRolePermissionRequest {
  role_id: number
  menu_ids: number[]
  direct_api_ids: number[]
  capability_codes?: string[]
}

export interface ApiItem {
  id: number
  path: string
  method: string
  detail: string
  status: number
  sync_state: string
  last_seen_at?: string | null
  menu_id?: number | null
  menu_name: string
  created_at: string
  updated_at: string
}

export interface PageDataApi {
  list: ApiItem[]
  total: number
  page: number
  page_size: number
}

export interface CreateApiRequest {
  path: string
  method: string
  detail: string
  status?: number
  menu_id?: number
}

export interface UpdateApiRequest {
  path?: string
  method?: string
  detail?: string
  status?: number
  menu_id?: number
}

export interface SyncApiRequest {
  force?: boolean
}

export interface SyncApiResponse {
  added: number
  restored: number
  marked_missing: number
  archived: number
  total: number
}

export interface UserRoleItem {
  id: number
  name: string
  code: string
}

export interface UserDetailItem {
  id: number
  uuid: string
  username: string
  phone: string
  email?: string
  avatar?: string
  freeze?: boolean
  created_at?: string
  updated_at?: string
  roles?: UserRoleItem[]
}

export interface PageDataUser {
  list: UserDetailItem[]
  total: number
  page: number
  page_size: number
}

export interface AssignUserRoleRequest {
  user_id: number
  org_id: number
  role_ids: number[]
}

export type UserRoleMatrixLevel = 'super_admin' | 'org_admin' | 'member'

export interface UserRoleMatrixRoleItem {
  id: number
  name: string
  code: string
  is_builtin: boolean
  matrix_level: UserRoleMatrixLevel
  assignable: boolean
  disabled_reason?: string
}

export interface UserRoleMatrixItem {
  assigned_role_ids: number[]
  operator_matrix_level: UserRoleMatrixLevel
  roles: UserRoleMatrixRoleItem[]
}

export interface OrgItem {
  id: number
  name: string
  description: string
  code: string
  avatar: string
  avatar_id?: number | null
  owner_id: number
  member_count: number
  created_at: string
  updated_at: string
}

export interface PageDataOrg {
  list: OrgItem[]
  total: number
  page?: number
  page_size?: number
}

export interface CreateOrgRequest {
  name: string
  description?: string
  code?: string
  avatar?: string
  avatar_id?: number
}

export interface UpdateOrgRequest {
  name?: string
  description?: string
  code?: string
  avatar?: string
  avatar_id?: number
}

export interface SetCurrentOrgRequest {
  org_id: number
}

export interface MyOrgItem {
  id: number
  name: string
  is_owner: boolean
}

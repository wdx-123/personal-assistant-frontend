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
  icon?: string
  route_name?: string
  route_path?: string
  route_param?: string
  component_path?: string
  status: number
  sort: number
  desc?: string
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
  parent_id: number
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
  desc?: string
  status: number
}

export interface PageDataRole {
  list: RoleItem[]
  total: number
  page: number
  page_size: number
}

export interface RoleSimpleItem {
  id: number
  name: string
  code: string
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

export interface UserListItem {
  id: number
  username: string
  phone?: string
  current_org?: {
    id: number
    name: string
  }
  roles?: {
    id: number
    name: string
  }[]
}

export interface PageDataUser {
  list: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UserDetailItem {
  id: number
  uuid?: string
  username: string
  phone?: string
  email?: string
  avatar?: string
  address?: string
  signature?: string
  register?: number
  freeze?: boolean
  current_org?: {
    id: number
    name: string
  }
  created_at?: string
  updated_at?: string
}

export interface AssignUserRoleRequest {
  user_id: number
  org_id: number
  role_ids: number[]
}

export interface OrgItem {
  id: number
  name: string
  description?: string
  code?: string
  owner_id?: number
}

export interface PageDataOrg {
  list: OrgItem[]
  total: number
  page: number
  page_size: number
}

export interface CreateOrgRequest {
  name: string
  description?: string
  code?: string
}

export interface UpdateOrgRequest {
  name?: string
  description?: string
  code?: string
}

export interface SetCurrentOrgRequest {
  org_id: number
}

export interface MyOrgItem {
  id: number
  name: string
  is_owner: boolean
}

export interface ApiItem {
  id: number
  path: string
  method: string
  detail?: string
  category?: string
  status: number
  created_at?: string
  updated_at?: string
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
  detail?: string
  category?: string
  status?: number
}

export interface UpdateApiRequest {
  path?: string
  method?: string
  detail?: string
  category?: string
  status?: number
}

export interface SyncApiRequest {
  delete_removed?: boolean
}

export interface SyncApiResponse {
  added: number
  updated: number
  disabled: number
  total: number
}

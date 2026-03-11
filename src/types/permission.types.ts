export interface AssignRolePermissionRequest {
  role_id: number
  menu_ids: number[]
  direct_api_ids: number[]
  capability_codes?: string[]
}

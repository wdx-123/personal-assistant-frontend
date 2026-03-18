export const routeMap: Record<string, string> = {
  '/dashboard': '/console/dashboard',
  '/workbench/task': '/console/workbench/task',
  '/permission/role': '/console/permission/role',
  '/permission/api': '/console/permission/api',
  '/permission/menu': '/console/permission/menu',
  '/team/list': '/console/team/list',
  '/team/members': '/console/team/members',
  '/settings': '/console/settings',
}

export const reverseRouteMap: Record<string, string> = Object.fromEntries(
  Object.entries(routeMap).map(([key, value]) => [value, key])
)

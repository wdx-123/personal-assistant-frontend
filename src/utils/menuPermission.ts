import type { ApiItemSimple, MenuItem } from '@/types'

export const MENU_ITEM_TYPE_BUTTON = 3

export function flattenMenus(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = []

  const walk = (menus: MenuItem[]) => {
    menus.forEach((item) => {
      result.push(item)
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children)
      }
    })
  }

  walk(items)
  return result
}

export function collectMenuCodes(items: MenuItem[]): Set<string> {
  return new Set(
    flattenMenus(items)
      .map((item) => item.code)
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
  )
}

export function hasMenuCode(items: MenuItem[], code: string): boolean {
  return collectMenuCodes(items).has(code)
}

export function hasAnyMenuCode(items: MenuItem[], codes: string[]): boolean {
  if (!Array.isArray(codes) || codes.length === 0) return true
  const codeSet = collectMenuCodes(items)
  return codes.some((code) => typeof code === 'string' && code.trim().length > 0 && codeSet.has(code.trim()))
}

export function normalizeApiPath(path: string): string {
  const trimmed = (path || '').trim()
  if (!trimmed) return ''
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return normalized.startsWith('/api/') ? normalized.slice(4) : (normalized === '/api' ? '' : normalized)
}

export function buildApiKey(method: string, path: string): string {
  const normalizedMethod = (method || '').trim().toUpperCase()
  const normalizedPath = normalizeApiPath(path)
  return `${normalizedMethod} ${normalizedPath}`
}

export function collectApiKeys(items: MenuItem[]): Set<string> {
  const apis: ApiItemSimple[] = []

  flattenMenus(items).forEach((item) => {
    if (Array.isArray(item.apis) && item.apis.length > 0) {
      apis.push(...item.apis)
    }
  })

  return new Set(
    apis
      .map((api) => buildApiKey(String(api?.method || ''), String(api?.path || '')))
      .filter((key) => {
        const trimmed = (key || '').trim()
        if (!trimmed) return false
        if (!trimmed.includes(' ')) return false
        const [method, path] = trimmed.split(' ')
        return !!method && !!path
      })
  )
}

const isPathPlaceholder = (segment: string) => segment.startsWith('{') && segment.endsWith('}')

export function matchApiPath(allowedPath: string, requiredPath: string): boolean {
  const a = normalizeApiPath(allowedPath)
  const r = normalizeApiPath(requiredPath)
  if (a === r) return true

  const aSeg = a.split('/').filter(Boolean)
  const rSeg = r.split('/').filter(Boolean)
  if (aSeg.length !== rSeg.length) return false

  for (let i = 0; i < aSeg.length; i += 1) {
    const left = aSeg[i]
    const right = rSeg[i]
    if (left === right) continue
    if (isPathPlaceholder(left) || isPathPlaceholder(right)) continue
    return false
  }

  return true
}

export function hasApiPermission(
  items: MenuItem[],
  api: { method: string; path: string }
): boolean {
  const requiredKey = buildApiKey(api.method, api.path)
  const [requiredMethod, requiredPath] = requiredKey.split(' ')
  const keys = collectApiKeys(items)
  if (!requiredMethod || !requiredPath) return false
  if (keys.size === 0) return false

  for (const key of keys) {
    const [method, path] = key.split(' ')
    if (method !== requiredMethod) continue
    if (matchApiPath(path, requiredPath)) return true
  }

  return false
}

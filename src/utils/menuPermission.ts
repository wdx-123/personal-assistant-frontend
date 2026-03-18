import type { MenuItem } from '@/types'

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

import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasAnyMenuCode, hasApiPermission, hasMenuCode } from '@/utils/menuPermission'

type PermissionValue =
  | string
  | string[]
  | {
      code?: string | string[]
      api?: { method: string; path: string }
      showIcon?: boolean
      tip?: string
    }

const ORIG_DISABLED = 'permissionOrigDisabled'
const ORIG_ARIA_DISABLED = 'permissionOrigAriaDisabled'
const ORIG_TITLE = 'permissionOrigTitle'

const BLOCK_INSTALLED = new WeakSet<HTMLElement>()

const resolveTargetElement = (el: HTMLElement): HTMLElement => {
  const anyEl = el as any
  if (typeof anyEl.disabled === 'boolean') return el

  const found = el.querySelector?.(
    'button, input, textarea, select, a, [role="button"]'
  ) as HTMLElement | null

  return found || el
}

const installBlocker = (el: HTMLElement) => {
  if (BLOCK_INSTALLED.has(el)) return

  const blockIfDenied = (event: Event) => {
    const current = event.currentTarget as HTMLElement | null
    if (!current) return
    if (current.getAttribute('data-permission-disabled') !== 'true') return
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const blockKeyIfDenied = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    blockIfDenied(event)
  }

  el.addEventListener('click', blockIfDenied, true)
  el.addEventListener('keydown', blockKeyIfDenied, true)
  BLOCK_INSTALLED.add(el)
}

const setDisabled = (el: HTMLElement, disabled: boolean) => {
  const anyEl = el as any
  if (typeof anyEl.disabled === 'boolean') {
    anyEl.disabled = disabled
  } else {
    if (disabled) {
      el.setAttribute('aria-disabled', 'true')
    } else {
      el.removeAttribute('aria-disabled')
    }
  }

  if (disabled) {
    el.setAttribute('data-permission-disabled', 'true')
    el.classList.add('permission-denied')
  } else {
    el.removeAttribute('data-permission-disabled')
    el.classList.remove('permission-denied')
  }
}

const ensureOriginSnapshot = (el: HTMLElement) => {
  const dataset = el.dataset as any
  if (dataset[ORIG_DISABLED] !== undefined) return

  const anyEl = el as any
  const originDisabled = typeof anyEl.disabled === 'boolean' ? String(anyEl.disabled) : String(el.getAttribute('aria-disabled') === 'true')
  dataset[ORIG_DISABLED] = originDisabled
  dataset[ORIG_ARIA_DISABLED] = el.getAttribute('aria-disabled') || ''
  dataset[ORIG_TITLE] = el.getAttribute('title') || ''
}

const restoreOriginSnapshot = (
  el: HTMLElement,
  options: { restoreDisabled?: boolean } = {}
) => {
  const dataset = el.dataset as any
  const anyEl = el as any
  const { restoreDisabled = true } = options

  if (restoreDisabled) {
    const originDisabled = dataset[ORIG_DISABLED] === 'true'
    if (typeof anyEl.disabled === 'boolean') {
      anyEl.disabled = originDisabled
    }
  }

  if (typeof anyEl.disabled !== 'boolean') {
    const originAria = dataset[ORIG_ARIA_DISABLED]
    if (originAria) el.setAttribute('aria-disabled', originAria)
    else el.removeAttribute('aria-disabled')
  }

  const originTitle = dataset[ORIG_TITLE]
  if (originTitle) el.setAttribute('title', originTitle)
  else el.removeAttribute('title')
}

const resolveAllowed = (value: PermissionValue): { allowed: boolean; showIcon: boolean; tip: string } => {
  const authStore = useAuthStore()
  const menus = authStore.myMenus

  if (typeof value === 'string') {
    const code = value.trim()
    const allowed = code ? hasMenuCode(menus, code) : true
    return { allowed, showIcon: true, tip: '无权限' }
  }

  if (Array.isArray(value)) {
    return { allowed: hasAnyMenuCode(menus, value), showIcon: true, tip: '无权限' }
  }

  const rawCode = value.code
  if (Array.isArray(rawCode)) {
    return { allowed: hasAnyMenuCode(menus, rawCode), showIcon: value.showIcon !== false, tip: value.tip || '无权限' }
  }

  const code = (rawCode || '').trim()
  if (code) {
    return { allowed: hasMenuCode(menus, code), showIcon: value.showIcon !== false, tip: value.tip || '无权限' }
  }

  const api = value.api
  if (api?.method && api?.path) {
    return { allowed: hasApiPermission(menus, api), showIcon: value.showIcon !== false, tip: value.tip || '无权限' }
  }

  return { allowed: true, showIcon: true, tip: '无权限' }
}

const applyPermission = (el: HTMLElement, binding: { value: PermissionValue }) => {
  const targetEl = resolveTargetElement(el)

  ensureOriginSnapshot(el)
  if (targetEl !== el) {
    ensureOriginSnapshot(targetEl)
  }

  installBlocker(el)
  if (targetEl !== el) {
    installBlocker(targetEl)
  }

  const { allowed, showIcon, tip } = resolveAllowed(binding.value)

  if (allowed) {
    restoreOriginSnapshot(el, { restoreDisabled: false })
    if (targetEl !== el) {
      restoreOriginSnapshot(targetEl, { restoreDisabled: false })
    }
    el.classList.remove('permission-denied')
    el.classList.remove('permission-denied-icon')
    el.removeAttribute('data-permission-disabled')
    if (targetEl !== el) {
      targetEl.classList.remove('permission-denied')
      targetEl.removeAttribute('data-permission-disabled')
    }
    return
  }

  if (tip && !el.getAttribute('title')) {
    el.setAttribute('title', tip)
  }

  if (showIcon) {
    el.classList.add('permission-denied-icon')
  } else {
    el.classList.remove('permission-denied-icon')
  }

  const anyTarget = targetEl as any
  const alreadyDisabled =
    typeof anyTarget.disabled === 'boolean' ? anyTarget.disabled === true : targetEl.getAttribute('aria-disabled') === 'true'
  if (alreadyDisabled) {
    el.setAttribute('data-permission-disabled', 'true')
    el.classList.add('permission-denied')
    if (targetEl !== el) {
      targetEl.setAttribute('data-permission-disabled', 'true')
      targetEl.classList.add('permission-denied')
    }
    return
  }

  el.setAttribute('data-permission-disabled', 'true')
  el.classList.add('permission-denied')
  setDisabled(targetEl, true)
  if (targetEl !== el) {
    targetEl.setAttribute('data-permission-disabled', 'true')
    targetEl.classList.add('permission-denied')
  }
}

export const permissionDirective: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    applyPermission(el, binding)
  },
  updated(el, binding) {
    applyPermission(el, binding)
  },
}

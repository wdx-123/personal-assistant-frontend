/**
 * 排行榜数据获取逻辑
 * 按平台 + 范围 + 组织维度缓存，支持翻面预加载和分页加载
 */
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRankingList } from '@/services/oj.service'
import { getUserList } from '@/services/permission.service'
import { isRequestCanceled } from '@/utils/request'
import type { OJPlatform, RankingItem, MyRank } from '@/types'

type RankingScope = 'current_org' | 'all_members' | 'org'

interface RankingCacheState {
  list: RankingItem[]
  myRank: MyRank | null
  total: number
  page: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  initialized: boolean
}

interface FetchRankingOptions {
  append?: boolean
  silentIfCached?: boolean
}

const createEmptyState = (): RankingCacheState => ({
  list: [],
  myRank: null,
  total: 0,
  page: 1,
  hasMore: true,
  loading: false,
  loadingMore: false,
  initialized: false,
})

export function useRankingData() {
  const authStore = useAuthStore()

  const rankingStateMap = reactive<Record<string, RankingCacheState>>({})
  const pendingBaseRequests = new Map<string, Promise<void>>()
  const pendingMoreRequests = new Map<string, Promise<void>>()
  const usernameMapCache = new Map<number, Map<number, string>>()
  const UNKNOWN_REAL_NAME = '未知用户'
  const pageSize = 10

  const normalizeScope = (scope: RankingScope): RankingScope => {
    return scope === 'current_org' ? 'org' : scope
  }

  const resolveScopeOrgId = (scope: RankingScope, orgId?: number) => {
    if (scope === 'all_members') return undefined
    return orgId || authStore.user?.current_org_id || undefined
  }

  const buildCacheKey = (platform: OJPlatform, scope: RankingScope, orgId?: number) => {
    const normalizedScope = normalizeScope(scope)
    if (normalizedScope === 'all_members') {
      return `${platform}:all_members`
    }

    return `${platform}:org:${orgId || 0}`
  }

  const getState = (platform: OJPlatform, scope: RankingScope, orgId?: number) => {
    const normalizedScope = normalizeScope(scope)
    const effectiveOrgId = resolveScopeOrgId(normalizedScope, orgId)
    const cacheKey = buildCacheKey(platform, normalizedScope, effectiveOrgId)

    if (!rankingStateMap[cacheKey]) {
      rankingStateMap[cacheKey] = reactive(createEmptyState())
    }

    return rankingStateMap[cacheKey]
  }

  const isUnknownRealName = (value: string) => {
    const normalized = (value || '').trim()
    return !normalized || normalized === UNKNOWN_REAL_NAME
  }

  const ensureUsernameMap = async (orgId: number) => {
    const cached = usernameMapCache.get(orgId)
    if (cached) return cached

    const data = await getUserList(
      { page: 0, page_size: 0, org_id: orgId },
      { skipTip: true, skipErrTip: true }
    )

    const map = new Map<number, string>()
    ;(data?.list || []).forEach((u) => {
      const name = (u.username || '').trim()
      if (u.id && name) map.set(u.id, name)
    })

    usernameMapCache.set(orgId, map)
    return map
  }

  const patchUnknownNamesForLanqiao = async (
    list: RankingItem[],
    scope: RankingScope,
    orgId?: number
  ) => {
    if (!list.length) return list
    if (!list.some((item) => isUnknownRealName(item.real_name))) return list

    const currentUserId = authStore.user?.id
    const currentUserName = (authStore.user?.username || '').trim()
    const effectiveOrgId = resolveScopeOrgId(scope, orgId)

    let usernameMap: Map<number, string> | null = null
    if (effectiveOrgId) {
      try {
        usernameMap = await ensureUsernameMap(effectiveOrgId)
      } catch {
        usernameMap = null
      }
    }

    return list.map((item) => {
      if (!isUnknownRealName(item.real_name)) return item

      if (currentUserId && item.user_id === currentUserId && currentUserName) {
        return { ...item, real_name: currentUserName }
      }

      const mapped = usernameMap?.get(item.user_id)
      if (mapped) return { ...item, real_name: mapped }

      return item
    })
  }

  const buildRankingConfig = (
    platform: OJPlatform,
    scope: RankingScope,
    orgId?: number,
    mode: 'base' | 'more' = 'base'
  ) => ({
    skipTip: true,
    skipErrTip: true,
    dedupeKey: `ranking:${platform}:${scope}:${orgId || 0}:${mode}`,
    cancelPrevious: true,
  })

  const fetchRankingPage = async (
    platform: OJPlatform,
    scope: RankingScope,
    orgId: number | undefined,
    page: number,
    options: FetchRankingOptions = {}
  ) => {
    const normalizedScope = normalizeScope(scope)
    const effectiveOrgId = resolveScopeOrgId(normalizedScope, orgId)
    const state = getState(platform, normalizedScope, effectiveOrgId)
    const cacheKey = buildCacheKey(platform, normalizedScope, effectiveOrgId)
    const isAppend = options.append === true
    const pendingMap = isAppend ? pendingMoreRequests : pendingBaseRequests
    const pendingRequest = pendingMap.get(cacheKey)
    if (pendingRequest) return pendingRequest

    const requestPromise = (async () => {
      const shouldShowInitialLoading =
        !isAppend && !(options.silentIfCached && state.initialized)

      if (isAppend) {
        state.loadingMore = true
      } else if (shouldShowInitialLoading) {
        state.loading = true
      }

      try {
        const data = await getRankingList(
          {
            platform,
            page,
            page_size: pageSize,
            scope: normalizedScope,
            org_id: normalizedScope === 'org' ? effectiveOrgId : undefined,
          },
          buildRankingConfig(platform, normalizedScope, effectiveOrgId, isAppend ? 'more' : 'base')
        )

        const nextList =
          platform === 'lanqiao'
            ? await patchUnknownNamesForLanqiao(data.list || [], normalizedScope, effectiveOrgId)
            : data.list || []

        if (isAppend) {
          state.list = [...state.list, ...nextList]
          state.page = page
        } else {
          state.list = nextList
          state.page = 1
        }

        state.myRank = data.my_rank || null
        state.total = data.total || 0
        state.hasMore = state.list.length < state.total
        state.initialized = true
      } catch (error) {
        if (isRequestCanceled(error)) return

        if (!isAppend && !state.initialized) {
          state.list = []
          state.myRank = null
          state.total = 0
          state.page = 1
          state.hasMore = false
          state.initialized = true
        }
      } finally {
        state.loading = false
        state.loadingMore = false
        pendingMap.delete(cacheKey)
      }
    })()

    pendingMap.set(cacheKey, requestPromise)
    return requestPromise
  }

  const refreshPlatform = (
    platform: OJPlatform,
    scope: RankingScope = 'org',
    orgId?: number,
    options: FetchRankingOptions = {}
  ) => {
    return fetchRankingPage(platform, scope, orgId, 1, options)
  }

  const ensureScopeReady = async (
    platform: OJPlatform,
    scope: RankingScope = 'org',
    orgId?: number,
    options: FetchRankingOptions = {}
  ) => {
    const normalizedScope = normalizeScope(scope)
    const effectiveOrgId = resolveScopeOrgId(normalizedScope, orgId)
    const state = getState(platform, normalizedScope, effectiveOrgId)

    if (!state.initialized) {
      await refreshPlatform(platform, normalizedScope, effectiveOrgId, options)
      return
    }

    void refreshPlatform(platform, normalizedScope, effectiveOrgId, {
      ...options,
      silentIfCached: true,
    })
  }

  const preparePlatform = async (platform: OJPlatform, orgId?: number) => {
    const effectiveOrgId = resolveScopeOrgId('org', orgId)
    const orgState = getState(platform, 'org', effectiveOrgId)

    if (orgState.initialized) {
      void refreshPlatform(platform, 'org', effectiveOrgId, { silentIfCached: true })
    } else {
      await refreshPlatform(platform, 'org', effectiveOrgId)
    }

    void ensureScopeReady(platform, 'all_members', undefined, { silentIfCached: true })
  }

  const loadMore = async (
    platform: OJPlatform,
    scope: RankingScope = 'org',
    orgId?: number
  ) => {
    const normalizedScope = normalizeScope(scope)
    const effectiveOrgId = resolveScopeOrgId(normalizedScope, orgId)
    const state = getState(platform, normalizedScope, effectiveOrgId)

    if (!state.hasMore || state.loadingMore) return

    await fetchRankingPage(
      platform,
      normalizedScope,
      effectiveOrgId,
      state.page + 1,
      { append: true }
    )
  }

  return {
    getState,
    loadMore,
    preparePlatform,
    refreshPlatform,
    ensureScopeReady,
  }
}

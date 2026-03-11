/**
 * 排行榜数据获取逻辑
 * 支持分页加载
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getRankingList } from '@/services/oj.service'
import type { RankingItem, MyRank } from '@/types'

export function useRankingData() {
  // 加载状态 - 两个平台独立
  const luoguLoading = ref(false)
  const leetcodeLoading = ref(false)
  const lanqiaoLoading = ref(false)

  // 加载更多状态
  const luoguLoadingMore = ref(false)
  const leetcodeLoadingMore = ref(false)
  const lanqiaoLoadingMore = ref(false)

  // 是否还有更多数据
  const luoguHasMore = ref(true)
  const leetcodeHasMore = ref(true)
  const lanqiaoHasMore = ref(true)

  // 分页信息
  const luoguPage = ref(1)
  const leetcodePage = ref(1)
  const lanqiaoPage = ref(1)
  const pageSize = 10

  // 洛谷排行榜数据
  const luoguRankList = ref<RankingItem[]>([])
  const luoguMyRank = ref<MyRank | null>(null)
  const luoguTotal = ref(0)

  // 力扣排行榜数据
  const leetcodeRankList = ref<RankingItem[]>([])
  const leetcodeMyRank = ref<MyRank | null>(null)
  const leetcodeTotal = ref(0)

  // 蓝桥杯排行榜数据
  const lanqiaoRankList = ref<RankingItem[]>([])
  const lanqiaoMyRank = ref<MyRank | null>(null)
  const lanqiaoTotal = ref(0)

  // 当前用户信息
  const authStore = useAuthStore()
  const user = authStore.user

  /**
   * 判断排行榜项是否是当前用户
   */
  const isCurrentUser = (item: RankingItem) => {
    return user?.id === item.user_id
  }

  /**
   * 获取洛谷排行榜数据（静默请求）
   */
  const fetchLuoguRankingList = async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        luoguLoadingMore.value = true
      } else {
        luoguLoading.value = true
      }

      const data = await getRankingList(
        { platform: 'luogu', page, page_size: pageSize },
        { skipTip: true }
      )

      if (isLoadMore) {
        // 加载更多：追加数据
        luoguRankList.value = [...luoguRankList.value, ...(data.list || [])]
      } else {
        // 刷新或首次加载：替换数据
        luoguRankList.value = data.list || []
        luoguPage.value = 1
      }

      luoguMyRank.value = data.my_rank || null
      luoguTotal.value = data.total || 0

      // 判断是否还有更多数据
      luoguHasMore.value = luoguRankList.value.length < luoguTotal.value
    } catch (error) {
      // 失败也不弹提示
      if (!isLoadMore) {
        luoguRankList.value = []
        luoguMyRank.value = null
        luoguTotal.value = 0
        luoguHasMore.value = false
      }
    } finally {
      luoguLoading.value = false
      luoguLoadingMore.value = false
    }
  }

  /**
   * 获取力扣排行榜数据（静默请求）
   */
  const fetchLeetcodeRankingList = async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        leetcodeLoadingMore.value = true
      } else {
        leetcodeLoading.value = true
      }

      const data = await getRankingList(
        { platform: 'leetcode', page, page_size: pageSize },
        { skipTip: true }
      )

      if (isLoadMore) {
        // 加载更多：追加数据
        leetcodeRankList.value = [...leetcodeRankList.value, ...(data.list || [])]
      } else {
        // 刷新或首次加载：替换数据
        leetcodeRankList.value = data.list || []
        leetcodePage.value = 1
      }

      leetcodeMyRank.value = data.my_rank || null
      leetcodeTotal.value = data.total || 0

      // 判断是否还有更多数据
      leetcodeHasMore.value = leetcodeRankList.value.length < leetcodeTotal.value
    } catch (error) {
      // 失败也不弹提示
      if (!isLoadMore) {
        leetcodeRankList.value = []
        leetcodeMyRank.value = null
        leetcodeTotal.value = 0
        leetcodeHasMore.value = false
      }
    } finally {
      leetcodeLoading.value = false
      leetcodeLoadingMore.value = false
    }
  }

  /**
   * 获取蓝桥杯排行榜数据（静默请求）
   */
  const fetchLanqiaoRankingList = async (page: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        lanqiaoLoadingMore.value = true
      } else {
        lanqiaoLoading.value = true
      }

      const data = await getRankingList(
        { platform: 'lanqiao', page, page_size: pageSize },
        { skipTip: true }
      )

      if (isLoadMore) {
        // 加载更多：追加数据
        lanqiaoRankList.value = [...lanqiaoRankList.value, ...(data.list || [])]
      } else {
        // 刷新或首次加载：替换数据
        lanqiaoRankList.value = data.list || []
        lanqiaoPage.value = 1
      }

      lanqiaoMyRank.value = data.my_rank || null
      lanqiaoTotal.value = data.total || 0

      // 判断是否还有更多数据
      lanqiaoHasMore.value = lanqiaoRankList.value.length < lanqiaoTotal.value
    } catch (error) {
      // 失败也不弹提示
      if (!isLoadMore) {
        lanqiaoRankList.value = []
        lanqiaoMyRank.value = null
        lanqiaoTotal.value = 0
        lanqiaoHasMore.value = false
      }
    } finally {
      lanqiaoLoading.value = false
      lanqiaoLoadingMore.value = false
    }
  }

  /**
   * 加载更多洛谷数据
   */
  const loadMoreLuogu = async () => {
    if (!luoguHasMore.value || luoguLoadingMore.value) return

    luoguPage.value += 1
    await fetchLuoguRankingList(luoguPage.value, true)
  }

  /**
   * 加载更多力扣数据
   */
  const loadMoreLeetcode = async () => {
    if (!leetcodeHasMore.value || leetcodeLoadingMore.value) return

    leetcodePage.value += 1
    await fetchLeetcodeRankingList(leetcodePage.value, true)
  }

  /**
   * 加载更多蓝桥杯数据
   */
  const loadMoreLanqiao = async () => {
    if (!lanqiaoHasMore.value || lanqiaoLoadingMore.value) return

    lanqiaoPage.value += 1
    await fetchLanqiaoRankingList(lanqiaoPage.value, true)
  }

  /**
   * 刷新所有排行榜数据
   */
  const refreshAll = async () => {
    await Promise.all([
      fetchLuoguRankingList(1, false),
      fetchLeetcodeRankingList(1, false),
      fetchLanqiaoRankingList(1, false)
    ])
  }

  return {
    luoguLoading,
    leetcodeLoading,
    lanqiaoLoading,
    luoguLoadingMore,
    leetcodeLoadingMore,
    lanqiaoLoadingMore,
    luoguHasMore,
    leetcodeHasMore,
    lanqiaoHasMore,
    luoguRankList,
    luoguMyRank,
    luoguTotal,
    leetcodeRankList,
    leetcodeMyRank,
    leetcodeTotal,
    lanqiaoRankList,
    lanqiaoMyRank,
    lanqiaoTotal,
    isCurrentUser,
    loadMoreLuogu,
    loadMoreLeetcode,
    loadMoreLanqiao,
    refreshAll,
  }
}

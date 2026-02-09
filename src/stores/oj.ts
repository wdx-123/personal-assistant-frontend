/**
 * OJ（Online Judge）状态管理
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { OJPlatform, OJUserInfo } from '@/types'

export const useOJStore = defineStore('oj', () => {
  // State
  const luoguInfo = ref<OJUserInfo | null>(null)
  const leetcodeInfo = ref<OJUserInfo | null>(null)
  const leaderboardPlatform = ref<OJPlatform>('luogu') // 当前显示的排行榜平台

  // Getters
  const getOJInfo = (platform: OJPlatform) => {
    return platform === 'luogu' ? luoguInfo : leetcodeInfo
  }

  // Actions
  function setOJInfo(platform: OJPlatform, info: OJUserInfo) {
    if (platform === 'luogu') {
      luoguInfo.value = info
    } else {
      leetcodeInfo.value = info
    }
  }

  function clearOJInfo(platform: OJPlatform) {
    if (platform === 'luogu') {
      luoguInfo.value = null
    } else {
      leetcodeInfo.value = null
    }
  }

  function toggleLeaderboardPlatform() {
    leaderboardPlatform.value = leaderboardPlatform.value === 'luogu' ? 'leetcode' : 'luogu'
  }

  return {
    // State
    luoguInfo,
    leetcodeInfo,
    leaderboardPlatform,
    // Actions
    getOJInfo,
    setOJInfo,
    clearOJInfo,
    toggleLeaderboardPlatform,
  }
})

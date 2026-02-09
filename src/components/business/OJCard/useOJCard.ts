/**
 * OJ 卡片数据逻辑
 */
import { ref, computed, onMounted } from 'vue'
import { message } from '@/components/common'
import { bindOJ, getOJStats } from '@/services/oj.service'
import type { OJPlatform, OJStatsResponse } from '@/types'

interface PlatformConfig {
  name: string
  description: string
  placeholder: string
}

interface UseOJCardOptions {
  platform: OJPlatform
  onBound?: (data: OJStatsResponse) => void
}

export function useOJCard(options: UseOJCardOptions) {
  const { platform, onBound } = options

  // 用户输入
  const identifier = ref('')

  // 加载状态
  const loading = ref(false)
  const isLoading = ref(false)

  // 是否已绑定
  const isBound = ref(false)

  // 用户信息
  const userInfo = ref<OJStatsResponse | null>(null)

  // 正在重新绑定（用于区分首次绑定和重新绑定）
  const isRebinding = ref(false)

  // 平台配置
  const platformConfigs: Record<OJPlatform, PlatformConfig> = {
    luogu: {
      name: '洛谷',
      description: '绑定您的洛谷账号，即可参与排名(*^▽^*)',
      placeholder: '请输入洛谷用户ID',
    },
    leetcode: {
      name: '力扣',
      description: '绑定您的力扣账号，即可参与排名(*^▽^*)',
      placeholder: '请输入力扣用户ID',
    },
  }

  const platformConfig = computed(() => platformConfigs[platform])
  const platformName = computed(() => platformConfig.value.name)
  const description = computed(() => platformConfig.value.description)
  const placeholder = computed(() => platformConfig.value.placeholder)

  /**
   * 加载用户 OJ 信息（静默请求）
   */
  const loadOJStats = async () => {
    try {
      isLoading.value = true
      const data = await getOJStats(
        { platform },
        {
          skipTip: true,
        }
      )

      userInfo.value = data
      isBound.value = true
    } catch (error) {
      // 接口错误可能表示未绑定
      isBound.value = false
      userInfo.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 绑定 OJ 账号（首次绑定 + 重新绑定）
   */
  const handleBind = async () => {
    if (!identifier.value.trim()) {
      message.warning('请输入用户ID')
      return
    }

    try {
      loading.value = true

      // 根据是否是重新绑定显示不同的提示
      const tipMessage = isRebinding.value
        ? `${platformName.value}账号重新绑定成功！`
        : `${platformName.value}账号绑定成功！`

      await bindOJ(
        {
          platform,
          identifier: identifier.value.trim(),
        },
        {
          customSuccTip: tipMessage,
          skipErrTip: true
        }
      )

      // 更新用户信息
      await loadOJStats()

      // 清空输入
      identifier.value = ''

      // 重置重新绑定状态
      isRebinding.value = false

      // 通知父组件
      if (userInfo.value) {
        onBound?.(userInfo.value)
      }
    } catch (error: unknown) {
      const err = error as { code?: number };
      if(err?.code === 4290){
        message.error('距离上次修改超过48h后才能再次修改')
      }else {
        message.error('绑定失败')
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始重新绑定
   * 点击"重新绑定"按钮或右上角翻转按钮后，翻转卡片到正面
   */
  const handleStartRebind = () => {
    // 翻转卡片到正面（显示输入框）
    isBound.value = false
    // 标记为重新绑定模式
    isRebinding.value = true
    // 预填充当前绑定的ID（可选）
    if (userInfo.value?.identifier) {
      identifier.value = userInfo.value.identifier
    }
  }

  /**
   * 从正面翻转回反面
   * 点击左上角返回按钮，不修改重新绑定状态
   */
  const handleFlipBack = () => {
    isBound.value = true
  }

  // 组件挂载时加载用户信息
  onMounted(() => {
    loadOJStats()
  })

  return {
    // 数据
    identifier,
    loading,
    isLoading,
    isBound,
    userInfo,
    isRebinding,
    platformName,
    description,
    placeholder,

    // 方法
    loadOJStats,
    handleBind,
    handleStartRebind,
    handleFlipBack,
  }
}

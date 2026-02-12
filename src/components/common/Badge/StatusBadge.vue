<script setup lang="ts">
import { computed } from 'vue'
import Badge from './Badge.vue'
import type { BadgeSize, BadgeTone, BadgeVariant } from './types'

interface Props {
  status: 'enabled' | 'disabled' | string
  enabledText?: string
  disabledText?: string
  variant?: BadgeVariant
  size?: BadgeSize
  showDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabledText: '启用',
  disabledText: '禁用',
  variant: 'soft',
  size: 'small',
  showDot: true
})

const normalizedStatus = computed(() => String(props.status || '').toLowerCase())

const tone = computed<BadgeTone>(() => {
  if (normalizedStatus.value === 'enabled') {
    return 'success'
  }
  if (normalizedStatus.value === 'disabled') {
    return 'neutral'
  }
  return 'neutral'
})

const label = computed(() => {
  if (normalizedStatus.value === 'enabled') {
    return props.enabledText
  }
  if (normalizedStatus.value === 'disabled') {
    return props.disabledText
  }
  return String(props.status || props.disabledText)
})
</script>

<template>
  <Badge :tone="tone" :variant="props.variant" :size="props.size" :show-dot="props.showDot">
    {{ label }}
  </Badge>
</template>

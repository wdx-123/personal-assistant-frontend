<script setup lang="ts">
import { computed } from 'vue'
import Badge from './Badge.vue'
import type { BadgeSize, BadgeTone, BadgeVariant } from './types'

interface Props {
  type: 'directory' | 'menu' | 'button' | string
  directoryText?: string
  menuText?: string
  buttonText?: string
  variant?: BadgeVariant
  size?: BadgeSize
  showDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  directoryText: '目录',
  menuText: '菜单',
  buttonText: '按钮',
  showDot: false
})

const normalizedType = computed(() => String(props.type || '').toLowerCase())

const tone = computed<BadgeTone>(() => {
  if (normalizedType.value === 'directory') {
    return 'success'
  }
  if (normalizedType.value === 'menu') {
    return 'primary'
  }
  if (normalizedType.value === 'button') {
    return 'danger'
  }
  return 'neutral'
})

const label = computed(() => {
  if (normalizedType.value === 'directory') {
    return props.directoryText
  }
  if (normalizedType.value === 'menu') {
    return props.menuText
  }
  if (normalizedType.value === 'button') {
    return props.buttonText
  }
  return String(props.type || props.menuText)
})

const resolvedVariant = computed<BadgeVariant>(() => {
  if (props.variant) {
    return props.variant
  }

  if (normalizedType.value === 'directory') {
    return 'soft'
  }

  return 'outline'
})

const resolvedSize = computed<BadgeSize>(() => {
  if (props.size) {
    return props.size
  }

  if (normalizedType.value === 'directory') {
    return 'medium'
  }
  if (normalizedType.value === 'menu') {
    return 'small'
  }
  if (normalizedType.value === 'button') {
    return 'xsmall'
  }
  return 'small'
})
</script>

<template>
  <Badge :tone="tone" :variant="resolvedVariant" :size="resolvedSize" :show-dot="props.showDot">
    {{ label }}
  </Badge>
</template>

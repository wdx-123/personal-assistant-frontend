<script setup lang="ts">
import { computed } from 'vue'
import type { BadgeProps } from './types'

interface Props extends BadgeProps {}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
  variant: 'soft',
  size: 'small',
  showDot: true,
  dotPulse: false
})

const badgeClass = computed(() => {
  return [
    'badge',
    `badge-${props.tone}`,
    `badge-${props.variant}`,
    `badge-${props.size}`
  ]
})
</script>

<template>
  <span :class="badgeClass">
    <span v-if="props.showDot" class="badge-dot" :class="{ pulse: props.dotPulse }"></span>
    <span class="badge-content">
      <slot></slot>
    </span>
  </span>
</template>

<style scoped>
.badge {
  --badge-color: #4b5563;
  --badge-dot-color: var(--badge-color);
  --badge-soft-bg: rgba(148, 163, 184, 0.12);
  --badge-soft-border: rgba(148, 163, 184, 0.26);
  --badge-soft-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  --badge-solid-bg: #64748b;
  --badge-outline-bg: #ffffff;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: var(--ui-radius-pill, 999px);
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  transition: border-color var(--ui-duration-hover, 140ms) var(--ui-ease-standard, ease),
    box-shadow var(--ui-duration-hover, 140ms) var(--ui-ease-standard, ease),
    color var(--ui-duration-hover, 140ms) var(--ui-ease-standard, ease),
    background-color var(--ui-duration-hover, 140ms) var(--ui-ease-standard, ease);
}

.badge-small {
  min-height: 22px;
  padding: 0 9px;
  gap: 6px;
  font-size: 12px;
}

.badge-xsmall {
  min-height: 18px;
  padding: 0 7px;
  gap: 4px;
  font-size: 11px;
}

.badge-medium {
  min-height: 24px;
  padding: 0 11px;
  gap: 6px;
  font-size: 13px;
}

.badge-soft {
  color: var(--badge-color);
  background: var(--badge-soft-bg);
  border-color: var(--badge-soft-border);
  box-shadow: var(--badge-soft-shadow);
}

.badge-solid {
  color: #ffffff;
  background: var(--badge-solid-bg);
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
}

.badge-outline {
  color: var(--badge-color);
  background: var(--badge-outline-bg);
  border-color: var(--badge-soft-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.badge-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--badge-dot-color);
}

.badge-dot.pulse {
  animation: badge-dot-pulse 1.8s ease-in-out infinite;
}

.badge-content {
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-primary {
  --badge-color: #2563eb;
  --badge-dot-color: #2563eb;
  --badge-soft-bg: rgba(37, 99, 235, 0.08);
  --badge-soft-border: rgba(37, 99, 235, 0.24);
  --badge-soft-shadow: 0 1px 2px rgba(37, 99, 235, 0.08);
  --badge-solid-bg: #2563eb;
}

.badge-success {
  --badge-color: #15803d;
  --badge-dot-color: #15803d;
  --badge-soft-bg: rgba(21, 128, 61, 0.08);
  --badge-soft-border: rgba(21, 128, 61, 0.24);
  --badge-soft-shadow: 0 1px 2px rgba(21, 128, 61, 0.08);
  --badge-solid-bg: #16a34a;
}

.badge-danger {
  --badge-color: #dc2626;
  --badge-dot-color: #dc2626;
  --badge-soft-bg: rgba(220, 38, 38, 0.08);
  --badge-soft-border: rgba(220, 38, 38, 0.24);
  --badge-soft-shadow: 0 1px 2px rgba(220, 38, 38, 0.08);
  --badge-solid-bg: #dc2626;
}

.badge-warning {
  --badge-color: #b45309;
  --badge-dot-color: #b45309;
  --badge-soft-bg: rgba(180, 83, 9, 0.08);
  --badge-soft-border: rgba(180, 83, 9, 0.24);
  --badge-soft-shadow: 0 1px 2px rgba(180, 83, 9, 0.08);
  --badge-solid-bg: #d97706;
}

.badge-neutral {
  --badge-color: #4b5563;
  --badge-dot-color: #6b7280;
  --badge-soft-bg: rgba(148, 163, 184, 0.12);
  --badge-soft-border: rgba(148, 163, 184, 0.28);
  --badge-soft-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  --badge-solid-bg: #64748b;
}

@keyframes badge-dot-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.22);
    opacity: 0.6;
  }
}
</style>

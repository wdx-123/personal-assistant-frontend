<template>
  <div
    class="ranking-avatar"
    :class="[
      `ranking-avatar--${size}`,
      `ranking-avatar--accent-${accent}`,
      { 'ranking-avatar--fallback': !showImage },
    ]"
    :style="avatarVars"
  >
    <img
      v-if="showImage"
      class="ranking-avatar__image"
      :src="normalizedSrc"
      :alt="name ? `${name}头像` : '用户头像'"
      loading="lazy"
      decoding="async"
      draggable="false"
      @error="handleImageError"
    />
    <div v-else class="ranking-avatar__fallback" aria-hidden="true">
      <span class="ranking-avatar__label">{{ fallbackText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type AvatarSize = 'podium' | 'list'
type AvatarAccent = 'gold' | 'silver' | 'bronze' | 'default'

interface Props {
  src?: string
  name?: string
  userId?: number
  size?: AvatarSize
  accent?: AvatarAccent
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  userId: undefined,
  size: 'list',
  accent: 'default',
})

const COLOR_PALETTES = [
  { start: '#60A5FA', end: '#2563EB' },
  { start: '#22D3EE', end: '#0EA5E9' },
  { start: '#34D399', end: '#059669' },
  { start: '#FBBF24', end: '#F59E0B' },
  { start: '#FB7185', end: '#E11D48' },
  { start: '#A78BFA', end: '#7C3AED' },
  { start: '#F97316', end: '#EA580C' },
  { start: '#2DD4BF', end: '#0F766E' },
]

const PLACEHOLDER_AVATAR_KEYWORDS = [
  'default-avatar',
  'default_avatar',
  'avatar-default',
  'default-user',
  'default_user',
  'placeholder-avatar',
  'placeholder_avatar',
  'noavatar',
  'no-avatar',
  'usericon',
]

const imageLoadFailed = ref(false)

const normalizedSrc = computed(() => (props.src || '').trim())

const isPlaceholderAvatar = (src: string) => {
  const normalized = src.trim().toLowerCase()
  if (!normalized) return false

  return PLACEHOLDER_AVATAR_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

const showImage = computed(() => {
  return Boolean(normalizedSrc.value) &&
    !isPlaceholderAvatar(normalizedSrc.value) &&
    !imageLoadFailed.value
})

const fallbackText = computed(() => {
  const compactName = (props.name || '').replace(/\s+/g, '')
  const chineseCharacter = compactName.match(/[\u4E00-\u9FFF]/u)?.[0]
  if (chineseCharacter) return chineseCharacter

  const alphaNumeric = compactName.match(/[A-Za-z0-9]/)?.[0]
  if (alphaNumeric) return alphaNumeric.toUpperCase()

  return 'U'
})

const paletteIndex = computed(() => {
  if (typeof props.userId === 'number' && Number.isFinite(props.userId)) {
    return Math.abs(props.userId) % COLOR_PALETTES.length
  }

  const seed = (props.name || '').trim()
  let hash = 0

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }

  return Math.abs(hash) % COLOR_PALETTES.length
})

const avatarVars = computed(() => {
  const palette = COLOR_PALETTES[paletteIndex.value] ?? COLOR_PALETTES[0]!

  return {
    '--ranking-avatar-start': palette.start,
    '--ranking-avatar-end': palette.end,
  }
})

const handleImageError = () => {
  imageLoadFailed.value = true
}

watch(normalizedSrc, () => {
  imageLoadFailed.value = false
})
</script>

<style scoped>
.ranking-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  box-sizing: border-box;
  background: #e2e8f0;
}

.ranking-avatar__image,
.ranking-avatar__fallback {
  width: 100%;
  height: 100%;
}

.ranking-avatar__image {
  display: block;
  object-fit: cover;
  background: #f8fafc;
}

.ranking-avatar__fallback {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0) 34%),
    linear-gradient(145deg, var(--ranking-avatar-start) 0%, var(--ranking-avatar-end) 100%);
}

.ranking-avatar__fallback::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.24) 0%,
    rgba(255, 255, 255, 0.04) 58%,
    rgba(15, 23, 42, 0.14) 100%
  );
}

.ranking-avatar__fallback::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.16) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.16) 50%,
      rgba(255, 255, 255, 0.16) 75%,
      transparent 75%,
      transparent 100%
    );
  background-size: 14px 14px;
  opacity: 0.18;
  mix-blend-mode: soft-light;
}

.ranking-avatar__label {
  position: relative;
  z-index: 1;
  color: #fff;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
}

.ranking-avatar--podium .ranking-avatar__label {
  font-size: 24px;
}

.ranking-avatar--accent-gold.ranking-avatar--podium .ranking-avatar__label {
  font-size: 28px;
}

.ranking-avatar--list .ranking-avatar__label {
  font-size: 16px;
}

.ranking-avatar--accent-default {
  border: 1px solid rgba(255, 255, 255, 0.88);
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.ranking-avatar--accent-silver,
.ranking-avatar--accent-bronze {
  border: 3px solid #fff;
  box-shadow:
    0 6px 16px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.ranking-avatar--accent-gold {
  border: 4px solid #facc15;
  box-shadow:
    0 8px 18px rgba(250, 204, 21, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
}
</style>

<script setup lang="ts">
/**
 * 背景轮播组件
 * 首屏优先探测第 1 张高清图是否能在极短预算内直接解码；
 * 若不能，则回退到绿色 poster，并在第 1 张高清图就位后通过 poster 退场完成渐清接管。
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import posterUrl from '@/assets/background/generated/poster.avif'
import imageA from '@/assets/background/generated/a-carousel.avif'
import imageB from '@/assets/background/generated/b-carousel.avif'
import imageC from '@/assets/background/generated/c-carousel.avif'
import imageD from '@/assets/background/generated/d-carousel.avif'

type CarouselState = 'booting' | 'poster' | 'revealing' | 'ready'
type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error'
type FastProbeResult = 'loaded' | 'timeout' | 'error'

const carouselImages = [imageA, imageB, imageC, imageD]
const state = ref<CarouselState>('booting')
const imageStates = ref<ImageLoadState[]>(carouselImages.map(() => 'idle'))
const currentIndex = ref(0)
const posterFading = ref(false)

const FAST_READY_BUDGET_MS = 180
const REVEAL_DURATION_MS = 2200
const CAROUSEL_INTERVAL_MS = 6700

const visibleCarouselImages = computed(() =>
  carouselImages
    .map((src, index) => ({ src, index }))
    .filter(({ index }) => imageStates.value[index] === 'loaded')
)
const showPoster = computed(() => state.value === 'poster' || state.value === 'revealing')
const showCarousel = computed(() => state.value === 'revealing' || state.value === 'ready')
const hasLoadError = computed(() => imageStates.value.some((item) => item === 'error'))

let intervalId: ReturnType<typeof setInterval> | null = null
let revealCompleteTimeoutId: ReturnType<typeof setTimeout> | null = null
let revealFrameId: number | null = null
let revealFrameId2: number | null = null
let disposed = false
let remainingLoadsStarted = false
const imageLoadTasks: Array<Promise<boolean> | null> = carouselImages.map(() => null)

const isImageLoaded = (index: number) => imageStates.value[index] === 'loaded'
const isImageErrored = (index: number) => imageStates.value[index] === 'error'

const markImageState = (index: number, nextState: ImageLoadState) => {
  imageStates.value[index] = nextState
}

const loadImage = (index: number, priority: 'high' | 'low') => {
  const existingTask = imageLoadTasks[index]
  if (existingTask) return existingTask

  const imageSrc = carouselImages[index]
  if (!imageSrc) {
    markImageState(index, 'error')
    return Promise.resolve(false)
  }

  markImageState(index, 'loading')

  const task = new Promise<boolean>((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.fetchPriority = priority

    image.onload = async () => {
      try {
        if (typeof image.decode === 'function') {
          await image.decode()
        }
      } catch {
      }

      if (disposed) {
        resolve(false)
        return
      }

      markImageState(index, 'loaded')
      resolve(true)
    }

    image.onerror = () => {
      if (disposed) {
        resolve(false)
        return
      }

      markImageState(index, 'error')
      resolve(false)
    }

    image.src = imageSrc
  })

  imageLoadTasks[index] = task
  return task
}

const loadRemainingImages = () => {
  if (remainingLoadsStarted) return
  remainingLoadsStarted = true

  for (let index = 1; index < carouselImages.length; index += 1) {
    void loadImage(index, 'low')
  }
}

const nextSlide = () => {
  const availableImages = visibleCarouselImages.value
  if (availableImages.length <= 1) return

  const firstAvailableImage = availableImages[0]
  if (!firstAvailableImage) return

  const currentPosition = availableImages.findIndex((item) => item.index === currentIndex.value)
  const nextPosition = currentPosition === -1 ? 0 : (currentPosition + 1) % availableImages.length
  currentIndex.value = availableImages[nextPosition]?.index ?? firstAvailableImage.index
}

const stopCarousel = () => {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}

const stopReveal = () => {
  if (!revealCompleteTimeoutId) return
  clearTimeout(revealCompleteTimeoutId)
  revealCompleteTimeoutId = null
}

const stopRevealFrames = () => {
  if (revealFrameId !== null) {
    cancelAnimationFrame(revealFrameId)
    revealFrameId = null
  }

  if (revealFrameId2 !== null) {
    cancelAnimationFrame(revealFrameId2)
    revealFrameId2 = null
  }
}

const startCarousel = () => {
  stopCarousel()

  if (state.value !== 'ready' || visibleCarouselImages.value.length <= 1) {
    return
  }

  intervalId = setInterval(nextSlide, CAROUSEL_INTERVAL_MS)
}

const getPosterRevealTargetIndex = () => {
  if (isImageLoaded(0)) return 0
  if (!isImageErrored(0)) return null
  return visibleCarouselImages.value[0]?.index ?? null
}

const startPosterReveal = (targetIndex: number) => {
  if (disposed || state.value !== 'poster') return

  stopReveal()
  stopRevealFrames()
  stopCarousel()

  currentIndex.value = targetIndex
  posterFading.value = false
  state.value = 'revealing'

  revealFrameId = requestAnimationFrame(() => {
    revealFrameId = null
    revealFrameId2 = requestAnimationFrame(() => {
      revealFrameId2 = null

      if (disposed) return

      posterFading.value = true
      revealCompleteTimeoutId = setTimeout(() => {
        if (disposed) return

        posterFading.value = false
        state.value = 'ready'
        startCarousel()
      }, REVEAL_DURATION_MS)
    })
  })
}

const maybeStartPosterReveal = () => {
  if (state.value !== 'poster') return

  const targetIndex = getPosterRevealTargetIndex()
  if (targetIndex === null) return

  startPosterReveal(targetIndex)
}

const probeFirstImage = async () => {
  const firstImageTask = loadImage(0, 'high')

  const timeoutTask = new Promise<FastProbeResult>((resolve) => {
    setTimeout(() => resolve('timeout'), FAST_READY_BUDGET_MS)
  })

  return Promise.race<FastProbeResult>([
    firstImageTask.then((loaded) => (loaded ? 'loaded' : 'error')),
    timeoutTask,
  ])
}

const bootCarousel = async () => {
  const firstImageProbeResult = await probeFirstImage()
  if (disposed) return

  loadRemainingImages()

  if (firstImageProbeResult === 'loaded') {
    currentIndex.value = 0
    posterFading.value = false
    state.value = 'ready'
    startCarousel()
    return
  }

  state.value = 'poster'
  maybeStartPosterReveal()
}

watch(
  () => visibleCarouselImages.value.map((item) => item.index).join(','),
  () => {
    const availableImages = visibleCarouselImages.value

    if (!availableImages.length) {
      stopCarousel()
      return
    }

    const firstAvailableImage = availableImages[0]
    if (!firstAvailableImage) {
      stopCarousel()
      return
    }

    const hasCurrentImage = availableImages.some((item) => item.index === currentIndex.value)
    if (!hasCurrentImage) {
      currentIndex.value = firstAvailableImage.index
    }

    if (state.value === 'poster') {
      maybeStartPosterReveal()
      return
    }

    if (state.value === 'ready') {
      startCarousel()
      return
    }

    stopCarousel()
  }
)

onMounted(() => {
  void bootCarousel()
})

onUnmounted(() => {
  disposed = true
  stopReveal()
  stopRevealFrames()
  stopCarousel()
})
</script>

<template>
  <div class="background-carousel" :class="{ 'has-error': hasLoadError }">
    <template v-if="showPoster">
      <div
        class="poster-layer"
        :class="{ fading: posterFading }"
        :style="{ backgroundImage: `url(${posterUrl})` }"
      />
      <div class="poster-overlay" :class="{ fading: posterFading }" />
    </template>

    <div class="carousel-layer" :class="{ visible: showCarousel }">
      <img
        v-for="item in visibleCarouselImages"
        :key="item.src"
        :src="showCarousel ? item.src : undefined"
        class="carousel-item"
        :class="{ active: currentIndex === item.index }"
        :alt="`Background ${item.index + 1}`"
        decoding="async"
        :fetchpriority="item.index === 0 ? 'high' : 'low'"
      />
    </div>
  </div>
</template>

<style scoped>
.background-carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.poster-layer,
.poster-overlay,
.carousel-layer,
.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.poster-layer {
  z-index: 2;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transform: scale(1.08);
  filter: saturate(1.08) brightness(1.18) contrast(0.92);
  transition: opacity 2.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}

.poster-overlay {
  z-index: 3;
  background:
    radial-gradient(circle at 16% 18%, rgba(197, 231, 173, 0.18), transparent 30%),
    radial-gradient(circle at 78% 20%, rgba(151, 207, 133, 0.14), transparent 28%),
    radial-gradient(circle at 50% 82%, rgba(231, 245, 220, 0.12), transparent 42%),
    linear-gradient(135deg, rgba(24, 53, 31, 0.08), rgba(168, 214, 153, 0.08));
  transition: opacity 2.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity;
}

.poster-layer.fading,
.poster-overlay.fading {
  opacity: 0;
}

.carousel-layer {
  z-index: 1;
  opacity: 0;
}

.carousel-layer.visible {
  opacity: 1;
}

.carousel-item {
  object-fit: cover;
  opacity: 0;
  will-change: opacity;
  transform: translateZ(0);
  transition: opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.carousel-item.active {
  opacity: 1;
}
</style>

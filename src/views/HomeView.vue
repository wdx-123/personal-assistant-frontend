<script setup lang="ts">
/**
 * 首页
 */
import { defineAsyncComponent, ref, watch, onMounted, onUnmounted, computed } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Modal, message } from "@/components/common";
import { getMyOrgs } from "@/services/permission.service";
import { getOJCurve } from "@/services/oj.service";
import { isRequestCanceled } from "@/utils/request";
import type LeaderboardCardComponent from "@/components/business/LeaderboardCard/LeaderboardCard.vue";
import type { OJCurveResponse, OJStatsResponse, OJPlatform } from "@/types";

const HeaderBar = defineAsyncComponent(() => import("@/components/layout/HeaderBar.vue"));
const OJCard = defineAsyncComponent(() => import("@/components/business/OJCard/OJCard.vue"));
const LeaderboardCard = defineAsyncComponent(
  () => import("@/components/business/LeaderboardCard/LeaderboardCard.vue")
);

const authStore = useAuthStore();

// 动画状态
const isExiting = ref(false);

// 当前选中的平台
const selectedPlatform = ref<OJPlatform>('luogu');

// 当前组织名称
const orgOptions = ref<Array<{ id: number; name: string; description?: string }>>([]);
const orgLoading = ref(false);
const switchOrgVisible = ref(false);
const pendingOrgId = ref<number>(0);

const browsingOrgId = computed(() => {
  return authStore.browsingOrgId || authStore.user?.current_org_id || 0;
});

const browsingOrgName = computed(() => {
  const found = orgOptions.value.find((o) => o.id === browsingOrgId.value);
  return found?.name || authStore.user?.current_org?.name || "未选择组织";
});

// 平台选项
const platformOptions = [
  { label: '洛谷', value: 'luogu' },
  { label: '蓝桥杯', value: 'lanqiao' },
  { label: '力扣', value: 'leetcode' }
];

// 排行榜组件引用
const leaderboardRef = ref<InstanceType<typeof LeaderboardCardComponent> | null>(null);

const curveLoadingPlatform = ref<OJPlatform | null>(null);
const curveDataByPlatform = ref<Record<OJPlatform, OJCurveResponse | null>>({
  luogu: null,
  lanqiao: null,
  leetcode: null,
});
const curveRequestSeq = ref(0);
let curveBootTimer: ReturnType<typeof setTimeout> | null = null;

const currentCurve = computed(() => curveDataByPlatform.value[selectedPlatform.value]);
const curveBound = computed(() => currentCurve.value?.bound ?? false);
const curvePoints = computed(() => currentCurve.value?.points || []);
const curveTotal = computed(() => currentCurve.value?.current_total ?? 0);
const curveLastSyncAt = computed(() => currentCurve.value?.last_sync_at || "");

const formatSyncAt = (value: string) => {
  const raw = (value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const formatted = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai",
    }).format(parsed);
    return formatted.replace(/\//g, "-").replace(",", "");
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.length >= 16 ? raw.slice(0, 16) : raw;
  }
  return raw;
};

const curveLastSyncAtFormatted = computed(() => formatSyncAt(curveLastSyncAt.value));

const curveTitle = computed(() => {
  const label = platformOptions.find((p) => p.value === selectedPlatform.value)?.label || "";
  return `${label}近30天刷题总数曲线`;
});

const getPointValue = (p: any) => {
  const raw = p?.solved_total ?? p?.value ?? p?.count ?? p?.solved ?? 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

const chartValues = computed(() => curvePoints.value.map(getPointValue));
const chartMax = computed(() => Math.max(0, ...chartValues.value));
const chartMin = computed(() => {
  if (!chartValues.value.length) return 0;
  return Math.min(...chartValues.value);
});
const chartLatest = computed(() => {
  if (!chartValues.value.length) return 0;
  return chartValues.value[chartValues.value.length - 1];
});
const chartHasData = computed(() => chartValues.value.length > 0);
const chartHasIncrease = computed(() => {
  const values = chartValues.value;
  if (values.length <= 1) return false;
  for (let i = 1; i < values.length; i += 1) {
    const current = values[i];
    const previous = values[i - 1];
    if (current !== undefined && previous !== undefined && current > previous) return true;
  }
  return false;
});

const chartStartDate = computed(() => (curvePoints.value[0] as any)?.date || "");
const chartEndDate = computed(() => (curvePoints.value[curvePoints.value.length - 1] as any)?.date || "");

const buildLinePath = (values: number[]) => {
  const w = 300;
  const h = 120;
  const pad = 10;
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0, max - min);
  const amplitude = (h - pad * 2) * 0.7;
  const midY = h / 2;
  const step = values.length === 1 ? 0 : (w - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const t = range === 0 ? 0.5 : (v - min) / range;
    const y = midY + (0.5 - t) * amplitude;
    return { x, y };
  });
  return points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");
};

const buildAreaPath = (values: number[]) => {
  const w = 300;
  const h = 120;
  const pad = 10;
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0, max - min);
  const amplitude = (h - pad * 2) * 0.7;
  const midY = h / 2;
  const step = values.length === 1 ? 0 : (w - pad * 2) / (values.length - 1);
  const top = values.map((v, i) => {
    const x = pad + i * step;
    const t = range === 0 ? 0.5 : (v - min) / range;
    const y = midY + (0.5 - t) * amplitude;
    return { x, y };
  });
  const firstPoint = top[0];
  const lastPoint = top[top.length - 1];
  if (!firstPoint || !lastPoint) return "";
  const startX = firstPoint.x;
  const endX = lastPoint.x;
  const baseY = midY + amplitude / 2;
  const topSeg = top.map((pt, idx) => `${idx === 0 ? "M" : "L"}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(" ");
  return `${topSeg} L${endX.toFixed(2)} ${baseY.toFixed(2)} L${startX.toFixed(2)} ${baseY.toFixed(2)} Z`;
};

const chartLinePath = computed(() => buildLinePath(chartValues.value));
const chartAreaPath = computed(() => buildAreaPath(chartValues.value));

const chartSvgRef = ref<SVGSVGElement | null>(null);
const chartHover = ref<{ index: number; x: number; y: number; left: number; top: number } | null>(null);

const getChartPointCoord = (values: number[], index: number) => {
  const w = 300;
  const h = 120;
  const pad = 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0, max - min);
  const amplitude = (h - pad * 2) * 0.7;
  const midY = h / 2;
  const step = values.length === 1 ? 0 : (w - pad * 2) / (values.length - 1);
  const x = pad + index * step;
  const v = values[index] ?? 0;
  const t = range === 0 ? 0.5 : (v - min) / range;
  const y = midY + (0.5 - t) * amplitude;
  return { x, y };
};

const hoverDate = computed(() => {
  if (!chartHover.value) return "";
  return String((curvePoints.value[chartHover.value.index] as any)?.date || "");
});

const hoverValue = computed(() => {
  if (!chartHover.value) return 0;
  return chartValues.value[chartHover.value.index] ?? 0;
});

const handleChartMouseMove = (e: MouseEvent) => {
  if (!chartHasData.value || !chartSvgRef.value) return;
  const values = chartValues.value;
  if (!values.length) return;

  const rect = chartSvgRef.value.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const w = 300;
  const h = 120;
  const pad = 10;
  const count = values.length;
  const step = count === 1 ? 0 : (w - pad * 2) / (count - 1);
  const xV = (Math.min(Math.max(e.clientX - rect.left, 0), rect.width) / rect.width) * w;
  const rawIndex = step === 0 ? 0 : Math.round((xV - pad) / step);
  const index = Math.min(Math.max(rawIndex, 0), count - 1);
  const { x, y } = getChartPointCoord(values, index);
  const left = (x / w) * rect.width;
  const top = (y / h) * rect.height;
  chartHover.value = { index, x, y, left, top };
};

const handleChartMouseLeave = () => {
  chartHover.value = null;
};

const fetchCurve = async (platform: OJPlatform = selectedPlatform.value) => {
  const seq = ++curveRequestSeq.value;
  curveLoadingPlatform.value = platform;
  try {
    const data = await getOJCurve(
      { platform },
      {
        skipSuccTip: true,
        skipErrTip: true,
        dedupeKey: `home:curve:${platform}`,
        cancelPrevious: true,
      }
    );
    if (seq !== curveRequestSeq.value) return;
    curveDataByPlatform.value = { ...curveDataByPlatform.value, [platform]: data };
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (seq !== curveRequestSeq.value) return;
    curveDataByPlatform.value = { ...curveDataByPlatform.value, [platform]: null };
  } finally {
    if (seq === curveRequestSeq.value) {
      curveLoadingPlatform.value = null;
    }
  }
};

// 路由离开前的守卫
onBeforeRouteLeave((to, _from, next) => {
  if (to.path.startsWith('/console')) {
    isExiting.value = true;
    // 等待动画完成
    setTimeout(() => {
      next();
    }, 600); // 略长于 CSS transition 时间 (500ms)
  } else {
    next();
  }
});

const normalizeOrg = (item: any) => {
  const raw = item?.org || item?.organization || item;
  const id = Number(raw?.id ?? raw?.org_id ?? item?.org_id ?? item?.id ?? 0);
  const name = String(raw?.name ?? raw?.org_name ?? item?.name ?? item?.org_name ?? "");
  const description = String(
    raw?.description ?? raw?.org_description ?? item?.description ?? item?.org_desc ?? ""
  );
  if (!id || !name) return null;
  return { id, name, description: description || undefined };
};

const loadMyOrgOptions = async () => {
  orgLoading.value = true;
  try {
    const list = await getMyOrgs({
      skipSuccTip: true,
      skipErrTip: true,
      dedupeKey: "home:org-options",
      cancelPrevious: true,
    });
    const normalized = (Array.isArray(list) ? list : [])
      .map(normalizeOrg)
      .filter(Boolean) as Array<{ id: number; name: string; description?: string }>;
    orgOptions.value = normalized;

    if (orgOptions.value.length > 0) {
      const exists = orgOptions.value.some((o) => o.id === browsingOrgId.value);
      if (!exists) {
        const fallbackId =
          orgOptions.value.find((o) => o.id === (authStore.user?.current_org_id || 0))?.id ||
          orgOptions.value[0]?.id ||
          0;
        authStore.setBrowsingOrgId(fallbackId);
      }
    }
  } catch (e) {
    if (isRequestCanceled(e)) return;
    orgOptions.value = [];
  } finally {
    orgLoading.value = false;
  }
};

const openSwitchOrgModal = async () => {
  pendingOrgId.value = browsingOrgId.value;
  switchOrgVisible.value = true;
  if (!orgOptions.value.length && !orgLoading.value) {
    await loadMyOrgOptions();
  }
};

const confirmSwitchOrg = () => {
  if (!pendingOrgId.value) return;
  if (pendingOrgId.value === browsingOrgId.value) {
    switchOrgVisible.value = false;
    return;
  }
  const nextName = orgOptions.value.find((o) => o.id === pendingOrgId.value)?.name;
  authStore.setBrowsingOrgId(pendingOrgId.value);
  switchOrgVisible.value = false;
  if (nextName) message.success(`已切换浏览组织：${nextName}`);
};

/**
 * 处理绑定成功
 */
const handleBound = (_data: OJStatsResponse) => {
  // 刷新排行榜
  leaderboardRef.value?.refresh();
  fetchCurve(selectedPlatform.value);
};

onMounted(() => {
  curveBootTimer = setTimeout(() => {
    void fetchCurve(selectedPlatform.value);
  }, 300);
});

onUnmounted(() => {
  if (!curveBootTimer) return;
  clearTimeout(curveBootTimer);
  curveBootTimer = null;
});

watch(
  () => selectedPlatform.value,
  (val) => {
    fetchCurve(val);
  }
);
</script>

<template>
  <div class="home-view">
    <!-- Header Bar -->
    <HeaderBar />

    <!-- 平台选择器 -->
    <div class="platform-selector-wrapper" :class="{ 'slide-out-left': isExiting }">
      <div class="selector-left">
        <div class="platform-selector">
          <div 
            v-for="option in platformOptions" 
            :key="option.value"
            class="platform-item"
            :class="{ active: selectedPlatform === option.value }"
            @click="selectedPlatform = option.value as OJPlatform"
          >
            {{ option.label }}
          </div>
        </div>
        
        <div class="switch-org-btn" @click="openSwitchOrgModal">
          切换组织
        </div>
      </div>

      <div class="current-org-btn">
        浏览组织：{{ browsingOrgName }}
      </div>
    </div>

    <!-- 卡片容器 -->
    <div class="cards-container">
      <!-- 左侧列：OJ 卡片 + 刷题曲线 -->
      <div class="left-column" :class="{ 'slide-out-left': isExiting }">
        <!-- 绑定卡片 (根据选择的平台渲染) -->
        <div class="card-wrapper oj-card-shell">
          <OJCard 
            :key="selectedPlatform" 
            :platform="selectedPlatform" 
            @bound="handleBound" 
          />
        </div>

        <div class="card-wrapper chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ curveTitle }}</div>
            <div class="chart-meta">
              <span class="meta-item">累计通过：{{ curveTotal }}题</span>
              <span v-if="chartHasData" class="meta-item">当前：{{ chartLatest }}题</span>
              <span v-if="curveLastSyncAtFormatted" class="meta-item">同步：{{ curveLastSyncAtFormatted }}</span>
            </div>
          </div>

          <div class="chart-body">
            <div v-if="curveLoadingPlatform === selectedPlatform" class="chart-loading">加载中...</div>
            <div v-else-if="!chartHasData && !curveBound" class="chart-empty">
              未绑定该平台账号，暂无曲线数据
            </div>
            <div v-else-if="!chartHasData" class="chart-empty">暂无曲线数据</div>
            <div v-else class="chart-canvas">
              <svg
                ref="chartSvgRef"
                viewBox="0 0 300 120"
                class="chart-svg"
                preserveAspectRatio="none"
                @mousemove="handleChartMouseMove"
                @mouseleave="handleChartMouseLeave"
              >
                <defs>
                  <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1890ff" stop-opacity="0.28" />
                    <stop offset="100%" stop-color="#1890ff" stop-opacity="0.02" />
                  </linearGradient>
                </defs>
                <path v-if="chartAreaPath" :d="chartAreaPath" fill="url(#curve-fill)" />
                <path
                  v-if="chartLinePath"
                  :d="chartLinePath"
                  fill="none"
                  stroke="#1890ff"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  v-if="chartHover"
                  :x1="chartHover.x"
                  :x2="chartHover.x"
                  y1="0"
                  y2="120"
                  stroke="rgba(24, 144, 255, 0.25)"
                  stroke-width="1"
                />
                <circle
                  v-if="chartHover"
                  :cx="chartHover.x"
                  :cy="chartHover.y"
                  r="4.5"
                  fill="#1890ff"
                  stroke="#ffffff"
                  stroke-width="2"
                />
              </svg>

              <div
                v-if="chartHover"
                class="chart-tooltip"
                :style="{ left: `${chartHover.left}px`, top: `${chartHover.top}px` }"
              >
                <div class="tooltip-date">{{ hoverDate }}</div>
                <div class="tooltip-value">{{ hoverValue }}题</div>
              </div>

              <div class="chart-footer">
                <span class="chart-note">最小：{{ chartMin }}题</span>
                <span class="chart-note">最大：{{ chartMax }}题</span>
                <span v-if="chartStartDate && chartEndDate" class="chart-note">
                  {{ chartStartDate }} ~ {{ chartEndDate }}
                </span>
                <span v-if="chartHasData && !chartHasIncrease" class="chart-note">近30天无新增刷题</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column" :class="{ 'slide-out-right': isExiting }">
        <!-- 右侧列：排行榜卡片 (传递当前平台) -->
        <LeaderboardCard 
          ref="leaderboardRef" 
          :platform="selectedPlatform" 
          :org-id="browsingOrgId"
          :org-name="browsingOrgName"
        />
      </div>

    </div>

    <Modal
      v-model:visible="switchOrgVisible"
      title="切换浏览组织"
      ok-text="切换"
      cancel-text="取消"
      :ok-disabled="!pendingOrgId || pendingOrgId === browsingOrgId"
      @ok="confirmSwitchOrg"
    >
      <div v-if="orgLoading" class="org-loading">加载中...</div>
      <div v-else-if="orgOptions.length === 0" class="org-empty">暂无可切换组织</div>
      <div v-else class="org-list">
        <div
          v-for="org in orgOptions"
          :key="org.id"
          class="org-item"
          :class="{ active: pendingOrgId === org.id }"
          @click="pendingOrgId = org.id"
        >
          <div class="org-name">{{ org.name }}</div>
          <div v-if="org.description" class="org-desc">{{ org.description }}</div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 平台选择器样式 */
.platform-selector-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.selector-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.switch-org-btn, .current-org-btn {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch-org-btn:hover, .current-org-btn:hover {
  color: #1890ff;
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.platform-selector {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.platform-item {
  padding: 8px 24px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.platform-item:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.platform-item.active {
  color: #fff;
  background: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.cards-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  align-content: start;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* height: 100%;  已经移到下面了 */
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.1s;
}

.right-column {
  animation: slide-in-right 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.2s;
  height: 100%; /* 确保右侧高度撑满 */
}

/* 卡片容器，统一高度 */
.card-wrapper {
  background: rgba(255, 255, 255, 0.95); /* 提高不透明度，匹配上面的卡片 */
  backdrop-filter: blur(10px);
  border-radius: 12px; /* 统一圆角 */
  border: none; /* 移除边框，使用阴影 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 统一阴影 */
  overflow: hidden;
  height: 280px; /* 固定高度 */
  flex: 1; /* 让两个卡片平分高度 */
}

.oj-card-shell {
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
}

/* 调整左侧列布局，确保高度撑满 */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%; /* 关键：撑满高度 */
  animation: slide-in-left 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.1s;
}

.org-loading,
.org-empty {
  color: #8c8c8c;
  text-align: center;
  padding: 24px 0;
}

.org-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 50vh;
  overflow: auto;
}

.org-item {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.org-item:hover {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(24, 144, 255, 0.04);
}

.org-item.active {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.08);
}

.org-name {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.org-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
}
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.chart-meta {
  margin-top: 6px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #8c8c8c;
  font-size: 12px;
}

.meta-item {
  white-space: nowrap;
}

.chart-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
}

.chart-loading,
.chart-empty {
  color: #8c8c8c;
  text-align: center;
  font-size: 13px;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-svg {
  width: 100%;
  flex: 1;
}

.chart-tooltip {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -120%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.2;
  pointer-events: none;
  min-width: 120px;
  backdrop-filter: blur(8px);
}

.tooltip-date {
  opacity: 0.9;
}

.tooltip-value {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
}

.chart-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: #8c8c8c;
  font-size: 12px;
}

.chart-note {
  white-space: nowrap;
}

/* 离开动画 */
.slide-out-left {
  transform: translateX(-100px);
  opacity: 0;
  transition: all 0.5s ease-in;
}

.slide-out-right {
  transform: translateX(100px);
  opacity: 0;
  transition: all 0.5s ease-in;
}

/* 进场动画 */
@keyframes slide-in-left {
  from {
    transform: translateX(-60px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(60px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
  
  .left-column, .right-column {
    height: auto;
  }
}
</style>

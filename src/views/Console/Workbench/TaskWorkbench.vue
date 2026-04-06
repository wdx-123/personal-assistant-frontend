<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { message, Modal } from "ant-design-vue";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ForkOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons-vue";
import { getMyOrgs } from "@/services/permission.service";
import {
  analyzeOJTaskTitles,
  createOJTask,
  deleteOJTask,
  executeOJTaskNow,
  getOJTaskDetail,
  getOJTaskExecutionDetail,
  getOJTaskExecutionUserDetail,
  getOJTaskVersions,
  listOJTaskExecutionUsers,
  listVisibleOJTasks,
  retryOJTask,
  reviseOJTask,
  updateOJTask,
} from "@/services/ojTask.service";
import { useAuthStore } from "@/stores/auth";
import { collectMenuCodes } from "@/utils/menuPermission";
import type {
  CreateOJTaskRequest,
  MyOrgItem,
  OJPlatform,
  OJTaskAnalyzeCandidate,
  OJTaskCreateResponse,
  OJTaskDetail,
  OJTaskExecutionDetail,
  OJTaskExecutionStatus,
  OJTaskExecutionUserDetail,
  OJTaskExecutionUserItem,
  OJTaskExecutionUserSummary,
  OJTaskItem,
  OJTaskItemRequest,
  OJTaskItemResolutionStatus,
  OJTaskListItem,
  OJTaskMode,
  OJTaskStatus,
  OJTaskVersionItem,
  ReviseOJTaskRequest,
  UpdateOJTaskRequest,
} from "@/types";
import { isPermissionDenied } from "@/utils/request";

dayjs.extend(utc);

type TaskFormMode = "create" | "edit" | "revise";
type FormItemAnalysisStatus =
  | "idle"
  | "analyzing"
  | "resolved"
  | "ambiguous"
  | "missing"
  | "invalid";

interface TaskFormItem {
  key: string;
  platform: OJPlatform;
  title: string;
  analysisToken?: string;
  status: FormItemAnalysisStatus;
  candidates: OJTaskAnalyzeCandidate[];
  resolvedQuestionCode?: string;
  resolvedTitle?: string;
  resolutionNote?: string;
  errorText?: string;
}

interface TaskFormState {
  title: string;
  description: string;
  mode: OJTaskMode;
  executeAt?: Dayjs;
  orgIds: number[];
  items: TaskFormItem[];
}

interface TaskActionState {
  task_id: number;
  mode: OJTaskMode;
  status: OJTaskStatus;
  execution_status?: OJTaskExecutionStatus | null;
}

interface TaskAnalysisSummary {
  idle: number;
  analyzing: number;
  resolved: number;
  ambiguous: number;
  missing: number;
  invalid: number;
}

const DETAIL_POLL_INTERVAL = 2000;
const DETAIL_POLL_TIMEOUT = 60000;
const DEFAULT_TASK_PAGE_SIZE = 5;

const OJ_TASK_PERMISSION_CODES = {
  create: ["permission:oj_task:create", "workbench_task_create"],
  edit: ["permission:oj_task:edit", "workbench_task_edit"],
  delete: ["permission:oj_task:delete", "workbench_task_delete"],
  execute: ["permission:oj_task:execute", "workbench_task_execute"],
  revise: ["permission:oj_task:revise", "workbench_task_revise"],
  retry: ["permission:oj_task:retry", "workbench_task_retry"],
} as const;

const STABLE_EXECUTION_STATUS = new Set<OJTaskExecutionStatus>([
  "succeeded",
  "failed",
  "cancelled",
]);

const TASK_MODE_OPTIONS: Array<{ label: string; value: OJTaskMode }> = [
  { label: "立即执行", value: "immediate" },
  { label: "定时执行", value: "scheduled" },
];

type TaskStatusFilterValue = OJTaskStatus | "all";

const TASK_STATUS_OPTIONS: Array<{ label: string; value: OJTaskStatus }> = [
  { label: "待定时", value: "scheduled" },
  { label: "已入队", value: "queued" },
  { label: "执行中", value: "executing" },
  { label: "执行成功", value: "succeeded" },
  { label: "执行失败", value: "failed" },
  { label: "已删除", value: "deleted" },
];

const TASK_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: TaskStatusFilterValue;
}> = [{ label: "全部状态", value: "all" }, ...TASK_STATUS_OPTIONS];

const EXECUTION_STATUS_META: Record<
  OJTaskExecutionStatus,
  { label: string; color: string }
> = {
  scheduled: { label: "待定时", color: "gold" },
  queued: { label: "排队中", color: "processing" },
  executing: { label: "执行中", color: "blue" },
  succeeded: { label: "成功", color: "success" },
  failed: { label: "失败", color: "error" },
  cancelled: { label: "已取消", color: "default" },
};

const TASK_STATUS_META: Record<OJTaskStatus, { label: string; color: string }> =
  {
    scheduled: { label: "待定时", color: "gold" },
    queued: { label: "已入队", color: "processing" },
    executing: { label: "执行中", color: "blue" },
    succeeded: { label: "执行成功", color: "success" },
    failed: { label: "执行失败", color: "error" },
    deleted: { label: "已删除", color: "default" },
  };

const FORM_ANALYSIS_META: Record<
  FormItemAnalysisStatus,
  { label: string; color: string }
> = {
  idle: { label: "待分析", color: "default" },
  analyzing: { label: "分析中", color: "processing" },
  resolved: { label: "已解析", color: "success" },
  ambiguous: { label: "待选择", color: "warning" },
  missing: { label: "未命中", color: "warning" },
  invalid: { label: "无效", color: "error" },
};

const RESOLUTION_STATUS_META: Record<
  OJTaskItemResolutionStatus,
  { label: string; color: string }
> = {
  resolved: { label: "已解析", color: "success" },
  pending_resolution: { label: "待解析", color: "warning" },
  invalid: { label: "无效", color: "error" },
};

const EXECUTION_TRIGGER_META: Record<string, string> = {
  create_immediate: "创建即执行",
  schedule_due: "定时触发",
  execute_now: "手动提前执行",
  retry: "重试派生",
};

const PLATFORM_OPTIONS: Array<{ label: string; value: OJPlatform }> = [
  { label: "洛谷", value: "luogu" },
  { label: "力扣", value: "leetcode" },
  { label: "蓝桥杯", value: "lanqiao" },
];

const USER_STATUS_META: Record<number, string> = {
  1: "活跃",
  2: "禁用",
  3: "已删除",
};

const PENDING_REASON_META: Record<string, string> = {
  account_unbound: "未绑定对应 OJ 账号",
  unsolved: "题目尚未完成",
};

const RESOLUTION_NOTE_META: Record<string, string> = {
  awaiting_question_sync: "等待题库同步",
  preflight_resolution_failed: "执行前解析失败",
};

const LIST_COLUMNS = [
  { title: "任务标题", dataIndex: "title", key: "title", width: 240 },
  {
    title: "版本",
    dataIndex: "version_no",
    key: "version_no",
    width: 88,
    align: "center" as const,
  },
  {
    title: "模式",
    dataIndex: "mode",
    key: "mode",
    width: 96,
    align: "center" as const,
  },
  {
    title: "任务状态",
    dataIndex: "status",
    key: "status",
    width: 108,
    align: "center" as const,
  },
  {
    title: "执行状态",
    dataIndex: "execution_status",
    key: "execution_status",
    width: 108,
    align: "center" as const,
  },
  {
    title: "组织数",
    dataIndex: "org_count",
    key: "org_count",
    width: 88,
    align: "center" as const,
  },
  {
    title: "题目数",
    dataIndex: "item_count",
    key: "item_count",
    width: 88,
    align: "center" as const,
  },
  {
    title: "完成用户",
    dataIndex: "completed_user_count",
    key: "completed_user_count",
    width: 108,
    align: "center" as const,
  },
  {
    title: "待完成用户",
    dataIndex: "pending_user_count",
    key: "pending_user_count",
    width: 116,
    align: "center" as const,
  },
  { title: "执行时间", dataIndex: "execute_at", key: "execute_at", width: 176 },
  { title: "更新时间", dataIndex: "updated_at", key: "updated_at", width: 176 },
  { title: "操作", key: "action", width: 340, fixed: "right" as const },
];

const TASK_ITEM_COLUMNS = [
  {
    title: "序号",
    dataIndex: "sort_no",
    key: "sort_no",
    width: 72,
    align: "center" as const,
  },
  {
    title: "平台",
    dataIndex: "platform",
    key: "platform",
    width: 96,
    align: "center" as const,
  },
  {
    title: "输入标题",
    dataIndex: "input_title",
    key: "input_title",
    width: 220,
  },
  {
    title: "解析状态",
    dataIndex: "resolution_status",
    key: "resolution_status",
    width: 116,
    align: "center" as const,
  },
  {
    title: "已解析题号",
    dataIndex: "resolved_question_code",
    key: "resolved_question_code",
    width: 150,
  },
  {
    title: "权威标题",
    dataIndex: "resolved_title_snapshot",
    key: "resolved_title_snapshot",
    width: 220,
  },
  {
    title: "解析备注",
    dataIndex: "resolution_note",
    key: "resolution_note",
    width: 180,
  },
];

const USER_COLUMNS = [
  { title: "用户", dataIndex: "username_snapshot", key: "username_snapshot" },
  { title: "组织", dataIndex: "orgs", key: "orgs", width: 220 },
  {
    title: "完成题数",
    dataIndex: "completed_item_count",
    key: "completed_item_count",
    width: 110,
    align: "center" as const,
  },
  {
    title: "待完成题数",
    dataIndex: "pending_item_count",
    key: "pending_item_count",
    width: 110,
    align: "center" as const,
  },
  {
    title: "状态",
    dataIndex: "all_completed",
    key: "all_completed",
    width: 100,
    align: "center" as const,
  },
  { title: "操作", key: "action", width: 100, align: "center" as const },
];

const USER_DETAIL_ITEM_COLUMNS = [
  {
    title: "序号",
    dataIndex: "sort_no",
    key: "sort_no",
    width: 72,
    align: "center" as const,
  },
  {
    title: "平台",
    dataIndex: "platform",
    key: "platform",
    width: 96,
    align: "center" as const,
  },
  {
    title: "输入标题",
    dataIndex: "input_title",
    key: "input_title",
    width: 220,
  },
  {
    title: "解析状态",
    dataIndex: "resolution_status",
    key: "resolution_status",
    width: 116,
    align: "center" as const,
  },
  {
    title: "已解析题号",
    dataIndex: "resolved_question_code",
    key: "resolved_question_code",
    width: 150,
  },
  {
    title: "权威标题",
    dataIndex: "resolved_title_snapshot",
    key: "resolved_title_snapshot",
    width: 220,
  },
  {
    title: "结果",
    dataIndex: "result_status",
    key: "result_status",
    width: 96,
    align: "center" as const,
  },
  {
    title: "原因 / 备注",
    dataIndex: "reason_note",
    key: "reason_note",
    width: 220,
  },
];

const taskListNoPermission = ref(false);
const tableLocale = computed(() => ({
  emptyText: taskListNoPermission.value ? "你没有权限访问" : "暂无任务数据",
}));
const userTableLocale = { emptyText: "暂无执行用户数据" };

const authStore = useAuthStore();

const taskFilters = reactive({
  keyword: "",
  org_id: undefined as number | undefined,
  mode: undefined as OJTaskMode | undefined,
  status: "all" as TaskStatusFilterValue | undefined,
  only_latest: "latest" as "latest" | "all",
});

const taskPagination = reactive({
  current: 1,
  pageSize: DEFAULT_TASK_PAGE_SIZE,
  total: 0,
});

const tasks = ref<OJTaskListItem[]>([]);
const taskLoading = ref(false);
const taskError = ref("");
const taskTableRegionRef = ref<HTMLElement | null>(null);
const taskScrollTrackRef = ref<HTMLElement | null>(null);

const orgLoading = ref(false);
const orgOptions = ref<MyOrgItem[]>([]);

const taskDrawerOpen = ref(false);
const taskDrawerMode = ref<TaskFormMode>("create");
const taskDrawerLoading = ref(false);
const taskSubmitting = ref(false);
const taskSubmitConfirming = ref(false);
const taskAnalyzing = ref(false);
const editingTaskId = ref<number | null>(null);

const detailDrawerOpen = ref(false);
const detailActiveTab = ref("overview");
const detailLoading = ref(false);
const detailError = ref("");
const detailTask = ref<OJTaskDetail | null>(null);
const detailExecution = ref<OJTaskExecutionDetail | null>(null);
const versionLoading = ref(false);
const versionError = ref("");
const taskVersions = ref<OJTaskVersionItem[]>([]);

const userFilters = reactive({
  username: "",
  completion_scope: "all" as "all" | "completed" | "pending",
});

const userPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const executionUsers = ref<OJTaskExecutionUserSummary[]>([]);
const executionUsersLoading = ref(false);
const executionUsersError = ref("");

const userDetailDrawerOpen = ref(false);
const userDetailLoading = ref(false);
const userDetailError = ref("");
const executionUserDetail = ref<OJTaskExecutionUserDetail | null>(null);

const taskForm = reactive<TaskFormState>({
  title: "",
  description: "",
  mode: "immediate",
  executeAt: undefined,
  orgIds: [],
  items: [],
});

const detailPolling = reactive({
  active: false,
  taskId: 0,
  executionId: 0,
  startedAt: 0,
});

let taskItemSeed = 0;
let detailPollTimer: number | null = null;
let taskTableScrollContainer: HTMLElement | null = null;
let taskScrollbarResizeObserver: ResizeObserver | null = null;
let taskScrollbarMeasureFrame: number | null = null;

const menuCodeSet = computed(() => collectMenuCodes(authStore.myMenus));
const canCreate = computed(() =>
  OJ_TASK_PERMISSION_CODES.create.some((code) => menuCodeSet.value.has(code)),
);
const currentExecution = computed(
  () => detailExecution.value || detailTask.value?.current_execution || null,
);

const detailActionState = computed<TaskActionState | null>(() => {
  if (!detailTask.value) {
    return null;
  }

  return {
    task_id: detailTask.value.task_id,
    mode: detailTask.value.mode,
    status: detailTask.value.status,
    execution_status: currentExecution.value?.status ?? null,
  };
});

const taskDrawerTitle = computed(() => {
  if (taskDrawerMode.value === "create") {
    return "新建 OJ 任务";
  }
  if (taskDrawerMode.value === "edit") {
    return "编辑定时任务";
  }
  return "派生新版本";
});

const taskDrawerOkText = computed(() => {
  if (taskDrawerMode.value === "create") {
    return "创建任务";
  }
  if (taskDrawerMode.value === "edit") {
    return "保存修改";
  }
  return "创建新版本";
});

const taskDrawerShowExecuteAt = computed(() => taskForm.mode === "scheduled");

const orgSelectOptions = computed(() =>
  orgOptions.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const taskPaginationConfig = computed(() => ({
  current: taskPagination.current,
  pageSize: taskPagination.pageSize,
  total: taskPagination.total,
  showSizeChanger: true,
  pageSizeOptions: ["5", "10", "20", "50"],
  showQuickJumper: false,
  showTotal: (total: number) => `共 ${total} 条`,
}));

const taskScrollbar = reactive({
  hasOverflow: false,
  hovered: false,
  dragging: false,
  thumbWidth: 0,
  thumbOffset: 0,
  dragStartX: 0,
  dragStartScrollLeft: 0,
});

const taskScrollThumbVisible = computed(
  () => taskScrollbar.hovered || taskScrollbar.dragging,
);

const taskScrollThumbStyle = computed(() => ({
  width: `${taskScrollbar.thumbWidth}px`,
  left: `${taskScrollbar.thumbOffset}px`,
}));

const executionUserPaginationConfig = computed(() => ({
  current: userPagination.current,
  pageSize: userPagination.pageSize,
  total: userPagination.total,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total: number) => `共 ${total} 位用户`,
}));

const taskFormAnalysisSummary = computed<TaskAnalysisSummary>(() =>
  taskForm.items.reduce<TaskAnalysisSummary>(
    (summary, item) => {
      summary[item.status] += 1;
      return summary;
    },
    {
      idle: 0,
      analyzing: 0,
      resolved: 0,
      ambiguous: 0,
      missing: 0,
      invalid: 0,
    },
  ),
);

const taskFormMissingRiskCount = computed(
  () => taskFormAnalysisSummary.value.missing,
);

const taskFormBlockingCount = computed(
  () =>
    taskFormAnalysisSummary.value.idle +
    taskFormAnalysisSummary.value.analyzing +
    taskFormAnalysisSummary.value.ambiguous +
    taskFormAnalysisSummary.value.invalid,
);

const taskFormAnalysisMessage = computed(() => {
  if (taskForm.items.length === 0) {
    return "至少添加 1 道题目，录入标题后再进行本地分析。";
  }

  if (
    taskFormBlockingCount.value === 0 &&
    taskFormMissingRiskCount.value === 0
  ) {
    return "题单已全部完成解析，可以直接提交。";
  }

  const blockingParts: string[] = [];
  if (taskFormAnalysisSummary.value.idle) {
    blockingParts.push(`${taskFormAnalysisSummary.value.idle} 道待分析`);
  }
  if (taskFormAnalysisSummary.value.analyzing) {
    blockingParts.push(`${taskFormAnalysisSummary.value.analyzing} 道分析中`);
  }
  if (taskFormAnalysisSummary.value.ambiguous) {
    blockingParts.push(
      `${taskFormAnalysisSummary.value.ambiguous} 道待选择候选`,
    );
  }
  if (taskFormAnalysisSummary.value.invalid) {
    blockingParts.push(
      `${taskFormAnalysisSummary.value.invalid} 道需要修正输入`,
    );
  }

  if (blockingParts.length > 0) {
    const riskSuffix = taskFormMissingRiskCount.value
      ? ` 另外有 ${taskFormMissingRiskCount.value} 道题未命中本地题库，可继续提交为待解析状态，但存在一定风险。`
      : "";
    return `当前仍有未完成解析的题目：${blockingParts.join("，")}。${riskSuffix}`;
  }

  return `当前有 ${taskFormMissingRiskCount.value} 道题未命中本地题库。你仍可继续提交，后端会以待解析状态入库并在后续自动回填，但执行结果存在一定风险。`;
});

const canManualAnalyze = computed(
  () =>
    !taskAnalyzing.value && taskForm.items.some((item) => item.title.trim()),
);

function isTaskItemReadyForSubmit(item: TaskFormItem): boolean {
  return item.status === "resolved" || item.status === "missing";
}

const taskFormReady = computed(() => {
  if (!taskForm.title.trim()) {
    return false;
  }

  if (
    Array.from(new Set(taskForm.orgIds.filter((id) => id > 0))).length === 0
  ) {
    return false;
  }

  if (
    taskForm.items.length === 0 ||
    !taskForm.items.every((item) => isTaskItemReadyForSubmit(item))
  ) {
    return false;
  }

  if (taskForm.mode === "scheduled") {
    if (!taskForm.executeAt || !taskForm.executeAt.isValid()) {
      return false;
    }
    if (taskForm.executeAt.valueOf() <= Date.now()) {
      return false;
    }
  }

  return true;
});

const isDetailPolling = computed(
  () =>
    detailPolling.active &&
    detailDrawerOpen.value &&
    detailTask.value?.task_id === detailPolling.taskId &&
    currentExecution.value?.execution_id === detailPolling.executionId,
);

function buildDefaultOrgIds(): number[] {
  const orgId = authStore.browsingOrgId || authStore.user?.current_org_id || 0;
  return orgId ? [orgId] : [];
}

function createTaskFormItem(seed: Partial<TaskFormItem> = {}): TaskFormItem {
  taskItemSeed += 1;
  return {
    key: `task-item-${taskItemSeed}`,
    platform: seed.platform || "leetcode",
    title: seed.title || "",
    analysisToken: seed.analysisToken,
    status: seed.status || "idle",
    candidates: seed.candidates ? [...seed.candidates] : [],
    resolvedQuestionCode: seed.resolvedQuestionCode,
    resolvedTitle: seed.resolvedTitle,
    resolutionNote: seed.resolutionNote,
    errorText: seed.errorText,
  };
}

function resetTaskFormItemAnalysis(
  item: TaskFormItem,
  nextStatus: FormItemAnalysisStatus = "idle",
): void {
  item.status = nextStatus;
  item.analysisToken = undefined;
  item.candidates = [];
  item.resolvedQuestionCode = undefined;
  item.resolvedTitle = undefined;
  item.resolutionNote = undefined;
  item.errorText = undefined;
}

function applyResolvedCandidate(
  item: TaskFormItem,
  candidate: Pick<
    OJTaskAnalyzeCandidate,
    "analysis_token" | "resolved_question_code" | "resolved_title"
  >,
): void {
  item.status = "resolved";
  item.analysisToken = candidate.analysis_token;
  item.candidates = [];
  item.resolvedQuestionCode = candidate.resolved_question_code;
  item.resolvedTitle = candidate.resolved_title;
  item.resolutionNote = undefined;
  item.errorText = undefined;
}

function mapTaskItemToFormItem(taskItem: OJTaskItem): TaskFormItem {
  return createTaskFormItem({
    platform: taskItem.platform,
    title: taskItem.input_title,
    status:
      taskItem.resolution_status === "resolved"
        ? "resolved"
        : taskItem.resolution_status === "pending_resolution"
          ? "missing"
          : "invalid",
    resolvedQuestionCode: taskItem.resolved_question_code,
    resolvedTitle: taskItem.resolved_title_snapshot,
    resolutionNote: taskItem.resolution_note,
  });
}

function resetTaskForm(): void {
  taskForm.title = "";
  taskForm.description = "";
  taskForm.mode = "immediate";
  taskForm.executeAt = undefined;
  taskForm.orgIds = buildDefaultOrgIds();
  taskForm.items = [createTaskFormItem()];
}

function fillTaskForm(detail: OJTaskDetail, mode: TaskFormMode): void {
  taskForm.title = detail.title;
  taskForm.description = detail.description;
  taskForm.mode = mode === "edit" ? "scheduled" : detail.mode;
  taskForm.executeAt = detail.execute_at ? dayjs(detail.execute_at) : undefined;
  taskForm.orgIds = detail.orgs.map((item) => item.org_id);
  taskForm.items = detail.items.length
    ? detail.items.map(mapTaskItemToFormItem)
    : [createTaskFormItem()];
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return value;
  }

  return parsed.format("YYYY-MM-DD HH:mm:ss");
}

function getTaskStatusMeta(status: OJTaskStatus) {
  return TASK_STATUS_META[status];
}

function getExecutionStatusMeta(status: OJTaskExecutionStatus) {
  return EXECUTION_STATUS_META[status];
}

function getFormItemStatusMeta(status: FormItemAnalysisStatus) {
  return FORM_ANALYSIS_META[status];
}

function getResolutionStatusMeta(status: OJTaskItemResolutionStatus) {
  return RESOLUTION_STATUS_META[status];
}

function getModeLabel(mode: OJTaskMode): string {
  return mode === "immediate" ? "立即执行" : "定时执行";
}

function getPlatformLabel(platform: OJPlatform): string {
  const hit = PLATFORM_OPTIONS.find((item) => item.value === platform);
  return hit?.label || platform;
}

function getPendingReasonLabel(reason?: string): string {
  if (!reason) {
    return "-";
  }
  return PENDING_REASON_META[reason] || reason;
}

function getResolutionNoteLabel(note?: string): string {
  if (!note) {
    return "-";
  }
  return RESOLUTION_NOTE_META[note] || note;
}

function getExecutionTriggerLabel(triggerType?: string): string {
  if (!triggerType) {
    return "-";
  }
  return EXECUTION_TRIGGER_META[triggerType] || triggerType;
}

function getUserStatusLabel(status: number): string {
  return USER_STATUS_META[status] || `状态 ${status}`;
}

function getTaskItemReasonNote(item: OJTaskExecutionUserItem): string {
  const parts: string[] = [];
  if (item.reason) {
    parts.push(getPendingReasonLabel(item.reason));
  }
  if (item.resolution_note) {
    parts.push(getResolutionNoteLabel(item.resolution_note));
  }
  return parts.length ? parts.join(" / ") : "-";
}

function hasActionPermission(codes: readonly string[]): boolean {
  return codes.some((code) => menuCodeSet.value.has(code));
}

function buildTaskActionState(record: OJTaskListItem): TaskActionState {
  return {
    task_id: record.task_id,
    mode: record.mode,
    status: record.status,
    execution_status: record.execution_status,
  };
}

function buildTaskActionStateFromRecord(
  record: Record<string, unknown>,
): TaskActionState {
  return buildTaskActionState(record as unknown as OJTaskListItem);
}

function openTaskDetailFromRecord(record: Record<string, unknown>): void {
  void openTaskDetail(
    Number(record.task_id || 0),
    Number(record.execution_id || 0),
  );
}

function openEditDrawerFromRecord(record: Record<string, unknown>): void {
  void openEditDrawer(Number(record.task_id || 0));
}

function openReviseDrawerFromRecord(record: Record<string, unknown>): void {
  void openReviseDrawer(Number(record.task_id || 0));
}

function openExecutionUserDetailFromRecord(
  record: Record<string, unknown>,
): void {
  void openExecutionUserDetail(record as unknown as OJTaskExecutionUserSummary);
}

function canEditTask(state: TaskActionState | null): boolean {
  return (
    !!state &&
    hasActionPermission(OJ_TASK_PERMISSION_CODES.edit) &&
    state.mode === "scheduled" &&
    state.status === "scheduled" &&
    state.execution_status === "scheduled"
  );
}

function canDeleteTask(state: TaskActionState | null): boolean {
  return (
    !!state &&
    hasActionPermission(OJ_TASK_PERMISSION_CODES.delete) &&
    state.mode === "scheduled" &&
    state.status === "scheduled" &&
    state.execution_status === "scheduled"
  );
}

function canExecuteTask(state: TaskActionState | null): boolean {
  return (
    !!state &&
    hasActionPermission(OJ_TASK_PERMISSION_CODES.execute) &&
    state.mode === "scheduled" &&
    state.status === "scheduled" &&
    state.execution_status === "scheduled"
  );
}

function canReviseTask(): boolean {
  return hasActionPermission(OJ_TASK_PERMISSION_CODES.revise);
}

function canRetryTask(state: TaskActionState | null): boolean {
  return (
    !!state &&
    hasActionPermission(OJ_TASK_PERMISSION_CODES.retry) &&
    (state.execution_status === "succeeded" ||
      state.execution_status === "failed")
  );
}

function buildAnalysisFeedbackMessage(summary: TaskAnalysisSummary): string {
  const parts: string[] = [];
  if (summary.resolved) {
    parts.push(`${summary.resolved} 道已解析`);
  }
  if (summary.ambiguous) {
    parts.push(`${summary.ambiguous} 道待选择候选`);
  }
  if (summary.missing) {
    parts.push(`${summary.missing} 道未命中，可按风险提交`);
  }
  if (summary.invalid) {
    parts.push(`${summary.invalid} 道输入无效`);
  }
  if (summary.idle) {
    parts.push(`${summary.idle} 道待分析`);
  }
  if (summary.analyzing) {
    parts.push(`${summary.analyzing} 道分析中`);
  }
  return parts.length ? parts.join("，") : "题单已全部解析完成。";
}

function buildSubmitBlockedMessage(summary: TaskAnalysisSummary): string {
  const parts: string[] = [];
  if (summary.ambiguous) {
    parts.push(`${summary.ambiguous} 道题需要选择候选`);
  }
  if (summary.invalid) {
    parts.push(`${summary.invalid} 道题输入需要修正`);
  }
  if (summary.idle) {
    parts.push(`${summary.idle} 道题尚未分析`);
  }
  if (summary.analyzing) {
    parts.push(`${summary.analyzing} 道题仍在分析`);
  }

  return parts.length
    ? `提交前请先完成题单解析：${parts.join("，")}。`
    : "提交前请先完成题单解析。";
}

function buildMissingRiskConfirmMessage(summary: TaskAnalysisSummary): string {
  const missingCount = summary.missing;
  return `当前有 ${missingCount} 道题未命中本地题库。继续提交后，这些题目会以待解析状态入库，等待后端后续自动回填；在此之前执行结果存在一定风险。确认继续提交吗？`;
}

function handleTaskItemPlatformChange(
  item: TaskFormItem,
  value: OJPlatform,
): void {
  item.platform = value;
  resetTaskFormItemAnalysis(item);
}

function handleTaskItemTitleChange(item: TaskFormItem, value: string): void {
  item.title = value;
  resetTaskFormItemAnalysis(item);
}

function addTaskItem(seed: Partial<TaskFormItem> = {}): void {
  taskForm.items.push(createTaskFormItem(seed));
}

function removeTaskItem(index: number): void {
  const target = taskForm.items[index];
  if (!target) {
    return;
  }

  if (taskForm.items.length === 1) {
    resetTaskFormItemAnalysis(target);
    target.title = "";
    return;
  }

  taskForm.items.splice(index, 1);
}

async function analyzeTaskItems(
  options: {
    indexes?: number[];
    source?: "manual" | "auto" | "submit";
  } = {},
): Promise<boolean> {
  const source = options.source || "manual";
  const targetIndexes = Array.from(
    new Set(
      (options.indexes?.length
        ? options.indexes
        : taskForm.items.map((_, index) => index)
      ).filter((index) => index >= 0 && index < taskForm.items.length),
    ),
  );

  if (targetIndexes.length === 0) {
    return taskForm.items.every((item) => isTaskItemReadyForSubmit(item));
  }

  const requestItemIndexes: number[] = [];
  const requestItems: OJTaskItemRequest[] = [];

  targetIndexes.forEach((index) => {
    const item = taskForm.items[index];
    if (!item) {
      return;
    }
    const title = item.title.trim();

    if (!title) {
      if (source === "manual" || source === "submit") {
        resetTaskFormItemAnalysis(item, "invalid");
        item.errorText =
          source === "submit"
            ? "请输入题目标题后再提交"
            : "请输入题目标题后再分析";
      } else {
        resetTaskFormItemAnalysis(item, "idle");
      }
      return;
    }

    item.status = "analyzing";
    item.errorText = undefined;
    item.candidates = [];
    requestItemIndexes.push(index);
    requestItems.push({
      platform: item.platform,
      title,
    });
  });

  if (requestItems.length === 0) {
    if (source === "manual") {
      message.warning("请先输入题目标题后再分析");
    }
    return taskForm.items.every((item) => isTaskItemReadyForSubmit(item));
  }

  try {
    const analysis = await analyzeOJTaskTitles(
      { items: requestItems },
      {
        skipSuccTip: true,
        skipErrTip: true,
      },
    );

    requestItemIndexes.forEach((index) => {
      const target = taskForm.items[index];
      if (!target) {
        return;
      }
      resetTaskFormItemAnalysis(target, "invalid");
      target.errorText = "分析失败，请稍后重试";
    });

    analysis.resolved.forEach((resolvedItem) => {
      const formIndex = requestItemIndexes[resolvedItem.input_index];
      if (formIndex === undefined) {
        return;
      }
      const target = taskForm.items[formIndex];
      if (!target) {
        return;
      }
      applyResolvedCandidate(target, {
        analysis_token: resolvedItem.analysis_token,
        resolved_question_code: resolvedItem.resolved_question_code,
        resolved_title: resolvedItem.resolved_title,
      });
    });

    analysis.ambiguous.forEach((ambiguousItem) => {
      const formIndex = requestItemIndexes[ambiguousItem.input_index];
      if (formIndex === undefined) {
        return;
      }
      const target = taskForm.items[formIndex];
      if (!target) {
        return;
      }
      resetTaskFormItemAnalysis(target, "ambiguous");
      target.candidates = ambiguousItem.options || [];
      target.errorText = "匹配到多个候选，请明确选择";
      target.resolutionNote = "multiple_candidates";
    });

    analysis.missing.forEach((missingItem) => {
      const formIndex = requestItemIndexes[missingItem.input_index];
      if (formIndex === undefined) {
        return;
      }
      const target = taskForm.items[formIndex];
      if (!target) {
        return;
      }
      resetTaskFormItemAnalysis(target, "missing");
      target.errorText =
        "本地题库未命中。你可以修正标题后重新分析，也可以继续提交为待解析状态。";
      target.resolutionNote = "not_found";
    });

    const summary = taskFormAnalysisSummary.value;
    const allResolved = taskForm.items.every(
      (item) => item.status === "resolved",
    );
    const allSubmitReady = taskForm.items.every((item) =>
      isTaskItemReadyForSubmit(item),
    );

    if (source === "manual") {
      if (allResolved) {
        message.success("题单解析完成，所有题目已锁定。");
      } else {
        message.warning(buildAnalysisFeedbackMessage(summary));
      }
    } else if (source === "auto" && !allResolved) {
      message.warning(
        `历史题单已回填，但仍有未解析项：${buildAnalysisFeedbackMessage(summary)}`,
      );
    }

    return allSubmitReady;
  } catch (error) {
    requestItemIndexes.forEach((index) => {
      const target = taskForm.items[index];
      if (!target) {
        return;
      }
      resetTaskFormItemAnalysis(target, "invalid");
      target.errorText = "分析失败，请稍后重试";
    });

    if (source === "manual" || source === "submit") {
      message.error("题目分析失败，请稍后重试");
    }
    return false;
  }
}

async function analyzeAllTaskItems(
  source: "manual" | "auto" | "submit" = "manual",
): Promise<boolean> {
  return analyzeTaskItems({ source });
}

async function analyzeSingleTaskItem(item: TaskFormItem): Promise<void> {
  const index = taskForm.items.findIndex(
    (candidate) => candidate.key === item.key,
  );
  if (index === -1) {
    return;
  }
  taskAnalyzing.value = true;
  try {
    await analyzeTaskItems({
      indexes: [index],
      source: "manual",
    });
  } finally {
    taskAnalyzing.value = false;
  }
}

function selectTaskItemCandidate(
  item: TaskFormItem,
  candidate: OJTaskAnalyzeCandidate,
): void {
  applyResolvedCandidate(item, candidate);
}

function validateTaskFormBase(): boolean {
  if (!taskForm.title.trim()) {
    message.warning("请输入任务标题");
    return false;
  }

  if (
    Array.from(new Set(taskForm.orgIds.filter((id) => id > 0))).length === 0
  ) {
    message.warning("请至少选择一个组织");
    return false;
  }

  if (taskForm.items.length === 0) {
    message.warning("请至少添加一道题目");
    return false;
  }

  if (taskForm.mode === "scheduled") {
    if (!taskForm.executeAt || !taskForm.executeAt.isValid()) {
      message.warning("请选择执行时间");
      return false;
    }

    if (taskForm.executeAt.valueOf() <= Date.now()) {
      message.warning("定时执行时间必须晚于当前时间");
      return false;
    }
  }

  return true;
}

async function ensureTaskItemsReadyForSubmit(): Promise<boolean> {
  taskForm.items.forEach((item) => {
    if (!item.title.trim()) {
      resetTaskFormItemAnalysis(item, "invalid");
      item.errorText = "请输入题目标题后再提交";
    }
  });

  const idleIndexes = taskForm.items
    .map((item, index) =>
      item.status === "idle" && item.title.trim() ? index : -1,
    )
    .filter((index) => index >= 0);

  if (idleIndexes.length) {
    const readyAfterAnalyze = await analyzeTaskItems({
      indexes: idleIndexes,
      source: "submit",
    });

    if (!readyAfterAnalyze) {
      message.warning(buildSubmitBlockedMessage(taskFormAnalysisSummary.value));
      return false;
    }
  }

  if (!taskForm.items.every((item) => isTaskItemReadyForSubmit(item))) {
    message.warning(buildSubmitBlockedMessage(taskFormAnalysisSummary.value));
    return false;
  }

  return true;
}

async function executeTaskFormSubmit(): Promise<void> {
  if (taskSubmitting.value) {
    return;
  }

  taskSubmitting.value = true;

  try {
    const payload = buildTaskPayload();

    if (taskDrawerMode.value === "create") {
      const result = await createOJTask(payload as CreateOJTaskRequest, {
        skipSuccTip: true,
      });
      await handleMutationResult(result, "任务已创建");
      return;
    }

    if (!editingTaskId.value) {
      message.error("缺少任务 ID，无法提交");
      return;
    }

    if (taskDrawerMode.value === "edit") {
      await updateOJTask(editingTaskId.value, payload as UpdateOJTaskRequest, {
        skipSuccTip: true,
      });
      taskDrawerOpen.value = false;
      await fetchTasks({ silent: true });
      if (
        detailDrawerOpen.value &&
        detailTask.value?.task_id === editingTaskId.value
      ) {
        await refreshDetailPanel({ silent: true });
      }
      message.success("任务已更新");
      return;
    }

    const reviseResult = await reviseOJTask(
      editingTaskId.value,
      payload as ReviseOJTaskRequest,
      {
        skipSuccTip: true,
      },
    );
    await handleMutationResult(reviseResult, "新版本已创建");
  } finally {
    taskSubmitting.value = false;
  }
}

function confirmSubmitWithMissingRisk(): void {
  taskSubmitConfirming.value = true;
  Modal.confirm({
    title: "确认按风险继续提交",
    content: buildMissingRiskConfirmMessage(taskFormAnalysisSummary.value),
    okText: "继续提交",
    cancelText: "取消",
    onCancel: () => {
      taskSubmitConfirming.value = false;
    },
    onOk: async () => {
      try {
        await executeTaskFormSubmit();
      } finally {
        taskSubmitConfirming.value = false;
      }
    },
  });
}

function buildTaskPayload():
  | CreateOJTaskRequest
  | UpdateOJTaskRequest
  | ReviseOJTaskRequest {
  const uniqueOrgIds = Array.from(
    new Set(taskForm.orgIds.filter((id) => id > 0)),
  );
  const items: OJTaskItemRequest[] = taskForm.items.map((item) => ({
    platform: item.platform,
    title: item.title.trim(),
    analysis_token: item.analysisToken,
  }));

  const payload = {
    title: taskForm.title.trim(),
    description: taskForm.description.trim(),
    mode: taskForm.mode,
    org_ids: uniqueOrgIds,
    items,
  } as CreateOJTaskRequest;

  if (taskForm.mode === "scheduled" && taskForm.executeAt) {
    payload.execute_at = taskForm.executeAt.utc().format();
  }

  if (taskDrawerMode.value === "edit") {
    return payload as UpdateOJTaskRequest;
  }

  return payload;
}

async function fetchOrgOptions(): Promise<void> {
  orgLoading.value = true;
  try {
    orgOptions.value = await getMyOrgs({
      skipSuccTip: true,
      skipErrTip: true,
    });
  } catch (error) {
    orgOptions.value = [];
    message.error("获取组织列表失败，请稍后重试");
  } finally {
    orgLoading.value = false;
  }
}

async function fetchTasks(options: { silent?: boolean } = {}): Promise<void> {
  taskLoading.value = true;
  taskError.value = "";
  try {
    const data = await listVisibleOJTasks(
      {
        page: taskPagination.current,
        page_size: taskPagination.pageSize,
        keyword: taskFilters.keyword.trim() || undefined,
        org_id: taskFilters.org_id,
        mode: taskFilters.mode,
        status: taskFilters.status === "all" ? undefined : taskFilters.status,
        only_latest: taskFilters.only_latest === "latest",
      },
      {
        skipSuccTip: true,
        skipErrTip: true,
      },
    );

    taskListNoPermission.value = false;
    tasks.value = data.list || [];
    taskPagination.total = data.total || 0;
    taskPagination.current = data.page || taskPagination.current;
    taskPagination.pageSize = data.page_size || taskPagination.pageSize;
  } catch (error) {
    if (isPermissionDenied(error)) {
      taskListNoPermission.value = true;
      tasks.value = [];
      taskPagination.total = 0;
      return;
    }
    taskError.value = "任务列表加载失败，请稍后重试。";
    tasks.value = [];
    taskPagination.total = 0;
    if (!options.silent) {
      message.error("任务列表加载失败，请稍后重试");
    }
  } finally {
    taskLoading.value = false;
    scheduleTaskScrollbarSync();
  }
}

function searchTasks(): void {
  taskPagination.current = 1;
  void fetchTasks();
}

function handleVersionViewChange(): void {
  taskPagination.current = 1;
  void fetchTasks({ silent: true });
}

function resetTaskFilters(): void {
  taskFilters.keyword = "";
  taskFilters.org_id = undefined;
  taskFilters.mode = undefined;
  taskFilters.status = "all";
  taskFilters.only_latest = "latest";
  taskPagination.current = 1;
  taskPagination.pageSize = DEFAULT_TASK_PAGE_SIZE;
  void fetchTasks();
}

function refreshTasks(): void {
  void fetchTasks();
}

function handleTaskPaginationChange(page: number, pageSize: number): void {
  taskPagination.current = page || 1;
  taskPagination.pageSize = pageSize || DEFAULT_TASK_PAGE_SIZE;
  void fetchTasks();
}

function clampTaskScrollbarValue(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(Math.max(value, min), max);
}

function cleanupTaskScrollbarDragListeners(): void {
  window.removeEventListener("pointermove", handleTaskThumbPointerMove);
  window.removeEventListener("pointerup", handleTaskThumbPointerUp);
  window.removeEventListener("pointercancel", handleTaskThumbPointerUp);
}

function detachTaskTableScrollContainer(): void {
  if (taskTableScrollContainer) {
    taskTableScrollContainer.removeEventListener(
      "scroll",
      handleTaskTableScroll,
    );
    if (taskScrollbarResizeObserver) {
      taskScrollbarResizeObserver.unobserve(taskTableScrollContainer);
    }
  }
  taskTableScrollContainer = null;
}

function resolveTaskTableScrollContainer(): HTMLElement | null {
  const nextContainer =
    taskTableRegionRef.value?.querySelector(
      ".oj-task-main-table .ant-table-content",
    ) || null;

  if (nextContainer === taskTableScrollContainer) {
    return taskTableScrollContainer;
  }

  detachTaskTableScrollContainer();
  taskTableScrollContainer = nextContainer as HTMLElement | null;

  if (taskTableScrollContainer) {
    taskTableScrollContainer.addEventListener("scroll", handleTaskTableScroll, {
      passive: true,
    });
    if (taskScrollbarResizeObserver) {
      taskScrollbarResizeObserver.observe(taskTableScrollContainer);
    }
  }

  return taskTableScrollContainer;
}

function ensureTaskScrollbarResizeObserver(): void {
  if (taskScrollbarResizeObserver || typeof ResizeObserver === "undefined") {
    return;
  }

  taskScrollbarResizeObserver = new ResizeObserver(() => {
    updateTaskScrollbarMetrics();
  });

  if (taskTableRegionRef.value) {
    taskScrollbarResizeObserver.observe(taskTableRegionRef.value);
  }
  if (taskScrollTrackRef.value) {
    taskScrollbarResizeObserver.observe(taskScrollTrackRef.value);
  }
}

function updateTaskScrollbarMetrics(): void {
  const scrollContainer = resolveTaskTableScrollContainer();
  const track = taskScrollTrackRef.value;

  if (!scrollContainer || !track) {
    taskScrollbar.hasOverflow = false;
    taskScrollbar.thumbWidth = 0;
    taskScrollbar.thumbOffset = 0;
    return;
  }

  const maxScrollLeft = Math.max(
    scrollContainer.scrollWidth - scrollContainer.clientWidth,
    0,
  );
  const trackWidth = track.clientWidth;

  if (maxScrollLeft <= 0 || trackWidth <= 0) {
    taskScrollbar.hasOverflow = false;
    taskScrollbar.hovered = false;
    taskScrollbar.thumbWidth = 0;
    taskScrollbar.thumbOffset = 0;
    return;
  }

  const visibleRatio = scrollContainer.clientWidth / scrollContainer.scrollWidth;
  const thumbWidth = clampTaskScrollbarValue(
    Math.round(trackWidth * visibleRatio),
    32,
    trackWidth,
  );
  const maxThumbOffset = Math.max(trackWidth - thumbWidth, 0);
  const scrollRatio =
    maxScrollLeft > 0 ? scrollContainer.scrollLeft / maxScrollLeft : 0;

  taskScrollbar.hasOverflow = true;
  taskScrollbar.thumbWidth = thumbWidth;
  taskScrollbar.thumbOffset = clampTaskScrollbarValue(
    scrollRatio * maxThumbOffset,
    0,
    maxThumbOffset,
  );
}

function scheduleTaskScrollbarSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (taskScrollbarMeasureFrame !== null) {
    window.cancelAnimationFrame(taskScrollbarMeasureFrame);
    taskScrollbarMeasureFrame = null;
  }

  void nextTick().then(() => {
    taskScrollbarMeasureFrame = window.requestAnimationFrame(() => {
      taskScrollbarMeasureFrame = null;
      ensureTaskScrollbarResizeObserver();
      resolveTaskTableScrollContainer();
      updateTaskScrollbarMetrics();
    });
  });
}

function syncTaskScrollFromThumbOffset(nextThumbOffset: number): void {
  const scrollContainer = resolveTaskTableScrollContainer();
  const track = taskScrollTrackRef.value;

  if (!scrollContainer || !track || !taskScrollbar.hasOverflow) {
    return;
  }

  const maxScrollLeft = Math.max(
    scrollContainer.scrollWidth - scrollContainer.clientWidth,
    0,
  );
  const maxThumbOffset = Math.max(track.clientWidth - taskScrollbar.thumbWidth, 0);
  const clampedThumbOffset = clampTaskScrollbarValue(
    nextThumbOffset,
    0,
    maxThumbOffset,
  );

  taskScrollbar.thumbOffset = clampedThumbOffset;

  if (maxScrollLeft <= 0 || maxThumbOffset <= 0) {
    scrollContainer.scrollLeft = 0;
    return;
  }

  scrollContainer.scrollLeft =
    (clampedThumbOffset / maxThumbOffset) * maxScrollLeft;
}

function moveTaskThumbToClientX(clientX: number): void {
  const track = taskScrollTrackRef.value;
  if (!track) {
    return;
  }

  const trackRect = track.getBoundingClientRect();
  const nextThumbOffset =
    clientX - trackRect.left - taskScrollbar.thumbWidth / 2;
  syncTaskScrollFromThumbOffset(nextThumbOffset);
}

function isPointerInsideTaskTrack(clientX: number, clientY: number): boolean {
  const track = taskScrollTrackRef.value;
  if (!track) {
    return false;
  }

  const trackRect = track.getBoundingClientRect();
  return (
    clientX >= trackRect.left &&
    clientX <= trackRect.right &&
    clientY >= trackRect.top &&
    clientY <= trackRect.bottom
  );
}

function handleTaskTableScroll(): void {
  updateTaskScrollbarMetrics();
}

function handleTaskScrollTrackEnter(): void {
  if (!taskScrollbar.hasOverflow) {
    return;
  }
  taskScrollbar.hovered = true;
}

function handleTaskScrollTrackLeave(): void {
  if (taskScrollbar.dragging) {
    return;
  }
  taskScrollbar.hovered = false;
}

function handleTaskScrollTrackPointerDown(event: PointerEvent): void {
  if (!taskScrollbar.hasOverflow) {
    return;
  }
  taskScrollbar.hovered = true;
  moveTaskThumbToClientX(event.clientX);
}

function handleTaskThumbPointerDown(event: PointerEvent): void {
  if (!taskScrollbar.hasOverflow) {
    return;
  }

  event.preventDefault();
  taskScrollbar.dragging = true;
  taskScrollbar.hovered = true;
  taskScrollbar.dragStartX = event.clientX;
  taskScrollbar.dragStartScrollLeft = taskTableScrollContainer?.scrollLeft || 0;

  document.body.style.userSelect = "none";
  window.addEventListener("pointermove", handleTaskThumbPointerMove);
  window.addEventListener("pointerup", handleTaskThumbPointerUp);
  window.addEventListener("pointercancel", handleTaskThumbPointerUp);
}

function handleTaskThumbPointerMove(event: PointerEvent): void {
  if (!taskScrollbar.dragging) {
    return;
  }

  event.preventDefault();

  const scrollContainer = resolveTaskTableScrollContainer();
  const track = taskScrollTrackRef.value;

  if (!scrollContainer || !track) {
    return;
  }

  const maxScrollLeft = Math.max(
    scrollContainer.scrollWidth - scrollContainer.clientWidth,
    0,
  );
  const maxThumbOffset = Math.max(track.clientWidth - taskScrollbar.thumbWidth, 0);

  if (maxScrollLeft <= 0 || maxThumbOffset <= 0) {
    return;
  }

  const deltaX = event.clientX - taskScrollbar.dragStartX;
  const scrollPerPixel = maxScrollLeft / maxThumbOffset;
  scrollContainer.scrollLeft = clampTaskScrollbarValue(
    taskScrollbar.dragStartScrollLeft + deltaX * scrollPerPixel,
    0,
    maxScrollLeft,
  );
}

function handleTaskThumbPointerUp(event: PointerEvent): void {
  taskScrollbar.dragging = false;
  cleanupTaskScrollbarDragListeners();
  document.body.style.removeProperty("user-select");

  if (!isPointerInsideTaskTrack(event.clientX, event.clientY)) {
    taskScrollbar.hovered = false;
  }
}

function openCreateDrawer(): void {
  editingTaskId.value = null;
  taskDrawerMode.value = "create";
  taskDrawerOpen.value = true;
  taskDrawerLoading.value = false;
  resetTaskForm();
}

async function openEditDrawer(taskId: number): Promise<void> {
  if (!taskId) {
    return;
  }

  editingTaskId.value = taskId;
  taskDrawerMode.value = "edit";
  taskDrawerOpen.value = true;
  taskDrawerLoading.value = true;
  resetTaskForm();

  try {
    const detail = await getOJTaskDetail(taskId, {
      skipSuccTip: true,
      skipErrTip: true,
    });
    fillTaskForm(detail, "edit");
    await analyzeAllTaskItems("auto");
  } catch (error) {
    taskDrawerOpen.value = false;
    message.error("加载任务详情失败，请稍后重试");
  } finally {
    taskDrawerLoading.value = false;
  }
}

async function openReviseDrawer(taskId: number): Promise<void> {
  if (!taskId) {
    return;
  }

  editingTaskId.value = taskId;
  taskDrawerMode.value = "revise";
  taskDrawerOpen.value = true;
  taskDrawerLoading.value = true;
  resetTaskForm();

  try {
    const detail = await getOJTaskDetail(taskId, {
      skipSuccTip: true,
      skipErrTip: true,
    });
    fillTaskForm(detail, "revise");
    await analyzeAllTaskItems("auto");
  } catch (error) {
    taskDrawerOpen.value = false;
    message.error("加载任务详情失败，请稍后重试");
  } finally {
    taskDrawerLoading.value = false;
  }
}

function closeTaskDrawer(): void {
  taskDrawerOpen.value = false;
}

function clearDetailPollTimer(): void {
  if (detailPollTimer !== null) {
    window.clearTimeout(detailPollTimer);
    detailPollTimer = null;
  }
}

function stopDetailPolling(): void {
  clearDetailPollTimer();
  detailPolling.active = false;
  detailPolling.taskId = 0;
  detailPolling.executionId = 0;
  detailPolling.startedAt = 0;
}

async function fetchTaskDetailBundle(
  taskId: number,
  executionId: number,
  options: { silent?: boolean } = {},
): Promise<void> {
  try {
    const [detail, execution] = await Promise.all([
      getOJTaskDetail(taskId, {
        skipSuccTip: true,
        skipErrTip: true,
      }),
      executionId
        ? getOJTaskExecutionDetail(taskId, executionId, {
            skipSuccTip: true,
            skipErrTip: true,
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    detailTask.value = detail;
    detailExecution.value = execution || detail.current_execution || null;
    detailError.value = "";
  } catch (error) {
    detailError.value = "任务详情加载失败，请稍后重试。";
    if (!options.silent) {
      message.error("任务详情加载失败，请稍后重试");
    }
    throw error;
  }
}

function resetExecutionUsersState(): void {
  userPagination.current = 1;
  userPagination.total = 0;
  executionUsers.value = [];
  executionUsersError.value = "";
}

function resetUserDetailState(): void {
  userDetailDrawerOpen.value = false;
  userDetailLoading.value = false;
  userDetailError.value = "";
  executionUserDetail.value = null;
}

async function loadTaskVersions(
  taskId: number,
  options: { silent?: boolean } = {},
): Promise<void> {
  versionLoading.value = true;
  versionError.value = "";
  try {
    const data = await getOJTaskVersions(taskId, {
      skipSuccTip: true,
      skipErrTip: true,
    });
    taskVersions.value = data.versions || [];
  } catch (error) {
    taskVersions.value = [];
    versionError.value = "版本链加载失败，请稍后重试。";
    if (!options.silent) {
      message.error("版本链加载失败，请稍后重试");
    }
  } finally {
    versionLoading.value = false;
  }
}

async function refreshTaskDetail(
  options: { silent?: boolean } = {},
): Promise<void> {
  if (!detailTask.value) {
    return;
  }
  await fetchTaskDetailBundle(
    detailTask.value.task_id,
    currentExecution.value?.execution_id ||
      detailTask.value.current_execution?.execution_id ||
      0,
    options,
  );
}

async function openTaskDetail(
  taskId: number,
  executionId: number,
): Promise<void> {
  if (!taskId) {
    return;
  }

  stopDetailPolling();
  resetUserDetailState();
  resetExecutionUsersState();
  detailDrawerOpen.value = true;
  detailActiveTab.value = "overview";
  detailLoading.value = true;
  detailError.value = "";

  try {
    await Promise.all([
      fetchTaskDetailBundle(taskId, executionId, { silent: false }),
      loadTaskVersions(taskId, { silent: true }),
    ]);
  } finally {
    detailLoading.value = false;
  }
}

async function refreshDetailPanel(
  options: { silent?: boolean } = {},
): Promise<void> {
  if (!detailTask.value) {
    return;
  }

  detailLoading.value = !options.silent;

  try {
    await Promise.all([
      refreshTaskDetail({ silent: options.silent }),
      loadTaskVersions(detailTask.value.task_id, { silent: true }),
    ]);

    if (detailActiveTab.value === "users") {
      await loadExecutionUsers({ silent: true });
    }
  } finally {
    detailLoading.value = false;
  }
}

function scheduleNextDetailPoll(): void {
  clearDetailPollTimer();
  detailPollTimer = window.setTimeout(() => {
    void pollTaskExecution();
  }, DETAIL_POLL_INTERVAL);
}

async function pollTaskExecution(): Promise<void> {
  if (!detailPolling.active || !detailDrawerOpen.value) {
    stopDetailPolling();
    return;
  }

  if (Date.now() - detailPolling.startedAt > DETAIL_POLL_TIMEOUT) {
    stopDetailPolling();
    await fetchTasks({ silent: true });
    message.warning("任务状态仍在更新中，可稍后手动刷新");
    return;
  }

  try {
    await refreshTaskDetail({ silent: true });

    if (detailActiveTab.value === "users") {
      await loadExecutionUsers({ silent: true });
    }

    const execution = currentExecution.value;
    if (!execution || execution.execution_id !== detailPolling.executionId) {
      stopDetailPolling();
      return;
    }

    if (STABLE_EXECUTION_STATUS.has(execution.status)) {
      stopDetailPolling();
      await fetchTasks({ silent: true });
      if (execution.status === "succeeded") {
        message.success("任务执行完成，结果已同步更新。");
      } else if (execution.status === "failed") {
        message.warning("任务执行失败，请查看错误信息或发起重试。");
      } else {
        message.info("任务执行已取消。");
      }
      return;
    }
  } catch (error) {
    if (Date.now() - detailPolling.startedAt > DETAIL_POLL_TIMEOUT) {
      stopDetailPolling();
      await fetchTasks({ silent: true });
      message.warning("任务状态仍在更新中，可稍后手动刷新");
      return;
    }
  }

  scheduleNextDetailPoll();
}

function startDetailPolling(taskId: number, executionId: number): void {
  stopDetailPolling();
  detailPolling.active = true;
  detailPolling.taskId = taskId;
  detailPolling.executionId = executionId;
  detailPolling.startedAt = Date.now();
  scheduleNextDetailPoll();
}

async function loadExecutionUsers(
  options: { silent?: boolean } = {},
): Promise<void> {
  const taskId = detailTask.value?.task_id;
  const executionId = currentExecution.value?.execution_id;

  if (!taskId || !executionId) {
    executionUsers.value = [];
    executionUsersError.value = "";
    userPagination.total = 0;
    return;
  }

  executionUsersLoading.value = true;
  executionUsersError.value = "";

  let allCompleted: boolean | undefined;
  if (userFilters.completion_scope === "completed") {
    allCompleted = true;
  } else if (userFilters.completion_scope === "pending") {
    allCompleted = false;
  }

  try {
    const data = await listOJTaskExecutionUsers(
      taskId,
      executionId,
      {
        page: userPagination.current,
        page_size: userPagination.pageSize,
        username: userFilters.username.trim() || undefined,
        all_completed: allCompleted,
      },
      {
        skipSuccTip: true,
        skipErrTip: true,
      },
    );

    executionUsers.value = data.list || [];
    userPagination.total = data.total || 0;
    userPagination.current = data.page || userPagination.current;
    userPagination.pageSize = data.page_size || userPagination.pageSize;
  } catch (error) {
    executionUsers.value = [];
    userPagination.total = 0;
    executionUsersError.value = "执行用户加载失败，请稍后重试。";
    if (!options.silent) {
      message.error("执行用户加载失败，请稍后重试");
    }
  } finally {
    executionUsersLoading.value = false;
  }
}

async function switchToVersion(record: OJTaskVersionItem): Promise<void> {
  await openTaskDetail(record.task_id, record.execution_id);
}

function handleExecutionUserSearch(): void {
  userPagination.current = 1;
  void loadExecutionUsers();
}

function resetExecutionUserFilters(): void {
  userFilters.username = "";
  userFilters.completion_scope = "all";
  userPagination.current = 1;
  void loadExecutionUsers();
}

function handleExecutionUserTableChange(pagination: {
  current?: number;
  pageSize?: number;
}): void {
  userPagination.current = pagination.current || 1;
  userPagination.pageSize = pagination.pageSize || 10;
  void loadExecutionUsers();
}

async function openExecutionUserDetail(
  summary: OJTaskExecutionUserSummary,
): Promise<void> {
  const taskId = detailTask.value?.task_id;
  const executionId = currentExecution.value?.execution_id;
  if (!taskId || !executionId) {
    return;
  }

  userDetailDrawerOpen.value = true;
  userDetailLoading.value = true;
  userDetailError.value = "";

  try {
    executionUserDetail.value = await getOJTaskExecutionUserDetail(
      taskId,
      executionId,
      summary.user_id,
      {
        skipSuccTip: true,
        skipErrTip: true,
      },
    );
  } catch (error) {
    executionUserDetail.value = null;
    userDetailError.value = "用户快照加载失败，请稍后重试。";
    message.error("用户快照加载失败，请稍后重试");
  } finally {
    userDetailLoading.value = false;
  }
}

function closeUserDetailDrawer(): void {
  resetUserDetailState();
}

async function handleMutationResult(
  result: OJTaskCreateResponse,
  successMessage: string,
): Promise<void> {
  taskDrawerOpen.value = false;
  await fetchTasks({ silent: true });
  await openTaskDetail(result.task_id, result.execution_id);

  if (result.status === "queued") {
    message.success(`${successMessage}，任务已入队，正在跟踪执行进度。`);
    startDetailPolling(result.task_id, result.execution_id);
    return;
  }

  message.success(successMessage);
}

async function submitTaskForm(): Promise<void> {
  if (
    taskDrawerLoading.value ||
    taskSubmitting.value ||
    taskSubmitConfirming.value ||
    taskAnalyzing.value
  ) {
    return;
  }

  if (!validateTaskFormBase()) {
    return;
  }

  try {
    const ready = await ensureTaskItemsReadyForSubmit();
    if (!ready) {
      return;
    }

    if (taskFormMissingRiskCount.value > 0) {
      confirmSubmitWithMissingRisk();
      return;
    }

    await executeTaskFormSubmit();
  } finally {
    if (!taskSubmitConfirming.value) {
      taskSubmitting.value = false;
    }
  }
}

function handleMutationWithConfirm(options: {
  title: string;
  content: string;
  onOk: () => Promise<void>;
}): void {
  Modal.confirm({
    title: options.title,
    content: options.content,
    okText: "确定",
    cancelText: "取消",
    onOk: options.onOk,
  });
}

function confirmDeleteTask(state: TaskActionState | null): void {
  if (!state) {
    return;
  }

  handleMutationWithConfirm({
    title: "删除任务版本",
    content: "删除后版本会保留审计痕迹，但不会再被调度执行。确认继续吗？",
    onOk: async () => {
      await deleteOJTask(state.task_id, {
        skipSuccTip: true,
      });
      await fetchTasks({ silent: true });
      if (
        detailDrawerOpen.value &&
        detailTask.value?.task_id === state.task_id
      ) {
        await refreshDetailPanel({ silent: true });
      }
      message.success("任务已删除");
    },
  });
}

function confirmExecuteTask(state: TaskActionState | null): void {
  if (!state) {
    return;
  }

  handleMutationWithConfirm({
    title: "提前执行任务",
    content: "任务将立即转为排队状态并异步执行，确认继续吗？",
    onOk: async () => {
      const result = await executeOJTaskNow(state.task_id, {
        skipSuccTip: true,
      });
      await fetchTasks({ silent: true });
      await openTaskDetail(result.task_id, result.execution_id);
      message.success("任务已提前入队，正在跟踪执行进度。");
      startDetailPolling(result.task_id, result.execution_id);
    },
  });
}

function confirmRetryTask(state: TaskActionState | null): void {
  if (!state) {
    return;
  }

  handleMutationWithConfirm({
    title: "重试任务版本",
    content: "重试会派生一个新版本并重新入队执行，确认继续吗？",
    onOk: async () => {
      const result = await retryOJTask(state.task_id, {
        skipSuccTip: true,
      });
      await fetchTasks({ silent: true });
      await openTaskDetail(result.task_id, result.execution_id);
      if (result.status === "queued") {
        message.success("重试版本已创建并入队，正在跟踪执行进度。");
        startDetailPolling(result.task_id, result.execution_id);
      } else {
        message.success("重试版本已创建");
      }
    },
  });
}

function disablePastDate(current: Dayjs): boolean {
  return current.endOf("day").valueOf() < dayjs().startOf("day").valueOf();
}

watch(
  () => detailActiveTab.value,
  (activeKey) => {
    if (
      activeKey === "users" &&
      detailDrawerOpen.value &&
      currentExecution.value
    ) {
      void loadExecutionUsers({ silent: true });
    }
  },
);

watch(
  () => taskDrawerOpen.value,
  (open) => {
    if (!open) {
      taskDrawerLoading.value = false;
      taskSubmitting.value = false;
      taskSubmitConfirming.value = false;
      taskAnalyzing.value = false;
      editingTaskId.value = null;
      resetTaskForm();
    }
  },
);

watch(
  () => detailDrawerOpen.value,
  (open) => {
    if (!open) {
      stopDetailPolling();
      detailActiveTab.value = "overview";
      detailLoading.value = false;
      detailError.value = "";
      detailTask.value = null;
      detailExecution.value = null;
      taskVersions.value = [];
      versionError.value = "";
      resetExecutionUsersState();
      resetUserDetailState();
    }
  },
);

watch(
  () => taskForm.mode,
  (mode) => {
    if (mode !== "scheduled") {
      taskForm.executeAt = undefined;
    }
  },
);

onBeforeUnmount(() => {
  stopDetailPolling();
  cleanupTaskScrollbarDragListeners();
  detachTaskTableScrollContainer();
  if (taskScrollbarResizeObserver) {
    taskScrollbarResizeObserver.disconnect();
    taskScrollbarResizeObserver = null;
  }
  if (taskScrollbarMeasureFrame !== null) {
    window.cancelAnimationFrame(taskScrollbarMeasureFrame);
    taskScrollbarMeasureFrame = null;
  }
  document.body.style.removeProperty("user-select");
});

onMounted(() => {
  resetTaskForm();
  scheduleTaskScrollbarSync();
  void fetchOrgOptions();
  void fetchTasks();
});
</script>

<template>
  <div class="page-container">
    <a-card
      :bordered="false"
      class="search-card"
      :body-style="{ padding: '24px 24px 0 24px' }"
    >
      <div class="task-search-layout">
        <a-form layout="inline" class="search-form task-search-main">
          <a-form-item
            label="关键词"
            class="task-search-item task-search-item-keyword"
          >
            <a-input
              v-model:value="taskFilters.keyword"
              class="task-search-input-keyword"
              placeholder="搜索任务标题或描述"
              allow-clear
              @pressEnter="searchTasks"
            >
              <template #prefix>
                <SearchOutlined style="color: rgba(0, 0, 0, 0.25)" />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item label="组织" class="task-search-item">
            <a-select
              v-model:value="taskFilters.org_id"
              placeholder="全部组织"
              style="width: 160px"
              allow-clear
              :loading="orgLoading"
              :options="orgSelectOptions"
            />
          </a-form-item>
          <a-form-item label="模式" class="task-search-item">
            <a-select
              v-model:value="taskFilters.mode"
              placeholder="全部模式"
              style="width: 140px"
              allow-clear
              :options="TASK_MODE_OPTIONS"
            />
          </a-form-item>
          <a-form-item label="状态" class="task-search-item">
            <a-select
              v-model:value="taskFilters.status"
              placeholder="全部状态"
              style="width: 150px"
              allow-clear
              :options="TASK_STATUS_FILTER_OPTIONS"
            />
          </a-form-item>
          <!-- 版本视图已移动到下方工具栏 -->
        </a-form>
        <div class="task-search-actions">
          <a-space :size="12">
            <a-button
              type="primary"
              @click="searchTasks"
            >
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button
              @click="resetTaskFilters"
            >
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </div>
      </div>
    </a-card>

    <a-card :bordered="false" class="content-card">
      <div class="toolbar">
        <a-space>
          <a-button
            v-permission="OJ_TASK_PERMISSION_CODES.create"
            type="primary"
            :disabled="!canCreate"
            @click="openCreateDrawer"
          >
            <template #icon><PlusOutlined /></template>
            新建 OJ 任务
          </a-button>
          <a-radio-group
            v-model:value="taskFilters.only_latest"
            button-style="solid"
            @change="handleVersionViewChange"
          >
            <a-radio-button value="latest">仅最新</a-radio-button>
            <a-radio-button value="all">全部版本</a-radio-button>
          </a-radio-group>
        </a-space>
        <a-space>
          <a-tooltip title="刷新任务列表">
            <a-button type="text" shape="circle" @click="refreshTasks">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </div>

      <a-alert
        type="info"
        show-icon
        class="page-alert"
        message="输入题目标题后先做本地分析，再提交任务。立即执行会自动跟踪状态，定时任务可继续编辑或提前执行。"
      />

      <a-alert
        v-if="taskError"
        type="error"
        show-icon
        class="page-alert"
        :message="taskError"
      />

      <div ref="taskTableRegionRef" class="task-table-region">
        <a-table
          class="oj-task-main-table"
          :columns="LIST_COLUMNS as any"
          :data-source="tasks"
          :pagination="false"
          :loading="taskLoading"
          :locale="tableLocale"
          row-key="task_id"
          size="middle"
          :scroll="{ x: 1750 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="task-title-cell">
                <div class="task-title-main">{{ record.title }}</div>
                <div class="task-title-sub">
                  v{{ record.version_no }} · root #{{ record.root_task_id }}
                  <span v-if="record.parent_task_id">
                    · 来源 #{{ record.parent_task_id }}</span
                  >
                </div>
                <div v-if="record.description" class="task-title-desc">
                  {{ record.description }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'mode'">
              <a-tag :color="record.mode === 'scheduled' ? 'gold' : 'blue'">
                {{ getModeLabel(record.mode) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getTaskStatusMeta(record.status).color">
                {{ getTaskStatusMeta(record.status).label }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'execution_status'">
              <a-tag
                :color="getExecutionStatusMeta(record.execution_status).color"
              >
                {{ getExecutionStatusMeta(record.execution_status).label }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'execute_at'">
              {{ formatDateTime(record.execute_at) }}
            </template>
            <template v-else-if="column.key === 'updated_at'">
              {{ formatDateTime(record.updated_at) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button
                  type="link"
                  size="small"
                  @click="openTaskDetailFromRecord(record)"
                >
                  <template #icon><EyeOutlined /></template>
                  详情
                </a-button>
                <a-button
                  v-permission="OJ_TASK_PERMISSION_CODES.edit"
                  type="link"
                  size="small"
                  :disabled="!canEditTask(buildTaskActionStateFromRecord(record))"
                  @click="openEditDrawerFromRecord(record)"
                >
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-button
                  v-permission="OJ_TASK_PERMISSION_CODES.execute"
                  type="link"
                  size="small"
                  :disabled="!canExecuteTask(buildTaskActionStateFromRecord(record))"
                  @click="
                    confirmExecuteTask(buildTaskActionStateFromRecord(record))
                  "
                >
                  <template #icon><PlayCircleOutlined /></template>
                  提前执行
                </a-button>
                <a-button
                  v-permission="OJ_TASK_PERMISSION_CODES.revise"
                  type="link"
                  size="small"
                  :disabled="!canReviseTask()"
                  @click="openReviseDrawerFromRecord(record)"
                >
                  <template #icon><ForkOutlined /></template>
                  派生
                </a-button>
                <a-button
                  v-permission="OJ_TASK_PERMISSION_CODES.retry"
                  type="link"
                  size="small"
                  :disabled="!canRetryTask(buildTaskActionStateFromRecord(record))"
                  @click="
                    confirmRetryTask(buildTaskActionStateFromRecord(record))
                  "
                >
                  <template #icon><RedoOutlined /></template>
                  重试
                </a-button>
                <a-button
                  v-permission="OJ_TASK_PERMISSION_CODES.delete"
                  type="link"
                  danger
                  size="small"
                  :disabled="!canDeleteTask(buildTaskActionStateFromRecord(record))"
                  @click="
                    confirmDeleteTask(buildTaskActionStateFromRecord(record))
                  "
                >
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </div>
            </template>
          </template>
        </a-table>
      </div>

      <div
        ref="taskScrollTrackRef"
        class="task-scrollbar-track"
        :class="{
          'is-overflowing': taskScrollbar.hasOverflow,
          'is-thumb-visible': taskScrollThumbVisible,
        }"
        @pointerenter="handleTaskScrollTrackEnter"
        @pointerleave="handleTaskScrollTrackLeave"
        @pointerdown="handleTaskScrollTrackPointerDown"
      >
        <div
          class="task-scrollbar-thumb"
          :style="taskScrollThumbStyle"
          @pointerdown.stop="handleTaskThumbPointerDown"
        />
      </div>

      <div class="task-pagination-wrapper">
        <a-pagination
          :current="taskPaginationConfig.current"
          :page-size="taskPaginationConfig.pageSize"
          :total="taskPaginationConfig.total"
          :show-size-changer="taskPaginationConfig.showSizeChanger"
          :page-size-options="taskPaginationConfig.pageSizeOptions"
          :show-quick-jumper="taskPaginationConfig.showQuickJumper"
          :show-total="taskPaginationConfig.showTotal"
          @change="handleTaskPaginationChange"
        />
      </div>
    </a-card>

    <a-drawer
      v-model:open="taskDrawerOpen"
      :title="taskDrawerTitle"
      width="920"
      :mask-closable="!taskSubmitting"
      destroy-on-close
      class="task-drawer"
      @close="closeTaskDrawer"
    >
      <a-spin :spinning="taskDrawerLoading || taskSubmitting">
        <a-form layout="vertical" class="task-form">
          <a-row :gutter="16">
            <a-col :xs="24" :lg="14">
              <a-form-item label="任务标题" required>
                <a-input
                  v-model:value="taskForm.title"
                  placeholder="例如：3 月周测补题任务"
                  :maxlength="120"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :lg="10">
              <a-form-item label="执行模式" required>
                <a-radio-group
                  v-model:value="taskForm.mode"
                  :disabled="taskDrawerMode === 'edit'"
                >
                  <a-radio-button value="immediate">立即执行</a-radio-button>
                  <a-radio-button value="scheduled">定时执行</a-radio-button>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :xs="24" :lg="taskDrawerShowExecuteAt ? 12 : 24">
              <a-form-item label="执行组织" required>
                <a-select
                  v-model:value="taskForm.orgIds"
                  mode="multiple"
                  :max-tag-count="4"
                  :loading="orgLoading"
                  :options="orgSelectOptions"
                  placeholder="选择可见组织"
                />
              </a-form-item>
            </a-col>
            <a-col v-if="taskDrawerShowExecuteAt" :xs="24" :lg="12">
              <a-form-item label="计划执行时间" required>
                <a-date-picker
                  v-model:value="taskForm.executeAt"
                  show-time
                  style="width: 100%"
                  :disabled-date="disablePastDate"
                  placeholder="选择未来时间"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="任务说明">
            <a-textarea
              v-model:value="taskForm.description"
              :rows="3"
              :maxlength="500"
              show-count
              placeholder="描述这次任务的背景、目标或适用人群"
            />
          </a-form-item>

          <a-card :bordered="false" class="analysis-summary-card">
            <div class="analysis-summary-header">
              <div class="analysis-summary-meta">
                <div class="analysis-summary-title">题单解析</div>
                <div class="analysis-summary-subtitle">
                  唯一命中会直接锁定，未命中题目仍可按风险提交为待解析状态，多候选则必须先确认。
                </div>
              </div>
              <a-space class="analysis-summary-actions">
                <a-button
                  :loading="taskAnalyzing"
                  :disabled="!canManualAnalyze"
                  @click="
                    taskAnalyzing = true;
                    analyzeAllTaskItems('manual').finally(
                      () => (taskAnalyzing = false),
                    );
                  "
                >
                  <template #icon><SyncOutlined /></template>
                  分析题单
                </a-button>
                <a-button type="dashed" @click="addTaskItem()">
                  <template #icon><PlusOutlined /></template>
                  添加题目
                </a-button>
              </a-space>
            </div>

            <a-space wrap>
              <a-tag color="success"
                >已解析 {{ taskFormAnalysisSummary.resolved }}</a-tag
              >
              <a-tag color="processing"
                >分析中 {{ taskFormAnalysisSummary.analyzing }}</a-tag
              >
              <a-tag color="default"
                >待分析 {{ taskFormAnalysisSummary.idle }}</a-tag
              >
              <a-tag color="warning"
                >待选择 {{ taskFormAnalysisSummary.ambiguous }}</a-tag
              >
              <a-tag color="warning"
                >未命中 {{ taskFormAnalysisSummary.missing }}</a-tag
              >
              <a-tag color="volcano"
                >需修正 {{ taskFormAnalysisSummary.invalid }}</a-tag
              >
            </a-space>

            <a-alert
              :type="
                taskFormBlockingCount === 0 && taskFormMissingRiskCount === 0
                  ? 'success'
                  : 'warning'
              "
              show-icon
              class="analysis-summary-alert"
              :message="taskFormAnalysisMessage"
            />
          </a-card>

          <div class="task-item-list">
            <div
              v-for="(item, index) in taskForm.items"
              :key="item.key"
              class="task-item-card"
            >
              <div class="task-item-card-header">
                <div class="task-item-index">
                  第 {{ index + 1 }} 题
                  <a-tag :color="getFormItemStatusMeta(item.status).color">
                    {{ getFormItemStatusMeta(item.status).label }}
                  </a-tag>
                </div>
                <a-space>
                  <a-button size="small" @click="analyzeSingleTaskItem(item)">
                    <template #icon><SyncOutlined /></template>
                    重新分析
                  </a-button>
                  <a-button
                    size="small"
                    danger
                    :disabled="taskForm.items.length === 1"
                    @click="removeTaskItem(index)"
                  >
                    <template #icon><DeleteOutlined /></template>
                    删除
                  </a-button>
                </a-space>
              </div>

              <div class="task-item-row">
                <a-select
                  :value="item.platform"
                  style="width: 160px"
                  :options="PLATFORM_OPTIONS"
                  @update:value="handleTaskItemPlatformChange(item, $event as OJPlatform)"
                />
                <a-input
                  :value="item.title"
                  class="task-item-title-input"
                  placeholder="请输入题目标题，例如 Two Sum / A+B Problem"
                  @update:value="handleTaskItemTitleChange(item, $event as string)"
                />
              </div>

              <div :class="['task-item-feedback', `is-${item.status}`]">
                <template v-if="item.status === 'resolved'">
                  <div class="analysis-feedback-main">
                    <CheckCircleOutlined
                      class="analysis-feedback-icon success"
                    />
                    <div>
                      <div class="analysis-feedback-title">已锁定唯一题目</div>
                      <div class="analysis-feedback-subtitle">
                        {{ getPlatformLabel(item.platform) }} ·
                        {{ item.resolvedQuestionCode || "-" }}
                        <span v-if="item.resolvedTitle">
                          · {{ item.resolvedTitle }}</span
                        >
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="item.status === 'ambiguous'">
                  <div class="analysis-feedback-main">
                    <WarningOutlined class="analysis-feedback-icon warning" />
                    <div>
                      <div class="analysis-feedback-title">
                        命中多个候选，请手动确认
                      </div>
                      <div class="analysis-feedback-subtitle">
                        请选择最符合的权威题目，系统会写入对应的分析令牌。
                      </div>
                    </div>
                  </div>
                  <div class="candidate-grid">
                    <button
                      v-for="candidate in item.candidates"
                      :key="candidate.analysis_token"
                      type="button"
                      class="candidate-card"
                      @click="selectTaskItemCandidate(item, candidate)"
                    >
                      <div class="candidate-code">
                        {{ candidate.resolved_question_code }}
                      </div>
                      <div class="candidate-title">
                        {{ candidate.resolved_title }}
                      </div>
                    </button>
                  </div>
                </template>
                <template v-else-if="item.status === 'missing'">
                  <div class="analysis-feedback-main">
                    <WarningOutlined class="analysis-feedback-icon warning" />
                    <div>
                      <div class="analysis-feedback-title">本地题库未命中</div>
                      <div class="analysis-feedback-subtitle">
                        {{
                          item.errorText ||
                          "可修正标题后重新分析，也可继续提交为待解析状态，后续由系统自动回填。"
                        }}
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="item.status === 'invalid'">
                  <div class="analysis-feedback-main">
                    <WarningOutlined class="analysis-feedback-icon danger" />
                    <div>
                      <div class="analysis-feedback-title">输入需要修正</div>
                      <div class="analysis-feedback-subtitle">
                        {{
                          item.errorText || "标题为空或分析失败，请检查后重试。"
                        }}
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="item.status === 'analyzing'">
                  <div class="analysis-feedback-main">
                    <SyncOutlined class="analysis-feedback-icon info spin" />
                    <div>
                      <div class="analysis-feedback-title">正在分析题目</div>
                      <div class="analysis-feedback-subtitle">
                        正在比对本地题库，请稍候。
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="analysis-feedback-main">
                    <SyncOutlined class="analysis-feedback-icon muted" />
                    <div>
                      <div class="analysis-feedback-title">等待分析</div>
                      <div class="analysis-feedback-subtitle">
                        修改平台或标题后，需要重新执行题单分析。
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </a-form>
      </a-spin>

      <template #footer>
        <div class="drawer-footer">
          <a-space>
            <a-button @click="closeTaskDrawer">取消</a-button>
            <a-button
              type="primary"
              :loading="taskSubmitting"
              :disabled="
                taskDrawerLoading ||
                taskSubmitConfirming ||
                taskAnalyzing ||
                !taskFormReady
              "
              @click="submitTaskForm"
            >
              {{ taskDrawerOkText }}
            </a-button>
          </a-space>
        </div>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="detailDrawerOpen"
      width="1180"
      :mask-closable="true"
      destroy-on-close
      class="detail-drawer"
    >
      <template #title>
        <div class="detail-title-block">
          <div class="detail-title-main">
            {{ detailTask?.title || "任务详情" }}
          </div>
          <div class="detail-title-sub">
            <span v-if="detailTask"
              >v{{ detailTask.version_no }} · task #{{
                detailTask.task_id
              }}</span
            >
            <span v-if="detailTask?.root_task_id">
              · root #{{ detailTask.root_task_id }}</span
            >
            <span v-if="currentExecution">
              · execution #{{ currentExecution.execution_id }}</span
            >
          </div>
        </div>
      </template>

      <a-spin :spinning="detailLoading">
        <div v-if="isDetailPolling" class="detail-polling-hint">
          <SyncOutlined class="spin" />
          <span>执行状态正在刷新中，每 2 秒自动同步一次结果。</span>
        </div>

        <a-alert
          v-if="detailError"
          type="error"
          show-icon
          class="page-alert"
          :message="detailError"
        />

        <template v-if="detailTask && currentExecution">
          <a-tabs v-model:activeKey="detailActiveTab">
            <a-tab-pane key="overview" tab="任务概览">
              <div class="toolbar detail-toolbar">
                <a-space>
                  <a-button size="small" @click="refreshDetailPanel()">
                    <template #icon><ReloadOutlined /></template>
                    刷新详情
                  </a-button>
                  <a-button
                    v-permission="OJ_TASK_PERMISSION_CODES.edit"
                    size="small"
                    :disabled="!canEditTask(detailActionState)"
                    @click="openEditDrawer(detailTask.task_id)"
                  >
                    <template #icon><EditOutlined /></template>
                    编辑
                  </a-button>
                  <a-button
                    v-permission="OJ_TASK_PERMISSION_CODES.execute"
                    size="small"
                    :disabled="!canExecuteTask(detailActionState)"
                    @click="confirmExecuteTask(detailActionState)"
                  >
                    <template #icon><PlayCircleOutlined /></template>
                    提前执行
                  </a-button>
                  <a-button
                    v-permission="OJ_TASK_PERMISSION_CODES.revise"
                    size="small"
                    :disabled="!canReviseTask()"
                    @click="openReviseDrawer(detailTask.task_id)"
                  >
                    <template #icon><ForkOutlined /></template>
                    派生新版本
                  </a-button>
                  <a-button
                    v-permission="OJ_TASK_PERMISSION_CODES.retry"
                    size="small"
                    :disabled="!canRetryTask(detailActionState)"
                    @click="confirmRetryTask(detailActionState)"
                  >
                    <template #icon><RedoOutlined /></template>
                    重试
                  </a-button>
                  <a-button
                    v-permission="OJ_TASK_PERMISSION_CODES.delete"
                    danger
                    size="small"
                    :disabled="!canDeleteTask(detailActionState)"
                    @click="confirmDeleteTask(detailActionState)"
                  >
                    <template #icon><DeleteOutlined /></template>
                    删除
                  </a-button>
                </a-space>
              </div>

              <div class="stats-grid">
                <a-card class="stat-card">
                  <div class="stat-label">任务状态</div>
                  <div class="stat-value">
                    <a-tag :color="getTaskStatusMeta(detailTask.status).color">
                      {{ getTaskStatusMeta(detailTask.status).label }}
                    </a-tag>
                  </div>
                </a-card>
                <a-card class="stat-card">
                  <div class="stat-label">执行状态</div>
                  <div class="stat-value">
                    <a-tag
                      :color="
                        getExecutionStatusMeta(currentExecution.status).color
                      "
                    >
                      {{
                        getExecutionStatusMeta(currentExecution.status).label
                      }}
                    </a-tag>
                  </div>
                </a-card>
                <a-card class="stat-card">
                  <div class="stat-label">覆盖用户</div>
                  <div class="stat-number">
                    {{ currentExecution.total_user_count }}
                  </div>
                </a-card>
                <a-card class="stat-card">
                  <div class="stat-label">已完成用户</div>
                  <div class="stat-number">
                    {{ currentExecution.completed_user_count }}
                  </div>
                </a-card>
                <a-card class="stat-card">
                  <div class="stat-label">待完成用户</div>
                  <div class="stat-number">
                    {{ currentExecution.pending_user_count }}
                  </div>
                </a-card>
                <a-card class="stat-card">
                  <div class="stat-label">题目总数</div>
                  <div class="stat-number">{{ detailTask.items.length }}</div>
                </a-card>
              </div>

              <a-card :bordered="false" class="section-card">
                <a-descriptions
                  :column="2"
                  bordered
                  class="detail-descriptions"
                >
                  <a-descriptions-item label="任务模式">
                    {{ getModeLabel(detailTask.mode) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="触发方式">
                    {{
                      getExecutionTriggerLabel(currentExecution.trigger_type)
                    }}
                  </a-descriptions-item>
                  <a-descriptions-item label="计划执行时间">
                    {{
                      formatDateTime(
                        detailTask.execute_at || currentExecution.planned_at,
                      )
                    }}
                  </a-descriptions-item>
                  <a-descriptions-item label="请求人 ID">
                    <span class="mono-text">{{
                      currentExecution.requested_by
                    }}</span>
                  </a-descriptions-item>
                  <a-descriptions-item label="开始时间">
                    {{ formatDateTime(currentExecution.started_at) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="结束时间">
                    {{ formatDateTime(currentExecution.finished_at) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="创建时间">
                    {{ formatDateTime(detailTask.created_at) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="更新时间">
                    {{ formatDateTime(detailTask.updated_at) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="任务说明" :span="2">
                    {{ detailTask.description || "-" }}
                  </a-descriptions-item>
                  <a-descriptions-item label="执行组织" :span="2">
                    <a-space wrap>
                      <a-tag
                        v-for="org in detailTask.orgs"
                        :key="org.org_id"
                        color="blue"
                      >
                        {{ org.org_name }}
                      </a-tag>
                    </a-space>
                  </a-descriptions-item>
                </a-descriptions>
              </a-card>

              <a-card
                :bordered="false"
                class="section-card"
                title="任务题单快照"
              >
                <a-table
                  :columns="TASK_ITEM_COLUMNS as any"
                  :data-source="detailTask.items"
                  :pagination="false"
                  :scroll="{ x: 1150 }"
                  row-key="id"
                  size="middle"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'platform'">
                      <a-tag color="geekblue">{{
                        getPlatformLabel(record.platform)
                      }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'resolution_status'">
                      <a-tag
                        :color="
                          getResolutionStatusMeta(record.resolution_status)
                            .color
                        "
                      >
                        {{
                          getResolutionStatusMeta(record.resolution_status)
                            .label
                        }}
                      </a-tag>
                    </template>
                    <template
                      v-else-if="column.key === 'resolved_question_code'"
                    >
                      <span class="mono-text">{{
                        record.resolved_question_code || "-"
                      }}</span>
                    </template>
                    <template
                      v-else-if="column.key === 'resolved_title_snapshot'"
                    >
                      {{ record.resolved_title_snapshot || "-" }}
                    </template>
                    <template v-else-if="column.key === 'resolution_note'">
                      {{ getResolutionNoteLabel(record.resolution_note) }}
                    </template>
                  </template>
                </a-table>
              </a-card>

              <a-alert
                v-if="currentExecution.error_message"
                type="error"
                show-icon
                class="page-alert"
                :message="currentExecution.error_message"
              />
            </a-tab-pane>

            <a-tab-pane key="versions" tab="版本链">
              <a-alert
                v-if="versionError"
                type="error"
                show-icon
                class="page-alert"
                :message="versionError"
              />

              <a-spin :spinning="versionLoading">
                <div v-if="taskVersions.length" class="version-list">
                  <div
                    v-for="version in taskVersions"
                    :key="version.task_id"
                    :class="[
                      'version-item',
                      {
                        active:
                          version.task_id === detailTask.task_id &&
                          version.execution_id ===
                            currentExecution.execution_id,
                      },
                    ]"
                  >
                    <div class="version-item-main">
                      <div class="version-item-title">
                        v{{ version.version_no }} · {{ version.title }}
                      </div>
                      <div class="version-item-meta">
                        <a-tag
                          :color="
                            version.mode === 'scheduled' ? 'gold' : 'blue'
                          "
                        >
                          {{ getModeLabel(version.mode) }}
                        </a-tag>
                        <a-tag :color="getTaskStatusMeta(version.status).color">
                          {{ getTaskStatusMeta(version.status).label }}
                        </a-tag>
                        <a-tag
                          :color="
                            getExecutionStatusMeta(version.execution_status)
                              .color
                          "
                        >
                          {{
                            getExecutionStatusMeta(version.execution_status)
                              .label
                          }}
                        </a-tag>
                      </div>
                      <div class="version-item-sub">
                        task #{{ version.task_id }} · execution #{{
                          version.execution_id
                        }}
                        ·
                        {{ formatDateTime(version.execute_at) }}
                      </div>
                    </div>
                    <a-button
                      type="primary"
                      ghost
                      :disabled="
                        version.task_id === detailTask.task_id &&
                        version.execution_id === currentExecution.execution_id
                      "
                      @click="switchToVersion(version)"
                    >
                      查看版本
                    </a-button>
                  </div>
                </div>
                <a-empty v-else description="暂无版本数据" />
              </a-spin>
            </a-tab-pane>

            <a-tab-pane key="users" tab="执行用户">
              <a-card
                :bordered="false"
                class="search-card users-search-card"
                :body-style="{ padding: '16px 16px 0 16px' }"
              >
                <a-form layout="inline">
                  <a-form-item label="用户">
                    <a-input
                      v-model:value="userFilters.username"
                      allow-clear
                      placeholder="搜索用户名"
                      @pressEnter="handleExecutionUserSearch"
                    />
                  </a-form-item>
                  <a-form-item label="完成范围">
                    <a-select
                      v-model:value="userFilters.completion_scope"
                      style="width: 160px"
                    >
                      <a-select-option value="all">全部用户</a-select-option>
                      <a-select-option value="completed"
                        >仅已全部完成</a-select-option
                      >
                      <a-select-option value="pending"
                        >仅未全部完成</a-select-option
                      >
                    </a-select>
                  </a-form-item>
                  <a-form-item>
                    <a-space>
                      <a-button
                        type="primary"
                        @click="handleExecutionUserSearch"
                      >
                        <template #icon><SearchOutlined /></template>
                        查询
                      </a-button>
                      <a-button @click="resetExecutionUserFilters">
                        <template #icon><ReloadOutlined /></template>
                        重置
                      </a-button>
                    </a-space>
                  </a-form-item>
                </a-form>
              </a-card>

              <a-alert
                v-if="executionUsersError"
                type="error"
                show-icon
                class="page-alert"
                :message="executionUsersError"
              />

              <a-table
                :columns="USER_COLUMNS as any"
                :data-source="executionUsers"
                :loading="executionUsersLoading"
                :pagination="executionUserPaginationConfig"
                :locale="userTableLocale"
                row-key="user_id"
                size="middle"
                :scroll="{ x: 920 }"
                @change="handleExecutionUserTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'username_snapshot'">
                    <div class="user-name-cell">
                      <a-avatar :src="record.avatar_snapshot" size="small">
                        <template #icon><UserOutlined /></template>
                      </a-avatar>
                      <div>
                        <div class="user-name-main">
                          {{ record.username_snapshot }}
                        </div>
                        <div class="user-name-sub">
                          #{{ record.user_id }} ·
                          {{ getUserStatusLabel(record.user_status_snapshot) }}
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'orgs'">
                    <a-space wrap>
                      <a-tag
                        v-for="org in record.orgs"
                        :key="`${record.user_id}-${org.org_id}`"
                      >
                        {{ org.org_name_snapshot }}
                      </a-tag>
                    </a-space>
                  </template>
                  <template v-else-if="column.key === 'all_completed'">
                    <a-tag
                      :color="record.all_completed ? 'success' : 'warning'"
                    >
                      {{ record.all_completed ? "已完成" : "待补题" }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-button
                      type="link"
                      size="small"
                      @click="openExecutionUserDetailFromRecord(record)"
                    >
                      查看
                    </a-button>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </template>
      </a-spin>
    </a-drawer>

    <a-drawer
      v-model:open="userDetailDrawerOpen"
      width="980"
      :mask-closable="true"
      destroy-on-close
      class="user-detail-drawer"
      @close="closeUserDetailDrawer"
    >
      <template #title>
        <div class="detail-title-block">
          <div class="detail-title-main">
            {{ executionUserDetail?.username_snapshot || "用户执行快照" }}
          </div>
          <div class="detail-title-sub">
            <span v-if="executionUserDetail"
              >用户 #{{ executionUserDetail.user_id }}</span
            >
          </div>
        </div>
      </template>

      <a-spin :spinning="userDetailLoading">
        <a-alert
          v-if="userDetailError"
          type="error"
          show-icon
          class="page-alert"
          :message="userDetailError"
        />

        <template v-if="executionUserDetail">
          <a-card :bordered="false" class="section-card">
            <a-descriptions :column="2" bordered class="detail-descriptions">
              <a-descriptions-item label="用户名">
                {{ executionUserDetail.username_snapshot }}
              </a-descriptions-item>
              <a-descriptions-item label="用户状态">
                {{
                  getUserStatusLabel(executionUserDetail.user_status_snapshot)
                }}
              </a-descriptions-item>
              <a-descriptions-item label="完成题数">
                {{ executionUserDetail.completed_item_count }}
              </a-descriptions-item>
              <a-descriptions-item label="待完成题数">
                {{ executionUserDetail.pending_item_count }}
              </a-descriptions-item>
              <a-descriptions-item label="执行组织" :span="2">
                <a-space wrap>
                  <a-tag
                    v-for="org in executionUserDetail.orgs"
                    :key="`${executionUserDetail.user_id}-${org.org_id}`"
                  >
                    {{ org.org_name_snapshot }}
                  </a-tag>
                </a-space>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>

          <a-card :bordered="false" class="section-card" title="已完成题目">
            <a-table
              :columns="USER_DETAIL_ITEM_COLUMNS as any"
              :data-source="executionUserDetail.completed_items"
              :pagination="false"
              row-key="task_item_id"
              size="middle"
              :scroll="{ x: 1280 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'platform'">
                  <a-tag color="geekblue">{{
                    getPlatformLabel(record.platform)
                  }}</a-tag>
                </template>
                <template v-else-if="column.key === 'resolution_status'">
                  <a-tag
                    :color="
                      getResolutionStatusMeta(record.resolution_status).color
                    "
                  >
                    {{
                      getResolutionStatusMeta(record.resolution_status).label
                    }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'resolved_question_code'">
                  <span class="mono-text">{{
                    record.resolved_question_code || "-"
                  }}</span>
                </template>
                <template v-else-if="column.key === 'resolved_title_snapshot'">
                  {{ record.resolved_title_snapshot || "-" }}
                </template>
                <template v-else-if="column.key === 'result_status'">
                  <a-tag color="success">已完成</a-tag>
                </template>
                <template v-else-if="column.key === 'reason_note'">
                  {{ getTaskItemReasonNote(record as OJTaskExecutionUserItem) }}
                </template>
              </template>
            </a-table>
          </a-card>

          <a-card :bordered="false" class="section-card" title="待完成题目">
            <a-table
              :columns="USER_DETAIL_ITEM_COLUMNS as any"
              :data-source="executionUserDetail.pending_items"
              :pagination="false"
              row-key="task_item_id"
              size="middle"
              :scroll="{ x: 1280 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'platform'">
                  <a-tag color="geekblue">{{
                    getPlatformLabel(record.platform)
                  }}</a-tag>
                </template>
                <template v-else-if="column.key === 'resolution_status'">
                  <a-tag
                    :color="
                      getResolutionStatusMeta(record.resolution_status).color
                    "
                  >
                    {{
                      getResolutionStatusMeta(record.resolution_status).label
                    }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'resolved_question_code'">
                  <span class="mono-text">{{
                    record.resolved_question_code || "-"
                  }}</span>
                </template>
                <template v-else-if="column.key === 'resolved_title_snapshot'">
                  {{ record.resolved_title_snapshot || "-" }}
                </template>
                <template v-else-if="column.key === 'result_status'">
                  <a-tag color="warning">待完成</a-tag>
                </template>
                <template v-else-if="column.key === 'reason_note'">
                  {{ getTaskItemReasonNote(record as OJTaskExecutionUserItem) }}
                </template>
              </template>
            </a-table>
          </a-card>
        </template>
      </a-spin>
    </a-drawer>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.search-card,
.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.section-card {
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.content-card {
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar :deep(.ant-btn),
.toolbar :deep(.ant-radio-button-wrapper) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toolbar :deep(.ant-btn > span),
.toolbar :deep(.ant-radio-button-wrapper span) {
  display: inline-flex;
  align-items: center;
}

.toolbar :deep(.ant-btn .anticon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.task-search-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 12px 12px;
}

.task-search-layout :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-search-layout :deep(.ant-btn > span) {
  display: inline-flex;
  align-items: center;
}

.task-search-layout :deep(.ant-btn .anticon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.task-search-layout :deep(.ant-input-prefix),
.task-search-layout :deep(.ant-input-suffix) {
  display: flex;
  align-items: center;
}

.task-search-layout :deep(.ant-select-arrow),
.task-search-layout :deep(.ant-select-clear) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-search-layout :deep(.ant-radio-button-wrapper) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-search-main {
  flex: 0 0 auto;
  min-width: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0 10px;
}

.search-form :deep(.ant-form-item) {
  margin-right: 0;
  margin-bottom: 20px;
}

.task-search-item {
  flex: 0 0 auto;
}

.task-search-item-keyword {
  flex: 0 0 auto;
  min-width: 0;
}

.task-search-input-keyword {
  width: 200px;
}

.task-search-item-version {
  min-width: max-content;
}

.task-search-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding-bottom: 20px;
  flex: 0 0 auto;
  margin-left: auto;
  white-space: nowrap;
}

.task-search-actions :deep(.ant-space) {
  gap: 10px !important;
}

.detail-toolbar {
  margin-bottom: 20px;
}

.page-alert {
  margin-bottom: 16px;
}

.task-table-region {
  min-width: 0;
}

:deep(.oj-task-main-table .ant-table-content) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.oj-task-main-table .ant-table-content::-webkit-scrollbar) {
  height: 0;
  width: 0;
}

.task-scrollbar-track {
  position: relative;
  width: 100%;
  height: 18px;
  margin-top: 0;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    max-height 0.18s ease,
    margin-top 0.18s ease;
}

.task-scrollbar-track::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.38);
  transform: translateY(-50%);
}

.task-scrollbar-track.is-overflowing {
  margin-top: 10px;
  max-height: 18px;
  opacity: 1;
  pointer-events: auto;
}

.task-scrollbar-thumb {
  position: absolute;
  top: 50%;
  min-width: 32px;
  height: 16px;
  border-radius: 6px;
  background: rgba(71, 85, 105, 0.88);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
  transform: translateY(-50%) scale(0.92);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    background-color 0.16s ease;
  cursor: grab;
}

.task-scrollbar-track.is-thumb-visible .task-scrollbar-thumb {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) scale(1);
}

.task-scrollbar-thumb:hover {
  background: rgba(51, 65, 85, 0.94);
}

.task-scrollbar-thumb:active {
  cursor: grabbing;
}

.task-pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.task-title-cell,
.task-title-main,
.task-title-sub,
.task-title-desc {
  display: block;
}

.task-title-main {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.task-title-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.task-title-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #4b5563;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.analysis-summary-card {
  margin-bottom: 20px;
  background:
    linear-gradient(
      135deg,
      rgba(221, 244, 255, 0.9),
      rgba(255, 255, 255, 0.96)
    ),
    radial-gradient(
      circle at top right,
      rgba(110, 231, 255, 0.25),
      transparent 45%
    );
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.analysis-summary-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.analysis-summary-meta {
  flex: 1 1 auto;
  min-width: 0;
}

.analysis-summary-actions {
  margin-left: auto;
  flex: 0 0 auto;
}

.task-drawer :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-drawer :deep(.ant-btn > span) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.task-drawer :deep(.ant-btn .anticon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  margin-inline-end: 0;
  font-size: 16px;
}

.task-drawer :deep(.ant-btn-sm > span) {
  gap: 4px;
}

.task-drawer :deep(.ant-btn-sm .anticon) {
  font-size: 14px;
}

.task-drawer :deep(.ant-input-prefix),
.task-drawer :deep(.ant-input-suffix) {
  display: flex;
  align-items: center;
}

.task-drawer :deep(.ant-select-arrow),
.task-drawer :deep(.ant-select-clear) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-drawer :deep(.ant-drawer-close) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.analysis-summary-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.analysis-summary-subtitle {
  margin-top: 6px;
  color: #475569;
  line-height: 1.7;
}

.analysis-summary-alert {
  margin-top: 14px;
}

.task-item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.96)
  );
}

.task-item-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.task-item-index {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.task-item-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-item-title-input {
  flex: 1;
}

.task-item-feedback {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid transparent;
}

.task-item-feedback.is-idle {
  background: rgba(248, 250, 252, 0.92);
  border-color: rgba(148, 163, 184, 0.18);
}

.task-item-feedback.is-analyzing {
  background: rgba(239, 246, 255, 0.95);
  border-color: rgba(96, 165, 250, 0.24);
}

.task-item-feedback.is-resolved {
  background: rgba(236, 253, 245, 0.92);
  border-color: rgba(52, 211, 153, 0.28);
}

.task-item-feedback.is-ambiguous {
  background: rgba(255, 251, 235, 0.95);
  border-color: rgba(251, 191, 36, 0.28);
}

.task-item-feedback.is-missing {
  background: rgba(255, 251, 235, 0.95);
  border-color: rgba(251, 191, 36, 0.28);
}

.task-item-feedback.is-invalid {
  background: rgba(254, 242, 242, 0.94);
  border-color: rgba(248, 113, 113, 0.26);
}

.analysis-feedback-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.analysis-feedback-icon {
  margin-top: 2px;
  font-size: 18px;
}

.analysis-feedback-icon.success {
  color: #059669;
}

.analysis-feedback-icon.warning {
  color: #d97706;
}

.analysis-feedback-icon.danger {
  color: #dc2626;
}

.analysis-feedback-icon.info {
  color: #2563eb;
}

.analysis-feedback-icon.muted {
  color: #64748b;
}

.analysis-feedback-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.analysis-feedback-subtitle {
  margin-top: 4px;
  color: #475569;
  line-height: 1.7;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.candidate-card {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.candidate-card:hover {
  transform: translateY(-1px);
  border-color: rgba(217, 119, 6, 0.42);
  box-shadow: 0 12px 24px rgba(217, 119, 6, 0.12);
}

.candidate-code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    monospace;
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
}

.candidate-title {
  margin-top: 6px;
  color: #1f2937;
  line-height: 1.6;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}

.detail-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-title-main {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.detail-title-sub {
  color: #64748b;
  font-size: 13px;
}

.detail-polling-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.95);
  border: 1px solid rgba(96, 165, 250, 0.22);
  color: #1d4ed8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 18px;
}

.stat-label {
  color: #64748b;
  font-size: 13px;
}

.stat-value {
  margin-top: 12px;
}

.stat-number {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.detail-descriptions {
  background: #fff;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.96)
  );
}

.version-item.active {
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.version-item-main {
  min-width: 0;
}

.version-item-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.version-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.version-item-sub {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.users-search-card {
  margin-bottom: 16px;
}

@media (max-width: 1280px) {
  .task-search-layout {
    justify-content: flex-start;
  }

  .task-search-actions {
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 24px;
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .task-search-main {
    min-width: 100%;
  }

  .search-form {
    gap: 0;
  }

  .task-search-item,
  .task-search-item-keyword,
  .task-search-item-version {
    width: 100%;
    min-width: 0;
  }

  .task-search-input-keyword {
    width: 100%;
  }
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name-main {
  font-weight: 600;
  color: #111827;
}

.user-name-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.mono-text {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    monospace;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-container {
    gap: 16px;
  }

  .analysis-summary-header,
  .task-item-card-header,
  .version-item,
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-item-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

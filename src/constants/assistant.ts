import type {
  AssistantConversationGroup,
  AssistantShellMode,
} from '@/types'

export const ASSISTANT_BACKEND_ROUTE_PATH = '/assistant'
export const ASSISTANT_ROUTE_PATH = '/console/assistant'
export const ASSISTANT_WORKBENCH_LEGACY_ROUTE_PATH = '/console/workbench/assistant'

export const ASSISTANT_ALWAYS_ACCESSIBLE_PATHS = new Set<string>([
  ASSISTANT_ROUTE_PATH,
  ASSISTANT_WORKBENCH_LEGACY_ROUTE_PATH,
])

export const ASSISTANT_INITIAL_SHELL_MODE: AssistantShellMode = 'launcher'

export const ASSISTANT_PROMPTS = [
  {
    key: 'task-report',
    label: '总结最近任务进展',
    description: '生成适合日报或周报发送的任务汇报。',
  },
  {
    key: 'scoped-report',
    label: '统计组织任务情况',
    description: '按当前组织和任务范围输出结构化汇总。',
  },
  {
    key: 'progress-insight',
    label: '分析最近刷题状态',
    description: '从排名、趋势和阶段性动作给出建议。',
  },
  {
    key: 'project-doc',
    label: '解释项目模块和用法',
    description: '基于正式项目文档给出模块定位和使用路径说明。',
  },
] as const

export const ASSISTANT_GROUP_ORDER: AssistantConversationGroup[] = [
  '今天',
  '最近',
  '更早',
]

export const ASSISTANT_FLOATING_BREAKPOINT = 960
export const ASSISTANT_WORKBENCH_SIDEBAR_DEFAULT_WIDTH = 264
export const ASSISTANT_WORKBENCH_SIDEBAR_MIN_WIDTH = 228
export const ASSISTANT_WORKBENCH_SIDEBAR_MAX_WIDTH = 320
export const ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSE_THRESHOLD = 148
export const ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSED_WIDTH = 16
export const ASSISTANT_WORKBENCH_DIVIDER_WIDTH = 12
export const ASSISTANT_WORKBENCH_CENTER_MIN_WIDTH = 780
export const ASSISTANT_WORKBENCH_CENTER_MAX_WIDTH = 1480

export const ASSISTANT_SHELL_LAUNCHER_SIZE = 48
export const ASSISTANT_SHELL_PANEL_WIDTH = 480
export const ASSISTANT_SHELL_PANEL_HEIGHT = 720
export const ASSISTANT_SHELL_EDGE_MARGIN = 18
export const ASSISTANT_SHELL_PANEL_OFFSET = 10

export const ASSISTANT_WORKBENCH_SIDEBAR_WIDTH_STORAGE_KEY =
  'assistant_workbench_sidebar_width'
export const ASSISTANT_WORKBENCH_SIDEBAR_COLLAPSED_STORAGE_KEY =
  'assistant_workbench_sidebar_collapsed'
export const ASSISTANT_SHELL_LAUNCHER_POSITION_STORAGE_KEY =
  'assistant_shell_launcher_position'

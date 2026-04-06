import dayjs from 'dayjs'
import { XStream } from 'ant-design-x-vue'
import type {
  AssistantConversation,
  AssistantConversationStartedPayload,
  AssistantErrorPayload,
  AssistantMessage,
  AssistantMessageCompletedPayload,
  AssistantScopeInfo,
  AssistantStructuredBlockPayload,
  AssistantStructuredCard,
  AssistantToolCallConfirmationResultPayload,
  AssistantToolCallFinishedPayload,
  AssistantToolCallStartedPayload,
  AssistantToolCallWaitingConfirmationPayload,
  AssistantToolDecisionRequest,
  AssistantTraceAction,
  AssistantTraceItem,
  StreamAssistantMessageRequest,
} from '@/types'

type MockStreamEvent =
  | { event: 'conversation_started'; data: AssistantConversationStartedPayload; delay?: number }
  | { event: 'assistant_token'; data: { token: string }; delay?: number }
  | { event: 'tool_call_started'; data: AssistantToolCallStartedPayload; delay?: number }
  | { event: 'tool_call_finished'; data: AssistantToolCallFinishedPayload; delay?: number }
  | { event: 'tool_call_waiting_confirmation'; data: AssistantToolCallWaitingConfirmationPayload; delay?: number }
  | { event: 'tool_call_confirmation_result'; data: AssistantToolCallConfirmationResultPayload; delay?: number }
  | { event: 'structured_block'; data: AssistantStructuredBlockPayload; delay?: number }
  | { event: 'message_completed'; data: AssistantMessageCompletedPayload; delay?: number }
  | { event: 'error'; data: AssistantErrorPayload; delay?: number }
  | { event: 'done'; data: Record<string, never>; delay?: number }

interface MockToolBlueprint {
  key: string
  title: string
  description: string
  duration_ms: number
  content: string
  detail_markdown: string
  confirmation_title?: string
  confirmation_description?: string
}

interface MockAssistantScenario {
  title: string
  preview: string
  intro_markdown: string
  confirm_markdown: string
  skip_markdown: string
  scope: AssistantScopeInfo
  tools: MockToolBlueprint[]
}

interface MockAssistantSession {
  scenario: MockAssistantScenario
  assistant_message_id: string
  request: StreamAssistantMessageRequest
}

export interface MockAssistantStreamResult {
  abortController: AbortController
  stream: AsyncIterable<{ event?: string; data?: string }>
}

const FIXED_DEMO_TITLE = '新建会话'
const FIXED_SCOPE_LABEL = '当前用户 + 当前组织 + 最近任务 + 当前文档范围'
const FIXED_DOC_SCOPE = 'README、架构设计方案、AI UI 改造说明'
const FIXED_TASK_NAME = 'OJ 任务闭环联调 V2'

const mockSessions = new Map<string, MockAssistantSession>()

const createConversation = (
  id: string,
  title: string,
  preview: string,
  updatedAt: string,
  group: AssistantConversation['group'],
): AssistantConversation => ({
  id,
  title,
  preview,
  updated_at: updatedAt,
  timestamp: dayjs(updatedAt).valueOf(),
  group,
  is_generating: false,
})

const createMessage = (
  id: string,
  conversationId: string,
  role: AssistantMessage['role'],
  content: string,
  createdAt: string,
  options: Partial<AssistantMessage> = {},
): AssistantMessage => ({
  id,
  conversation_id: conversationId,
  role,
  content,
  created_at: createdAt,
  status: 'success',
  cards: [],
  trace_items: [],
  ...options,
})

const createTraceActions = (toolKey: string): AssistantTraceAction[] => [
  {
    key: `${toolKey}_confirm`,
    label: '继续使用',
    action: 'confirm',
    style: 'primary',
  },
  {
    key: `${toolKey}_skip`,
    label: '跳过此工具',
    action: 'skip',
    style: 'default',
  },
]

const splitMarkdownChunks = (content: string, size = 48) => {
  const chunks: string[] = []

  for (let index = 0; index < content.length; index += size) {
    chunks.push(content.slice(index, index + size))
  }

  return chunks
}

const createTraceItem = (
  tool: MockToolBlueprint,
  options: Partial<AssistantTraceItem> = {},
): AssistantTraceItem => ({
  key: tool.key,
  title: tool.title,
  description: tool.description,
  status: 'success',
  duration_ms: tool.duration_ms,
  content: tool.content,
  detail_markdown: tool.detail_markdown,
  ...options,
})

const getScenarioTools = (scenario: MockAssistantScenario) => {
  const [scopeTool, taskTool, docTool, progressTool, composeTool] =
    scenario.tools

  if (!scopeTool || !taskTool || !docTool || !progressTool || !composeTool) {
    throw new Error('Mock assistant scenario tools are incomplete.')
  }

  return {
    scopeTool,
    taskTool,
    docTool,
    progressTool,
    composeTool,
  }
}

const buildStructuredCards = (
  seed: string,
  input: string,
  decision: 'confirm' | 'skip',
): AssistantStructuredCard[] => [
  {
    key: `${seed}_task_card`,
    type: 'task_report',
    title: '任务执行总览',
    summary:
      '主线任务已经进入收口阶段，当前阻塞点集中在少数成员补齐与回归验证。',
    metrics: [
      { label: '完成率', value: '81%', tone: 'success' },
      { label: '覆盖成员', value: '17 / 21', tone: 'primary' },
      { label: '阻塞项', value: '3', tone: 'warning' },
    ],
    bullets: [
      '登录、权限、题目同步与执行链路已经完成联调。',
      `本轮提问为“${input}”，当前结果来自当前会话数据。`,
      '可以直接继续追问“改成日报口吻”或“输出成周报结构”。',
    ],
  },
  {
    key: `${seed}_progress_card`,
    type: 'progress_insight',
    title: '个人进度建议',
    summary:
      '近 7 天的训练节奏稳定，但中等题突破密度仍偏低，建议从维持型练习切到突破型练习。',
    metrics: [
      { label: '当前排名', value: '#5', tone: 'primary' },
      { label: '近 7 天', value: '+12 题', tone: 'success' },
      { label: '重点方向', value: '中等题', tone: 'warning' },
    ],
    bullets: [
      '简单题继续热身即可，不再作为主要提升目标。',
      '建议未来三天集中攻克 2 到 3 道中等题并补齐错因总结。',
      '这张卡只保留摘要信息，不替代完整分析报告。',
    ],
  },
  {
    key: `${seed}_doc_card`,
    type: 'project_doc',
    title: decision === 'confirm' ? '项目文档摘要' : '文档范围说明',
    summary:
      decision === 'confirm'
        ? '已补充正式文档摘要，当前页面会展示 Workbench 挂载方式、业务定位和后续对接方式。'
        : '本轮选择跳过读取项目文档，因此保留任务与进度结论，文档侧只展示范围说明而不展开正文摘要。',
    metrics: [
      { label: '主入口', value: 'Workbench', tone: 'primary' },
      { label: '文档范围', value: decision === 'confirm' ? '已读取' : '已跳过', tone: decision === 'confirm' ? 'success' : 'warning' },
      { label: '展示模式', value: '结果摘要卡片', tone: 'primary' },
    ],
    bullets:
      decision === 'confirm'
        ? [
            '助手模块是挂在控制台 Workbench 中的正式业务页面，不再单独做展示页。',
            '消息区会直接展示处理记录和结果摘要，便于继续追问与复核。',
            '保持当前数据协议时，后端接入真实 AI 服务后界面不需要大改。',
          ]
        : [
            '这张卡用于说明跳过工具后，当前会话仍会保留范围和结果区域的一致性。',
            '当用户拒绝某个工具时，后续回答会继续，但少掉对应知识源的增强信息。',
            '真实后端接入时可沿用同样的决策接口与状态语义。',
          ],
  },
]

const buildScenario = (
  input: string,
  contextUserName: string,
  contextOrgName: string,
  seed: string,
): MockAssistantScenario => {
  const normalizedInput = input.trim() || '未填写问题'
  const confirmToolKey = `${seed}_doc_snapshot`

  return {
    title: FIXED_DEMO_TITLE,
    preview: normalizedInput,
    intro_markdown: [
      '# 助手执行摘要',
      '',
      `你刚才的问题是：**${normalizedInput}**。`,
      '',
      '## 当前结论',
      '',
      '- 已锁定当前用户、当前组织、最近任务和正式文档范围。',
      '- 任务主线数据已经拿到，个人进度建议也具备生成条件。',
      '- 接下来需要你决定是否继续读取项目文档摘要，再合成最终结果。',
      '',
      '## 快速指标',
      '',
      '| 指标 | 当前值 |',
      '| --- | --- |',
      '| 任务完成率 | 81% |',
      '| 覆盖成员 | 17 / 21 |',
      '| 阻塞项 | 3 |',
      '',
      '> 处理记录会继续推进；如果你允许读取文档工具，我会把项目说明一并补进结果摘要。',
      '',
      '```text',
      '等待工具确认：读取项目文档摘要',
      '```',
      '',
    ].join('\n'),
    confirm_markdown: [
      '',
      '## 工具确认结果',
      '',
      '你已允许继续读取项目文档摘要，当前结果已补充页面定位、知识源和后续接入方式。',
      '',
      '## 下一步建议',
      '',
      '1. 直接把任务总览卡改成日报口吻。',
      '2. 继续追问个人进度建议的拆解动作。',
      '3. 如果要接后端，只需沿用当前 stream 事件与结果协议。',
      '',
    ].join('\n'),
    skip_markdown: [
      '',
      '## 工具确认结果',
      '',
      '你选择跳过项目文档工具，因此我继续基于任务快照和个人进度完成回答，不再补正文档摘要。',
      '',
      '## 下一步建议',
      '',
      '1. 先把已有任务与进度结果整理成日报。',
      '2. 后续如需补充项目说明，可单独再触发文档类问题。',
      '3. 真实后端接入时，可把“拒绝工具”也作为一次显式决策事件记录。',
      '',
    ].join('\n'),
    scope: {
      user_name: contextUserName,
      org_name: contextOrgName,
      scope_label: FIXED_SCOPE_LABEL,
      task_name: FIXED_TASK_NAME,
      doc_scope_label: FIXED_DOC_SCOPE,
    },
    tools: [
      {
        key: `${seed}_scope_context`,
        title: '解析当前分析范围',
        description: '绑定当前用户、当前组织、默认任务与文档白名单',
        duration_ms: 16,
        content: '已确认当前范围锁定为用户、组织、最近任务与当前文档。',
        detail_markdown: [
          '### 范围解析',
          '',
          `- 用户：${contextUserName}`,
          `- 组织：${contextOrgName}`,
          `- 任务：${FIXED_TASK_NAME}`,
          `- 文档范围：${FIXED_DOC_SCOPE}`,
        ].join('\n'),
      },
      {
        key: `${seed}_task_snapshot`,
        title: '加载最近任务快照',
        description: '读取完成率、成员覆盖情况、阻塞项与后续动作',
        duration_ms: 148,
        content: '命中最近一次任务快照：完成率 81%，覆盖成员 17/21，阻塞项 3 个。',
        detail_markdown: [
          '### 任务快照',
          '',
          '| 字段 | 值 |',
          '| --- | --- |',
          '| 完成率 | 81% |',
          '| 覆盖成员 | 17 / 21 |',
          '| 阻塞项 | 3 |',
          '',
          '建议先处理未完成成员与回归验证问题。',
        ].join('\n'),
      },
      {
        key: confirmToolKey,
        title: '读取项目文档摘要',
        description: '确认是否使用正式项目文档补充回答上下文',
        duration_ms: 88,
        content: '命中 README、架构设计方案与 AI UI 改造说明。',
        detail_markdown: [
          '### 将要读取的文档',
          '',
          '- README',
          '- AI 助手架构设计方案',
          '- AI UI 改造说明',
          '',
          '读取后会补充页面定位、知识源和后端对接方式说明。',
        ].join('\n'),
        confirmation_title: '是否继续使用“项目文档摘要”工具？',
        confirmation_description:
          '使用后会把正式文档中的页面定位和接入说明补进回答；跳过则只基于任务与进度数据继续输出。',
      },
      {
        key: `${seed}_progress_snapshot`,
        title: '加载个人进度分析',
        description: '读取近 7 天刷题数量、排名趋势和建议动作',
        duration_ms: 132,
        content: '命中近 7 天趋势：新增 12 题，排名提升 2 位，中等题仍是突破重点。',
        detail_markdown: [
          '### 近 7 天进度',
          '',
          '- 新增题目：12',
          '- 排名变化：+2',
          '- 重点方向：中等题',
          '',
          '建议未来三天集中做 2 到 3 道中等题并补齐错因总结。',
        ].join('\n'),
      },
      {
        key: `${seed}_compose_response`,
        title: '合成最终结果',
        description: '整理主回答、处理记录和结果卡片',
        duration_ms: 44,
        content: '已整理 markdown 主回答、处理记录与结果卡片。',
        detail_markdown: [
          '### 输出合成',
          '',
          '- 会话区：markdown 回答',
          '- 附加信息：本轮范围与处理记录',
          '- 结果区：摘要卡片',
        ].join('\n'),
      },
    ],
  }
}

const buildCompletedAssistantMessage = (
  conversationId: string,
  prompt: string,
  createdAt: string,
  contextUserName: string,
  contextOrgName: string,
): AssistantMessage => {
  const scenario = buildScenario(
    prompt,
    contextUserName,
    contextOrgName,
    conversationId,
  )
  const fullContent = `${scenario.intro_markdown}${scenario.confirm_markdown}`

  return createMessage(
    `${conversationId}_assistant`,
    conversationId,
    'assistant',
    fullContent,
    createdAt,
    {
      cards: buildStructuredCards(conversationId, prompt, 'confirm'),
      trace_items: scenario.tools.map((tool, index) =>
        createTraceItem(tool, {
          status: index === 2 ? 'success' : 'success',
        }),
      ),
      scope: scenario.scope,
    },
  )
}

const initialConversations: AssistantConversation[] = [
  createConversation(
    'conv_demo_overview',
    '任务汇报与项目摘要',
    '展示 markdown 回答、轨迹与结构化卡片的完整联动。',
    dayjs().subtract(12, 'minute').toISOString(),
    '今天',
  ),
  createConversation(
    'conv_demo_progress',
    '个人进度建议',
    '展示时间留存、聊天历史和右侧执行轨迹。',
    dayjs().subtract(2, 'day').toISOString(),
    '最近',
  ),
  createConversation(
    'conv_demo_docs',
    '文档工具确认',
    '展示等待确认、继续使用和跳过工具后的两段式结果。',
    dayjs().subtract(8, 'day').toISOString(),
    '更早',
  ),
]

const initialMessageMap: Record<string, AssistantMessage[]> = {
  conv_demo_overview: [
    createMessage(
      'conv_demo_overview_user',
      'conv_demo_overview',
      'user',
      '帮我整理一版任务汇报并说明助手页面定位。',
      dayjs().subtract(13, 'minute').toISOString(),
    ),
    buildCompletedAssistantMessage(
      'conv_demo_overview',
      '帮我整理一版任务汇报并说明助手页面定位。',
      dayjs().subtract(12, 'minute').toISOString(),
      '当前用户',
      '算法一组',
    ),
  ],
  conv_demo_progress: [
    createMessage(
      'conv_demo_progress_user',
      'conv_demo_progress',
      'user',
      '分析一下我最近的刷题节奏和下一步建议。',
      dayjs().subtract(2, 'day').subtract(1, 'minute').toISOString(),
    ),
    buildCompletedAssistantMessage(
      'conv_demo_progress',
      '分析一下我最近的刷题节奏和下一步建议。',
      dayjs().subtract(2, 'day').toISOString(),
      '当前用户',
      '算法一组',
    ),
  ],
  conv_demo_docs: [
    createMessage(
      'conv_demo_docs_user',
      'conv_demo_docs',
      'user',
      '给我看一下文档工具确认后的整体效果。',
      dayjs().subtract(8, 'day').subtract(1, 'minute').toISOString(),
    ),
    buildCompletedAssistantMessage(
      'conv_demo_docs',
      '给我看一下文档工具确认后的整体效果。',
      dayjs().subtract(8, 'day').toISOString(),
      '当前用户',
      '算法一组',
    ),
  ],
}

const mockDb = {
  conversations: structuredClone(initialConversations),
  messagesByConversation: structuredClone(initialMessageMap),
}

const serializeEvent = (event: MockStreamEvent) =>
  `event:${event.event}\ndata:${JSON.stringify(event.data)}\n\n`

const createStreamFromEvents = (events: MockStreamEvent[]): MockAssistantStreamResult => {
  const encoder = new TextEncoder()
  const abortController = new AbortController()

  const readableStream = new ReadableStream<Uint8Array>({
    start(controller) {
      let eventIndex = 0

      const pushNext = () => {
        if (abortController.signal.aborted) {
          controller.close()
          return
        }

        const currentEvent = events[eventIndex]
        if (!currentEvent) {
          controller.close()
          return
        }

        controller.enqueue(encoder.encode(serializeEvent(currentEvent)))
        eventIndex += 1
        setTimeout(pushNext, currentEvent.delay ?? 45)
      }

      pushNext()
    },
    cancel() {
      abortController.abort()
    },
  })

  return {
    abortController,
    stream: XStream({
      readableStream,
    }),
  }
}

const buildInitialStreamEvents = (scenario: MockAssistantScenario): MockStreamEvent[] => {
  const { scopeTool, taskTool, docTool } = getScenarioTools(scenario)
  const events: MockStreamEvent[] = [
    {
      event: 'conversation_started',
      data: { title: scenario.title },
      delay: 15,
    },
  ]

  splitMarkdownChunks(scenario.intro_markdown).forEach((token, index) => {
    events.push({
      event: 'assistant_token',
      data: { token },
      delay: index === 0 ? 20 : 18,
    })
  })

  events.push(
    {
      event: 'structured_block',
      data: { scope: scenario.scope },
      delay: 30,
    },
    {
      event: 'tool_call_started',
      data: {
        key: scopeTool.key,
        title: scopeTool.title,
        description: scopeTool.description,
      },
      delay: 35,
    },
    {
      event: 'tool_call_finished',
      data: {
        key: scopeTool.key,
        description: scopeTool.description,
        duration_ms: scopeTool.duration_ms,
        status: 'success',
        content: scopeTool.content,
        detail_markdown: scopeTool.detail_markdown,
      },
      delay: 45,
    },
    {
      event: 'tool_call_started',
      data: {
        key: taskTool.key,
        title: taskTool.title,
        description: taskTool.description,
      },
      delay: 40,
    },
    {
      event: 'tool_call_finished',
      data: {
        key: taskTool.key,
        description: taskTool.description,
        duration_ms: taskTool.duration_ms,
        status: 'success',
        content: taskTool.content,
        detail_markdown: taskTool.detail_markdown,
      },
      delay: 45,
    },
    {
      event: 'tool_call_waiting_confirmation',
      data: {
        key: docTool.key,
        title: docTool.title,
        description: docTool.description,
        detail_markdown: docTool.detail_markdown,
        confirmation_title: docTool.confirmation_title || '是否继续使用该工具？',
        confirmation_description:
          docTool.confirmation_description || '请确认是否继续执行该工具。',
        actions: createTraceActions(docTool.key),
      },
      delay: 35,
    },
  )

  return events
}

const buildDecisionStreamEvents = (
  session: MockAssistantSession,
  decision: AssistantToolDecisionRequest['decision'],
): MockStreamEvent[] => {
  const { docTool, progressTool, composeTool } = getScenarioTools(
    session.scenario,
  )
  const cards = buildStructuredCards(
    session.request.conversation_id,
    session.request.content,
    decision,
  )
  const followUpMarkdown =
    decision === 'confirm'
      ? session.scenario.confirm_markdown
      : session.scenario.skip_markdown
  const fullContent = `${session.scenario.intro_markdown}${followUpMarkdown}`

  const events: MockStreamEvent[] = [
    {
      event: 'tool_call_confirmation_result',
      data: {
        key: docTool.key,
        decision,
        status: decision === 'confirm' ? 'pending' : 'skipped',
        description:
          decision === 'confirm'
            ? '已确认继续读取项目文档摘要，准备补充文档上下文。'
            : '已跳过项目文档摘要工具，继续基于已有数据完成回答。',
        detail_markdown:
          decision === 'confirm'
            ? docTool.detail_markdown
            : '### 已跳过\n\n本轮不再读取项目文档摘要，后续回答仅基于任务与进度数据。',
      },
      delay: 18,
    },
  ]

  if (decision === 'confirm') {
    events.push({
      event: 'tool_call_finished',
      data: {
        key: docTool.key,
        description: '正式文档摘要已读取完成。',
        duration_ms: docTool.duration_ms,
        status: 'success',
        content: docTool.content,
        detail_markdown: docTool.detail_markdown,
      },
      delay: 42,
    })
  }

  events.push(
    {
      event: 'tool_call_started',
      data: {
        key: progressTool.key,
        title: progressTool.title,
        description: progressTool.description,
      },
      delay: 38,
    },
    {
      event: 'tool_call_finished',
      data: {
        key: progressTool.key,
        description: progressTool.description,
        duration_ms: progressTool.duration_ms,
        status: 'success',
        content: progressTool.content,
        detail_markdown: progressTool.detail_markdown,
      },
      delay: 46,
    },
    {
      event: 'tool_call_started',
      data: {
        key: composeTool.key,
        title: composeTool.title,
        description: composeTool.description,
      },
      delay: 36,
    },
    {
      event: 'tool_call_finished',
      data: {
        key: composeTool.key,
        description: composeTool.description,
        duration_ms: composeTool.duration_ms,
        status: 'success',
        content: composeTool.content,
        detail_markdown: composeTool.detail_markdown,
      },
      delay: 42,
    },
  )

  cards.forEach((card, index) => {
    events.push({
      event: 'structured_block',
      data: { card },
      delay: index === 0 ? 36 : 28,
    })
  })

  splitMarkdownChunks(followUpMarkdown).forEach((token, index) => {
    events.push({
      event: 'assistant_token',
      data: { token },
      delay: index === 0 ? 18 : 15,
    })
  })

  events.push(
    {
      event: 'message_completed',
      data: { content: fullContent },
      delay: 18,
    },
    {
      event: 'done',
      data: {},
      delay: 0,
    },
  )

  return events
}

const updateConversationMeta = (
  conversationId: string,
  preview: string,
  title: string,
) => {
  const now = new Date().toISOString()
  const target = mockDb.conversations.find((item) => item.id === conversationId)

  if (!target) return

  target.preview = preview
  target.title = title
  target.updated_at = now
  target.timestamp = dayjs(now).valueOf()
  target.group = '今天'
}

const persistInitialSnapshot = (
  request: StreamAssistantMessageRequest,
  scenario: MockAssistantScenario,
) => {
  const now = new Date().toISOString()
  const userMessageId = `${request.conversation_id}_user_${Date.now()}`
  const assistantMessageId = `${request.conversation_id}_assistant_${Date.now()}`
  const { scopeTool, taskTool, docTool } = getScenarioTools(scenario)

  updateConversationMeta(request.conversation_id, request.content, scenario.title)

  if (!mockDb.messagesByConversation[request.conversation_id]) {
    mockDb.messagesByConversation[request.conversation_id] = []
  }

  mockDb.messagesByConversation[request.conversation_id]?.push(
    createMessage(
      userMessageId,
      request.conversation_id,
      'user',
      request.content,
      now,
    ),
    createMessage(
      assistantMessageId,
      request.conversation_id,
      'assistant',
      scenario.intro_markdown,
      now,
      {
        status: 'idle',
        scope: scenario.scope,
        trace_items: [
          createTraceItem(scopeTool),
          createTraceItem(taskTool),
          createTraceItem(docTool, {
            status: 'awaiting_confirmation',
            requires_confirmation: true,
            confirmation_title: docTool.confirmation_title,
            confirmation_description: docTool.confirmation_description,
            actions: createTraceActions(docTool.key),
            duration_ms: undefined,
            content: undefined,
          }),
        ],
      },
    ),
  )

  mockSessions.set(request.conversation_id, {
    scenario,
    assistant_message_id: assistantMessageId,
    request,
  })
}

const persistDecisionSnapshot = (
  request: AssistantToolDecisionRequest,
  session: MockAssistantSession,
) => {
  const assistantMessages = mockDb.messagesByConversation[request.conversation_id]
  if (!assistantMessages) return

  const targetMessage = assistantMessages.find(
    (item) => item.id === session.assistant_message_id,
  )
  if (!targetMessage) return

  const fullContent =
    request.decision === 'confirm'
      ? `${session.scenario.intro_markdown}${session.scenario.confirm_markdown}`
      : `${session.scenario.intro_markdown}${session.scenario.skip_markdown}`

  targetMessage.content = fullContent
  targetMessage.status = 'success'
  targetMessage.cards = buildStructuredCards(
    request.conversation_id,
    session.request.content,
    request.decision,
  )
  targetMessage.trace_items = session.scenario.tools.map((tool) => {
    if (tool.key === request.tool_key && request.decision === 'skip') {
      return createTraceItem(tool, {
        status: 'skipped',
        duration_ms: undefined,
        content: '用户已跳过该工具，后续回答未读取项目文档摘要。',
      })
    }

    return createTraceItem(tool)
  })
  targetMessage.scope = session.scenario.scope
}

const createErrorStream = (message: string) =>
  createStreamFromEvents([
    {
      event: 'error',
      data: { message },
      delay: 0,
    },
    {
      event: 'done',
      data: {},
      delay: 0,
    },
  ])

export async function listMockConversations(): Promise<AssistantConversation[]> {
  return structuredClone(mockDb.conversations).sort(
    (left, right) => right.timestamp - left.timestamp,
  )
}

export async function createMockConversation(
  title = '新建会话',
): Promise<AssistantConversation> {
  const conversation = createConversation(
    `conv_${Date.now()}`,
    title,
    '开始一轮新的 AI 对话。',
    new Date().toISOString(),
    '今天',
  )
  mockDb.conversations.unshift(conversation)
  mockDb.messagesByConversation[conversation.id] = []
  return structuredClone(conversation)
}

export async function getMockConversationMessages(
  conversationId: string,
): Promise<AssistantMessage[]> {
  return structuredClone(mockDb.messagesByConversation[conversationId] || [])
}

export async function deleteMockConversation(
  conversationId: string,
): Promise<void> {
  mockDb.conversations = mockDb.conversations.filter(
    (item) => item.id !== conversationId,
  )
  delete mockDb.messagesByConversation[conversationId]
  mockSessions.delete(conversationId)
}

export async function openMockAssistantStream(
  request: StreamAssistantMessageRequest,
): Promise<MockAssistantStreamResult> {
  const scenario = buildScenario(
    request.content,
    request.context_user_name,
    request.context_org_name,
    request.conversation_id || `stream_${Date.now()}`,
  )

  persistInitialSnapshot(request, scenario)
  return createStreamFromEvents(buildInitialStreamEvents(scenario))
}

export async function openMockAssistantToolDecisionStream(
  request: AssistantToolDecisionRequest,
): Promise<MockAssistantStreamResult> {
  const session = mockSessions.get(request.conversation_id)
  const { docTool } = session ? getScenarioTools(session.scenario) : { docTool: undefined }

  if (!session || !docTool || docTool.key !== request.tool_key) {
    return createErrorStream('当前没有可继续的工具确认流程。')
  }

  persistDecisionSnapshot(request, session)
  mockSessions.delete(request.conversation_id)
  return createStreamFromEvents(buildDecisionStreamEvents(session, request.decision))
}

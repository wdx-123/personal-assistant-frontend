# 公共组件使用文档

## 组件列表

- [Button](#button-按钮) - 按钮
- [Badge](#badge-标签) - 标签
- [Input](#input-输入框) - 输入框
- [Modal](#modal-弹窗) - 弹窗
- [Loading](#loading-加载) - 加载
- [Message](#message-消息提示) - 消息提示

---

## Button 按钮

### 基础用法

```vue
<script setup lang="ts">
import { Button } from '@/components/common'

const handleClick = () => {
  console.log('按钮点击')
}
</script>

<template>
  <Button type="primary" @click="handleClick">主要按钮</Button>
  <Button type="default">默认按钮</Button>
  <Button type="success">成功按钮</Button>
  <Button type="warning">警告按钮</Button>
  <Button type="danger">危险按钮</Button>
</template>
```

### 尺寸

```vue
<template>
  <Button size="small">小按钮</Button>
  <Button size="medium">中按钮</Button>
  <Button size="large">大按钮</Button>
</template>
```

### 状态

```vue
<template>
  <Button disabled>禁用按钮</Button>
  <Button loading>加载中</Button>
  <Button block>块级按钮</Button>
  <Button ghost>幽灵按钮</Button>
</template>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| type | 按钮类型 | `'primary' \| 'default' \| 'danger' \| 'success' \| 'warning'` | `'default'` |
| size | 按钮尺寸 | `'large' \| 'medium' \| 'small'` | `'medium'` |
| disabled | 是否禁用 | `boolean` | `false` |
| loading | 是否加载中 | `boolean` | `false` |
| block | 是否为块级按钮 | `boolean` | `false` |
| ghost | 是否为幽灵按钮 | `boolean` | `false` |

---

## Badge 标签

### 基础用法

```vue
<script setup lang="ts">
import { Badge, StatusBadge, MenuTypeBadge } from '@/components/common'
</script>

<template>
  <Badge tone="primary">自定义标签</Badge>
  <StatusBadge status="enabled" />
  <StatusBadge status="disabled" />
  <MenuTypeBadge type="directory" />
  <MenuTypeBadge type="menu" />
  <MenuTypeBadge type="button" />
</template>
```

### 变体与尺寸

```vue
<template>
  <Badge tone="success" variant="soft" size="small">soft</Badge>
  <Badge tone="success" variant="outline" size="medium">outline</Badge>
  <Badge tone="danger" variant="solid">solid</Badge>
</template>
```

### Props（Badge）

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| tone | 色彩语义 | `'primary' \| 'success' \| 'danger' \| 'neutral' \| 'warning'` | `'neutral'` |
| variant | 视觉风格 | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| size | 尺寸 | `'xsmall' \| 'small' \| 'medium'` | `'small'` |
| showDot | 是否显示圆点 | `boolean` | `true` |
| dotPulse | 圆点是否脉冲 | `boolean` | `false` |

### Props（StatusBadge）

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| status | 状态值 | `'enabled' \| 'disabled' \| string` | - |
| enabledText | 启用文案 | `string` | `'启用'` |
| disabledText | 禁用文案 | `string` | `'禁用'` |
| variant | 视觉风格 | `'soft' \| 'solid' \| 'outline'` | `'soft'` |
| size | 尺寸 | `'xsmall' \| 'small' \| 'medium'` | `'small'` |
| showDot | 是否显示圆点 | `boolean` | `true` |

### Props（MenuTypeBadge）

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| type | 菜单类型 | `'directory' \| 'menu' \| 'button' \| string` | - |
| directoryText | 目录文案 | `string` | `'目录'` |
| menuText | 菜单文案 | `string` | `'菜单'` |
| buttonText | 按钮文案 | `string` | `'按钮'` |
| variant | 视觉风格 | `'soft' \| 'solid' \| 'outline'` | `按类型自动：目录='soft'，菜单='outline'，按钮='outline'` |
| size | 尺寸 | `'xsmall' \| 'small' \| 'medium'` | `按类型自动：目录='medium'，菜单='small'，按钮='xsmall'` |
| showDot | 是否显示圆点 | `boolean` | `false` |

### 表格操作区推荐（控制台）

```vue
<template>
  <td class="table-action-cell">
    <button class="table-action-btn table-action-btn--neutral">查看</button>
    <button class="table-action-btn table-action-btn--primary">编辑</button>
    <button class="table-action-btn table-action-btn--danger">删除</button>
  </td>
</template>
```

- `table-action-cell`：统一操作区布局（右对齐、间距稳定）
- `table-action-btn`：统一文字按钮基类（不位移，仅颜色/背景微反馈）
- `table-action-btn--primary|neutral|danger|success`：语义色

---

## Input 输入框

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/common'

const value = ref('')
</script>

<template>
  <Input v-model="value" placeholder="请输入内容" />
</template>
```

### 功能示例

```vue
<template>
  <!-- 带清除按钮 -->
  <Input v-model="value" clearable placeholder="可清除" />

  <!-- 密码输入框 -->
  <Input v-model="password" type="password" show-password placeholder="密码" />

  <!-- 带图标 -->
  <Input v-model="value" prefix-icon="🔍" placeholder="搜索" />

  <!-- 错误状态 -->
  <Input v-model="value" error error-text="输入有误" />
</template>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| type | 输入框类型 | `'text' \| 'password' \| 'email' \| 'number' \| 'tel'` | `'text'` |
| size | 输入框尺寸 | `'large' \| 'medium' \| 'small'` | `'medium'` |
| disabled | 是否禁用 | `boolean` | `false` |
| placeholder | 占位文本 | `string` | `''` |
| clearable | 是否显示清除按钮 | `boolean` | `false` |
| showPassword | 是否显示密码切换按钮 | `boolean` | `false` |
| error | 是否错误状态 | `boolean` | `false` |
| errorText | 错误提示文本 | `string` | `''` |

---

## Modal 弹窗

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Modal } from '@/components/common'

const visible = ref(false)
const handleOk = () => {
  console.log('确定')
  visible.value = false
}
</script>

<template>
  <Button @click="visible = true">打开弹窗</Button>

  <Modal v-model:visible="visible" title="提示" @ok="handleOk">
    <p>这是弹窗内容</p>
  </Modal>
</template>
```

### 尺寸

```vue
<template>
  <Modal v-model:visible="visible" size="small">小弹窗</Modal>
  <Modal v-model:visible="visible" size="medium">中弹窗</Modal>
  <Modal v-model:visible="visible" size="large">大弹窗</Modal>
</template>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| visible | 是否显示弹窗 | `boolean` | `false` |
| title | 弹窗标题 | `string` | `''` |
| size | 弹窗尺寸 | `'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` |
| closable | 是否显示关闭按钮 | `boolean` | `true` |
| maskClosable | 点击遮罩是否关闭 | `boolean` | `true` |
| okText | 确定按钮文字 | `string` | `'确定'` |
| cancelText | 取消按钮文字 | `string` | `'取消'` |
| okLoading | 确定按钮加载中 | `boolean` | `false` |

---

## Loading 加载

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@/components/common'

const loading = ref(true)
</script>

<template>
  <Loading :loading="loading" text="加载中..." />
</template>
```

### 类型

```vue
<template>
  <Loading type="spinner" />
  <Loading type="dots" />
  <Loading type="bars" />
</template>
```

### Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| loading | 是否显示 | `boolean` | `true` |
| type | 加载指示器类型 | `'spinner' \| 'dots' \| 'bars'` | `'spinner'` |
| size | 尺寸 | `'large' \| 'medium' \| 'small'` | `'medium'` |
| text | 加载文本 | `string` | `''` |
| fullscreen | 是否全屏 | `boolean` | `false` |

---

## Message 消息提示

### 基础用法

```vue
<script setup lang="ts">
import { message } from '@/components/common'

const showSuccess = () => {
  message.success('操作成功')
}

const showError = () => {
  message.error('操作失败')
}

const showWarning = () => {
  message.warning('警告信息')
}

const showInfo = () => {
  message.info('提示信息')
}
</script>

<template>
  <Button @click="showSuccess">成功</Button>
  <Button @click="showError">错误</Button>
  <Button @click="showWarning">警告</Button>
  <Button @click="showInfo">信息</Button>
</template>
```

### 自定义时长

```typescript
// 显示 5 秒
message.success('操作成功', 5000)

// 不自动关闭
message.error('错误信息', 0)
```

### 回调函数

```typescript
message.success('操作成功', 3000, () => {
  console.log('消息关闭')
})
```

### API

| 方法 | 说明 | 参数 |
|------|------|------|
| success | 成功消息 | `content, duration?, onClose?` |
| error | 错误消息 | `content, duration?, onClose?` |
| warning | 警告消息 | `content, duration?, onClose?` |
| info | 信息消息 | `content, duration?, onClose?` |

---

## 统一导入

```typescript
// 可以从统一入口导入所有组件
import { Button, Input, Modal, Loading, message } from '@/components/common'
```

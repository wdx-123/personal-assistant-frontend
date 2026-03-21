<template>
  <div class="page-container">
    <a-card :bordered="false" class="search-card" :body-style="{ padding: '24px 24px 0 24px' }">
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="菜单名称" name="name">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入菜单名称"
            allow-clear
            @pressEnter="search"
          >
            <template #prefix>
              <SearchOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button
              type="primary"
              @click="search"
              class="btn-search"
            >
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button
              @click="resetSearch"
              class="btn-reset"
            >
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" class="content-card">
      <div class="toolbar">
        <a-space>
          <a-button
            v-permission="['permission:menu:add', 'permission:menu:create']"
            type="primary"
            @click="openEditModal()"
          >
            <template #icon><PlusOutlined /></template>
            新增菜单
          </a-button>
          <a-button
            v-permission="['permission:menu:batch_delete', 'permission:menu:delete_batch', 'permission:menu:delete']"
            danger
            :disabled="!hasSelected"
            @click="batchDelete"
          >
            <template #icon><DeleteOutlined /></template>
            批量删除
          </a-button>
        </a-space>
        <a-space>
          <a-tooltip title="刷新">
            <a-button type="text" shape="circle" @click="refresh">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </div>

      <a-table
        :columns="columns as any"
        :data-source="displayRows"
        :row-selection="{ selectedRowKeys: selectedIds, onChange: onSelectChange }"
        row-key="id"
        :loading="loading"
        :pagination="false"
        :locale="tableLocale"
        size="small"
        childrenColumnName="children"
        :indent-size="30"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-tooltip placement="topLeft" :title="record.name">
              <span>{{ record.name }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.type === 'directory' ? 'orange' : (record.type === 'menu' ? 'blue' : 'cyan')">
              {{ record.type === 'directory' ? '目录' : (record.type === 'menu' ? '菜单' : '按钮') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'enabled' ? 'success' : 'error'">
              {{ record.status === 'enabled' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'icon'">
            <a-tooltip placement="topLeft" :title="record.icon">
              <span v-if="isImageUrl(record.icon)" class="icon-cell">
                <img :src="record.icon" alt="" class="icon-image" />
              </span>
              <span v-else class="text-ellipsis">{{ record.icon || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'permission'">
            <a-tooltip placement="topLeft" :title="record.permission">
              <span>{{ record.permission }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'componentPath'">
            <a-tooltip placement="topLeft" :title="record.componentPath">
              <span>{{ record.componentPath }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-buttons">
              <a-button
                v-permission="['permission:menu:edit', 'permission:menu:update']"
                type="primary"
                size="small"
                class="btn-edit"
                @click="openEditModal(record)"
              >
                编辑
              </a-button>
              <a-popconfirm
                title="确认删除该菜单项吗？"
                @confirm="handleDelete(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button
                  v-permission="['permission:menu:delete']"
                  type="primary"
                  danger
                  size="small"
                  class="btn-delete"
                >
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑/新增 模态框 -->
    <a-modal
      v-model:open="isEditModalOpen"
      :title="modalType === 'add' ? '新增菜单管理' : '编辑菜单管理'"
      width="560px"
      :maskClosable="false"
      :footer="null"
      :style="{ top: '12px' }"
      :bodyStyle="{ maxHeight: '62vh', overflowY: 'auto', padding: '12px 14px 6px' }"
      wrap-class-name="menu-edit-modal-wrap"
    >
      <a-form :model="editingForm" layout="horizontal" class="menu-edit-form">
        <a-form-item v-if="editingForm.type !== 'directory'" label="父级菜单">
          <a-tree-select
            v-model:value="selectedParentId"
            :tree-data="tree"
            :fieldNames="{ children: 'children', label: 'name', value: 'id' }"
            placeholder="请选择父级菜单"
            allow-clear
            tree-default-expand-all
          />
        </a-form-item>

        <a-form-item label="菜单名称" required>
          <a-input v-model:value="editingForm.name" placeholder="请输入" />
        </a-form-item>

        <a-form-item label="菜单类型" required>
          <a-radio-group v-model:value="editingForm.type" :disabled="modalType === 'edit'">
            <a-radio value="directory">目录</a-radio>
            <a-radio value="menu">菜单</a-radio>
            <a-radio value="button">按钮</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item v-if="editingForm.type !== 'button'" label="路由名称">
          <a-input
            v-model:value="editingForm.routeName"
            placeholder="请输入"
          />
        </a-form-item>

        <a-form-item v-if="editingForm.type !== 'button'" label="路由路径">
          <a-input
            v-model:value="editingForm.routePath"
            placeholder="请输入"
          />
        </a-form-item>

        <a-form-item v-if="editingForm.type !== 'button'" label="图标">
          <a-input
            v-model:value="editingForm.icon"
            placeholder="请输入"
          />
        </a-form-item>

        <a-form-item v-if="editingForm.type === 'menu'" label="组件路径" :required="editingForm.type === 'menu'">
          <a-input
            v-model:value="editingForm.componentPath"
            placeholder="请输入"
          />
        </a-form-item>

        <a-form-item v-if="editingForm.type === 'button'" label="权限标识" :required="editingForm.type === 'button'">
          <a-input
            v-model:value="editingForm.permission"
            placeholder="请输入"
          />
        </a-form-item>

        <a-form-item label="状态" required>
          <a-select v-model:value="editingForm.status" placeholder="请选择状态">
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">禁用</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="排序">
          <a-input-number v-model:value="editingForm.sort" :min="0" />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea v-model:value="editingForm.description" placeholder="请输入" :rows="3" />
        </a-form-item>
      </a-form>

      <div class="menu-modal-footer">
        <a-button @click="isEditModalOpen = false">取消</a-button>
        <a-button
          v-permission="
            modalType === 'add'
              ? ['permission:menu:add', 'permission:menu:create']
              : ['permission:menu:edit', 'permission:menu:update']
          "
          type="primary"
          :loading="modalLoading"
          @click="saveMenu"
        >
          {{ modalType === 'add' ? '新增' : '保存' }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  DeleteOutlined
} from '@ant-design/icons-vue'
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth'
import { isPermissionDenied } from '@/utils/request'

const searchForm = reactive({
  name: '',
  status: undefined as string | undefined
})

const columns = [
  { title: '菜单名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80, align: 'center' },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 100, align: 'center', ellipsis: true },
  { title: '路由/权限标识', dataIndex: 'permission', key: 'permission', ellipsis: true },
  { title: '组件路径', dataIndex: 'componentPath', key: 'componentPath', ellipsis: true },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80, align: 'center' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' },
  { title: '操作', key: 'actions', width: 180, align: 'center', fixed: 'right' as const }
]

type TableKey = string | number
const tree = ref<any[]>([])
const loading = ref(false)
const noPermission = ref(false)
const authStore = useAuthStore()
const tableLocale = computed(() => ({ emptyText: noPermission.value ? '你没有权限访问' : '暂无数据' }))
const selectedIds = ref<TableKey[]>([])
const hasSelected = computed(() => selectedIds.value.length > 0)

const fetchMenus = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      page_size: 2000,
      keyword: searchForm.name || undefined,
      status: searchForm.status === 'enabled' ? 1 : (searchForm.status === 'disabled' ? 0 : undefined)
    }
    const data = await getMenuList(params, { skipSuccTip: true, skipErrTip: true })
    if (data) {
      const list = data.list || []
      const hasChildren = list.some((item: any) => Array.isArray(item.children) && item.children.length > 0)
      tree.value = hasChildren ? list.map(mapToNode) : buildTreeFromList(list)
      noPermission.value = false
    }
  } catch (error) {
    if (isPermissionDenied(error)) {
      noPermission.value = true
      tree.value = []
    } else {
      console.error('Failed to fetch menus:', error)
    }
  } finally {
    loading.value = false
  }
}

const isImageUrl = (value?: string) => {
  if (!value) return false
  return /^https?:\/\//.test(value) || /^data:image\//.test(value)
}

const mapToNode = (item: any): any => {
  const typeStr = item.type === 1 ? 'directory' : (item.type === 2 ? 'menu' : 'button')
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    type: typeStr,
    permission: typeStr === 'button' ? item.code : (item.route_path || item.code),
    routeName: item.route_name,
    routePath: item.route_path,
    routeParam: item.route_param,
    componentPath: item.component_path,
    status: item.status === 1 ? 'enabled' : 'disabled',
    sort: item.sort,
    icon: item.icon,
    description: item.desc,
    children: item.children && item.children.length > 0 ? item.children.map(mapToNode) : undefined
  }
}

const buildTreeFromList = (list: any[]) => {
  const nodeMap = new Map<number, any>()
  const roots: any[] = []
  list.forEach((item: any) => {
    nodeMap.set(item.id, { ...mapToNode(item), children: [] })
  })
  list.forEach((item: any) => {
    const parentId = item.parent_id
    const node = nodeMap.get(item.id)
    if (parentId && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const cleanChildren = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length) {
        cleanChildren(node.children)
      } else {
        delete node.children
      }
    })
  }
  cleanChildren(roots)
  return roots
}

const displayRows = computed(() => tree.value)

const search = () => {
  fetchMenus()
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = undefined
  fetchMenus()
}

const refresh = async () => {
  selectedIds.value = []
  await fetchMenus()
  message.success('已刷新菜单数据')
}

const onSelectChange = (selectedRowKeys: TableKey[], _selectedRows: any[]) => {
  selectedIds.value = selectedRowKeys
}

const batchDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确认删除选中的 ${selectedIds.value.length} 个菜单项吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await Promise.all(selectedIds.value.map(id => deleteMenu(Number(id), { skipSuccTip: true })))
        message.success('批量删除成功')
        selectedIds.value = []
        fetchMenus()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await deleteMenu(row.id, { skipSuccTip: true })
    message.success('菜单项已删除')
    fetchMenus()
  } catch (error) {
    console.error(error)
  }
}

// Edit Modal
const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const modalLoading = ref(false)
const editingForm = reactive<any>({
  id: 0,
  name: '',
  code: '',
  type: 'menu',
  routeName: '',
  routePath: '',
  routeParam: '',
  componentPath: '',
  permission: '',
  icon: '',
  description: '',
  status: 'enabled',
  sort: 1
})
const selectedParentId = ref<number | undefined>(undefined)

const openEditModal = (row?: any) => {
  if (row) {
    modalType.value = 'edit'
    Object.assign(editingForm, {
      id: row.id,
      name: row.name || '',
      code: row.code || '',
      type: row.type || 'menu',
      routeName: row.routeName || '',
      routePath: row.routePath || '',
      routeParam: row.routeParam || '',
      componentPath: row.componentPath || '',
      permission: row.type === 'button' ? (row.code || row.permission || '') : (row.permission || ''),
      icon: row.icon || '',
      description: row.description || '',
      status: row.status || 'enabled',
      sort: row.sort ?? 1
    })
    // Find parent logic simplified
    selectedParentId.value = findParentId(row.id, tree.value)
  } else {
    modalType.value = 'add'
    Object.assign(editingForm, {
      id: 0,
      name: '',
      code: '',
      type: 'menu',
      routeName: '',
      routePath: '',
      routeParam: '',
      componentPath: '',
      permission: '',
      icon: '',
      description: '',
      status: 'enabled',
      sort: 1
    })
    selectedParentId.value = undefined
  }
  isEditModalOpen.value = true
}

const findParentId = (targetId: number, nodes: any[]): number | undefined => {
  for (const n of nodes) {
    if (n.children) {
      if (n.children.some((c: any) => c.id === targetId)) {
        return n.id
      }
      const found = findParentId(targetId, n.children)
      if (found) return found
    }
  }
  return undefined
}

const saveMenu = async () => {
  if (!editingForm.name) {
    message.warning('请填写菜单名称')
    return
  }
  if (editingForm.type === 'menu' && (!editingForm.routeName || !editingForm.routePath || !editingForm.componentPath)) {
    message.warning('菜单类型需填写路由名称、路由路径和组件路径')
    return
  }
  if (editingForm.type === 'directory' && (!editingForm.routeName || !editingForm.routePath)) {
    // Optional: enforce routeName/Path for directory if needed, but usually directories might just be containers.
    // However, user specifically asked to edit them, so we shouldn't block empty if they clear it, 
    // BUT the form inputs are now visible. 
    // If the user WANTS to edit them, we just let them.
    // The previous validation blocked directories from needing them, but maybe the issue was just the form visibility.
    // Actually, checking the form visibility above (v-if="editingForm.type !== 'button'") means directories SHOW them.
    // The previous code had :required="editingForm.type === 'menu'", so they were optional for directory.
    // So the validation logic below should also be loose for directories unless strict mode is required.
    // We will keep it optional for directory to be safe, or just not validate here.
  }
  if (editingForm.type === 'button' && !editingForm.permission) {
    message.warning('按钮类型需填写权限标识')
    return
  }

  modalLoading.value = true
  
  const isMenuType = editingForm.type === 'menu'
  const isButtonType = editingForm.type === 'button'
  const code = isButtonType
    ? String(editingForm.permission || '').trim()
    : String(
      editingForm.routePath ||
      editingForm.routeName ||
      editingForm.name ||
      editingForm.code ||
      ''
    ).trim()

  if (!code) {
    message.warning('无法生成菜单标识，请补充必要信息')
    modalLoading.value = false
    return
  }

  const payload = {
    parent_id: editingForm.type === 'directory' ? 0 : (selectedParentId.value || 0),
    name: editingForm.name,
    code,
    type: editingForm.type === 'directory' ? 1 : (editingForm.type === 'menu' ? 2 : 3),
    icon: isButtonType ? '' : editingForm.icon,
    route_name: (isMenuType || editingForm.type === 'directory') ? editingForm.routeName : '',
    route_path: (isMenuType || editingForm.type === 'directory') ? editingForm.routePath : '',
    route_param: isMenuType ? editingForm.routeParam : '',
    component_path: isMenuType ? editingForm.componentPath : '',
    status: editingForm.status === 'enabled' ? 1 : 0,
    sort: editingForm.sort || 0,
    desc: editingForm.description
  }

  try {
    if (modalType.value === 'add') {
      await createMenu(payload, { skipSuccTip: true })
      message.success('菜单新增成功')
    } else {
      await updateMenu(editingForm.id, payload, { skipSuccTip: true })
      message.success('菜单更新成功')
    }
    isEditModalOpen.value = false
    fetchMenus()
  } catch (error) {
    console.error(error)
  } finally {
    modalLoading.value = false
  }
}

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.search-card {
  margin-bottom: 24px;
}

.content-card {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

/* 确保表格容器占满剩余空间 */
.content-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 调整搜索表单样式 */
.search-form :deep(.ant-form-item) {
  margin-bottom: 24px; /* 统一底部间距 */
}

/* 搜索按钮颜色 - 接近截图中的蓝色 */
.btn-search {
  background-color: #1677ff;
  border-color: #1677ff;
}

.btn-search:hover {
  background-color: #4096ff;
  border-color: #4096ff;
}

/* 调整操作按钮样式 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

:deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn > span) {
  display: inline-flex;
  align-items: center;
}

:deep(.ant-btn .anticon) {
  margin-right: 4px;
}

.btn-edit,
.btn-delete {
  border-radius: 4px;
  padding: 0 12px;
  height: 28px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 覆盖 Ant Design 默认的按钮阴影，使其看起来更扁平，接近截图风格 */
.btn-edit {
  background-color: #3b82f6; /* 接近截图的蓝色 */
  border-color: #3b82f6;
  box-shadow: none;
}

.btn-edit:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-delete {
  background-color: #ef4444; /* 接近截图的红色 */
  border-color: #ef4444;
  box-shadow: none;
}

.btn-delete:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* 强制单行显示 */
.text-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.icon-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.icon-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

:deep(.menu-edit-modal-wrap .ant-modal-content) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.menu-edit-modal-wrap .ant-modal-header) {
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.menu-edit-modal-wrap .ant-modal-title) {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

:deep(.menu-edit-modal-wrap .ant-modal-close) {
  width: 34px;
  height: 34px;
}

:deep(.menu-edit-modal-wrap .ant-modal-body) {
  padding: 12px 14px 6px;
}

.menu-edit-form :deep(.ant-form-item) {
  margin-bottom: 8px;
}

.menu-edit-form :deep(.ant-form-item-label) {
  width: 84px;
  text-align: right;
  padding-right: 6px;
}

.menu-edit-form :deep(.ant-form-item-label > label) {
  height: 32px;
  font-size: 12px;
  font-weight: 600;
}

.menu-edit-form :deep(.ant-form-item-control-input) {
  min-height: 32px;
}

.menu-edit-form :deep(.ant-form-item-control) {
  max-width: 360px;
}

.menu-edit-form :deep(.ant-input),
.menu-edit-form :deep(.ant-input-number),
.menu-edit-form :deep(.ant-select-selector),
.menu-edit-form :deep(.ant-select-selection-search-input),
.menu-edit-form :deep(.ant-tree-select .ant-select-selector) {
  height: 32px;
  border-radius: 6px;
  font-size: 12px;
}

.menu-edit-form :deep(.ant-input),
.menu-edit-form :deep(.ant-input-number-input),
.menu-edit-form :deep(.ant-select-selection-item),
.menu-edit-form :deep(.ant-select-selection-placeholder),
.menu-edit-form :deep(.ant-tree-select .ant-select-selection-item),
.menu-edit-form :deep(.ant-tree-select .ant-select-selection-placeholder) {
  line-height: 30px;
}

.menu-edit-form :deep(.ant-radio-wrapper) {
  font-size: 12px;
  margin-right: 10px;
}

.menu-edit-form :deep(.ant-radio) {
  transform: scale(1);
}

.menu-edit-form :deep(.ant-input-number) {
  width: 100%;
}

.menu-edit-form :deep(.ant-input-textarea textarea.ant-input) {
  min-height: 64px;
  padding-top: 6px;
  line-height: 1.5;
}

.menu-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.menu-modal-footer :deep(.ant-btn) {
  height: 30px;
  min-width: 68px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* 优化表格紧凑度 */
:deep(.ant-table-small) > .ant-table-content > .ant-table-body > table > tbody > tr > td {
  padding: 8px 8px; /* 减小内边距 */
}
</style>

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
            <a-button type="primary" @click="search" class="btn-search">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="resetSearch" class="btn-reset">
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
          <a-button type="primary" @click="openEditModal()">
            <template #icon><PlusOutlined /></template>
            新增菜单
          </a-button>
          <a-button
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
        :columns="columns"
        :data-source="displayRows"
        :row-selection="{ selectedRowKeys: selectedIds, onChange: onSelectChange }"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
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
              <span class="text-ellipsis">{{ record.icon || '-' }}</span>
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
              <a-button type="primary" size="small" class="btn-edit" @click="openEditModal(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确认删除该菜单项吗？"
                @confirm="handleDelete(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="primary" danger size="small" class="btn-delete">
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
      :title="modalType === 'add' ? '新增菜单' : '编辑菜单'"
      @ok="saveMenu"
      :confirmLoading="modalLoading"
      width="700px"
      :maskClosable="false"
    >
      <a-form :model="editingForm" layout="vertical" :label-col="{ style: { width: '100px' } }">
        <a-row :gutter="16">
          <a-col :span="24" v-if="editingForm.type !== 'directory'">
            <a-form-item label="父级菜单">
              <a-tree-select
                v-model:value="selectedParentId"
                :tree-data="tree"
                :fieldNames="{ children: 'children', label: 'name', value: 'id' }"
                placeholder="请选择父级菜单"
                allow-clear
                tree-default-expand-all
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item label="菜单名称" required>
              <a-input v-model:value="editingForm.name" placeholder="请输入菜单名称" />
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item label="菜单类型" required>
              <a-radio-group v-model:value="editingForm.type" :disabled="modalType === 'edit'">
                <a-radio value="directory">目录</a-radio>
                <a-radio value="menu">菜单</a-radio>
                <a-radio value="button">按钮</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>

          <template v-if="editingForm.type === 'directory' || editingForm.type === 'menu'">
            <a-col :span="12">
              <a-form-item :label="editingForm.type === 'directory' ? '目录标识' : '菜单标识'" required>
                <a-input v-model:value="editingForm.code" placeholder="请输入标识" />
              </a-form-item>
            </a-col>
          </template>

          <template v-if="editingForm.type === 'menu'">
            <a-col :span="12">
              <a-form-item label="路由名称" required>
                <a-input v-model:value="editingForm.routeName" placeholder="请输入路由名称" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="路由路径" required>
                <a-input v-model:value="editingForm.routePath" placeholder="请输入路由路径" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="组件路径">
                <a-input v-model:value="editingForm.componentPath" placeholder="请输入组件路径" />
              </a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item label="路由参数">
                <a-input v-model:value="editingForm.routeParam" placeholder='JSON格式，例如：{"id": 1}' />
              </a-form-item>
            </a-col>
          </template>

          <template v-if="editingForm.type === 'button'">
            <a-col :span="24">
              <a-form-item label="按钮标识">
                <a-input v-model:value="editingForm.permission" placeholder="如: system:user:add" />
              </a-form-item>
            </a-col>
          </template>

          <a-col :span="12">
            <a-form-item label="图标">
              <a-input v-model:value="editingForm.icon" placeholder="请输入图标名称" />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="排序">
              <a-input-number v-model:value="editingForm.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>

          <a-col :span="12">
            <a-form-item label="状态" required>
              <a-radio-group v-model:value="editingForm.status">
                <a-radio value="enabled">启用</a-radio>
                <a-radio value="disabled">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>

          <a-col :span="24">
            <a-form-item label="描述">
              <a-textarea v-model:value="editingForm.description" placeholder="请输入描述" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
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
  DeleteOutlined, 
  EditOutlined 
} from '@ant-design/icons-vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/services/permission.service'

const searchForm = reactive({
  name: '',
  status: undefined as string | undefined
})

const activeSearchQuery = reactive({
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

const tree = ref<any[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const hasSelected = computed(() => selectedIds.value.length > 0)

const totalItems = computed(() => {
  const count = (nodes: any[]): number => {
    return nodes.reduce((acc, node) => {
      return acc + 1 + (node.children ? count(node.children) : 0)
    }, 0)
  }
  return count(displayRows.value)
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: () => `共 ${totalItems.value} 条`
})

const fetchMenus = async () => {
  loading.value = true
  try {
    const data = await getMenuTree({ skipSuccTip: true })
    if (data) {
      tree.value = data.map(mapToNode)
    }
  } catch (error) {
    console.error('Failed to fetch menus:', error)
  } finally {
    loading.value = false
  }
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

// Filter logic for search
const displayRows = computed(() => {
  const keyword = activeSearchQuery.name.trim().toLowerCase()
  const status = activeSearchQuery.status

  if (!keyword && !status) return tree.value

  const filterTree = (nodes: any[]): any[] => {
    const out: any[] = []
    for (const n of nodes) {
      const nameMatch = !keyword || n.name.toLowerCase().includes(keyword)
      const statusMatch = !status || n.status === status
      
      let children = undefined
      if (n.children) {
        children = filterTree(n.children)
      }
      
      if ((nameMatch && statusMatch) || (children && children.length)) {
        out.push({ ...n, children })
      }
    }
    return out
  }
  return filterTree(tree.value)
})

const search = () => {
  activeSearchQuery.name = searchForm.name
  activeSearchQuery.status = searchForm.status
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = undefined
  search()
}

const refresh = async () => {
  selectedIds.value = []
  await fetchMenus()
  message.success('已刷新菜单数据')
}

const onSelectChange = (selectedRowKeys: number[]) => {
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
        await Promise.all(selectedIds.value.map(id => deleteMenu(id, { skipSuccTip: true })))
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
  type: 'menu',
  status: 'enabled',
  sort: 1
})
const selectedParentId = ref<number | undefined>(undefined)

const openEditModal = (row?: any) => {
  if (row) {
    modalType.value = 'edit'
    Object.assign(editingForm, row)
    // Find parent logic simplified
    selectedParentId.value = findParentId(row.id, tree.value)
  } else {
    modalType.value = 'add'
    Object.assign(editingForm, { id: 0, name: '', code: '', type: 'menu', status: 'enabled', sort: 1, routeName: '', routePath: '', routePath: '', componentPath: '', permission: '', icon: '', description: '' })
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

  modalLoading.value = true
  
  let code = ''
  if (editingForm.type === 'directory') {
    code = editingForm.code || ''
  } else if (editingForm.type === 'menu') {
    code = editingForm.code || ''
  } else if (editingForm.type === 'button') {
    code = editingForm.permission || ''
  }

  const payload = {
    parent_id: selectedParentId.value || 0,
    name: editingForm.name,
    code,
    type: editingForm.type === 'directory' ? 1 : (editingForm.type === 'menu' ? 2 : 3),
    icon: editingForm.icon,
    route_name: editingForm.routeName,
    route_path: editingForm.routePath,
    route_param: editingForm.routeParam,
    component_path: editingForm.componentPath,
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

/* 优化表格紧凑度 */
:deep(.ant-table-small) > .ant-table-content > .ant-table-body > table > tbody > tr > td {
  padding: 8px 8px; /* 减小内边距 */
}
</style>

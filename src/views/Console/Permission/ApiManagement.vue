<template>
  <div class="page-container">
    <a-card :bordered="false" class="search-card" :body-style="{ padding: '24px 24px 0 24px' }">
      <a-form layout="inline" :model="searchQuery" class="search-form">
        <a-form-item label="API 路径" name="path">
          <a-input
            v-model:value="searchQuery.path"
            placeholder="请输入 API 路径"
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
            v-model:value="searchQuery.status"
            placeholder="请选择状态"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API类别" name="menu_id">
          <a-select
            v-model:value="searchQuery.menu_id"
            placeholder="请选择类别"
            style="width: 180px"
            allow-clear
          >
            <a-select-option v-for="item in menuCategoryOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item class="search-form-actions">
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
            v-permission="['permission:api:add', 'permission:api:create']"
            type="primary"
            @click="openEditModal()"
          >
            <template #icon><PlusOutlined /></template>
            新增API
          </a-button>
          <a-button
            v-permission="['permission:api:batch_delete']"
            danger
            :disabled="!hasSelected"
            @click="batchDelete"
          >
            <template #icon><DeleteOutlined /></template>
            批量删除
          </a-button>
        </a-space>
        <a-space>
          <a-button
            v-permission="['permission:api:sync', 'permission:api:sync_routes']"
            type="primary"
            @click="syncRoutes"
          >
            同步路由
          </a-button>
          <a-tooltip title="刷新">
            <a-button type="text" shape="circle" @click="refresh">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </div>

      <a-table
        :columns="columns as any"
        :data-source="apis"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys: selectedIds, onChange: onSelectChange }"
        row-key="id"
        @change="handleTableChange"
        :loading="loading"
        :locale="tableLocale"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'enabled' ? 'success' : 'error'">
              {{ record.status === 'enabled' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'method'">
            <a-tag :color="getMethodColor(record.method)">{{ record.method || '-' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'menu_name'">
            {{ getMenuLabel(record) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button
                v-permission="['permission:api:edit', 'permission:api:update']"
                type="primary"
                size="small"
                class="btn-edit"
                @click="openEditModal(record)"
              >
                编辑
              </a-button>
              <a-popconfirm
                title="确认删除该 API 吗？"
                @confirm="deleteApi(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button
                  v-permission="['permission:api:delete']"
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
      :title="modalType === 'add' ? '新增API' : '编辑API'"
      @ok="saveApi"
      :okText="apiModalOkText"
      :okButtonProps="{ disabled: !canSaveApi }"
      :confirmLoading="modalLoading"
      :maskClosable="false"
    >
      <a-form :model="editingApi" layout="vertical">
        <a-form-item label="API路径" required name="path">
          <a-input v-model:value="editingApi.path" placeholder="请输入 API 路径 (如: /system/user)" />
        </a-form-item>
        <a-form-item label="API详情" required name="description">
          <a-input v-model:value="editingApi.description" placeholder="请输入 API 描述" />
        </a-form-item>
        <a-form-item label="API类别" required name="menu_id">
          <a-select
            v-model:value="editingApi.menu_id"
            placeholder="请选择 API 类别"
            allow-clear
          >
            <a-select-option v-for="item in menuCategoryOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="API方法" required name="method">
          <a-select v-model:value="editingApi.method" placeholder="请选择请求方法">
            <a-select-option value="GET">GET</a-select-option>
            <a-select-option value="POST">POST</a-select-option>
            <a-select-option value="PUT">PUT</a-select-option>
            <a-select-option value="DELETE">DELETE</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="editingApi.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
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
  DeleteOutlined
} from '@ant-design/icons-vue'
import { getApiList, getMenuList, syncApi, createApi, updateApi, deleteApi as deleteApiService } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth'
import { hasAnyMenuCode } from '@/utils/menuPermission'
import { isPermissionDenied } from '@/utils/request'

const searchQuery = reactive({
  path: '',
  status: undefined as string | undefined,
  menu_id: undefined as number | undefined
})

const columns = [
  { title: 'API 路径', dataIndex: 'path', key: 'path', width: 250 },
  { title: 'API 详情', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: 'API 方法', dataIndex: 'method', key: 'method', width: 100 },
  { title: '类别', dataIndex: 'menu_name', key: 'menu_name', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 180, align: 'center', fixed: 'right' as const }
]

type TableKey = string | number
const apis = ref<any[]>([])
const menuCategoryOptions = ref<{ label: string; value: number }[]>([])
const loading = ref(false)
const noPermission = ref(false)
const authStore = useAuthStore()
const tableLocale = computed(() => ({ emptyText: noPermission.value ? '你没有权限访问' : '暂无数据' }))
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total: number) => `共 ${total} 条`
})

const getMenuLabel = (record: any) => {
  const hit = menuCategoryOptions.value.find((item) => item.value === record.menu_id)
  return hit?.label || record.menu_name || '-'
}

const getMenuIdByName = (name?: string) => {
  if (!name) return undefined
  const hit = menuCategoryOptions.value.find((item) => item.label === name)
  return hit?.value
}

const fetchApis = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      keyword: searchQuery.path || undefined,
      status: searchQuery.status === 'enabled' ? 1 : (searchQuery.status === 'disabled' ? 0 : undefined),
      menu_id: searchQuery.menu_id || undefined
    }
    
    const data = await getApiList(params, { skipSuccTip: true, skipErrTip: true })
    if (data) {
      noPermission.value = false
      apis.value = data.list.map((item: any) => ({
        id: item.id,
        path: item.path,
        description: item.detail || '',
        menu_id: item.menu_id || item.group_id || undefined,
        menu_name: item.menu_name || item.category || '',
        method: item.method,
        status: item.status === 1 ? 'enabled' : 'disabled'
      }))
      pagination.total = data.total
    }
  } catch (error) {
    if (isPermissionDenied(error)) {
      noPermission.value = true
      apis.value = []
      pagination.total = 0
    } else {
      console.error('Failed to fetch APIs:', error)
    }
  } finally {
    loading.value = false
  }
}

const fetchMenuCategories = async () => {
  try {
    const data = await getMenuList({ page: 1, page_size: 1000, parent_id: 0 }, { skipSuccTip: true })
    const list = data?.list || []
    menuCategoryOptions.value = list.map((item: any) => ({
      label: item.name || '',
      value: item.id
    })).filter((item: any) => item.value)
  } catch (error) {
    console.error(error)
    menuCategoryOptions.value = []
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchApis()
}

const search = () => {
  pagination.current = 1
  fetchApis()
}

const resetSearch = () => {
  searchQuery.path = ''
  searchQuery.status = undefined
  searchQuery.menu_id = undefined
  search()
}

const refresh = () => {
  fetchApis()
  message.success('已刷新 API 数据')
}

const syncRoutes = async () => {
  try {
    const result = await syncApi({}, { skipSuccTip: true })
    message.success(`同步完成：新增 ${result.added}，更新 ${result.updated}，禁用 ${result.disabled}，总计 ${result.total}`)
    fetchApis()
  } catch (error) {
    console.error(error)
  }
}

// Selection
const selectedIds = ref<TableKey[]>([])
const hasSelected = computed(() => selectedIds.value.length > 0)
const onSelectChange = (selectedRowKeys: TableKey[], _selectedRows: any[]) => {
  selectedIds.value = selectedRowKeys
}

const batchDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确认删除选中的 ${selectedIds.value.length} 个 API 吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await Promise.all(selectedIds.value.map(id => deleteApiService(Number(id), { skipSuccTip: true })))
        message.success('批量删除成功')
        selectedIds.value = []
        fetchApis()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const deleteApi = async (id: number) => {
  try {
    await deleteApiService(id, { skipSuccTip: true })
    message.success('API 已删除')
    fetchApis()
  } catch (error) {
    console.error(error)
  }
}

// Edit Modal
const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const modalLoading = ref(false)
const canCreateApi = computed(() => hasAnyMenuCode(authStore.myMenus, ['permission:api:add', 'permission:api:create']))
const canUpdateApi = computed(() => hasAnyMenuCode(authStore.myMenus, ['permission:api:edit', 'permission:api:update']))
const canSaveApi = computed(() => (modalType.value === 'add' ? canCreateApi.value : canUpdateApi.value))
const apiModalOkText = computed(() => (canSaveApi.value ? '保存' : '⛔ 保存'))
const editingApi = reactive({
  id: 0,
  path: '',
  description: '',
  menu_id: undefined as number | undefined,
  method: undefined as string | undefined,
  status: 'enabled'
})

const openEditModal = (api?: any) => {
  if (api) {
    modalType.value = 'edit'
    Object.assign(editingApi, {
      ...api,
      menu_id: api.menu_id || getMenuIdByName(api.menu_name) || undefined
    })
  } else {
    modalType.value = 'add'
    Object.assign(editingApi, { id: 0, path: '', description: '', menu_id: undefined, method: undefined, status: 'enabled' })
  }
  fetchMenuCategories()
  isEditModalOpen.value = true
}

const saveApi = async () => {
  if (!canSaveApi.value) {
    return
  }
  if (!editingApi.path || !editingApi.description || !editingApi.method) {
    message.warning('请填写必要的 API 信息')
    return
  }
  
  modalLoading.value = true
  try {
    const payload = {
      path: editingApi.path,
      method: editingApi.method || 'GET',
      detail: editingApi.description,
      menu_id: editingApi.menu_id || 0, // 如果未选择类别，传 0
      status: editingApi.status === 'enabled' ? 1 : 0
    }

    if (modalType.value === 'add') {
      await createApi(payload, { skipSuccTip: true, skipErrTip: true })
    } else {
      await updateApi(editingApi.id, payload, { skipSuccTip: true, skipErrTip: true })
    }
    
    message.success(modalType.value === 'add' ? '新增成功' : '更新成功')
    isEditModalOpen.value = false
    fetchApis()
  } catch (error) {
    console.error(error)
  } finally {
    modalLoading.value = false
  }
}

const getMethodColor = (method: string) => {
  switch (method?.toUpperCase()) {
    case 'GET': return 'blue'
    case 'POST': return 'green'
    case 'PUT': return 'orange'
    case 'DELETE': return 'red'
    default: return 'default'
  }
}

onMounted(() => {
  fetchApis()
  fetchMenuCategories()
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
</style>

<template>
  <div class="page-container">
    <div class="search-card">
      <div class="form-group">
        <label class="form-label">API 路径:</label>
        <Input
          v-model="searchQuery.path"
          placeholder="请输入"
          @keydown.enter="search"
          class="search-input"
        />
      </div>
      <div class="form-group">
        <label class="form-label">状态:</label>
        <select
          v-model="searchQuery.status"
          class="form-select status-select"
        >
          <option value="">请选择</option>
          <option value="enabled">启用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>
      <button @click="search" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        搜索
      </button>
      <button @click="resetSearch" class="btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        重置
      </button>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <button
          @click="batchDelete"
          :disabled="selectedIds.length === 0"
          :class="['btn', selectedIds.length > 0 ? 'btn-danger-light' : 'btn-disabled']"
        >
          批量删除 ({{ selectedIds.length }})
        </button>
        <div class="toolbar-actions">
          <button @click="openEditModal()" class="btn btn-primary">
            新增API管理
          </button>
          <button @click="refresh" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <div class="dropdown-container">
            <button @click="toggleColumnFilter" class="btn btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              列筛选
            </button>
            <div v-if="isColumnFilterOpen" class="dropdown-menu animate-fade-in">
              <div class="dropdown-header">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="isAllSelected" class="checkbox-input" />
                  <span>全选</span>
                </label>
              </div>
              <div class="dropdown-body">
                <label v-for="col in tempColumns" :key="col.key" class="checkbox-label">
                  <input type="checkbox" v-model="col.visible" class="checkbox-input" />
                  <span>{{ col.label }}</span>
                </label>
              </div>
              <div class="dropdown-footer">
                <button @click="closeColumnFilter" class="btn-xs btn-default">取消</button>
                <button @click="applyColumnFilter" class="btn-xs btn-primary">筛选</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <input type="checkbox" v-model="isAllSelectedRows" class="checkbox-input" />
              </th>
              <th v-if="getColumnVisible('path')">API 路径</th>
              <th v-if="getColumnVisible('description')">API 详情</th>
              <th v-if="getColumnVisible('method')">API 方法</th>
              <th v-if="getColumnVisible('status')">状态</th>
              <th v-if="getColumnVisible('action')" class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="api in paginatedApis" :key="api.id">
              <td>
                <input type="checkbox" :checked="selectedIds.includes(api.id)" @change="toggleSelection(api.id)" class="checkbox-input" />
              </td>
              <td v-if="getColumnVisible('path')" :title="api.path">{{ api.path }}</td>
              <td v-if="getColumnVisible('description')" :title="api.description">{{ api.description }}</td>
              <td v-if="getColumnVisible('method')" :title="api.method || '-'">{{ api.method || '-' }}</td>
              <td v-if="getColumnVisible('status')">
                <span :class="api.status === 'enabled' ? 'status-enabled' : 'status-disabled'">
                  {{ api.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td v-if="getColumnVisible('action')" class="action-cell">
                <button @click="openEditModal(api)" class="btn-xs btn-primary">
                  编辑
                </button>
                <button @click="deleteApi(api.id)" class="btn-xs btn-danger">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="paginatedApis.length === 0">
              <td :colspan="visibleColumnsCount + 1" class="empty-cell">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>共 {{ totalApis }} 条数据</span>
        <div class="page-controls">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            @click="changePage(page)"
            :class="['page-number', currentPage === page ? 'active' : '']"
          >
            {{ page }}
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages || totalPages === 0"
            @click="changePage(currentPage + 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <select
          v-model.number="pageSize"
          class="page-size-select"
        >
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
        </select>
      </div>
    </div>

    <div v-if="isEditModalOpen" class="modal-overlay">
      <div class="modal-content animate-fade-in">
        <div class="modal-header">
          <h3>{{ modalType === 'add' ? '新增API管理' : '编辑API管理' }}</h3>
          <div class="modal-close">
            <button class="icon-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button @click="closeEditModal" class="icon-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label required">API路径：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingApi.path"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">API详情：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingApi.description"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">API类别：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingApi.category"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">API方法：</label>
            <div class="input-wrapper">
              <select
                v-model="editingApi.method"
                class="form-select full-width"
              >
                <option value="">请选择</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="-">-</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">状态：</label>
            <div class="input-wrapper">
              <select
                v-model="editingApi.status"
                class="form-select full-width"
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-secondary">取消</button>
          <button @click="saveApi" class="btn btn-primary">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Confirm, Input } from '@/components/common'
import { getApiList, createApi, updateApi, deleteApi as deleteApiService } from '@/services/permission.service'

const searchQuery = ref({
  path: '',
  status: ''
})

const columns = ref([
  { key: 'path', label: 'API 路径', visible: true },
  { key: 'description', label: 'API 详情', visible: true },
  { key: 'method', label: 'API 方法', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'action', label: '操作', visible: true }
])

const isColumnFilterOpen = ref(false)
const tempColumns = ref<any[]>([])

const toggleColumnFilter = () => {
  if (!isColumnFilterOpen.value) {
    tempColumns.value = JSON.parse(JSON.stringify(columns.value))
  }
  isColumnFilterOpen.value = !isColumnFilterOpen.value
}

const closeColumnFilter = () => {
  isColumnFilterOpen.value = false
}

const isAllSelected = computed({
  get: () => tempColumns.value.every(c => c.visible),
  set: (val) => tempColumns.value.forEach(c => c.visible = val)
})

const applyColumnFilter = () => {
  columns.value = JSON.parse(JSON.stringify(tempColumns.value))
  closeColumnFilter()
}

const getColumnVisible = (key: string) => {
  const col = columns.value.find(c => c.key === key)
  return col ? col.visible : true
}

const visibleColumnsCount = computed(() => columns.value.filter(c => c.visible).length)

type ApiStatus = 'enabled' | 'disabled'
interface ApiRow {
  id: number
  path: string
  description: string
  category?: string
  method: string
  status: ApiStatus
}

const apis = ref<ApiRow[]>([])
const totalApis = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const fetchApis = async () => {
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchQuery.value.path || undefined,
      status: searchQuery.value.status === 'enabled' ? 1 : (searchQuery.value.status === 'disabled' ? 0 : undefined)
    }
    
    const data = await getApiList(params, { skipSuccTip: true })
    console.log(data)
    if (data) {
      apis.value = data.list.map(item => ({
        id: item.id,
        path: item.path,
        description: item.detail || '',
        category: item.category || '',
        method: item.method,
        status: item.status === 1 ? 'enabled' : 'disabled'
      }))
      totalApis.value = data.total
    }
  } catch (error) {
    console.error('Failed to fetch APIs:', error)
  }
}

const paginatedApis = computed(() => apis.value)

const totalPages = computed(() => Math.ceil(totalApis.value / pageSize.value))

const search = () => {
  currentPage.value = 1
  fetchApis()
}

const resetSearch = () => {
  searchQuery.value.path = ''
  searchQuery.value.status = ''
  currentPage.value = 1
  selectedIds.value = []
  fetchApis()
}

const refresh = () => {
  selectedIds.value = []
  fetchApis()
  message.success('已刷新 API 数据')
}

const selectedIds = ref<number[]>([])

const isAllSelectedRows = computed({
  get: () => paginatedApis.value.length > 0 && paginatedApis.value.every(api => selectedIds.value.includes(api.id)),
  set: (val) => {
    const currentIds = paginatedApis.value.map(api => api.id)
    if (val) {
      selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentIds]))
    } else {
      selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id))
    }
  }
})

const toggleSelection = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请选择要删除的 API')
    return
  }
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除选中的 API 吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    await Promise.all(selectedIds.value.map(id => deleteApiService(id, { skipSuccTip: true })))
    
    message.success('批量删除成功')
    fetchApis()
    selectedIds.value = []
  } catch (error) {
    if (error) console.error(error)
  }
}

const deleteApi = async (id: number) => {
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除该 API 吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    await deleteApiService(id, { skipSuccTip: true })
    message.success('API 已删除')
    
    fetchApis()
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  } catch (error) {
    if (error) console.error(error)
  }
}

const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const editingApi = reactive({
  id: 0,
  path: '',
  description: '',
  category: '',
  method: '',
  status: 'enabled' as ApiStatus
})

const openEditModal = (api?: ApiRow) => {
  if (api) {
    modalType.value = 'edit'
    Object.assign(editingApi, {
      ...api,
      category: api.category || ''
    })
  } else {
    modalType.value = 'add'
    Object.assign(editingApi, { id: 0, path: '', description: '', category: '', method: '', status: 'enabled' as ApiStatus })
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const saveApi = async () => {
  const path = editingApi.path.trim()
  const description = editingApi.description.trim()
  const method = editingApi.method.trim()
  const category = editingApi.category?.trim()

  if (!path || !description || !method) {
    message.warning('请填写完整的 API 信息')
    return
  }
  
  try {
    if (modalType.value === 'add') {
      await createApi({
        path,
        method,
        detail: description,
        category,
        status: editingApi.status === 'enabled' ? 1 : 0
      }, { skipSuccTip: true })
    } else {
      await updateApi(editingApi.id, {
        path,
        method,
        detail: description,
        category,
        status: editingApi.status === 'enabled' ? 1 : 0
      }, { skipSuccTip: true })
    }
    
    message.success(modalType.value === 'add' ? 'API 新增成功' : 'API 更新成功')
    fetchApis()
    closeEditModal()
  } catch (error) {
    console.error(error)
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchApis()
  }
}

onMounted(() => {
  fetchApis()
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input, .form-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: box-shadow 0.2s;
  height: 36px; /* 统一高度 */
}

/* 覆盖 Input 组件样式以匹配页面风格 */
:deep(.input-wrapper) {
  border-radius: 4px;
  border-color: #d1d5db;
  transition: box-shadow 0.2s;
}

:deep(.input-focused) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: transparent;
}

:deep(.input-medium) {
  height: 36px;
}

:deep(.input-field) {
  font-size: 14px;
}

.form-input:focus, .form-select:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: transparent;
}

.search-input {
  width: 192px;
}

.status-select {
  width: 128px;
  color: #4b5563;
}

.btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: white;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-danger-light {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-danger-light:hover {
  background-color: #fee2e2;
}

.btn-disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.icon {
  height: 16px;
  width: 16px;
}

.icon-lg {
  height: 24px;
  width: 24px;
}

.icon-sm {
  height: 16px;
  width: 16px;
}

.content-card {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 8px 0 8px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 8px;
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 192px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f3f4f6;
  z-index: 10;
}

.dropdown-header, .dropdown-footer {
  padding: 8px;
}

.dropdown-header {
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-footer {
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dropdown-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.checkbox-label:hover {
  background-color: #f9fafb;
}

.checkbox-input {
  border-radius: 4px;
  border-color: #d1d5db;
  color: #2563eb;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-default {
  border-color: #e5e7eb;
  color: #4b5563;
  background-color: white;
}

.btn-default:hover {
  background-color: #f9fafb;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.table-container {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}

.data-table th {
  padding: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tr:hover {
  background-color: #f9fafb;
}

.col-checkbox {
  width: 48px;
}

.status-enabled {
  color: #22c55e;
}

.status-disabled {
  color: #9ca3af;
}

.action-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.btn-link {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  margin-right: 8px;
}

.btn-link:hover {
  color: #1d4ed8;
}

.empty-cell {
  padding: 32px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 14px;
  color: #4b5563;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn, .page-number {
  border: 1px solid #e5e7eb;
  background-color: white;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  min-width: 32px;
  text-align: center;
}

.page-btn:hover, .page-number:hover {
  background-color: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.page-size-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  outline: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  display: flex;
  gap: 8px;
  color: #9ca3af;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
}

.icon-btn:hover {
  color: #4b5563;
}

.modal-body {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: flex;
  align-items: center;
}

.required::before {
  content: "*";
  color: #ef4444;
  margin-right: 4px;
}

.modal-body .form-label {
  width: 96px;
  text-align: right;
  margin-right: 16px;
  color: #4b5563;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.full-width {
  width: 100%;
}

.relative-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #9ca3af;
  display: flex;
  align-items: center;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #d1d5db;
  cursor: pointer;
}

.clear-btn:hover {
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid #f3f4f6;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>

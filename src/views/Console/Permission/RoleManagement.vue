<template>
  <div class="page-container">
    <div class="search-card">
      <div class="form-group">
        <label class="form-label">角色名称:</label>
        <Input
          v-model="searchQuery.roleName"
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
            新增角色管理
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
              <th v-if="getColumnVisible('name')">角色名称</th>
              <th v-if="getColumnVisible('key')">角色标识</th>
              <th v-if="getColumnVisible('status')" class="table-col-center">状态</th>
              <th v-if="getColumnVisible('updateTime')">更新时间</th>
              <th v-if="getColumnVisible('action')" class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in paginatedRoles" :key="role.id">
              <td>
                <input type="checkbox" :checked="selectedIds.includes(role.id)" @change="toggleSelection(role.id)" class="checkbox-input" />
              </td>
              <td v-if="getColumnVisible('name')" :title="role.name">{{ role.name }}</td>
              <td v-if="getColumnVisible('key')" :title="role.key">{{ role.key }}</td>
              <td v-if="getColumnVisible('status')" class="table-col-center">
                <StatusBadge :status="role.status" />
              </td>
              <td v-if="getColumnVisible('updateTime')" :title="role.updateTime">{{ role.updateTime }}</td>
              <td v-if="getColumnVisible('action')" class="action-cell table-action-cell">
                <button @click="openPermissionModal(role)" class="table-action-btn table-action-btn--neutral">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  修改权限
                </button>
                <button @click="openEditModal(role)" class="table-action-btn table-action-btn--primary">
                  编辑
                </button>
                <button @click="deleteRole(role.id)" class="table-action-btn table-action-btn--danger">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="paginatedRoles.length === 0">
              <td :colspan="visibleColumnCount + 1" class="empty-cell">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>共 {{ totalRoles }} 条数据</span>
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
          <h3>{{ modalType === 'add' ? '新增角色管理' : '编辑角色管理' }}</h3>
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
            <label class="form-label required">名称：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingRole.name"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">角色标识：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingRole.key"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row" v-if="modalType === 'add'">
            <label class="form-label">描述：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingRole.desc"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row" v-else>
            <label class="form-label">状态：</label>
            <div class="input-wrapper">
              <select
                v-model="editingRole.status"
                class="form-select full-width"
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-secondary">取消</button>
          <button @click="saveRole" class="btn btn-primary">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>

    <div v-if="isPermissionModalOpen" class="modal-overlay">
      <div class="modal-content large-modal animate-fade-in">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3>修改权限 - {{ permissionRole.name }}</h3>
          </div>
          <button @click="closePermissionModal" class="icon-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="permission-body">
          <div class="permission-panel">
            <div class="panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>功能权限</span>
            </div>
            <div class="panel-content custom-scrollbar">
              <div v-for="item in functionalPermissions" :key="item.id" class="permission-item">
                <div class="permission-row">
                  <button v-if="item.children && item.children.length" @click="item.expanded = !item.expanded" class="expand-btn">
                    <svg :class="['icon-sm transition-transform', item.expanded ? 'rotate-90' : '']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div v-else style="width: 16px; height: 16px;"></div>
                  <label class="checkbox-label">
                    <input type="checkbox" :checked="isMenuChecked(item.id)" @change="toggleMenuSelection(item)" class="checkbox-input" />
                    <span>{{ item.label }}</span>
                  </label>
                </div>
                <div v-if="item.children && item.expanded" class="permission-children">
                  <div v-for="child in item.children" :key="child.id" class="permission-item">
                    <div class="permission-row">
                      <button v-if="child.children && child.children.length" @click="child.expanded = !child.expanded" class="expand-btn">
                        <svg :class="['icon-sm transition-transform', child.expanded ? 'rotate-90' : '']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div v-else style="width: 16px; height: 16px;"></div>
                      <label class="checkbox-label">
                        <input type="checkbox" :checked="isMenuChecked(child.id)" @change="toggleMenuSelection(child)" class="checkbox-input" />
                        <span>{{ child.label }}</span>
                      </label>
                    </div>
                    <div v-if="child.children && child.expanded" class="permission-children">
                      <div v-for="grandChild in child.children" :key="grandChild.id" class="permission-child">
                        <label class="checkbox-label">
                          <input type="checkbox" :checked="isMenuChecked(grandChild.id)" @change="toggleMenuSelection(grandChild)" class="checkbox-input" />
                          <span>{{ grandChild.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="permission-panel">
            <div class="panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>数据权限</span>
            </div>
            <div class="panel-content custom-scrollbar">
              <div v-for="item in dataPermissions" :key="item.id" class="permission-item">
                <div class="permission-row">
                  <button v-if="item.children && item.children.length" @click="item.expanded = !item.expanded" class="expand-btn">
                    <svg :class="['icon-sm transition-transform', item.expanded ? 'rotate-90' : '']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div v-else style="width: 16px; height: 16px;"></div>
                  <label class="checkbox-label">
                    <input type="checkbox" :checked="isApiChecked(item.id)" @change="toggleApiSelection(item)" class="checkbox-input" />
                    <span>{{ item.label }}</span>
                  </label>
                </div>
                <div v-if="item.children && item.expanded" class="permission-children">
                  <div v-for="child in item.children" :key="child.id" class="permission-item">
                    <div class="permission-row">
                      <button v-if="child.children && child.children.length" @click="child.expanded = !child.expanded" class="expand-btn">
                        <svg :class="['icon-sm transition-transform', child.expanded ? 'rotate-90' : '']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div v-else style="width: 16px; height: 16px;"></div>
                      <label class="checkbox-label">
                        <input type="checkbox" :checked="isApiChecked(child.id)" @change="toggleApiSelection(child)" class="checkbox-input" />
                        <span>{{ child.label }}</span>
                      </label>
                    </div>
                    <div v-if="child.children && child.expanded" class="permission-children">
                      <div v-for="grandChild in child.children" :key="grandChild.id" class="permission-child">
                        <label class="checkbox-label">
                          <input type="checkbox" :checked="isApiChecked(grandChild.id)" @change="toggleApiSelection(grandChild)" class="checkbox-input" />
                          <span>{{ grandChild.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closePermissionModal" class="btn btn-secondary">Cancel</button>
          <button @click="savePermission" class="btn btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Confirm, Input, StatusBadge } from '@/components/common'
import { getRoleList, createRole, updateRole, deleteRole as deleteRoleApi } from '@/services/permission.service'

const searchQuery = ref({
  roleName: '',
  status: ''
})

const columns = ref([
  { key: 'name', label: '角色名称', visible: true },
  { key: 'key', label: '角色标识', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'updateTime', label: '更新时间', visible: true },
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
const visibleColumnCount = computed(() => columns.value.filter(c => c.visible).length)

type RoleStatus = 'enabled' | 'disabled'
interface RoleRow {
  id: number
  name: string
  key: string
  status: RoleStatus
  updateTime: string
  desc?: string
}

interface PermissionNode {
  id: number
  label: string
  expanded?: boolean
  children?: PermissionNode[]
}

const roles = ref<RoleRow[]>([])
const totalRoles = ref(0)
const allRoles = ref<RoleRow[]>([])

const currentPage = ref(1)
const pageSize = ref(20)

const paginatedRoles = computed(() => {
  return roles.value
})

const totalPages = computed(() => Math.ceil(totalRoles.value / pageSize.value))

// 获取角色列表
const fetchRoles = async () => {
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchQuery.value.roleName || undefined,
      status: searchQuery.value.status === 'enabled' ? 1 : (searchQuery.value.status === 'disabled' ? 0 : undefined)
    }
    
    const data = await getRoleList(params, { skipSuccTip: true })
    console.log(data)
    if (data) {
      roles.value = data.list.map((item: any) => ({
        id: item.id,
        name: item.name,
        key: item.code,
        status: item.status === 1 ? 'enabled' : 'disabled',
        updateTime: item.updated_at || '',
        desc: item.desc
      }))
      totalRoles.value = data.total
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  }
}

const applySearch = () => {
  fetchRoles()
}

const search = () => {
  currentPage.value = 1
  fetchRoles()
}

const resetSearch = () => {
  searchQuery.value.roleName = ''
  searchQuery.value.status = ''
  currentPage.value = 1
  selectedIds.value = []
  fetchRoles()
}

const refresh = () => {
  selectedIds.value = []
  fetchRoles()
  message.success('已刷新角色数据')
}

const selectedIds = ref<number[]>([])

const isAllSelectedRows = computed({
  get: () => paginatedRoles.value.length > 0 && paginatedRoles.value.every(r => selectedIds.value.includes(r.id)),
  set: (val) => {
    const currentIds = paginatedRoles.value.map(r => r.id)
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
    message.warning('请选择要删除的角色')
    return
  }
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除选中的角色吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    // 循环调用删除接口
    await Promise.all(selectedIds.value.map(id => deleteRoleApi(id)))
    
    message.success('批量删除成功')
    fetchRoles()
    selectedIds.value = []
  } catch (error) {
    if (error) console.error(error)
  }
}

const deleteRole = async (id: number) => {
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除该角色吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    await deleteRoleApi(id, { skipSuccTip: true })
    message.success('删除成功')
    
    fetchRoles()
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } catch (error) {
    if (error) console.error(error)
  }
}

const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const editingRole = reactive({
  id: 0,
  name: '',
  key: '',
  status: 'enabled' as RoleStatus,
  desc: ''
})

const openEditModal = (role?: RoleRow) => {
  if (role) {
    modalType.value = 'edit'
    Object.assign(editingRole, role)
  } else {
    modalType.value = 'add'
    Object.assign(editingRole, { id: 0, name: '', key: '', status: 'enabled' as RoleStatus, desc: '' })
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const saveRole = async () => {
  const name = editingRole.name.trim()
  const key = editingRole.key.trim()
  if (!name || !key) {
    message.warning('请填写完整的角色信息')
    return
  }
  
  try {
    if (modalType.value === 'add') {
      await createRole({
        name,
        code: key,
        desc: editingRole.desc
      }, { skipSuccTip: true })
    } else {
      await updateRole(editingRole.id, {
        name,
        code: key,
        status: editingRole.status === 'enabled' ? 1 : 0,
        desc: editingRole.desc
      }, { skipSuccTip: true })
    }
    
    message.success('保存成功')
    
    fetchRoles()
    closeEditModal()
  } catch (error) {
    console.error(error)
  }
}

const isPermissionModalOpen = ref(false)
const permissionRole = reactive({
  id: 0,
  name: ''
})

const functionalPermissions = ref<PermissionNode[]>([
  { 
    id: 1000, 
    label: '权限管理', 
    expanded: true, 
    children: [
      { 
        id: 1100, 
        label: '角色管理', 
        expanded: true,
        children: [
          { id: 1101, label: '新增角色管理' },
          { id: 1102, label: '编辑角色信息' },
          { id: 1103, label: '修改角色权限' },
          { id: 1104, label: '删除角色' }
        ]
      },
      { 
        id: 1200, 
        label: 'API管理', 
        expanded: true,
        children: [
          { id: 1201, label: '新增API管理' },
          { id: 1202, label: '编辑API信息' },
          { id: 1203, label: '删除API' }
        ]
      },
      { 
        id: 1300, 
        label: '菜单管理', 
        expanded: true,
        children: [
          { id: 1301, label: '新增菜单管理' },
          { id: 1302, label: '编辑菜单信息' },
          { id: 1303, label: '删除菜单' }
        ]
      }
    ]
  },
  { id: 2000, label: '人员管理', expanded: true },
  { id: 3000, label: '组织管理', expanded: true },
  { id: 4000, label: '我的团队', expanded: true }
])
const dataPermissions = ref<PermissionNode[]>([
  {
    id: 5000,
    label: '权限管理',
    expanded: true,
    children: [
      {
        id: 5100,
        label: '角色管理',
        expanded: true,
        children: [
          { id: 5101, label: 'POST /system/role' },
          { id: 5102, label: 'PUT /system/role/{id}' },
          { id: 5103, label: 'DELETE /system/role/{id}' }
        ]
      },
      {
        id: 5200,
        label: 'API管理',
        expanded: true,
        children: [
          { id: 5201, label: 'POST /system/api' },
          { id: 5202, label: 'PUT /system/api/{id}' },
          { id: 5203, label: 'DELETE /system/api/{id}' }
        ]
      },
      {
        id: 5300,
        label: '菜单管理',
        expanded: true,
        children: [
          { id: 5301, label: 'POST /system/menu' },
          { id: 5302, label: 'PUT /system/menu/{id}' },
          { id: 5303, label: 'DELETE /system/menu/{id}' }
        ]
      }
    ]
  }
])
const selectedMenuIds = ref<Set<number>>(new Set())
const selectedApiIds = ref<Set<number>>(new Set())

const collectMenuIds = (node: PermissionNode): number[] => {
  const ids = [node.id]
  if (node.children) {
    node.children.forEach(child => {
      ids.push(...collectMenuIds(child))
    })
  }
  return ids
}

const updateSelectedMenuIds = (ids: number[], selected: boolean) => {
  const next = new Set(selectedMenuIds.value)
  ids.forEach(id => selected ? next.add(id) : next.delete(id))
  selectedMenuIds.value = next
}

const isMenuChecked = (id: number) => selectedMenuIds.value.has(id)

const toggleMenuSelection = (node: PermissionNode) => {
  const ids = collectMenuIds(node)
  const shouldSelect = ids.some(id => !selectedMenuIds.value.has(id))
  updateSelectedMenuIds(ids, shouldSelect)
}

const isApiChecked = (id: number) => selectedApiIds.value.has(id)

const toggleApiSelection = (node: PermissionNode) => {
  const ids = collectMenuIds(node)
  const shouldSelect = ids.some(id => !selectedApiIds.value.has(id))
  
  const next = new Set(selectedApiIds.value)
  ids.forEach(id => shouldSelect ? next.add(id) : next.delete(id))
  selectedApiIds.value = next
}

const openPermissionModal = (role: RoleRow) => {
  permissionRole.id = role.id
  permissionRole.name = role.name
  isPermissionModalOpen.value = true
}

const closePermissionModal = () => {
  isPermissionModalOpen.value = false
}

const savePermission = () => {
  closePermissionModal()
  message.success('权限已保存')
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchRoles()
  }
}

const init = () => {
  fetchRoles()
}

onMounted(() => {
  init()
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
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
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

.action-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
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

.large-modal {
  width: 1000px;
  height: 750px;
  display: flex;
  flex-direction: column;
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

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-purple {
  color: #a855f7;
}

.permission-body {
  flex: 1;
  padding: 24px;
  display: flex;
  gap: 24px;
  overflow: hidden;
  font-size: 13px;
}

.permission-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}

.permission-panel:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8fafc;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  font-weight: 600;
  color: #1e293b;
}

.text-orange {
  color: #f97316;
}

.text-blue {
  color: #3b82f6;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.permission-item {
  margin-bottom: 4px;
}

.permission-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.expand-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
}

.expand-btn:hover {
  color: #4b5563;
}

.transition-transform {
  transition: transform 0.2s;
}

.rotate-90 {
  transform: rotate(90deg);
}

.permission-children {
  margin-left: 20px;
  padding-left: 16px;
  border-left: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>

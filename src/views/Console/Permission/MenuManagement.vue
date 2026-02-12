<template>
  <div class="page-container">
    <div class="search-card">
      <div class="form-group">
        <label class="form-label">菜单名称:</label>
        <Input
          v-model="searchQuery.name"
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
            新增菜单管理
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
              <th v-if="getColumnVisible('id')" style="width: 80px">ID</th>
              <th v-if="getColumnVisible('name')">菜单名称</th>
              <th v-if="getColumnVisible('type')" class="table-col-center" style="width: 100px">菜单类型</th>
              <th v-if="getColumnVisible('permission')" style="width: 150px">按钮标识</th>
              <th v-if="getColumnVisible('routeName')" style="width: 150px">路由名称</th>
              <th v-if="getColumnVisible('routePath')" style="width: 150px">路由路径</th>
              <th v-if="getColumnVisible('componentPath')" style="width: 150px">组件路径</th>
              <th v-if="getColumnVisible('status')" class="table-col-center" style="width: 80px">状态</th>
              <th v-if="getColumnVisible('sort')" style="width: 80px">排序</th>
              <th v-if="getColumnVisible('actions')" class="text-right" style="width: 140px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in displayRows" :key="row.id" :class="expandedIds.has(row.id) ? 'row-expanded' : ''">
              <td class="align-middle">
                <input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleSelection(row.id)" class="checkbox-input" />
              </td>
              <td v-if="getColumnVisible('id')" class="align-middle" :title="String(row.id)">{{ row.id }}</td>
              <td v-if="getColumnVisible('name')" class="align-middle">
                <div class="flex-center" :style="{ paddingLeft: row.level * 16 + 'px' }">
                  <button
                    v-if="row.hasChildren"
                    @click="toggleExpand(row.id)"
                    class="expand-toggle-btn"
                  >
                    <svg v-if="expandedIds.has(row.id)" xmlns="http://www.w3.org/2000/svg" class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span :title="row.name">{{ row.name }}</span>
                </div>
              </td>
              <td v-if="getColumnVisible('type')" class="align-middle table-col-center">
                <MenuTypeBadge :type="row.type" />
              </td>
              <td v-if="getColumnVisible('permission')" class="align-middle" :title="row.permission || '-'">{{ row.permission || '-' }}</td>
              <td v-if="getColumnVisible('routeName')" class="align-middle" :title="row.routeName || '-'">{{ row.routeName || '-' }}</td>
              <td v-if="getColumnVisible('routePath')" class="align-middle" :title="row.routePath || '-'">{{ row.routePath || '-' }}</td>
              <td v-if="getColumnVisible('componentPath')" class="align-middle" :title="row.componentPath || '-'">{{ row.componentPath || '-' }}</td>
              <td v-if="getColumnVisible('status')" class="align-middle table-col-center">
                <StatusBadge :status="row.status" />
              </td>
              <td v-if="getColumnVisible('sort')" class="align-middle">{{ row.sort }}</td>
              <td v-if="getColumnVisible('actions')" class="action-cell table-action-cell">
                <button @click="openEditModal(row)" class="table-action-btn table-action-btn--primary">
                  编辑
                </button>
                <button @click="handleDelete(row)" class="table-action-btn table-action-btn--danger">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="displayRows.length === 0">
              <td :colspan="visibleColumnCount + 1" class="empty-cell">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>共 {{ flatMenu.length }} 条数据</span>
      </div>
    </div>

    <div v-if="isEditModalOpen" class="modal-overlay">
      <div class="modal-content large-modal-auto animate-fade-in">
        <div class="modal-header">
          <h3>{{ modalType === 'add' ? '新增菜单管理' : '编辑菜单管理' }}</h3>
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
        <div class="modal-body-scroll">
          <div class="form-row" v-if="editingForm.type !== 'directory'">
            <label class="form-label required">父级菜单：</label>
            <div class="input-wrapper relative-wrapper">
              <select v-model="selectedParentId" class="form-select full-width">
                <option :value="null">无父级</option>
                <option v-for="opt in parentMenuOptions" :key="opt.id" :value="opt.id">
                  {{ (opt.level > 0 ? '— '.repeat(opt.level) : '') + opt.name }}
                </option>
              </select>
              <div class="select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">菜单名称：</label>
            <div class="input-wrapper">
              <Input
                v-model="editingForm.name"
                placeholder="请输入"
                clearable
                class="full-width"
              />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">菜单类型：</label>
            <div class="input-wrapper">
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="editingForm.type" value="directory" :disabled="modalType === 'edit' && editingForm.type !== 'directory'" />
                  <span>目录</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="editingForm.type" value="menu" :disabled="modalType === 'edit' && editingForm.type !== 'menu'" />
                  <span>菜单</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="editingForm.type" value="button" :disabled="modalType === 'edit' && editingForm.type !== 'button'" />
                  <span>按钮</span>
                </label>
              </div>
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type === 'directory' || editingForm.type === 'menu'">
            <label class="form-label required">{{ editingForm.type === 'directory' ? '目录标识' : '菜单标识' }}：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.code" placeholder="请输入" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type === 'menu'">
            <label class="form-label required">路由名称：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.routeName" placeholder="请输入" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type !== 'button'">
            <label class="form-label required">路由路径：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.routePath" placeholder="请输入" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type === 'menu'">
            <label class="form-label">路由参数：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.routeParam" placeholder='JSON格式，例如：{"id": 1}' clearable class="full-width" />
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type === 'menu'">
            <label class="form-label">组件路径：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.componentPath" placeholder="请输入" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row" v-if="editingForm.type === 'button'">
            <label class="form-label">按钮标识：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.permission" placeholder="system:user:add" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">图标：</label>
            <div class="input-wrapper">
              <Input v-model="editingForm.icon" placeholder="请输入" clearable class="full-width" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label required">状态：</label>
            <div class="input-wrapper relative-wrapper">
              <select v-model="editingForm.status" class="form-select full-width">
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
              <div class="select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">排序：</label>
            <div class="input-wrapper">
              <Input v-model.number="editingForm.sort" type="number" placeholder="1" class="full-width" />
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">描述：</label>
            <div class="input-wrapper">
              <textarea v-model="editingForm.description" rows="3" placeholder="请输入" class="form-textarea full-width"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn btn-secondary">取消</button>
          <button @click="saveMenu" class="btn btn-primary">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getMenuTree, getMenuDetail, createMenu, updateMenu, deleteMenu } from '@/services/permission.service'
import { message, Confirm, Input, MenuTypeBadge, StatusBadge } from '@/components/common'
import type { MenuItem, CreateMenuRequest, UpdateMenuRequest } from '@/types'

type MenuType = 'directory' | 'menu' | 'button'
type MenuStatus = 'enabled' | 'disabled'

const menuTypeOrder: Record<MenuType, number> = {
  directory: 0,
  menu: 1,
  button: 2
}

interface MenuNode {
  id: number
  name: string
  code?: string
  permission?: string
  type: MenuType
  routeName?: string
  routePath?: string
  routeParam?: string
  componentPath?: string
  status: MenuStatus
  sort: number
  icon?: string
  description?: string
  children?: MenuNode[]
}

interface FlatRow {
  id: number
  name: string
  code?: string
  permission?: string
  type: MenuType
  routeName?: string
  routePath?: string
  routeParam?: string
  componentPath?: string
  status: MenuStatus
  sort: number
  level: number
  hasChildren: boolean
}

const searchQuery = ref({ name: '', status: '' })

const columns = ref([
  { key: 'id', label: 'ID', visible: true },
  { key: 'name', label: '菜单名称', visible: true },
  { key: 'type', label: '菜单类型', visible: true },
  { key: 'permission', label: '按钮标识', visible: true },
  { key: 'routeName', label: '路由名称', visible: true },
  { key: 'routePath', label: '路由路径', visible: true },
  { key: 'componentPath', label: '组件路径', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'sort', label: '排序', visible: true },
  { key: 'actions', label: '操作', visible: true }
])

const isColumnFilterOpen = ref(false)
const tempColumns = ref<any[]>([])

const toggleColumnFilter = () => {
  if (!isColumnFilterOpen.value) tempColumns.value = JSON.parse(JSON.stringify(columns.value))
  isColumnFilterOpen.value = !isColumnFilterOpen.value
}
const closeColumnFilter = () => { isColumnFilterOpen.value = false }
const isAllSelected = computed({
  get: () => tempColumns.value.every(c => c.visible),
  set: (val) => tempColumns.value.forEach(c => c.visible = val)
})
const applyColumnFilter = () => { columns.value = JSON.parse(JSON.stringify(tempColumns.value)); closeColumnFilter() }
const getColumnVisible = (key: string) => columns.value.find(c => c.key === key)?.visible ?? true
const visibleColumnCount = computed(() => columns.value.filter(c => c.visible).length)

const tree = ref<MenuNode[]>([])
const flatMenu = ref<FlatRow[]>([])
const expandedIds = ref<Set<number>>(new Set())
const selectedIds = ref<number[]>([])

const fetchMenus = async () => {
  try {
    const data = await getMenuTree({ skipSuccTip: true })
    if (data) {
      tree.value = data.map(mapToNode)
      applySearch()
    }
  } catch (error) {
    console.error('Failed to fetch menus:', error)
  }
}

const mapToNode = (item: MenuItem): MenuNode => {
  const typeStr = item.type === 1 ? 'directory' : (item.type === 2 ? 'menu' : 'button')
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    type: typeStr as MenuType,
    permission: typeStr === 'button' ? item.code : undefined,
    routeName: item.route_name,
    routePath: item.route_path,
    routeParam: item.route_param,
    componentPath: item.component_path,
    status: item.status === 1 ? 'enabled' : 'disabled',
    sort: item.sort,
    icon: item.icon,
    description: item.desc,
    children: item.children ? item.children.map(mapToNode) : undefined
  }
}

const toFlat = (nodes: MenuNode[], level = 0): FlatRow[] => {
  const res: FlatRow[] = []
  const orderedNodes = [...nodes].sort((a, b) => {
    const typeRank = menuTypeOrder[a.type] - menuTypeOrder[b.type]
    if (typeRank !== 0) return typeRank
    const sortRank = a.sort - b.sort
    if (sortRank !== 0) return sortRank
    return a.id - b.id
  })

  for (const n of orderedNodes) {
    res.push({
      id: n.id,
      name: n.name,
      permission: n.permission,
      type: n.type,
      routeName: n.routeName,
      routePath: n.routePath,
      routeParam: n.routeParam,
      componentPath: n.componentPath,
      status: n.status,
      sort: n.sort,
      level,
      hasChildren: !!(n.children && n.children.length)
    })
    if (n.children && expandedIds.value.has(n.id)) res.push(...toFlat(n.children, level + 1))
  }
  return res
}

const toFlatAll = (nodes: MenuNode[], level = 0): FlatRow[] => {
  const res: FlatRow[] = []
  const orderedNodes = [...nodes].sort((a, b) => {
    const typeRank = menuTypeOrder[a.type] - menuTypeOrder[b.type]
    if (typeRank !== 0) return typeRank
    const sortRank = a.sort - b.sort
    if (sortRank !== 0) return sortRank
    return a.id - b.id
  })

  for (const n of orderedNodes) {
    res.push({
      id: n.id,
      name: n.name,
      permission: n.permission,
      type: n.type,
      routeName: n.routeName,
      routePath: n.routePath,
      routeParam: n.routeParam,
      componentPath: n.componentPath,
      status: n.status,
      sort: n.sort,
      level,
      hasChildren: !!(n.children && n.children.length)
    })
    if (n.children) res.push(...toFlatAll(n.children, level + 1))
  }
  return res
}

const applySearch = () => {
  const keyword = searchQuery.value.name.trim().toLowerCase()
  const status = searchQuery.value.status
  const filterTree = (nodes: MenuNode[]): MenuNode[] => {
    const out: MenuNode[] = []
    for (const n of nodes) {
      const nameMatch = !keyword || n.name.toLowerCase().includes(keyword)
      const statusMatch = !status || n.status === status
      const children = n.children ? filterTree(n.children) : undefined
      if (nameMatch && statusMatch || (children && children.length)) {
        out.push({ ...n, children })
      }
    }
    return out
  }
  const filtered = filterTree(tree.value)
  flatMenu.value = toFlat(filtered, 0)
}

const search = () => { applySearch() }
const resetSearch = () => { searchQuery.value = { name: '', status: '' }; applySearch() }
const refresh = () => {
  expandedIds.value = new Set()
  selectedIds.value = []
  fetchMenus()
  message.success('已刷新菜单数据')
}

const isAllSelectedRows = computed({
  get: () => displayRows.value.length > 0 && displayRows.value.every(r => selectedIds.value.includes(r.id)),
  set: (val) => {
    const currentIds = displayRows.value.map(r => r.id)
    selectedIds.value = val ? Array.from(new Set([...selectedIds.value, ...currentIds])) : selectedIds.value.filter(id => !currentIds.includes(id))
  }
})

const displayRows = computed(() => flatMenu.value)

const toggleExpand = (id: number) => {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
  applySearch()
}

const toggleSelection = (id: number) => {
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请选择要删除的菜单项')
    return
  }
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除选中的菜单项吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    await Promise.all(selectedIds.value.map(id => deleteMenu(id, { skipSuccTip: true })))
    
    message.success('批量删除成功')
    fetchMenus()
    selectedIds.value = []
  } catch (error) {
    if (error) console.error(error)
  }
}

const handleDelete = async (row: FlatRow) => {
  try {
    await Confirm({
      title: '确认删除',
      content: '确认删除该菜单项吗？',
      type: 'warning',
      okText: '删除',
      cancelText: '取消'
    })
    
    await deleteMenu(row.id, { skipSuccTip: true })
    message.success('菜单项已删除')
    
    fetchMenus()
    selectedIds.value = selectedIds.value.filter(id => id !== row.id)
  } catch (error) {
    if (error) console.error(error)
  }
}

const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const editingForm = reactive<MenuNode>({
  id: 0,
  name: '',
  type: 'menu',
  status: 'enabled',
  sort: 1
})

const selectedParentId = ref<number | null>(null)
const getDescendantIds = (id: number): number[] => {
  const node = findNodeById(id, tree.value)
  const res: number[] = []
  const walk = (n?: MenuNode) => {
    if (!n || !n.children) return
    for (const c of n.children) {
      res.push(c.id)
      walk(c)
    }
  }
  walk(node)
  return res
}

const findParentId = (targetId: number, nodes: MenuNode[]): number | null => {
  for (const n of nodes) {
    if (n.children) {
      if (n.children.some(c => c.id === targetId)) {
        return n.id
      }
      const found = findParentId(targetId, n.children)
      if (found) return found
    }
  }
  return null
}

const parentMenuOptions = computed(() => {
  const rows = toFlatAll(tree.value, 0)
  const exclude = modalType.value === 'edit' ? new Set<number>([editingForm.id, ...getDescendantIds(editingForm.id)]) : new Set<number>()
  return rows.filter(r => r.type === 'menu' && !exclude.has(r.id))
})

const openEditModal = (row?: FlatRow) => {
  if (row) {
    modalType.value = 'edit'
    const node = findNodeById(row.id, tree.value)
    
    if (node) {
      Object.assign(editingForm, {
        id: node.id,
        name: node.name,
        code: node.code,
        type: node.type,
        permission: node.permission,
        routeName: node.routeName,
        routePath: node.routePath,
        routeParam: node.routeParam,
        componentPath: node.componentPath,
        status: node.status,
        sort: node.sort,
        icon: node.icon,
        description: node.description
      })
      
      selectedParentId.value = findParentId(node.id, tree.value)
    } else {
      message.error('未找到菜单数据')
      return
    }
  } else {
    modalType.value = 'add'
    Object.assign(editingForm, { id: 0, name: '', code: '', type: 'menu', status: 'enabled', sort: 1, routeName: '', routePath: '', routeParam: '', componentPath: '', permission: '' })
    selectedParentId.value = null
  }
  isEditModalOpen.value = true
}
const closeEditModal = () => { isEditModalOpen.value = false }

const findNodeById = (id: number, nodes: MenuNode[]): MenuNode | undefined => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNodeById(id, n.children)
      if (found) return found
    }
  }
}

const saveMenu = async () => {
  const name = editingForm.name.trim()
  if (!name) {
    message.warning('请填写菜单名称')
    return
  }

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
    name,
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
    closeEditModal()
    fetchMenus()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchMenus()
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
  height: 36px;
}

.form-textarea {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: box-shadow 0.2s;
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

.form-input:focus, .form-select:focus, .form-textarea:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: transparent;
}

.form-select {
  appearance: none;
  background-image: none;
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
  height: 20px;
  width: 20px;
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

.table-container {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
  table-layout: fixed;
}

.flex-center {
  display: flex;
  align-items: center;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.max-w-240 {
  max-width: 240px;
}

.align-middle { vertical-align: middle; }

.expand-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  margin-right: 4px;
}

.radio-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.radio-input {
  cursor: pointer;
}

.modal-body-scroll {
  padding: 32px;
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.large-modal-auto {
  width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.form-textarea {
  resize: vertical;
}

.relative-wrapper { position: relative; }
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

.data-table th {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table tr:hover {
  background-color: #f9fafb;
}

.row-expanded {
  background-color: #eff6ff;
}

.align-middle {
  vertical-align: middle;
}

.expand-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  margin-right: 8px;
  padding: 0;
}

.expand-toggle-btn:hover {
  color: #374151;
}

.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.max-w-240 {
  max-width: 240px;
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
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.large-modal-auto {
  width: 680px;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
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

.modal-body-scroll {
  padding: 24px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.modal-body-scroll .form-label {
  width: 96px;
  text-align: right;
  margin-right: 16px;
  color: #374151;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.full-width {
  width: 100%;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.radio-input {
  margin-right: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 24px;
  gap: 16px;
  border-top: 1px solid #e5e7eb;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>

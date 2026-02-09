<template>
  <div class="h-full flex flex-col gap-4">
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">菜单名称：</label>
        <input
          v-model="searchQuery.name"
          type="text"
          placeholder="请输入"
          class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">状态：</label>
        <select
          v-model="searchQuery.status"
          class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32 text-gray-600"
        >
          <option value="">请选择</option>
          <option value="enabled">启用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>
      <button @click="search" class="flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        搜索
      </button>
      <button @click="resetSearch" class="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        重置
      </button>
    </div>

    <div class="bg-white pl-2 pr-4 py-4 rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col">
      <div class="flex justify-between items-center mb-4 px-2 pt-2">
        <button
          @click="batchDelete"
          :disabled="selectedIds.length === 0"
          :class="[
            'mt-1 px-4 py-1.5 rounded text-sm border transition-colors flex items-center gap-1',
            selectedIds.length > 0
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer'
              : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
          ]"
        >
          批量删除 ({{ selectedIds.length }})
        </button>
        <div class="flex items-center gap-4 pr-2">
          <button @click="openEditModal()" class="mt-1 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1">
            新增菜单管理
          </button>
          <button @click="refresh" class="mt-1 bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <div class="relative">
            <button @click="toggleColumnFilter" class="mt-1 bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              列筛选
            </button>
            <div v-if="isColumnFilterOpen" class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 animate-fade-in">
              <div class="p-2 border-b border-gray-100">
                <label class="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" v-model="isAllSelected" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-gray-700">全选</span>
                </label>
              </div>
              <div class="p-2 space-y-1">
                <label v-for="col in tempColumns" :key="col.key" class="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" v-model="col.visible" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-gray-700">{{ col.label }}</span>
                </label>
              </div>
              <div class="p-2 border-t border-gray-100 flex justify-end gap-2">
                <button @click="closeColumnFilter" class="px-2 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">取消</button>
                <button @click="applyColumnFilter" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">筛选</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden">
        <table class="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col style="width:40px" />
            <col v-if="getColumnVisible('id')" style="width:64px" />
            <col v-if="getColumnVisible('name')" style="width:240px" />
            <col v-if="getColumnVisible('type')" style="width:100px" />
            <col v-if="getColumnVisible('permission')" style="width:160px" />
            <col v-if="getColumnVisible('routeName')" style="width:120px" />
            <col v-if="getColumnVisible('routePath')" style="width:160px" />
            <col v-if="getColumnVisible('componentPath')" style="width:160px" />
            <col v-if="getColumnVisible('status')" style="width:80px" />
            <col v-if="getColumnVisible('sort')" style="width:60px" />
            <col v-if="getColumnVisible('actions')" style="width:140px" />
          </colgroup>
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-3 py-2">
                <input type="checkbox" v-model="isAllSelectedRows" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th v-if="getColumnVisible('id')" class="px-3 py-2 text-sm font-medium text-gray-900">ID</th>
              <th v-if="getColumnVisible('name')" class="px-3 py-2 text-sm font-medium text-gray-900">菜单名称</th>
              <th v-if="getColumnVisible('type')" class="px-3 py-2 text-sm font-medium text-gray-900">菜单类型</th>
              <th v-if="getColumnVisible('permission')" class="px-3 py-2 text-sm font-medium text-gray-900">权限标识</th>
              <th v-if="getColumnVisible('routeName')" class="px-3 py-2 text-sm font-medium text-gray-900">路由名称</th>
              <th v-if="getColumnVisible('routePath')" class="px-3 py-2 text-sm font-medium text-gray-900">路由路径</th>
              <th v-if="getColumnVisible('componentPath')" class="px-3 py-2 text-sm font-medium text-gray-900">组件路径</th>
              <th v-if="getColumnVisible('status')" class="px-3 py-2 text-sm font-medium text-gray-900">状态</th>
              <th v-if="getColumnVisible('sort')" class="px-3 py-2 text-sm font-medium text-gray-900">排序</th>
              <th v-if="getColumnVisible('actions')" class="px-3 py-2 text-sm font-medium text-gray-900 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in displayRows" :key="row.id" :class="['border-b transition-colors', expandedIds.has(row.id) ? 'bg-blue-50' : 'hover:bg-gray-50']">
              <td class="px-3 py-2 align-middle">
                <input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleSelection(row.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </td>
              <td v-if="getColumnVisible('id')" class="px-3 py-2 text-sm text-gray-700 truncate align-middle" :title="String(row.id)">{{ row.id }}</td>
              <td v-if="getColumnVisible('name')" class="px-3 py-2 text-sm text-gray-700 align-middle">
                <div class="flex items-center" :style="{ paddingLeft: row.level * 16 + 'px' }">
                  <button
                    v-if="row.hasChildren"
                    @click="toggleExpand(row.id)"
                    class="text-gray-500 hover:text-gray-700 mr-2"
                  >
                    <svg v-if="expandedIds.has(row.id)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span class="truncate max-w-[240px] inline-block" :title="row.name">{{ row.name }}</span>
                </div>
              </td>
              <td v-if="getColumnVisible('type')" class="px-3 py-2 text-sm align-middle">
                <span
                  :class="{
                    'text-green-600': row.type === 'directory',
                    'text-blue-600': row.type === 'menu',
                    'text-red-600': row.type === 'button'
                  }"
                >
                  {{ row.type === 'directory' ? '目录' : row.type === 'menu' ? '菜单' : '权限' }}
                </span>
              </td>
              <td v-if="getColumnVisible('permission')" class="px-3 py-2 text-sm text-gray-500 truncate align-middle" :title="row.permission || '-'">{{ row.permission || '-' }}</td>
              <td v-if="getColumnVisible('routeName')" class="px-3 py-2 text-sm text-gray-500 truncate align-middle" :title="row.routeName || '-'">{{ row.routeName || '-' }}</td>
              <td v-if="getColumnVisible('routePath')" class="px-3 py-2 text-sm text-gray-500 truncate align-middle" :title="row.routePath || '-'">{{ row.routePath || '-' }}</td>
              <td v-if="getColumnVisible('componentPath')" class="px-3 py-2 text-sm text-gray-500 truncate align-middle" :title="row.componentPath || '-'">{{ row.componentPath || '-' }}</td>
              <td v-if="getColumnVisible('status')" class="px-3 py-2 text-sm font-medium align-middle">
                <span :class="row.status === 'enabled' ? 'text-green-500' : 'text-gray-400'">
                  {{ row.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td v-if="getColumnVisible('sort')" class="px-3 py-2 text-sm text-gray-500 align-middle">{{ row.sort }}</td>
              <td v-if="getColumnVisible('actions')" class="px-3 py-2 flex justify-end items-center gap-2">
                <button @click="openEditModal(row)" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                  编辑
                </button>
                <button @click="deleteMenu(row)" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="displayRows.length === 0">
              <td :colspan="visibleColumnCount + 1" class="p-8 text-center text-gray-500 text-sm">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end items-center gap-4 mt-4 text-sm text-gray-600">
        <span>共 {{ flatMenu.length }} 条数据</span>
      </div>
    </div>

    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-xl w-[680px] max-h-[80vh] overflow-y-auto animate-fade-in">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 class="text-base font-medium text-gray-900">{{ modalType === 'add' ? '新增菜单管理' : '编辑菜单管理' }}</h3>
          <div class="flex items-center gap-2 text-gray-400">
            <button class="hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button @click="closeEditModal" class="hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="px-8 py-6 space-y-5">
          <div class="flex items-center">
            <label class="w-28 text-right text-sm text-gray-700 mr-4"><span class="text-red-500 mr-1">*</span>菜单名称：</label>
            <div class="flex-1 relative">
              <input
                v-model="editingForm.name"
                type="text"
                placeholder="请输入"
                class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div class="flex items-center">
            <label class="w-28 text-right text-sm text-gray-700 mr-4"><span class="text-red-500 mr-1">*</span>菜单类型：</label>
            <div class="flex-1">
              <label class="mr-6 text-sm text-gray-700">
                <input type="radio" value="directory" v-model="editingForm.type" class="mr-2 align-middle" />
                目录
              </label>
              <label class="mr-6 text-sm text-gray-700">
                <input type="radio" value="menu" v-model="editingForm.type" class="mr-2 align-middle" />
                菜单
              </label>
              <label class="text-sm text-gray-700">
                <input type="radio" value="button" v-model="editingForm.type" class="mr-2 align-middle" />
                权限
              </label>
            </div>
          </div>
          <div class="flex items-center" v-if="editingForm.type !== 'button'">
            <label class="w-28 text-right text-sm text-gray-700 mr-4"><span class="text-red-500 mr-1">*</span>路由名称：</label>
            <div class="flex-1">
              <input v-model="editingForm.routeName" type="text" placeholder="请输入" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-center" v-if="editingForm.type !== 'button'">
            <label class="w-28 text-right text-sm text-gray-700 mr-4"><span class="text-red-500 mr-1">*</span>路由路径：</label>
            <div class="flex-1">
              <input v-model="editingForm.routePath" type="text" placeholder="请输入" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-center" v-if="editingForm.type === 'menu'">
            <label class="w-28 text-right text-sm text-gray-700 mr-4">组件路径：</label>
            <div class="flex-1">
              <input v-model="editingForm.componentPath" type="text" placeholder="请输入" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-center" v-if="editingForm.type === 'button'">
            <label class="w-28 text-right text-sm text-gray-700 mr-4">权限标识：</label>
            <div class="flex-1">
              <input v-model="editingForm.permission" type="text" placeholder="system:user:add" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-center">
            <label class="w-28 text-right text-sm text-gray-700 mr-4">图标：</label>
            <div class="flex-1">
              <input v-model="editingForm.icon" type="text" placeholder="请输入" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-center">
            <label class="w-28 text-right text-sm text-gray-700 mr-4"><span class="text-red-500 mr-1">*</span>状态：</label>
            <div class="flex-1 relative">
              <select v-model="editingForm.status" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div class="flex items-center">
            <label class="w-28 text-right text-sm text-gray-700 mr-4">排序：</label>
            <div class="flex-1">
              <input v-model.number="editingForm.sort" type="number" placeholder="1" class="w-full h-10 rounded-lg px-3 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400" />
            </div>
          </div>
          <div class="flex items-start">
            <label class="w-28 text-right text-sm text-gray-700 mr-4">描述：</label>
            <div class="flex-1">
              <textarea v-model="editingForm.description" rows="3" placeholder="请输入" class="w-full rounded-lg px-3 py-2 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"></textarea>
            </div>
          </div>
        </div>
        <div class="flex justify-end items-center px-6 py-4 gap-4 border-t border-gray-200">
          <button @click="closeEditModal" class="px-5 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button @click="saveMenu" class="px-5 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from '@/components/common'

type MenuType = 'directory' | 'menu' | 'button'
type MenuStatus = 'enabled' | 'disabled'

interface MenuNode {
  id: number
  name: string
  permission?: string
  type: MenuType
  routeName?: string
  routePath?: string
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
  permission?: string
  type: MenuType
  routeName?: string
  routePath?: string
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
  { key: 'permission', label: '权限标识', visible: true },
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

const mockMenu: MenuNode[] = [
  {
    id: 1, name: '系统管理', type: 'directory', status: 'enabled', sort: 1, icon: 'settings',
    children: [
      { id: 11, name: '用户管理', type: 'menu', routeName: 'UserList', routePath: '/users', componentPath: 'views/users/List.vue', status: 'enabled', sort: 1 },
      { id: 12, name: '角色管理', type: 'menu', routeName: 'RoleList', routePath: '/roles', componentPath: 'views/roles/List.vue', status: 'enabled', sort: 2 },
      { id: 13, name: '权限按钮-新增', type: 'button', permission: 'system:user:add', status: 'enabled', sort: 3 }
    ]
  },
  {
    id: 2, name: '内容管理', type: 'directory', status: 'enabled', sort: 2,
    children: [
      { id: 21, name: '文章管理', type: 'menu', routeName: 'ArticleList', routePath: '/articles', componentPath: 'views/articles/List.vue', status: 'enabled', sort: 1 },
      { id: 22, name: '评论管理', type: 'menu', routeName: 'CommentList', routePath: '/comments', componentPath: 'views/comments/List.vue', status: 'enabled', sort: 2 },
      { id: 23, name: '权限按钮-删除', type: 'button', permission: 'content:comment:delete', status: 'disabled', sort: 3 },
      {
        id: 24, name: '运营', type: 'directory', status: 'enabled', sort: 4,
        children: [
          { id: 241, name: '活动管理', type: 'menu', routeName: 'CampaignList', routePath: '/ops/campaigns', componentPath: 'views/ops/CampaignList.vue', status: 'enabled', sort: 1 },
          { id: 242, name: '权限按钮-开启活动', type: 'button', permission: 'ops:campaign:start', status: 'enabled', sort: 2 }
        ]
      }
    ]
  }
]

const toFlat = (nodes: MenuNode[], level = 0): FlatRow[] => {
  const res: FlatRow[] = []
  for (const n of nodes) {
    res.push({
      id: n.id,
      name: n.name,
      permission: n.permission,
      type: n.type,
      routeName: n.routeName,
      routePath: n.routePath,
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
const refresh = () => { tree.value = JSON.parse(JSON.stringify(mockMenu)); expandedIds.value = new Set(); selectedIds.value = []; applySearch(); message.success('已刷新菜单数据') }

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

const batchDelete = () => {
  if (selectedIds.value.length === 0) {
    message.warning('请选择要删除的菜单项')
    return
  }
  if (!window.confirm('确认删除选中的菜单项吗？')) return
  const count = selectedIds.value.length
  const removeByIds = (nodes: MenuNode[]): MenuNode[] => {
    const out: MenuNode[] = []
    for (const n of nodes) {
      if (selectedIds.value.includes(n.id)) continue
      const children = n.children ? removeByIds(n.children) : undefined
      out.push(children ? { ...n, children } : { ...n, children: undefined })
    }
    return out
  }
  tree.value = removeByIds(tree.value)
  selectedIds.value = []
  applySearch()
  message.success(`已删除 ${count} 条菜单项`)
}

const deleteMenu = (row: FlatRow) => {
  if (!window.confirm('确认删除该菜单项吗？')) return
  const remove = (nodes: MenuNode[]): MenuNode[] => {
    const out: MenuNode[] = []
    for (const n of nodes) {
      if (n.id === row.id) continue
      const children = n.children ? remove(n.children) : undefined
      out.push(children ? { ...n, children } : { ...n, children: undefined })
    }
    return out
  }
  tree.value = remove(tree.value)
  selectedIds.value = selectedIds.value.filter(id => id !== row.id)
  applySearch()
  message.success('菜单项已删除')
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

const openEditModal = (row?: FlatRow) => {
  if (row) {
    modalType.value = 'edit'
    const node = findNodeById(row.id, tree.value)
    if (node) Object.assign(editingForm, node)
  } else {
    modalType.value = 'add'
    Object.assign(editingForm, { id: 0, name: '', type: 'menu', status: 'enabled', sort: 1, routeName: '', routePath: '', componentPath: '', permission: '' })
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

const saveMenu = () => {
  const name = editingForm.name.trim()
  if (!name) {
    message.warning('请填写菜单名称')
    return
  }
  const duplicateName = (nodes: MenuNode[]) => {
    for (const n of nodes) {
      if (n.id !== editingForm.id && n.name === name) return true
      if (n.children && duplicateName(n.children)) return true
    }
    return false
  }
  if (duplicateName(tree.value)) {
    message.warning('菜单名称已存在')
    return
  }
  if (modalType.value === 'add') {
    const maxId = maxNodeId(tree.value)
    const newNode: MenuNode = {
      id: maxId + 1,
      name,
      permission: editingForm.permission,
      type: editingForm.type,
      routeName: editingForm.routeName,
      routePath: editingForm.routePath,
      componentPath: editingForm.componentPath,
      status: editingForm.status,
      sort: editingForm.sort,
      icon: editingForm.icon,
      description: editingForm.description
    }
    tree.value.push(newNode)
  } else {
    const update = (nodes: MenuNode[]) => {
      for (const n of nodes) {
        if (n.id === editingForm.id) {
          n.name = name
          n.permission = editingForm.permission
          n.type = editingForm.type
          n.routeName = editingForm.routeName
          n.routePath = editingForm.routePath
          n.componentPath = editingForm.componentPath
          n.status = editingForm.status
          n.sort = editingForm.sort
          n.icon = editingForm.icon
          n.description = editingForm.description
          break
        }
        if (n.children) update(n.children)
      }
    }
    update(tree.value)
  }
  applySearch()
  closeEditModal()
  message.success(modalType.value === 'add' ? '菜单新增成功' : '菜单更新成功')
}

const maxNodeId = (nodes: MenuNode[]): number => {
  let max = 0
  const walk = (ns: MenuNode[]) => {
    for (const n of ns) {
      max = Math.max(max, n.id)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return max
}

const init = () => {
  tree.value = JSON.parse(JSON.stringify(mockMenu))
  applySearch()
}

init()
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>

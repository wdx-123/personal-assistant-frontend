<template>
  <div class="h-full flex flex-col gap-4">
    <!-- 顶部搜索栏 -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">API 路径:</label>
        <input 
          type="text" 
          placeholder="请输入" 
          v-model="searchQuery.path"
          class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">状态:</label>
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

    <!-- 主体内容区 -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col">
      <!-- 操作栏 -->
      <div class="flex justify-between items-center mb-4">
        <button 
          @click="batchDelete"
          :disabled="selectedIds.length === 0"
          :class="[
            'px-4 py-1.5 rounded text-sm border transition-colors flex items-center gap-1',
            selectedIds.length > 0 
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer' 
              : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
          ]"
        >
          批量删除 ({{ selectedIds.length }})
        </button>
        <div class="flex items-center gap-3">
          <button @click="openEditModal()" class="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1">
            新增API管理
          </button>
          <button @click="refresh" class="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <div class="relative">
            <button @click="toggleColumnFilter" class="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              列筛选
            </button>
            
            <!-- 列筛选下拉框 -->
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

      <!-- 表格 -->
      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="p-4 w-12">
                <input type="checkbox" v-model="isAllSelectedRows" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th v-if="getColumnVisible('path')" class="p-4 text-sm font-medium text-gray-900">API 路径</th>
              <th v-if="getColumnVisible('description')" class="p-4 text-sm font-medium text-gray-900">API 详情</th>
              <th v-if="getColumnVisible('category')" class="p-4 text-sm font-medium text-gray-900">API 分组</th>
              <th v-if="getColumnVisible('method')" class="p-4 text-sm font-medium text-gray-900">API 方法</th>
              <th v-if="getColumnVisible('status')" class="p-4 text-sm font-medium text-gray-900">状态</th>
              <th v-if="getColumnVisible('action')" class="p-4 text-sm font-medium text-gray-900 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="api in paginatedApis" :key="api.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="p-4">
                <input type="checkbox" :checked="selectedIds.includes(api.id)" @change="toggleSelection(api.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </td>
              <td v-if="getColumnVisible('path')" class="p-4 text-sm text-gray-700">{{ api.path }}</td>
              <td v-if="getColumnVisible('description')" class="p-4 text-sm text-gray-500">{{ api.description }}</td>
              <td v-if="getColumnVisible('category')" class="p-4 text-sm text-gray-700">{{ api.groupId ?? '-' }}</td>
              <td v-if="getColumnVisible('method')" class="p-4 text-sm text-gray-500">{{ api.method || '-' }}</td>
              <td v-if="getColumnVisible('status')" class="p-4 text-sm text-green-500 font-medium">
                <span :class="api.status === 'enabled' ? 'text-green-500' : 'text-gray-400'">
                  {{ api.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td v-if="getColumnVisible('action')" class="p-4 flex justify-end items-center gap-2">
                <button @click="openEditModal(api)" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                  编辑
                </button>
                <button @click="deleteApi(api.id)" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="paginatedApis.length === 0">
              <td :colspan="visibleColumnsCount + 1" class="p-8 text-center text-gray-500 text-sm">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="flex justify-end items-center gap-4 mt-4 text-sm text-gray-600">
        <span>共 {{ totalApis }} 条数据</span>
        <div class="flex items-center gap-1">
          <button 
            class="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            v-for="page in displayedPages" 
            :key="page"
            @click="changePage(page)"
            :class="[
              'px-3 py-1 rounded transition-colors',
              currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-200 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <button 
            class="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages || totalPages === 0"
            @click="changePage(currentPage + 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <select 
          v-model.number="pageSize"
          class="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
        </select>
      </div>
    </div>

    <!-- 编辑/新增弹窗 -->
    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[500px] animate-fade-in">
        <!-- 弹窗头部 -->
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 class="text-lg font-medium text-gray-800">{{ modalType === 'add' ? '新增API管理' : '编辑API管理' }}</h3>
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
        
        <!-- 弹窗内容 -->
        <div class="p-8 space-y-6">
          <!-- API路径 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4"><span class="text-red-500 mr-1">*</span>API路径：</label>
            <div class="flex-1 relative">
              <input 
                v-model="editingApi.path" 
                type="text" 
                placeholder="请输入"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <button v-if="editingApi.path" @click="editingApi.path = ''" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- API详情 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4"><span class="text-red-500 mr-1">*</span>API详情：</label>
            <div class="flex-1 relative">
              <input 
                v-model="editingApi.description" 
                type="text" 
                placeholder="请输入"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <button v-if="editingApi.description" @click="editingApi.description = ''" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- API分组 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4">API分组：</label>
            <div class="flex-1 relative">
              <input 
                v-model.number="editingApi.groupId" 
                type="number" 
                placeholder="请输入分组ID"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <button v-if="editingApi.groupId !== undefined && editingApi.groupId !== null" @click="editingApi.groupId = undefined" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- API方法 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4"><span class="text-red-500 mr-1">*</span>API方法：</label>
            <div class="flex-1">
              <select 
                v-model="editingApi.method"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors appearance-none bg-white"
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

          <!-- 状态 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4">状态：</label>
            <div class="flex-1 relative">
              <select 
                v-model="editingApi.status"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors appearance-none bg-white"
              >
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
        </div>
        
        <!-- 弹窗底部 -->
        <div class="flex justify-end items-center p-4 gap-3 border-t border-gray-100">
          <button @click="closeEditModal" class="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
          <button @click="saveApi" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getApiList, createApi, updateApi, deleteApi as removeApi } from '@/services/permission.service';
import type { ApiItem } from '@/types';

const searchQuery = ref({
  path: '',
  status: ''
});

// 列筛选相关逻辑
const columns = ref([
  { key: 'path', label: 'API 路径', visible: true },
  { key: 'description', label: 'API 详情', visible: true },
  { key: 'category', label: 'API 类别', visible: true },
  { key: 'method', label: 'API 方法', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'action', label: '操作', visible: true }
]);

const isColumnFilterOpen = ref(false);

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

const tempColumns = ref<ColumnConfig[]>([]);

const toggleColumnFilter = () => {
  if (!isColumnFilterOpen.value) {
    // 打开时复制当前状态
    tempColumns.value = JSON.parse(JSON.stringify(columns.value));
  }
  isColumnFilterOpen.value = !isColumnFilterOpen.value;
};

const closeColumnFilter = () => {
  isColumnFilterOpen.value = false;
};

const isAllSelected = computed({
  get: () => tempColumns.value.every(c => c.visible),
  set: (val) => tempColumns.value.forEach(c => c.visible = val)
});

const applyColumnFilter = () => {
  columns.value = JSON.parse(JSON.stringify(tempColumns.value));
  closeColumnFilter();
};

const getColumnVisible = (key: string) => {
  const col = columns.value.find(c => c.key === key);
  return col ? col.visible : true;
};

const visibleColumnsCount = computed(() => columns.value.filter(c => c.visible).length);

// 模拟数据
type ApiStatus = 'enabled' | 'disabled';

interface ApiRow {
  id: number;
  path: string;
  description: string;
  groupId?: number;
  method: string;
  status: ApiStatus;
}

const apis = ref<ApiRow[]>([]);
const totalApis = ref(0);

const toStatus = (status?: number): ApiStatus => (status === 1 ? 'enabled' : 'disabled');
const toStatusValue = (status?: string) => (status === 'enabled' ? 1 : status === 'disabled' ? 0 : undefined);
const toApiRow = (api: ApiItem): ApiRow => ({
  id: api.id,
  path: api.path,
  description: api.detail || '',
  groupId: api.group_id,
  method: api.method,
  status: toStatus(api.status)
});

// 搜索与分页逻辑
const currentPage = ref(1);
const pageSize = ref(20);

const filteredApis = computed(() => apis.value);

const totalPages = computed(() => Math.ceil(totalApis.value / pageSize.value));

const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  // 简化分页逻辑，仅显示部分页码
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
});

const paginatedApis = computed(() => {
  return apis.value;
});

const changePage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const search = () => {
  currentPage.value = 1;
  fetchApis();
};

const resetSearch = () => {
  searchQuery.value.path = '';
  searchQuery.value.status = '';
  currentPage.value = 1;
  fetchApis();
};

watch([pageSize], () => {
  currentPage.value = 1;
  fetchApis();
});

const refresh = () => {
  fetchApis();
};

const fetchApis = async () => {
  const data = await getApiList(
    {
      page: currentPage.value,
      page_size: pageSize.value,
      status: toStatusValue(searchQuery.value.status),
      keyword: searchQuery.value.path || undefined
    },
    { skipTip: true }
  );
  apis.value = data.list.map(toApiRow);
  totalApis.value = data.total;
  selectedIds.value = selectedIds.value.filter(id => apis.value.some(api => api.id === id));
};

// 选择与批量操作逻辑
const selectedIds = ref<number[]>([]);

const isAllSelectedRows = computed({
  get: () => paginatedApis.value.length > 0 && paginatedApis.value.every(r => selectedIds.value.includes(r.id)),
  set: (val) => {
    if (val) {
      const currentIds = paginatedApis.value.map(r => r.id);
      selectedIds.value = [...new Set([...selectedIds.value, ...currentIds])];
    } else {
      const currentIds = paginatedApis.value.map(r => r.id);
      selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id));
    }
  }
});

const toggleSelection = (id: number) => {
  const index = selectedIds.value.indexOf(id);
  if (index === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(index, 1);
  }
};

const batchDelete = () => {
  if (selectedIds.value.length === 0) return;
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 个API吗？`)) {
    Promise.all(selectedIds.value.map(id => removeApi(id))).then(() => {
      selectedIds.value = [];
      fetchApis();
    });
  }
};

const deleteApi = (id: number) => {
  if (confirm('确定要删除该API吗？')) {
    removeApi(id).then(() => {
      const index = selectedIds.value.indexOf(id);
      if (index !== -1) selectedIds.value.splice(index, 1);
      fetchApis();
    });
  }
};

// 编辑/新增逻辑
const isEditModalOpen = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const editingApi = reactive({
  id: 0,
  path: '',
  description: '',
  groupId: undefined as number | undefined,
  method: '',
  status: 'enabled'
});

const openEditModal = (api?: ApiRow) => {
  if (api) {
    modalType.value = 'edit';
    editingApi.id = api.id;
    editingApi.path = api.path;
    editingApi.description = api.description;
    editingApi.groupId = api.groupId;
    editingApi.method = api.method;
    editingApi.status = api.status;
  } else {
    modalType.value = 'add';
    editingApi.id = 0;
    editingApi.path = '';
    editingApi.description = '';
    editingApi.groupId = undefined;
    editingApi.method = '';
    editingApi.status = 'enabled';
  }
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const saveApi = () => {
  if (!editingApi.path || !editingApi.description || !editingApi.method) {
    alert('请填写所有必填项');
    return;
  }

  if (modalType.value === 'add') {
    createApi({
      path: editingApi.path,
      method: editingApi.method,
      detail: editingApi.description,
      group_id: editingApi.groupId,
      status: toStatusValue(editingApi.status)
    }).then(() => {
      closeEditModal();
      fetchApis();
    });
  } else {
    updateApi(editingApi.id, {
      path: editingApi.path,
      method: editingApi.method,
      detail: editingApi.description,
      group_id: editingApi.groupId,
      status: toStatusValue(editingApi.status)
    }).then(() => {
      closeEditModal();
      fetchApis();
    });
  }
};

onMounted(() => {
  fetchApis();
});

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

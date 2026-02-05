<template>
  <div class="h-full flex flex-col gap-4">
    <!-- 顶部搜索栏 -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">角色名称:</label>
        <input 
          type="text" 
          placeholder="请输入" 
          v-model="searchQuery.roleName"
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
            新增角色管理
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
              <th v-if="getColumnVisible('name')" class="p-4 text-sm font-medium text-gray-900">角色名称</th>
              <th v-if="getColumnVisible('key')" class="p-4 text-sm font-medium text-gray-900">角色标识</th>
              <th v-if="getColumnVisible('status')" class="p-4 text-sm font-medium text-gray-900">状态</th>
              <th v-if="getColumnVisible('updateTime')" class="p-4 text-sm font-medium text-gray-900">更新时间</th>
              <th v-if="getColumnVisible('action')" class="p-4 text-sm font-medium text-gray-900 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in paginatedRoles" :key="role.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="p-4">
                <input type="checkbox" :checked="selectedIds.includes(role.id)" @change="toggleSelection(role.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </td>
              <td v-if="getColumnVisible('name')" class="p-4 text-sm text-gray-700">{{ role.name }}</td>
              <td v-if="getColumnVisible('key')" class="p-4 text-sm text-gray-500">{{ role.key }}</td>
              <td v-if="getColumnVisible('status')" class="p-4 text-sm font-medium">
                <span :class="role.status === 'enabled' ? 'text-green-500' : 'text-gray-400'">
                  {{ role.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td v-if="getColumnVisible('updateTime')" class="p-4 text-sm text-gray-500">{{ role.updateTime }}</td>
              <td v-if="getColumnVisible('action')" class="p-4 flex justify-end items-center gap-2">
                <button @click="openPermissionModal(role)" class="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  修改权限
                </button>
                <button @click="openEditModal(role)" class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                  编辑
                </button>
                <button @click="deleteRole(role.id)" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="flex justify-end items-center gap-4 mt-4 text-sm text-gray-600">
        <span>共 {{ totalRoles }} 条数据</span>
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
            v-for="page in totalPages" 
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

    <!-- 编辑角色弹窗 -->
    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[500px] animate-fade-in">
        <!-- 弹窗头部 -->
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 class="text-lg font-medium text-gray-800">{{ modalType === 'add' ? '新增角色管理' : '编辑角色管理' }}</h3>
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
          <!-- 名称 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4"><span class="text-red-500 mr-1">*</span>名称：</label>
            <div class="flex-1 relative">
              <input 
                v-model="editingRole.name" 
                type="text" 
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <button v-if="editingRole.name" @click="editingRole.name = ''" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 角色标识 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4"><span class="text-red-500 mr-1">*</span>角色标识：</label>
            <div class="flex-1 relative">
              <input 
                v-model="editingRole.key" 
                type="text" 
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <button v-if="editingRole.key" @click="editingRole.key = ''" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 状态 -->
          <div class="flex items-center">
            <label class="w-24 text-right text-sm text-gray-600 mr-4">状态：</label>
            <div class="flex-1 relative">
              <select 
                v-model="editingRole.status"
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
          <button @click="saveRole" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>

    <!-- 修改权限弹窗 -->
    <div v-if="isPermissionModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[900px] h-[600px] flex flex-col animate-fade-in">
        <!-- 弹窗头部 -->
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-800">修改权限 - {{ permissionRole.name }}</h3>
          </div>
          <button @click="closePermissionModal" class="hover:text-gray-600 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="flex-1 p-6 flex gap-6 overflow-hidden">
          <!-- 功能权限 -->
          <div class="flex-1 flex flex-col border border-gray-100 rounded-lg shadow-sm">
            <div class="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="font-medium text-gray-700">功能权限</span>
            </div>
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div v-for="item in functionalPermissions" :key="item.id" class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <button @click="item.expanded = !item.expanded" class="text-gray-400 hover:text-gray-600">
                    <svg :class="{'rotate-90': item.expanded}" class="h-4 w-4 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <input type="checkbox" :id="'func-'+item.id" :checked="isMenuChecked(item.id)" @change="toggleMenuSelection(item)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label :for="'func-'+item.id" class="text-sm text-gray-700 select-none">{{ item.label }}</label>
                </div>
                <div v-if="item.expanded" class="ml-6 border-l border-gray-200 pl-4 space-y-2">
                  <div v-for="sub in item.children" :key="sub.id">
                    <div class="flex items-center gap-2 mb-1">
                      <button v-if="sub.children && sub.children.length" @click="sub.expanded = !sub.expanded" class="text-gray-400 hover:text-gray-600">
                        <svg :class="{'rotate-90': sub.expanded}" class="h-3 w-3 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div v-else class="w-3"></div>
                      <input type="checkbox" :id="'func-'+sub.id" :checked="isMenuChecked(sub.id)" @change="toggleMenuSelection(sub)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label :for="'func-'+sub.id" class="text-sm text-gray-700 select-none">{{ sub.label }}</label>
                    </div>
                    <!-- 第三级 -->
                    <div v-if="sub.expanded && sub.children" class="ml-6 border-l border-gray-200 pl-4 space-y-1 mt-1">
                      <div v-for="child in sub.children" :key="child.id" class="flex items-center gap-2">
                        <input type="checkbox" :id="'func-'+child.id" :checked="isMenuChecked(child.id)" @change="toggleMenuSelection(child)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label :for="'func-'+child.id" class="text-sm text-gray-600 select-none">{{ child.label }}</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 数据权限 -->
          <div class="flex-1 flex flex-col border border-gray-100 rounded-lg shadow-sm">
            <div class="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="font-medium text-gray-700">数据权限</span>
            </div>
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div v-for="item in dataPermissions" :key="item.id" class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <button @click="item.expanded = !item.expanded" class="text-gray-400 hover:text-gray-600">
                    <svg :class="{'rotate-90': item.expanded}" class="h-4 w-4 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <input type="checkbox" :id="'data-'+item.id" disabled class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label :for="'data-'+item.id" class="text-sm text-gray-700 select-none">{{ item.label }}</label>
                </div>
                <div v-if="item.expanded" class="ml-6 border-l border-gray-200 pl-4 space-y-2">
                  <div v-for="sub in item.children" :key="sub.id">
                    <div class="flex items-center gap-2 mb-1">
                      <input type="checkbox" :id="'data-'+sub.id" disabled class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label :for="'data-'+sub.id" class="text-sm text-gray-500 font-mono select-none">{{ sub.label }}</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 弹窗底部 -->
        <div class="flex justify-end items-center p-4 gap-3 border-t border-gray-100">
          <button @click="closePermissionModal" class="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button @click="savePermission" class="px-6 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getRoleList, createRole, updateRole, deleteRole as removeRole, getMenuTree, getRoleMenuIds, assignRoleMenu, getApiList } from '@/services/permission.service';
import type { RoleItem, MenuItem, ApiItem } from '@/types';

const searchQuery = ref({
  roleName: '',
  status: ''
});

// 列筛选相关逻辑
const columns = ref([
  { key: 'name', label: '角色名称', visible: true },
  { key: 'key', label: '角色标识', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'updateTime', label: '更新时间', visible: true },
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

type RoleStatus = 'enabled' | 'disabled';

interface RoleRow {
  id: number;
  name: string;
  key: string;
  status: RoleStatus;
  updateTime: string;
  desc?: string;
}

interface PermissionNode {
  id: number;
  label: string;
  expanded?: boolean;
  children?: PermissionNode[];
}

const roles = ref<RoleRow[]>([]);
const totalRoles = ref(0);

const toStatus = (status?: number): RoleStatus => (status === 1 ? 'enabled' : 'disabled');
const toStatusValue = (status?: string) => (status === 'enabled' ? 1 : status === 'disabled' ? 0 : undefined);
interface RoleItemWithTime extends RoleItem {
  updated_at?: string;
}

const toRoleRow = (role: RoleItemWithTime): RoleRow => ({
  id: role.id,
  name: role.name,
  key: role.code,
  status: toStatus(role.status),
  updateTime: role.updated_at ?? '-',
  desc: role.desc
});

// 搜索与分页逻辑
const currentPage = ref(1);
const pageSize = ref(20);

const filteredRoles = computed(() => roles.value);

const paginatedRoles = computed(() => {
  return roles.value;
});

const totalPages = computed(() => Math.ceil(totalRoles.value / pageSize.value));

const fetchRoles = async () => {
  const data = await getRoleList(
    {
      page: currentPage.value,
      page_size: pageSize.value,
      status: toStatusValue(searchQuery.value.status),
      keyword: searchQuery.value.roleName || undefined
    },
    { skipTip: true }
  );
  roles.value = data.list.map(toRoleRow);
  totalRoles.value = data.total;
  selectedIds.value = selectedIds.value.filter(id => roles.value.some(role => role.id === id));
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchRoles();
  }
};

watch([pageSize], () => {
  currentPage.value = 1;
  fetchRoles();
});

const search = () => {
  currentPage.value = 1;
  fetchRoles();
};

const resetSearch = () => {
  searchQuery.value.roleName = '';
  searchQuery.value.status = '';
  currentPage.value = 1;
  fetchRoles();
};

const refresh = () => {
  fetchRoles();
};

// 选择与批量操作逻辑
const selectedIds = ref<number[]>([]);

const isAllSelectedRows = computed({
  get: () => paginatedRoles.value.length > 0 && paginatedRoles.value.every(r => selectedIds.value.includes(r.id)),
  set: (val) => {
    if (val) {
      const currentIds = paginatedRoles.value.map(r => r.id);
      selectedIds.value = [...new Set([...selectedIds.value, ...currentIds])];
    } else {
      const currentIds = paginatedRoles.value.map(r => r.id);
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
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 个角色吗？`)) {
    Promise.all(selectedIds.value.map(id => removeRole(id))).then(() => {
      selectedIds.value = [];
      fetchRoles();
    });
  }
};

const deleteRole = (id: number) => {
  if (confirm('确定要删除该角色吗？')) {
    removeRole(id).then(() => {
      const index = selectedIds.value.indexOf(id);
      if (index !== -1) selectedIds.value.splice(index, 1);
      fetchRoles();
    });
  }
};

// 编辑/新增角色相关逻辑
const isEditModalOpen = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const editingRole = reactive({
  id: 0,
  name: '',
  key: '',
  status: 'enabled'
});

const openEditModal = (role?: RoleRow) => {
  if (role) {
    modalType.value = 'edit';
    editingRole.id = role.id;
    editingRole.name = role.name;
    editingRole.key = role.key;
    editingRole.status = role.status;
  } else {
    modalType.value = 'add';
    editingRole.id = 0;
    editingRole.name = '';
    editingRole.key = '';
    editingRole.status = 'enabled';
  }
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const saveRole = () => {
  if (modalType.value === 'add') {
    createRole({
      name: editingRole.name,
      code: editingRole.key
    }).then(() => {
      closeEditModal();
      fetchRoles();
    });
  } else {
    updateRole(editingRole.id, {
      name: editingRole.name,
      code: editingRole.key,
      status: toStatusValue(editingRole.status)
    }).then(() => {
      closeEditModal();
      fetchRoles();
    });
  }
};

// 权限管理相关逻辑
const isPermissionModalOpen = ref(false);
const permissionRole = reactive({
  id: 0,
  name: ''
});

// 模拟功能权限数据
const functionalPermissions = ref<PermissionNode[]>([]);
const dataPermissions = ref<PermissionNode[]>([]);
const selectedMenuIds = ref<Set<number>>(new Set());

const mapMenuTree = (items: MenuItem[]): PermissionNode[] => {
  return items.map(item => ({
    id: item.id,
    label: item.name,
    expanded: true,
    children: item.children ? mapMenuTree(item.children) : []
  }));
};

const mapApiPermissions = (items: ApiItem[]): PermissionNode[] => {
  const groups = new Map<number, PermissionNode>();
  let index = 1;
  items.forEach(item => {
    const groupId = item.group_id ?? -index;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        label: item.group_id ? `分组 ${item.group_id}` : '未分组',
        expanded: true,
        children: []
      });
      if (!item.group_id) index += 1;
    }
    groups.get(groupId)!.children!.push({
      id: item.id,
      label: `${item.method} ${item.path}`
    });
  });
  return Array.from(groups.values());
};

const collectMenuIds = (node: PermissionNode): number[] => {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach(child => ids.push(...collectMenuIds(child)));
  }
  return ids;
};

const updateSelectedMenuIds = (ids: number[], selected: boolean) => {
  const next = new Set(selectedMenuIds.value);
  ids.forEach(id => {
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
  });
  selectedMenuIds.value = next;
};

const isMenuChecked = (id: number) => selectedMenuIds.value.has(id);
const toggleMenuSelection = (node: PermissionNode) => {
  const ids = collectMenuIds(node);
  const shouldSelect = ids.some(id => !selectedMenuIds.value.has(id));
  updateSelectedMenuIds(ids, shouldSelect);
};

const openPermissionModal = async (role: RoleRow) => {
  permissionRole.id = role.id;
  permissionRole.name = role.name;
  const [menuTree, roleMenuIds, apiPage] = await Promise.all([
    getMenuTree({ skipTip: true }),
    getRoleMenuIds(role.id, { skipTip: true }),
    getApiList({ page: 1, page_size: 1000 }, { skipTip: true })
  ]);
  functionalPermissions.value = mapMenuTree(menuTree);
  dataPermissions.value = mapApiPermissions(apiPage.list);
  selectedMenuIds.value = new Set(roleMenuIds);
  isPermissionModalOpen.value = true;
};

const closePermissionModal = () => {
  isPermissionModalOpen.value = false;
};

const savePermission = () => {
  assignRoleMenu({
    role_id: permissionRole.id,
    menu_ids: Array.from(selectedMenuIds.value)
  }).then(() => {
    closePermissionModal();
  });
};

onMounted(() => {
  fetchRoles();
});
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
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

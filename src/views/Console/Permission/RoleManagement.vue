<template>
  <div class="h-full flex flex-col gap-4">
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">角色名称:</label>
        <input
          v-model="searchQuery.roleName"
          type="text"
          placeholder="请输入"
          @keyup.enter="search"
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

    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col">
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
            新增角色管理
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
              <td v-if="getColumnVisible('name')" class="p-4 text-sm text-gray-700 truncate" :title="role.name">{{ role.name }}</td>
              <td v-if="getColumnVisible('key')" class="p-4 text-sm text-gray-500 truncate" :title="role.key">{{ role.key }}</td>
              <td v-if="getColumnVisible('status')" class="p-4 text-sm font-medium">
                <span :class="role.status === 'enabled' ? 'text-green-500' : 'text-gray-400'">
                  {{ role.status === 'enabled' ? '启用' : '禁用' }}
                </span>
              </td>
              <td v-if="getColumnVisible('updateTime')" class="p-4 text-sm text-gray-500 truncate" :title="role.updateTime">{{ role.updateTime }}</td>
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
            <tr v-if="paginatedRoles.length === 0">
              <td :colspan="visibleColumnCount + 1" class="p-8 text-center text-gray-500 text-sm">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[500px] animate-fade-in">
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
        <div class="p-8 space-y-6">
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
        <div class="flex justify-end items-center p-4 gap-3 border-t border-gray-100">
          <button @click="closeEditModal" class="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
          <button @click="saveRole" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">{{ modalType === 'add' ? '新增' : '更新' }}</button>
        </div>
      </div>
    </div>

    <div v-if="isPermissionModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[900px] h-[600px] flex flex-col animate-fade-in">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.940-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
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
        <div class="flex-1 p-6 flex gap-6 overflow-hidden">
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
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" :checked="isMenuChecked(item.id)" @change="toggleMenuSelection(item)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-gray-700">{{ item.label }}</span>
                  </label>
                </div>
                <div v-if="item.children && item.expanded" class="ml-6 space-y-2">
                  <div v-for="child in item.children" :key="child.id" class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" :checked="isMenuChecked(child.id)" @change="toggleMenuSelection(child)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-gray-700">{{ child.label }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 flex flex-col border border-gray-100 rounded-lg shadow-sm">
            <div class="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="font-medium text-gray-700">数据权限</span>
            </div>
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div v-for="group in dataPermissions" :key="group.id" class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <button @click="group.expanded = !group.expanded" class="text-gray-400 hover:text-gray-600">
                    <svg :class="{'rotate-90': group.expanded}" class="h-4 w-4 transform transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span class="text-sm text-gray-700">{{ group.label }}</span>
                </div>
                <div v-if="group.children && group.expanded" class="ml-6 space-y-2">
                  <div v-for="api in group.children" :key="api.id" class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" :checked="isApiChecked(api.id)" @change="toggleApiSelection(api.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-gray-700">{{ api.label }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end items-center p-4 gap-3 border-t border-gray-100">
          <button @click="closePermissionModal" class="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button @click="savePermission" class="px-6 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from '@/components/common'

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
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return roles.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(totalRoles.value / pageSize.value))

const mockRoles: RoleRow[] = [
  { id: 1, name: '团长', key: 'SchoolAdmin', status: 'enabled', updateTime: '2025-11-07 17:21:28' },
  { id: 2, name: '城市管理员', key: 'CityAdmin', status: 'enabled', updateTime: '2025-11-07 17:21:40' },
  { id: 3, name: '超级管理员', key: 'SuperAdmin', status: 'enabled', updateTime: '2025-08-04 09:22:50' },
  { id: 4, name: '老g', key: 'g', status: 'enabled', updateTime: '2026-01-31 19:21:30' }
]

const applySearch = () => {
  const keyword = searchQuery.value.roleName.trim().toLowerCase()
  const status = searchQuery.value.status
  const filtered = allRoles.value.filter(r => {
    const nameMatch = !keyword || r.name.toLowerCase().includes(keyword)
    const statusMatch = !status || r.status === status
    return nameMatch && statusMatch
  })
  roles.value = filtered
  totalRoles.value = filtered.length
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1
  }
}

const search = () => {
  currentPage.value = 1
  applySearch()
}

const resetSearch = () => {
  searchQuery.value.roleName = ''
  searchQuery.value.status = ''
  currentPage.value = 1
  selectedIds.value = []
  applySearch()
}

const refresh = () => {
  allRoles.value = [...mockRoles]
  selectedIds.value = []
  applySearch()
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

const batchDelete = () => {
  if (selectedIds.value.length === 0) {
    message.warning('请选择要删除的角色')
    return
  }
  if (!window.confirm('确认删除选中的角色吗？')) return
  const count = selectedIds.value.length
  allRoles.value = allRoles.value.filter(r => !selectedIds.value.includes(r.id))
  selectedIds.value = []
  applySearch()
  message.success(`已删除 ${count} 条角色`)
}

const deleteRole = (id: number) => {
  if (!window.confirm('确认删除该角色吗？')) return
  allRoles.value = allRoles.value.filter(r => r.id !== id)
  selectedIds.value = selectedIds.value.filter(i => i !== id)
  applySearch()
  message.success('角色已删除')
}

const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const editingRole = reactive({
  id: 0,
  name: '',
  key: '',
  status: 'enabled' as RoleStatus
})

const openEditModal = (role?: RoleRow) => {
  if (role) {
    modalType.value = 'edit'
    Object.assign(editingRole, role)
  } else {
    modalType.value = 'add'
    Object.assign(editingRole, { id: 0, name: '', key: '', status: 'enabled' as RoleStatus })
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const saveRole = () => {
  const name = editingRole.name.trim()
  const key = editingRole.key.trim()
  if (!name || !key) {
    message.warning('请填写完整的角色信息')
    return
  }
  const duplicated = allRoles.value.some(r => r.id !== editingRole.id && (r.name === name || r.key === key))
  if (duplicated) {
    message.warning('角色名称或标识已存在')
    return
  }
  if (modalType.value === 'add') {
    const maxId = allRoles.value.reduce((m, r) => Math.max(m, r.id), 0)
    allRoles.value.unshift({
      id: maxId + 1,
      name,
      key,
      status: editingRole.status as RoleStatus,
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
  } else {
    allRoles.value = allRoles.value.map(r => r.id === editingRole.id ? { ...r, name, key, status: editingRole.status as RoleStatus, updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ') } : r)
  }
  applySearch()
  closeEditModal()
  message.success(modalType.value === 'add' ? '角色新增成功' : '角色更新成功')
}

const isPermissionModalOpen = ref(false)
const permissionRole = reactive({
  id: 0,
  name: ''
})

const functionalPermissions = ref<PermissionNode[]>([
  { id: 101, label: '用户管理', expanded: true, children: [{ id: 102, label: '新增用户' }, { id: 103, label: '删除用户' }] },
  { id: 201, label: '组织管理', expanded: true, children: [{ id: 202, label: '新增组织' }, { id: 203, label: '删除组织' }] }
])
const dataPermissions = ref<PermissionNode[]>([
  { id: 301, label: '评论管理', expanded: true, children: [{ id: 302, label: 'GET /order/back/comment/list' }, { id: 303, label: 'PUT /order/back/comment/convert' }] },
  { id: 401, label: '轮播图', expanded: true, children: [{ id: 402, label: 'GET /carousel/list' }, { id: 403, label: 'DELETE /carousel/delete' }] }
])
const selectedMenuIds = ref<Set<number>>(new Set())
const selectedApiIds = ref<Set<number>>(new Set())

const collectMenuIds = (node: PermissionNode): number[] => {
  const ids = [node.id]
  if (node.children) node.children.forEach(c => ids.push(c.id))
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

const toggleApiSelection = (id: number) => {
  const next = new Set(selectedApiIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
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
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

const init = () => {
  allRoles.value = [...mockRoles]
  applySearch()
}

init()
</script>

<style scoped>
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

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">关键词:</label>
        <input 
          type="text" 
          placeholder="用户名/手机号" 
          v-model="searchQuery.keyword"
          class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">组织:</label>
        <select 
          v-model.number="searchQuery.orgId"
          class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 text-gray-600"
        >
          <option :value="undefined">全部</option>
          <option v-for="org in orgOptions" :key="org.id" :value="org.id">{{ org.name }}</option>
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
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <button @click="refresh" class="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
        <div class="relative">
          <button @click="toggleColumnFilter" class="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            列筛选
          </button>
          <div v-if="isColumnFilterOpen" class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
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

      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th v-if="getColumnVisible('username')" class="p-4 text-sm font-medium text-gray-900">用户名</th>
              <th v-if="getColumnVisible('phone')" class="p-4 text-sm font-medium text-gray-900">手机号</th>
              <th v-if="getColumnVisible('org')" class="p-4 text-sm font-medium text-gray-900">当前组织</th>
              <th v-if="getColumnVisible('roles')" class="p-4 text-sm font-medium text-gray-900">角色</th>
              <th v-if="getColumnVisible('action')" class="p-4 text-sm font-medium text-gray-900 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td v-if="getColumnVisible('username')" class="p-4 text-sm text-gray-700">{{ user.username }}</td>
              <td v-if="getColumnVisible('phone')" class="p-4 text-sm text-gray-500">{{ user.phone || '-' }}</td>
              <td v-if="getColumnVisible('org')" class="p-4 text-sm text-gray-700">{{ user.orgName || '-' }}</td>
              <td v-if="getColumnVisible('roles')" class="p-4 text-sm text-gray-500">{{ user.roleNames || '-' }}</td>
              <td v-if="getColumnVisible('action')" class="p-4 table-action-cell">
                <button @click="openRoleModal(user)" class="table-action-btn table-action-btn--primary">
                  配置角色
                </button>
              </td>
            </tr>
            <tr v-if="paginatedUsers.length === 0">
              <td :colspan="visibleColumnsCount" class="p-8 text-center text-gray-500 text-sm">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end items-center gap-4 mt-4 text-sm text-gray-600">
        <span>共 {{ totalUsers }} 条数据</span>
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

    <div v-if="isRoleModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 class="text-lg font-medium text-gray-800">配置角色 - {{ roleModalUser.username }}</h3>
          <button @click="closeRoleModal" class="hover:text-gray-600 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-4 overflow-auto">
          <div class="flex items-center gap-3">
            <label class="text-sm text-gray-600 w-20">组织</label>
            <select 
              v-model.number="roleModalUser.orgId"
              class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option :value="undefined">请选择</option>
              <option v-for="org in orgOptions" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>
          <div class="border border-gray-100 rounded-lg">
            <div class="px-4 py-2 border-b border-gray-100 bg-gray-50 text-sm text-gray-700">角色列表</div>
            <div class="p-4 grid grid-cols-2 gap-3">
              <label v-for="role in roleOptions" :key="role.id" class="flex items-center gap-2 text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  :checked="selectedRoleIds.includes(role.id)"
                  @change="toggleRole(role.id)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{{ role.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end items-center p-4 gap-3 border-t border-gray-100">
          <button @click="closeRoleModal" class="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
          <button @click="saveUserRoles" class="px-6 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-sm">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { getUserList, getUserRoles, assignUserRole, getRoleList, getOrgList } from '@/services/permission.service';
import type { UserListItem, RoleItem, OrgItem } from '@/types';

interface UserRow {
  id: number;
  username: string;
  phone?: string;
  orgId?: number;
  orgName?: string;
  roleNames?: string;
}

const searchQuery = ref({
  keyword: '',
  orgId: undefined as number | undefined
});

const columns = ref([
  { key: 'username', label: '用户名', visible: true },
  { key: 'phone', label: '手机号', visible: true },
  { key: 'org', label: '当前组织', visible: true },
  { key: 'roles', label: '角色', visible: true },
  { key: 'action', label: '操作', visible: true }
]);

const isColumnFilterOpen = ref(false);
const tempColumns = ref<any[]>([]);

const toggleColumnFilter = () => {
  if (!isColumnFilterOpen.value) {
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

const users = ref<UserRow[]>([]);
const totalUsers = ref(0);
const orgOptions = ref<OrgItem[]>([]);
const roleOptions = ref<RoleItem[]>([]);

const currentPage = ref(1);
const pageSize = ref(20);

const paginatedUsers = computed(() => users.value);
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value));

const fetchUsers = async () => {
  const data = await getUserList(
    {
      page: currentPage.value,
      page_size: pageSize.value,
      org_id: searchQuery.value.orgId,
      keyword: searchQuery.value.keyword || undefined
    },
    { skipTip: true }
  );
  users.value = data.list.map((user: UserListItem) => ({
    id: user.id,
    username: user.username,
    phone: user.phone,
    orgId: user.current_org?.id,
    orgName: user.current_org?.name,
    roleNames: user.roles?.map(role => role.name).join('、')
  }));
  totalUsers.value = data.total;
};

const fetchOrgOptions = async () => {
  const data = await getOrgList({ page: 1, page_size: 1000 }, { skipTip: true });
  orgOptions.value = data.list;
};

const fetchRoleOptions = async () => {
  const data = await getRoleList({ page: 1, page_size: 1000 }, { skipTip: true });
  roleOptions.value = data.list;
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchUsers();
  }
};

watch([pageSize], () => {
  currentPage.value = 1;
  fetchUsers();
});

const search = () => {
  currentPage.value = 1;
  fetchUsers();
};

const resetSearch = () => {
  searchQuery.value.keyword = '';
  searchQuery.value.orgId = undefined;
  currentPage.value = 1;
  fetchUsers();
};

const refresh = () => {
  fetchUsers();
};

const isRoleModalOpen = ref(false);
const roleModalUser = reactive({
  id: 0,
  username: '',
  orgId: undefined as number | undefined
});
const selectedRoleIds = ref<number[]>([]);

const openRoleModal = async (user: UserRow) => {
  roleModalUser.id = user.id;
  roleModalUser.username = user.username;
  roleModalUser.orgId = user.orgId ?? orgOptions.value[0]?.id;
  if (roleModalUser.orgId) {
    const roles = await getUserRoles(user.id, roleModalUser.orgId, { skipTip: true });
    selectedRoleIds.value = roles.map(role => role.id);
  } else {
    selectedRoleIds.value = [];
  }
  isRoleModalOpen.value = true;
};

const closeRoleModal = () => {
  isRoleModalOpen.value = false;
};

const toggleRole = (roleId: number) => {
  if (selectedRoleIds.value.includes(roleId)) {
    selectedRoleIds.value = selectedRoleIds.value.filter(id => id !== roleId);
  } else {
    selectedRoleIds.value = [...selectedRoleIds.value, roleId];
  }
};

const saveUserRoles = () => {
  if (!roleModalUser.orgId) return;
  assignUserRole({
    user_id: roleModalUser.id,
    org_id: roleModalUser.orgId,
    role_ids: selectedRoleIds.value
  }).then(() => {
    closeRoleModal();
    fetchUsers();
  });
};

watch(
  () => roleModalUser.orgId,
  (orgId) => {
    if (!isRoleModalOpen.value || !orgId) return;
    getUserRoles(roleModalUser.id, orgId, { skipTip: true }).then(roles => {
      selectedRoleIds.value = roles.map(role => role.id);
    });
  }
);

onMounted(() => {
  fetchOrgOptions();
  fetchRoleOptions();
  fetchUsers();
});
</script>

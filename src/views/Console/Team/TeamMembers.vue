<template>
  <div class="page-container">
    <!-- 团队概览头部 -->
    <div class="team-header-card">
      <div class="team-summary">
        <div class="team-avatar-lg" :style="{ backgroundColor: getAvatarColor(currentOrg?.name || '') }">
          {{ (currentOrg?.name || '组').charAt(0).toUpperCase() }}
        </div>
        <div class="team-details">
          <div class="team-title-row">
            <h2 class="team-title">{{ currentOrg?.name || '未选择组织' }}</h2>
            <span class="role-badge">所有者</span>
          </div>
          <p class="team-description">{{ currentOrg?.description || '暂无组织描述' }}</p>
          <div class="team-stats">
            <div class="stat-item">
              <span class="stat-label">成员数</span>
              <span class="stat-value">{{ pagination.total }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">{{ currentOrg?.createdAt || '-' }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">状态</span>
              <span class="stat-value status-active">活跃</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-search">
        <div class="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索用户名、邮箱..." 
            class="search-input"
            @keydown.enter="searchMembers"
          />
        </div>
        <button
          class="btn btn-primary"
          @click="searchMembers"
        >
          搜索
        </button>
        <button
          class="btn btn-secondary"
          @click="resetSearch"
        >
          重置
        </button>
        <button
          v-permission="['permission:org:exit']"
          class="btn btn-danger"
          @click="handleLeaveTeam"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出团队
        </button>
      </div>
    </div>

    <!-- 成员列表表格 -->
    <div class="content-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-index">序号</th>
              <th class="col-avatar">头像</th>
              <th class="col-name">用户名</th>
              <th class="col-role">角色</th>
              <th class="col-phone">手机号</th>
              <th class="col-status">状态</th>
              <th class="col-action text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(member, index) in filteredMembers" :key="member.id">
              <td class="col-index">{{ (pagination.current - 1) * pagination.pageSize + index + 1 }}</td>
              <td class="col-avatar">
                <img :src="member.avatar" alt="avatar" class="member-avatar" />
              </td>
              <td class="col-name">
                <div class="user-info">
                  <span class="username">{{ member.username }}</span>
                  <span class="user-id">ID: {{ member.id }}</span>
                </div>
              </td>
              <td class="col-role">
                <span class="role-tag" :class="getRoleClass(member.role)">{{ member.role }}</span>
              </td>
              <td class="col-phone">{{ member.phone }}</td>
              <td class="col-status">
                <span class="status-dot" :class="member.status === 'enabled' ? 'bg-green' : 'bg-red'"></span>
                {{ member.status === 'enabled' ? '启用' : '禁用' }}
              </td>
              <td class="col-action">
                <div class="action-buttons">
                  <button
                    v-permission="['permission:user:role:assign']"
                    class="btn-xs btn-primary"
                    @click="handleEditMember(member)"
                  >
                    编辑
                  </button>
                  <button
                    v-permission="['permission:org:member:remove']"
                    class="btn-xs btn-danger"
                    @click="handleDeleteMember(member)"
                  >
                    移除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="membersLoading">
              <td colspan="7" class="empty-cell">成员加载中...</td>
            </tr>
            <tr v-else-if="membersNoPermission">
              <td colspan="7" class="empty-cell">你没有权限访问</td>
            </tr>
            <tr v-else-if="filteredMembers.length === 0">
              <td colspan="7" class="empty-cell">暂无成员数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-wrapper">
        <a-pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-quick-jumper="false"
          :page-size-options="['5', '10', '20', '50']"
          :show-total="(total:number) => `共 ${total} 条数据`"
          @change="handlePageChange"
          @showSizeChange="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 模态框 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ modalTitle }}</h3>
        <div class="form-group">
          <label class="form-label">分配角色</label>
          <select v-model="selectedRoleId" class="form-select">
            <option v-for="role in roleOptions" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn btn-secondary" :disabled="modalLoading">取消</button>
          <button
            v-permission="['permission:user:assign_role', 'permission:user:role:assign']"
            @click="handleSaveMember"
            class="btn btn-primary"
            :disabled="modalLoading || !selectedRoleId"
          >
            {{ modalLoading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message, Confirm } from '@/components/common'
import { getOrgList, getUserList, removeOrgMember, leaveOrg, getRoleList, assignUserRole } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth'
import type { OrgItem } from '@/types'
import { isPermissionDenied } from '@/utils/request'

interface Member {
  id: number
  username: string
  avatar: string
  role: string
  roleIds: number[]
  phone: string
  status: 'enabled' | 'disabled'
}

interface OrgOption {
  id: number
  name: string
  description: string
  createdAt: string
}

const authStore = useAuthStore()
const router = useRouter()
const members = ref<Member[]>([])
const membersLoading = ref(false)
const membersNoPermission = ref(false)
const orgs = ref<OrgOption[]>([])
const targetOrgId = ref<number>(0)

const searchQuery = ref('')
const showModal = ref(false)
const modalTitle = ref('')
const roleOptions = ref<{id: number, name: string}[]>([])
const selectedRoleId = ref<number | undefined>(undefined)
const editingMemberId = ref<number | undefined>(undefined)
const modalLoading = ref(false)

const fetchRoles = async () => {
  try {
    const data = await getRoleList({ page: 0, page_size: 100 }, { skipSuccTip: true })
    roleOptions.value = (data?.list || []).map((r: any) => ({ id: r.id, name: r.name }))
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    roleOptions.value = []
  }
}

const handleSaveMember = async () => {
  if (!selectedRoleId.value || !editingMemberId.value) return
  
  modalLoading.value = true
  try {
    await assignUserRole({
      user_id: editingMemberId.value,
      org_id: targetOrgId.value || currentOrgId.value,
      role_ids: [selectedRoleId.value]
    }, { skipSuccTip: true })
    message.success('角色分配成功')
    showModal.value = false
    await fetchMembers()
  } catch (e) {
    console.error(e)
  } finally {
    modalLoading.value = false
  }
}
const currentOrgId = computed(() => authStore.user?.current_org_id || 0)
const currentOrg = computed(() => orgs.value.find((item) => item.id === targetOrgId.value))
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const mapOrg = (item: OrgItem): OrgOption => ({
  id: item.id,
  name: item.name || '-',
  description: item.description || '',
  createdAt: item.created_at ? String(item.created_at).slice(0, 10) : '-'
})

const getAvatarColor = (name: string) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const fetchOrgs = async () => {
  try {
    const data = await getOrgList({ page: 0, page_size: 0 }, { skipSuccTip: true })
    orgs.value = (data?.list || []).map(mapOrg)
    if (!targetOrgId.value) {
      targetOrgId.value = currentOrgId.value || orgs.value[0]?.id || 0
    }
  } catch (error) {
    orgs.value = []
  }
}

const fetchMembers = async () => {
  const orgId = targetOrgId.value || currentOrgId.value
  if (!orgId) {
    members.value = []
    return
  }

  membersLoading.value = true
  try {
    const data = await getUserList(
      {
        page: pagination.value.current,
        page_size: pagination.value.pageSize,
        org_id: orgId,
        keyword: searchQuery.value.trim() || undefined
      },
      { skipSuccTip: true, skipErrTip: true }
    )
    membersNoPermission.value = false
    members.value = (data?.list || []).map((item: any) => ({
      id: item.id,
      username: item.username || '-',
      avatar: item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.username || String(item.id))}`,
      role: item.roles?.[0]?.name || '普通成员',
      roleIds: item.roles?.map((r: any) => r.id) || [],
      phone: item.phone || '-',
      status: item.freeze ? 'disabled' : 'enabled'
    }))
    pagination.value.total = data?.total || 0
  } catch (error) {
    if (isPermissionDenied(error)) {
      membersNoPermission.value = true
    }
    members.value = []
    pagination.value.total = 0
  } finally {
    membersLoading.value = false
  }
}

const filteredMembers = computed(() => {
  return members.value
})

const getRoleClass = (role: string) => {
  if (role === '管理员' || role === '技术负责人') return 'role-admin'
  return 'role-user'
}

const handleLeaveTeam = async () => {
  const orgId = targetOrgId.value || currentOrgId.value
  if (!orgId) return

  try {
    await Confirm({
      title: '退出团队',
      content: `确定要退出 "${currentOrg.value?.name || '当前团队'}" 吗？`,
      type: 'warning',
      okText: '退出',
      cancelText: '取消'
    })
    
    await leaveOrg({ org_id: orgId }, { skipSuccTip: true })
    message.success('已退出团队')
    router.push('/console/team/my')
  } catch (e) {
    // Cancelled or error
  }
}

const handleEditMember = async (member: Member) => {
  if (roleOptions.value.length === 0) {
    await fetchRoles()
  }
  editingMemberId.value = member.id
  selectedRoleId.value = member.roleIds[0]
  modalTitle.value = `编辑成员 - ${member.username}`
  showModal.value = true
}

const handleDeleteMember = async (member: Member) => {
  try {
    await Confirm({
      title: '移除成员',
      content: `确定要将 "${member.username}" 从团队中移除吗？`,
      type: 'warning',
      okText: '移除',
      cancelText: '取消'
    })
    
    // Call API to remove member
    await removeOrgMember(targetOrgId.value || currentOrgId.value, member.id, { skipSuccTip: true })
    
    members.value = members.value.filter(m => m.id !== member.id)
    message.success('成员已移除')
  } catch (e) {
    // Cancelled
  }
}

const searchMembers = () => {
  pagination.value.current = 1
  fetchMembers()
}

const resetSearch = () => {
  searchQuery.value = ''
  pagination.value.current = 1
  fetchMembers()
}

const handlePageChange = (page: number) => {
  pagination.value.current = page
  fetchMembers()
}

const handlePageSizeChange = (page: number, pageSize: number) => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
  fetchMembers()
}

onMounted(async () => {
  await fetchOrgs()
  await fetchMembers()
})

watch(
  () => currentOrgId.value,
  (id) => {
    if (id) {
      targetOrgId.value = id
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.page-container {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头部卡片样式 */
.team-header-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.team-summary {
  display: flex;
  gap: 20px;
}

.team-avatar-lg {
  width: 80px;
  height: 80px;
  background-color: #1890ff;
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(24, 144, 255, 0.2);
}

.team-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.role-badge {
  background-color: #ecfdf5;
  color: #059669;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.team-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  max-width: 600px;
}

.team-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stat-divider {
  width: 1px;
  height: 12px;
  background-color: #e5e7eb;
}

.status-active {
  color: #059669;
}

/* 搜索区域样式 */
.header-search {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 表格样式 */
.content-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  overflow-y: auto;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  color: #374151;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.col-index { width: 60px; text-align: center; }
.col-avatar { width: 60px; }
.col-name { width: 200px; }
.col-role { width: 150px; }
.col-phone { width: 150px; }
.col-status { width: 100px; }
.col-action { width: 150px; }
.text-right { text-align: right; }
.text-center { text-align: center; }

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f3f4f6;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  color: #111827;
}

.user-id {
  font-size: 12px;
  color: #9ca3af;
}

.role-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.role-user {
  background-color: #f3f4f6;
  color: #374151;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  margin-bottom: 1px;
}

.bg-green { background-color: #10b981; }
.bg-red { background-color: #ef4444; }

.empty-cell {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

/* 按钮样式复用 */
.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #096dd9;
}

.btn-secondary {
  background-color: white;
  border-color: #d1d5db;
  color: #374151;
}

.btn-xs {
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-xs.btn-primary {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.btn-xs.btn-primary:hover {
  background-color: #dbeafe;
}

.btn-xs.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-xs.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.icon {
  width: 18px;
  height: 18px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #111827;
}

.modal-body-text {
  color: #4b5563;
  margin-bottom: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
}

.form-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
</style>

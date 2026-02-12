<template>
  <div class="page-container">
    <!-- 团队概览头部 -->
    <div class="team-header-card">
      <div class="team-summary">
        <div class="team-avatar-lg">前</div>
        <div class="team-details">
          <div class="team-title-row">
            <h2 class="team-title">前端开发组</h2>
            <span class="role-badge">所有者</span>
          </div>
          <p class="team-description">负责公司所有前端项目的开发与维护，包括官网、管理后台等。</p>
          <div class="team-stats">
            <div class="stat-item">
              <span class="stat-label">成员数</span>
              <span class="stat-value">12</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">2023-01-15</span>
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
          />
        </div>
        <button class="btn btn-primary" @click="handleInviteMember">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          邀请成员
        </button>
      </div>
    </div>

    <!-- 成员列表表格 -->
    <div class="content-card">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-index">序号</th>
            <th class="col-avatar">头像</th>
            <th class="col-name">用户名</th>
            <th class="col-role">角色</th>
            <th class="col-email">邮箱</th>
            <th class="col-status">状态</th>
            <th class="col-action text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(member, index) in filteredMembers" :key="member.id">
            <td class="col-index">{{ index + 1 }}</td>
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
            <td class="col-email">{{ member.email }}</td>
            <td class="col-status">
              <span class="status-dot" :class="member.status === 'enabled' ? 'bg-green' : 'bg-red'"></span>
              {{ member.status === 'enabled' ? '启用' : '禁用' }}
            </td>
            <td class="col-action">
              <div class="action-buttons">
                <button class="btn-xs btn-primary" @click="handleEditMember(member)">编辑</button>
                <button class="btn-xs btn-danger" @click="handleDeleteMember(member)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredMembers.length === 0">
            <td colspan="7" class="empty-cell">暂无成员数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 模态框占位 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ modalTitle }}</h3>
        <p class="modal-body-text">功能开发中...</p>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message, Confirm } from '@/components/common'

interface Member {
  id: number
  username: string
  avatar: string
  role: string
  email: string
  status: 'enabled' | 'disabled'
}

// Mock Data
const members = ref<Member[]>([
  { id: 1001, username: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', role: '管理员', email: 'admin@example.com', status: 'enabled' },
  { id: 1002, username: 'User1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User1', role: '普通成员', email: 'user1@example.com', status: 'enabled' },
  { id: 1003, username: 'User2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User2', role: '普通成员', email: 'user2@example.com', status: 'disabled' },
  { id: 1004, username: 'DevLead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevLead', role: '技术负责人', email: 'dev@example.com', status: 'enabled' },
  { id: 1005, username: 'Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Designer', role: '设计师', email: 'design@example.com', status: 'enabled' },
])

const searchQuery = ref('')
const showModal = ref(false)
const modalTitle = ref('')

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m => 
    m.username.toLowerCase().includes(query) || 
    m.email.toLowerCase().includes(query)
  )
})

const getRoleClass = (role: string) => {
  if (role === '管理员' || role === '技术负责人') return 'role-admin'
  return 'role-user'
}

const handleInviteMember = () => {
  modalTitle.value = '邀请新成员'
  showModal.value = true
}

const handleEditMember = (member: Member) => {
  modalTitle.value = `编辑成员 - ${member.username}`
  showModal.value = true
}

const handleDeleteMember = async (member: Member) => {
  try {
    await Confirm({
      title: '删除成员',
      content: `确定要将 "${member.username}" 从团队中移除吗？`,
      type: 'warning',
      okText: '移除',
      cancelText: '取消'
    })
    
    members.value = members.value.filter(m => m.id !== member.id)
    message.success('成员已移除')
  } catch (e) {
    // Cancelled
  }
}
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
.col-email { width: 250px; }
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
}
</style>
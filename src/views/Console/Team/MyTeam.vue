<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-title">我的团队</div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="handleJoinTeam">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          加入团队
        </button>
        <button class="btn btn-primary" @click="handleCreateTeam">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建团队
        </button>
      </div>
    </div>

    <div class="team-grid">
      <div v-for="team in teams" :key="team.id" class="team-card" :class="{ 'active': team.isCurrent }">
        <div class="card-header">
          <div class="team-avatar" :style="{ backgroundColor: getAvatarColor(team.name) }">
            {{ team.name.charAt(0).toUpperCase() }}
          </div>
          <div class="team-info">
            <h3 class="team-name">{{ team.name }}</h3>
            <div class="invite-code-wrapper" @click.stop="copyInviteCode(team.inviteCode)" title="点击复制邀请码">
              <span class="invite-label">邀请码：</span>
              <span class="invite-code">{{ team.inviteCode }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-copy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="team-status" v-if="team.isCurrent">
            <span class="status-badge">当前团队</span>
          </div>
        </div>
        
        <div class="card-body">
          <p class="team-desc">{{ team.description || '暂无描述' }}</p>
          <div class="team-meta">
            <div class="meta-item">
              <span class="label">成员</span>
              <span class="value">{{ team.memberCount }}</span>
            </div>
            <div class="meta-item">
              <span class="label">创建时间</span>
              <span class="value">{{ team.createdAt }}</span>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button v-if="!team.isCurrent" class="btn-text btn-switch" @click="handleSwitchTeam(team)">
            切换团队
          </button>
          <div class="footer-actions">
            <button class="btn-icon" title="团队详情" @click="handleViewDetails(team)">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button v-if="team.role === 'owner'" class="btn-icon" title="编辑团队" @click="handleEditTeam(team)">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button v-if="team.role === 'owner'" class="btn-icon btn-delete" title="删除团队" @click="handleDeleteTeam(team)">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
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
import { ref } from 'vue'
import { message, Confirm } from '@/components/common'

interface Team {
  id: number
  name: string
  description: string
  role: 'owner' | 'member'
  memberCount: number
  createdAt: string
  isCurrent: boolean
  inviteCode: string
}

// Mock Data
const teams = ref<Team[]>([
  {
    id: 1,
    name: '前端开发组',
    description: '负责公司所有前端项目的开发与维护，包括官网、管理后台等。',
    role: 'owner',
    memberCount: 12,
    createdAt: '2023-01-15',
    isCurrent: true,
    inviteCode: 'FE-2023-001'
  },
  {
    id: 2,
    name: '产品设计部',
    description: '负责产品原型设计、UI设计以及用户体验优化。',
    role: 'member',
    memberCount: 8,
    createdAt: '2023-02-20',
    isCurrent: false,
    inviteCode: 'PD-2023-X9Y'
  },
  {
    id: 3,
    name: '后端架构组',
    description: '核心业务逻辑实现，微服务架构设计与维护。',
    role: 'member',
    memberCount: 15,
    createdAt: '2023-01-10',
    isCurrent: false,
    inviteCode: 'BE-ARCH-888'
  },
  {
    id: 4,
    name: '测试运维组',
    description: '自动化测试流程建设，服务器运维与部署。',
    role: 'owner',
    memberCount: 6,
    createdAt: '2023-03-05',
    isCurrent: false,
    inviteCode: 'QA-OPS-777'
  },
  {
    id: 5,
    name: 'AI 实验室',
    description: '探索人工智能技术在业务场景中的落地应用。',
    role: 'owner',
    memberCount: 4,
    createdAt: '2023-06-12',
    isCurrent: false,
    inviteCode: 'AI-LAB-999'
  }
])

const showModal = ref(false)
const modalTitle = ref('')

const getAvatarColor = (name: string) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const handleJoinTeam = () => {
  modalTitle.value = '加入团队'
  showModal.value = true
}

const handleCreateTeam = () => {
  modalTitle.value = '创建团队'
  showModal.value = true
}

const handleSwitchTeam = async (team: Team) => {
  try {
    await Confirm({
      title: '切换团队',
      content: `确定要切换到 "${team.name}" 吗？`,
      type: 'info',
      okText: '切换',
      cancelText: '取消'
    })
    
    teams.value.forEach(t => t.isCurrent = false)
    team.isCurrent = true
    message.success(`已切换到 ${team.name}`)
  } catch (e) {
    // Cancelled
  }
}

const handleViewDetails = (team: Team) => {
  modalTitle.value = `团队详情 - ${team.name}`
  showModal.value = true
}

const handleEditTeam = (team: Team) => {
  modalTitle.value = `编辑团队 - ${team.name}`
  showModal.value = true
}

const handleDeleteTeam = async (team: Team) => {
  try {
    await Confirm({
      title: '删除团队',
      content: `确定要解散 "${team.name}" 吗？此操作不可恢复。`,
      type: 'warning',
      okText: '解散',
      cancelText: '取消'
    })
    
    teams.value = teams.value.filter(t => t.id !== team.id)
    message.success('团队已解散')
  } catch (e) {
    // Cancelled
  }
}

const copyInviteCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    message.success('邀请码已复制')
  } catch (err) {
    message.error('复制失败，请手动复制')
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.team-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}

.team-card.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.card-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.team-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-code-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 2px 0;
  width: fit-content;
  transition: color 0.2s;
}

.invite-code-wrapper:hover {
  color: #1890ff;
}

.invite-code-wrapper:hover .invite-code {
  text-decoration: underline;
}

.invite-label {
  color: #9ca3af;
}

.invite-code {
  font-family: monospace;
  font-weight: 500;
}

.icon-copy {
  width: 14px;
  height: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.invite-code-wrapper:hover .icon-copy {
  opacity: 1;
}

.team-status {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-badge {
  background-color: #1890ff;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-desc {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 42px;
}

.team-meta {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px dashed #f3f4f6;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 12px;
  color: #9ca3af;
}

.meta-item .value {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.card-footer {
  padding: 12px 20px;
  background-color: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f3f4f6;
}

.btn-switch {
  color: #1890ff;
  font-weight: 500;
  font-size: 14px;
}

.btn-switch:hover {
  text-decoration: underline;
}

.footer-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn-icon:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-delete:hover {
  background-color: #fef2f2;
  color: #dc2626;
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

/* Button & Icon Utils */
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

.btn-secondary:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

.btn-text {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.icon {
  width: 18px;
  height: 18px;
}
</style>
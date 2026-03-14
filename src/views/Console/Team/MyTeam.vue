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
            <img v-if="team.avatar" :src="team.avatar" alt="avatar" class="team-avatar-image" />
            <span v-else>{{ team.name.charAt(0).toUpperCase() }}</span>
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

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ modalTitle }}</h3>
        <template v-if="modalMode === 'create' || modalMode === 'edit'">
          <div class="form-item">
            <div class="form-label">组织名称</div>
            <input v-model="orgForm.name" class="form-input" type="text" placeholder="请输入组织名称" maxlength="50" />
          </div>
          <div class="form-item">
            <div class="form-label">组织描述</div>
            <textarea
              v-model="orgForm.description"
              class="form-textarea"
              rows="3"
              placeholder="请输入组织描述"
              maxlength="200"
            />
          </div>
          <div class="form-item">
            <div class="form-label">组织邀请码</div>
            <input v-model="orgForm.code" class="form-input" type="text" placeholder="请输入邀请码" maxlength="30" />
          </div>
          <div class="form-item">
            <div class="form-label">头像地址</div>
            <input v-model="orgForm.avatar" class="form-input" type="text" placeholder="请输入头像地址" />
          </div>
          <div class="form-item">
            <div class="form-label">头像ID</div>
            <input v-model.number="orgForm.avatar_id" class="form-input" type="number" placeholder="请输入头像ID" />
          </div>
        </template>
        <template v-else-if="modalMode === 'join'">
          <div class="form-item">
            <div class="form-label">组织邀请码</div>
            <input v-model="orgForm.code" class="form-input" type="text" placeholder="请输入组织邀请码" maxlength="30" />
          </div>
          <p class="modal-tip">请输入团队管理员提供的邀请码加入团队</p>
        </template>
        <p v-else class="modal-body-text">{{ modalBodyText }}</p>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn btn-secondary">取消</button>
          <button
            v-if="modalMode === 'create' || modalMode === 'edit'"
            @click="submitOrgForm"
            class="btn btn-primary"
            :disabled="modalSubmitting"
          >
            {{ modalSubmitting ? '提交中...' : '确认' }}
          </button>
          <button
            v-if="modalMode === 'join'"
            @click="handleJoinSubmit"
            class="btn btn-primary"
            :disabled="modalSubmitting"
          >
            {{ modalSubmitting ? '加入中...' : '加入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message, Confirm } from '@/components/common'
import { useAuthStore } from '@/stores/auth'
import { createOrg, deleteOrg, getOrgList, setCurrentOrg, updateOrg, joinOrg, getRoleList, assignUserRole } from '@/services/permission.service'
import type { CreateOrgRequest, OrgItem, UpdateOrgRequest } from '@/types'

interface Team {
  id: number
  name: string
  description: string
  role: 'owner' | 'member'
  memberCount: number
  createdAt: string
  isCurrent: boolean
  inviteCode: string
  avatar?: string
  avatarId?: number
  ownerId?: number
}

const authStore = useAuthStore()
const teams = ref<Team[]>([])
const modalMode = ref<'create' | 'edit' | 'detail' | 'join' | ''>('')
const modalBodyText = ref('')
const modalSubmitting = ref(false)
const editingOrgId = ref<number | null>(null)

const showModal = ref(false)
const modalTitle = ref('')
const orgForm = reactive({
  name: '',
  description: '',
  code: '',
  avatar: '',
  avatar_id: undefined as number | undefined
})

const resetOrgForm = () => {
  orgForm.name = ''
  orgForm.description = ''
  orgForm.code = ''
  orgForm.avatar = ''
  orgForm.avatar_id = undefined
}

const mapOrgToTeam = (org: OrgItem): Team => {
  const currentOrgId = authStore.user?.current_org_id || 0
  const isOwner = org.owner_id ? org.owner_id === authStore.user?.id : true
  return {
    id: org.id,
    name: org.name || '-',
    description: org.description || '',
    role: isOwner ? 'owner' : 'member',
    memberCount: org.member_count || 0,
    createdAt: org.created_at ? String(org.created_at).slice(0, 10) : '-',
    isCurrent: org.id === currentOrgId,
    inviteCode: org.code || '-',
    avatar: org.avatar || '',
    avatarId: org.avatar_id,
    ownerId: org.owner_id
  }
}

const fetchTeams = async () => {
  try {
    const data = await getOrgList({ page: 0, page_size: 0 }, { skipSuccTip: true })
    teams.value = (data?.list || []).map(mapOrgToTeam)
  } catch (error) {
    teams.value = []
  }
}

const getAvatarColor = (name: string) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const handleJoinTeam = () => {
  modalMode.value = 'join'
  modalTitle.value = '加入团队'
  resetOrgForm()
  showModal.value = true
}

const handleCreateTeam = () => {
  modalMode.value = 'create'
  modalTitle.value = '创建团队'
  resetOrgForm()
  editingOrgId.value = null
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
    
    await setCurrentOrg({ org_id: team.id }, { skipSuccTip: true })
    if (authStore.user) {
      authStore.setUser({
        ...authStore.user,
        current_org_id: team.id,
        current_org: {
          ...authStore.user.current_org,
          id: team.id,
          name: team.name,
          description: team.description,
          code: team.inviteCode,
          owner_id: team.ownerId || 0,
          created_at: team.createdAt,
          updated_at: '' // No need to be precise here for simple update
        }
      })
    }
    await authStore.fetchMyMenus(team.id, { skipSuccTip: true, skipErrTip: true })
    teams.value.forEach((t) => {
      t.isCurrent = t.id === team.id
    })
    message.success(`已切换到 ${team.name}`)
  } catch (e) {
  }
}

const handleViewDetails = (team: Team) => {
  modalMode.value = 'detail'
  modalTitle.value = `团队详情 - ${team.name}`
  modalBodyText.value = `组织名称：${team.name}\n邀请码：${team.inviteCode}\n组织描述：${team.description || '暂无描述'}`
  showModal.value = true
}

const handleEditTeam = (team: Team) => {
  modalMode.value = 'edit'
  modalTitle.value = `编辑团队 - ${team.name}`
  editingOrgId.value = team.id
  orgForm.name = team.name
  orgForm.description = team.description || ''
  orgForm.code = team.inviteCode === '-' ? '' : team.inviteCode
  orgForm.avatar = team.avatar || ''
  orgForm.avatar_id = team.avatarId
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
    
    await deleteOrg(team.id, { skipSuccTip: true })
    teams.value = teams.value.filter(t => t.id !== team.id)
    if (team.isCurrent && teams.value.length) {
      const fallbackTeam = teams.value[0]
      await setCurrentOrg({ org_id: fallbackTeam.id }, { skipSuccTip: true })
      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          current_org_id: fallbackTeam.id,
          current_org: {
            ...authStore.user.current_org,
            id: fallbackTeam.id,
            name: fallbackTeam.name,
            description: fallbackTeam.description,
            code: fallbackTeam.inviteCode,
            owner_id: fallbackTeam.ownerId || 0,
            created_at: fallbackTeam.createdAt,
            updated_at: ''
          }
        })
      }
      await authStore.fetchMyMenus(fallbackTeam.id, { skipSuccTip: true, skipErrTip: true })
      teams.value.forEach((t) => {
        t.isCurrent = t.id === fallbackTeam.id
      })
    }
    message.success('团队已解散')
  } catch (e) {
  }
}

const copyInviteCode = async (code: string) => {
  if (!code || code === '-') {
    message.warning('该组织暂无邀请码')
    return
  }
  try {
    await navigator.clipboard.writeText(code)
    message.success('邀请码已复制')
  } catch (err) {
    message.error('复制失败，请手动复制')
  }
}

const submitOrgForm = async () => {
  const name = orgForm.name.trim()
  if (!name) {
    message.warning('请输入组织名称')
    return
  }

  const payload: CreateOrgRequest | UpdateOrgRequest = {
    name,
    description: orgForm.description.trim() || undefined,
    code: orgForm.code.trim() || undefined,
    avatar: orgForm.avatar.trim() || undefined,
    avatar_id: orgForm.avatar_id && orgForm.avatar_id > 0 ? orgForm.avatar_id : undefined
  }

  modalSubmitting.value = true
  try {
    if (modalMode.value === 'edit' && editingOrgId.value) {
      await updateOrg(editingOrgId.value, payload as UpdateOrgRequest, { skipSuccTip: true })
      message.success('组织信息已更新')
    } else {
      // Create org and get the result (assuming it returns the created org or null)
      const newOrg: any = await createOrg(payload as CreateOrgRequest, { skipSuccTip: true })
      message.success('组织创建成功')

      // Auto assign "Administrator" role to the creator
      try {
        let orgId = newOrg?.id
        
        // If createOrg didn't return ID, try to find it in the list
        if (!orgId && authStore.user?.id) {
          // Fetch the latest list to find the new org
          const res = await getOrgList({ page: 1, page_size: 100, keyword: name }, { skipSuccTip: true })
          // Filter by owner and exact name match
          const myOrgs = (res?.list || []).filter((o: any) => o.owner_id === authStore.user?.id && o.name === name)
          if (myOrgs.length > 0) {
            // Sort by ID descending to get the latest one
            myOrgs.sort((a: any, b: any) => b.id - a.id)
            orgId = myOrgs[0].id
          }
        }

        if (orgId && authStore.user?.id) {
          // Fetch roles to find "Administrator"
          const rolesData = await getRoleList({ page: 1, page_size: 100 }, { skipSuccTip: true })
          const adminRole = (rolesData?.list || []).find((r: any) => r.name === '管理员' || r.name === 'Administrator')
          
          if (adminRole) {
             await assignUserRole({
               user_id: authStore.user.id,
               org_id: orgId,
               role_ids: [adminRole.id]
             }, { skipSuccTip: true })
           }
         }
       } catch (err) {
        console.error('Failed to auto-assign admin role:', err)
      }
    }
    showModal.value = false
    await fetchTeams()
  } catch (error) {
  } finally {
    modalSubmitting.value = false
  }
}

const handleJoinSubmit = async () => {
  const code = orgForm.code.trim()
  if (!code) {
    message.warning('请输入邀请码')
    return
  }

  modalSubmitting.value = true
  try {
    await joinOrg({ invite_code: code }, { skipSuccTip: true })
    message.success('加入团队成功')
    showModal.value = false
    await fetchTeams()
  } catch (error) {
  } finally {
    modalSubmitting.value = false
  }
}

onMounted(() => {
  fetchTeams()
})
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

.team-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
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
  white-space: pre-line;
}

.modal-tip {
  font-size: 12px;
  color: #6b7280;
  margin-top: -8px;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 14px;
}

.form-label {
  font-size: 13px;
  color: #374151;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #1f2937;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
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

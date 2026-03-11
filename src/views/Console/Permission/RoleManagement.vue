<template>
  <div class="page-container">
    <a-card :bordered="false" class="search-card" :body-style="{ padding: '24px 24px 0 24px' }">
      <a-form layout="inline" :model="searchQuery" class="search-form">
        <a-form-item label="角色名称" name="roleName">
          <a-input
            v-model:value="searchQuery.roleName"
            placeholder="请输入角色名称"
            allow-clear
            @pressEnter="search"
          >
            <template #prefix>
              <SearchOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select
            v-model:value="searchQuery.status"
            placeholder="请选择状态"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="search" class="btn-search">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="resetSearch" class="btn-reset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" class="content-card">
      <div class="toolbar">
        <a-space>
          <a-button type="primary" @click="openEditModal()">
            <template #icon><PlusOutlined /></template>
            新增角色
          </a-button>
          <a-button
            danger
            :disabled="!hasSelected"
            @click="batchDelete"
          >
            <template #icon><DeleteOutlined /></template>
            批量删除
          </a-button>
        </a-space>
        <a-space>
          <a-tooltip title="刷新">
            <a-button type="text" shape="circle" @click="refresh">
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </div>

      <a-table
        :columns="columns as any"
        :data-source="roles"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys: selectedIds, onChange: onSelectChange }"
        row-key="id"
        @change="handleTableChange"
        :loading="loading"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'enabled' ? 'success' : 'error'">
              {{ record.status === 'enabled' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" size="small" class="btn-permission" @click="openPermissionModal(record)">
                <template #icon><SettingOutlined /></template>
                修改权限
              </a-button>
              <a-button type="primary" size="small" class="btn-edit" @click="openEditModal(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确认删除该角色吗？"
                @confirm="deleteRole(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="primary" danger size="small" class="btn-delete">
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑/新增 模态框 -->
    <a-modal
      v-model:open="isEditModalOpen"
      :title="modalType === 'add' ? '新增角色' : '编辑角色'"
      @ok="saveRole"
      :confirmLoading="modalLoading"
      :maskClosable="false"
    >
      <a-form :model="editingRole" layout="vertical" ref="roleFormRef">
        <a-form-item label="角色名称" required name="name">
          <a-input v-model:value="editingRole.name" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item label="角色标识" required name="key">
          <a-input v-model:value="editingRole.key" placeholder="请输入角色标识 (如: admin)" />
        </a-form-item>
        <a-form-item label="描述" name="desc">
          <a-textarea v-model:value="editingRole.desc" placeholder="请输入角色描述" :rows="3" />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="editingRole.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 权限设置 模态框 -->
    <a-modal
      v-model:open="isPermissionModalOpen"
      :title="`修改权限 - ${permissionRole.name}`"
      width="1100px"
      @ok="savePermission"
      :confirmLoading="permissionSaving"
      :maskClosable="false"
    >
      <div class="permission-container">
        <a-row :gutter="24">
          <a-col :span="8">
            <a-card title="功能权限" size="small" :bordered="true">
              <a-tree
                :checkedKeys="selectedMenuIds"
                checkable
                defaultExpandAll
                :tree-data="functionalPermissions as any"
                :fieldNames="{ children: 'children', title: 'label', key: 'id' }"
                :height="400"
                @check="onMenuTreeCheck"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card title="数据权限" size="small" :bordered="true">
              <a-tree
                :checkedKeys="selectedApiIds"
                checkable
                defaultExpandAll
                :tree-data="dataPermissions as any"
                :fieldNames="{ children: 'children', title: 'label', key: 'id' }"
                :height="400"
                @check="onApiTreeCheck"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card title="资源权限" size="small" :bordered="true">
              <a-tree
                :checkedKeys="selectedResourceCodes"
                checkable
                defaultExpandAll
                :tree-data="resourcePermissions as any"
                :fieldNames="{ children: 'children', title: 'label', key: 'id' }"
                :height="400"
                @check="onResourceTreeCheck"
              />
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  SettingOutlined 
} from '@ant-design/icons-vue'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole as deleteRoleApi,
  getRoleMenuApiMap,
  assignRolePermission
} from '@/services/permission.service'

const searchQuery = reactive({
  roleName: '',
  status: undefined as string | undefined
})

const columns = [
  { title: '角色名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '角色标识', dataIndex: 'key', key: 'key', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 280, align: 'center', fixed: 'right' as const }
]

const roles = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: (total: number) => `共 ${total} 条`
})

const fetchRoles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      keyword: searchQuery.roleName || undefined,
      status: searchQuery.status === 'enabled' ? 1 : (searchQuery.status === 'disabled' ? 0 : undefined)
    }
    
    const data = await getRoleList(params, { skipSuccTip: true })
    if (data) {
      roles.value = data.list.map((item: any) => ({
        id: item.id,
        name: item.name,
        key: item.code,
        status: item.status === 1 ? 'enabled' : 'disabled',
        updateTime: item.updated_at || '-',
        desc: item.desc || '-'
      }))
      pagination.total = data.total
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchRoles()
}

const search = () => {
  pagination.current = 1
  fetchRoles()
}

const resetSearch = () => {
  searchQuery.roleName = ''
  searchQuery.status = undefined
  search()
}

const refresh = () => {
  fetchRoles()
  message.success('已刷新角色数据')
}

// Selection
type TableKey = string | number
const selectedIds = ref<TableKey[]>([])
const hasSelected = computed(() => selectedIds.value.length > 0)
const onSelectChange = (selectedRowKeys: TableKey[], _selectedRows: any[]) => {
  selectedIds.value = selectedRowKeys
}

const batchDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确认删除选中的 ${selectedIds.value.length} 个角色吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await Promise.all(selectedIds.value.map(id => deleteRoleApi(Number(id), { skipSuccTip: true })))
        message.success('批量删除成功')
        selectedIds.value = []
        fetchRoles()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const deleteRole = async (id: number) => {
  try {
    await deleteRoleApi(id, { skipSuccTip: true })
    message.success('删除成功')
    fetchRoles()
  } catch (error) {
    console.error(error)
  }
}

// Edit Modal
const isEditModalOpen = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const modalLoading = ref(false)
const editingRole = reactive({
  id: 0,
  name: '',
  key: '',
  status: 'enabled',
  desc: ''
})

const openEditModal = (role?: any) => {
  if (role) {
    modalType.value = 'edit'
    Object.assign(editingRole, role)
  } else {
    modalType.value = 'add'
    Object.assign(editingRole, { id: 0, name: '', key: '', status: 'enabled', desc: '' })
  }
  isEditModalOpen.value = true
}

const saveRole = async () => {
  if (!editingRole.name || !editingRole.key) {
    message.warning('请填写角色名称和标识')
    return
  }
  
  modalLoading.value = true
  try {
    if (modalType.value === 'add') {
      await createRole({
        name: editingRole.name,
        code: editingRole.key,
        desc: editingRole.desc
      }, { skipSuccTip: true })
    } else {
      await updateRole(editingRole.id, {
        name: editingRole.name,
        code: editingRole.key,
        status: editingRole.status === 'enabled' ? 1 : 0,
        desc: editingRole.desc
      }, { skipSuccTip: true })
    }
    message.success(modalType.value === 'add' ? '新增成功' : '更新成功')
    isEditModalOpen.value = false
    fetchRoles()
  } catch (error) {
    console.error(error)
  } finally {
    modalLoading.value = false
  }
}

type PermissionNode = {
  id: string | number
  label: string
  children?: PermissionNode[]
  isLeaf?: boolean
}

const isPermissionModalOpen = ref(false)
const permissionRole = reactive({ id: 0, name: '' })
const selectedMenuIds = ref<number[]>([])
const selectedApiIds = ref<(string | number)[]>([])
const selectedResourceCodes = ref<string[]>([])
const availableApiIds = ref<number[]>([])
const permissionSaving = ref(false)
const functionalPermissions = ref<PermissionNode[]>([])
const dataPermissions = ref<PermissionNode[]>([])
const resourcePermissions = ref<any[]>([])

const getMenuChildren = (item: any) => {
  return item?.children || item?.menus || item?.menu_list || item?.menuList || []
}

const buildFunctionalPermissions = (items: any[]): PermissionNode[] => {
  const mapItem = (item: any): PermissionNode | null => {
    // 过滤掉禁用的菜单（status === 0 或 status === '0' 或 disabled === true）
    // 注意：后端可能返回 status: 1 (启用) / 0 (禁用)
    const isDisabled = item.status === 0 || item.status === '0' || item.disabled === true
    if (isDisabled) {
      return null
    }

    const id = typeof item.id === 'number' ? item.id : (typeof item.menu_id === 'number' ? item.menu_id : 0)
    const label = item.label || item.name || item.title || item.code || ''
    const childrenSource = getMenuChildren(item)
    const children = Array.isArray(childrenSource) ? childrenSource.map(mapItem).filter(Boolean) as PermissionNode[] : []
    
    return children.length ? { id, label, children } : { id, label }
  }

  return Array.isArray(items) ? items.map(mapItem).filter(Boolean) as PermissionNode[] : []
}

const buildDataPermissions = (items: any[]) => {
  const allApiIds = new Set<number>()

  const mapItem = (item: any): PermissionNode | null => {
    // 过滤掉禁用的菜单
    const isDisabled = item.status === 0 || item.status === '0' || item.disabled === true
    if (isDisabled) {
      return null
    }

    const menuId = typeof item.id === 'number' ? item.id : (typeof item.menu_id === 'number' ? item.menu_id : 0)
    if (!menuId) return null

    const children: PermissionNode[] = []

    // 1. Sub-menus
    const subMenusSource = getMenuChildren(item)
    if (Array.isArray(subMenusSource)) {
      subMenusSource.forEach((sub) => {
        const node = mapItem(sub)
        if (node) children.push(node)
      })
    }

    // 2. APIs
    const apisSource = item?.apis || item?.api_list || item?.apiList || item?.api_map || item?.apiMap || []
    if (Array.isArray(apisSource)) {
      apisSource.forEach((api) => {
        const apiId = typeof api?.id === 'number' ? api.id : 0
        if (apiId) {
          allApiIds.add(apiId)
          const method = api?.method || api?.api_method || api?.http_method || ''
          const path = api?.path || api?.api_path || api?.url || ''
          const name = api?.name || ''
          const label = name ? `${name} (${method} ${path})` : `${method} ${path}`
          
          children.push({
            id: `api-${apiId}`,
            label: label.trim(),
            isLeaf: true
          })
        }
      })
    }

    // Only return the menu node if it has children (sub-menus or APIs)
    // This cleans up the tree to show only relevant paths
    if (children.length === 0) {
      return null
    }

    return {
      id: `menu-${menuId}`,
      label: item.label || item.name || item.title || '',
      children
    }
  }

  const tree = items.map(mapItem).filter(Boolean) as PermissionNode[]
  return { tree, apiIds: Array.from(allApiIds) }
}

const normalizeMenuApiMap = (raw: any) => {
  if (Array.isArray(raw)) {
    return { items: raw, assignedMenuIds: [], assignedApiIds: [] }
  }
  const items =
    raw?.menu_api_map ||
    raw?.menuApiMap ||
    raw?.menu_tree ||
    raw?.menuTree ||
    raw?.list ||
    raw?.menus ||
    raw?.data ||
    []
  const assignedMenuIds =
    raw?.assigned_menu_ids ||
    raw?.assignedMenuIds ||
    raw?.menu_ids ||
    raw?.menuIds ||
    raw?.checked_menu_ids ||
    raw?.checkedMenuIds ||
    []
  const assignedApiIds =
    raw?.assigned_api_ids ||
    raw?.assignedApiIds ||
    raw?.api_ids ||
    raw?.apiIds ||
    raw?.checked_api_ids ||
    raw?.checkedApiIds ||
    []
  
  const resourceManagement = raw?.resource_management || raw?.resources || raw?.capability_groups || []
  const assignedResourceCodes = raw?.assigned_resource_codes || raw?.resource_codes || raw?.assigned_capability_codes || []

  return { items, assignedMenuIds, assignedApiIds, resourceManagement, assignedResourceCodes }
}

const buildResourcePermissions = (items: any[]): PermissionNode[] => {
  if (!items || !items.length) return []
  
  return items.map((group) => {
    // 兼容后端返回字段，可能是 capabilities 或其他
    // 如果没有 capabilities 字段，但有 children，也可以兼容
    const caps = group.capabilities || group.children || []
    
    const children = caps.map((cap: any) => {
      const code = cap.code || cap.capability_code || ''
      return {
        id: code,
        label: `${code}`,
        isLeaf: true
      }
    })
    
    return {
      id: group.group_code,
      label: group.group_code,
      children
    }
  })
}

const normalizeCheckedIds = (checkedKeys: any): number[] => {
  const keys = Array.isArray(checkedKeys)
    ? checkedKeys
    : Array.isArray(checkedKeys?.checked)
      ? checkedKeys.checked
      : []
  return Array.from(
    new Set(
      keys
        .map((key: unknown) => Number(key))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    )
  )
}

const normalizeApiTreeCheckedKeys = (checkedKeys: any): (string | number)[] => {
  const keys = Array.isArray(checkedKeys)
    ? checkedKeys
    : Array.isArray(checkedKeys?.checked)
      ? checkedKeys.checked
      : []
  return Array.from(new Set(keys))
}

const onMenuTreeCheck = (checkedKeys: any) => {
  selectedMenuIds.value = normalizeCheckedIds(checkedKeys)
}

const onApiTreeCheck = (checkedKeys: any) => {
  selectedApiIds.value = normalizeApiTreeCheckedKeys(checkedKeys)
}

const onResourceTreeCheck = (checkedKeys: any) => {
  // 资源权限使用的是字符串key
  const keys = Array.isArray(checkedKeys)
    ? checkedKeys
    : Array.isArray(checkedKeys?.checked)
      ? checkedKeys.checked
      : []
  selectedResourceCodes.value = Array.from(new Set(keys))
}

const loadPermissionData = async (roleId: number) => {
  try {
    const menuApiMap = await getRoleMenuApiMap(roleId, { skipSuccTip: true })
    const { items, assignedMenuIds, assignedApiIds, resourceManagement, assignedResourceCodes } = normalizeMenuApiMap(menuApiMap)
    
    functionalPermissions.value = buildFunctionalPermissions(items || [])
    const { tree, apiIds } = buildDataPermissions(items || [])
    dataPermissions.value = tree
    availableApiIds.value = apiIds
    
    // Resource Permissions
    resourcePermissions.value = buildResourcePermissions(resourceManagement || [])
    
    selectedMenuIds.value = normalizeCheckedIds(assignedMenuIds)
    selectedApiIds.value = normalizeCheckedIds(assignedApiIds).map((id) => `api-${id}`)
    
    // assignedResourceCodes should be string[]
    selectedResourceCodes.value = Array.isArray(assignedResourceCodes) ? assignedResourceCodes : []
  } catch (error) {
    console.error(error)
    functionalPermissions.value = []
    dataPermissions.value = []
    resourcePermissions.value = []
    selectedMenuIds.value = []
    selectedApiIds.value = []
    availableApiIds.value = []
    selectedResourceCodes.value = []
  }
}

const openPermissionModal = async (role: any) => {
  permissionRole.id = role.id
  permissionRole.name = role.name
  isPermissionModalOpen.value = true
  await loadPermissionData(role.id)
}

const savePermission = async () => {
  // 1. 整理勾选的菜单ID，并补充半选的父节点ID
  // 注意：Ant Design Vue 的 Tree 组件在 check 事件中如果 checkStrictly=false（默认），
  // 返回的 checkedKeys 只是叶子节点或者完全选中的节点，可能不包含半选的父节点。
  // 但是后端需要完整的 menu_ids 路径才能构建树，或者我们在这里手动补全。
  
  // 实际上，为了保险起见，我们需要遍历权限树，找到所有被选中节点的父节点
  const checkedMenuIdSet = new Set(selectedMenuIds.value.filter((id) => Number.isInteger(id) && id > 0))
  
  const findParentIds = (nodes: PermissionNode[], targetId: number, parents: number[]): number[] | null => {
    for (const node of nodes) {
      const nodeId = typeof node.id === 'string' && node.id.startsWith('menu-') 
        ? Number(node.id.replace('menu-', '')) 
        : (typeof node.id === 'number' ? node.id : 0)
        
      if (nodeId === targetId) {
        return parents
      }
      
      if (node.children && node.children.length > 0) {
        const found = findParentIds(node.children, targetId, [...parents, nodeId])
        if (found) return found
      }
    }
    return null
  }

  // 遍历所有已选的菜单ID，找到它们的父级路径并添加到集合中
  // 注意：functionalPermissions 是构建好的树结构，但 ID 是带 'menu-' 前缀的字符串或者是数字
  // 我们需要确保 ID 格式一致
  
  // 简单的做法：如果前端用的是 checkStrictly=false，AntD 的 checkedKeys 应该只包含叶子节点（如果父节点全选了也包含父节点）。
  // 如果是 checkStrictly=true，则包含所有点击过的。
  // 截图看似乎是默认行为。
  // 无论如何，我们在这里做一个“向上查找补全”的逻辑是比较稳妥的。
  
  const allMenuIds = new Set<number>()
  
  // 辅助函数：扁平化树，建立 id -> parentId 的映射
  const menuParentMap = new Map<number, number>()
  const traverseTree = (nodes: PermissionNode[], parentId: number = 0) => {
    nodes.forEach(node => {
      // 提取纯数字ID
      let nodeId = 0
      if (typeof node.id === 'number') {
        nodeId = node.id
      } else if (typeof node.id === 'string' && node.id.startsWith('menu-')) {
        nodeId = Number(node.id.replace('menu-', ''))
      }
      
      if (nodeId > 0) {
        menuParentMap.set(nodeId, parentId)
        if (node.children) {
          traverseTree(node.children, nodeId)
        }
      }
    })
  }
  traverseTree(functionalPermissions.value)
  
  // 遍历当前勾选的ID，向上递归补充父ID
  selectedMenuIds.value.forEach(id => {
    if (!id) return
    let currentId = id
    while (currentId !== 0) {
      allMenuIds.add(currentId)
      currentId = menuParentMap.get(currentId) || 0
    }
  })

  const menuIds = Array.from(allMenuIds)
  const apiIdPool = new Set(availableApiIds.value)
  const apiIds = Array.from(
    new Set(
      selectedApiIds.value
        .map((key) => {
          if (typeof key === 'string' && key.startsWith('api-')) {
            return Number(key.replace('api-', ''))
          }
          return 0
        })
        .filter((id) => Number.isInteger(id) && id > 0 && apiIdPool.has(id))
    )
  )

  // 过滤掉资源权限中的组节点（如果有子节点的节点ID通常是组ID）
  // 这里简单判断：如果是叶子节点才提交
  // 但我们 tree 数据里没有保留 flat map。
  // 重新遍历 resourcePermissions 找到所有的叶子节点 ID Set
  const resourceLeafIds = new Set<string>()
  const traverseResource = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        traverseResource(node.children)
      } else if (node.isLeaf) {
        // 只有标记为叶子节点（Capability）的才收集
        resourceLeafIds.add(node.id)
      }
    })
  }
  traverseResource(resourcePermissions.value)
  
  const resourceCodes = selectedResourceCodes.value.filter(code => resourceLeafIds.has(code))

  permissionSaving.value = true
  try {
    await assignRolePermission({
      role_id: permissionRole.id,
      menu_ids: menuIds,
      direct_api_ids: apiIds,
      capability_codes: resourceCodes
    }, { skipSuccTip: true })
    
    isPermissionModalOpen.value = false
    message.success('权限配置已保存，即将刷新页面生效')
    
    // 延迟刷新页面，让用户看到成功提示
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error(error)
  } finally {
    permissionSaving.value = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.search-card {
  margin-bottom: 24px;
}

.content-card {
  min-height: 500px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 调整搜索表单样式 */
.search-form :deep(.ant-form-item) {
  margin-bottom: 24px; /* 统一底部间距 */
}

/* 搜索按钮颜色 - 接近截图中的蓝色 */
.btn-search {
  background-color: #1677ff;
  border-color: #1677ff;
}

.btn-search:hover {
  background-color: #4096ff;
  border-color: #4096ff;
}

/* 调整操作按钮样式 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.btn-permission {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.btn-edit,
.btn-delete {
  border-radius: 4px;
  padding: 0 12px;
  height: 28px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 覆盖 Ant Design 默认的按钮阴影，使其看起来更扁平，接近截图风格 */
.btn-edit {
  background-color: #3b82f6; /* 接近截图的蓝色 */
  border-color: #3b82f6;
  box-shadow: none;
}

.btn-edit:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-delete {
  background-color: #ef4444; /* 接近截图的红色 */
  border-color: #ef4444;
  box-shadow: none;
}

.btn-delete:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* 图标与文字对齐调整 */
:deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn > span) {
  display: inline-flex;
  align-items: center;
}

:deep(.ant-btn .anticon) {
  margin-right: 4px;
}
</style>

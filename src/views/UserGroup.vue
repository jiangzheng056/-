<template>
  <div class="user-group-page">
    <!-- 左侧用户分组栏 -->
    <div class="group-sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">用户分组</h2>
        <el-button type="primary" @click="openCreateGroupDialog">
          <el-icon>
            <Plus />
          </el-icon>
          新建
        </el-button>
      </div>

      <!-- 分组搜索 -->
      <div class="sidebar-search">
        <el-input v-model="groupSearchKey" placeholder="搜索分组" clearable :prefix-icon="Search" />
      </div>

      <!-- 分组树 -->
      <div class="group-tree">
        <el-tree ref="treeRef" :data="filteredGroupTree" node-key="id" default-expand-all :expand-on-click-node="false"
          highlight-current @node-click="handleNodeClick">
          <template #default="{ data }">
            <div class="tree-node">
              <div class="node-content">
                <el-icon class="node-icon">
                  <Folder />
                </el-icon>
                <span class="node-label">{{ data.nodeName }}</span>
                <span class="node-count" v-if="data.userCount">{{ data.userCount }}</span>
              </div>
              <div class="node-actions">
                <el-icon class="action-icon" @click.stop="openEditGroupDialog(data)">
                  <Edit />
                </el-icon>
                <el-icon class="action-icon delete" @click.stop="deleteGroup(data)">
                  <Delete />
                </el-icon>
              </div>
            </div>
          </template>
        </el-tree>

        <!-- 空状态 -->
        <div v-if="groupTreeData.length === 0" class="empty-tree">
          <el-icon :size="48">
            <FolderOpened />
          </el-icon>
          <p>暂无分组</p>
          <el-button type="primary" @click="openCreateGroupDialog">创建分组</el-button>
        </div>
      </div>
    </div>

    <!-- 右侧用户列表区域 -->
    <div class="user-content">
      <div class="content-card">
        <!-- 头部 -->
        <div class="content-header">
          <div class="header-left">
            <h3 class="content-title">{{ currentGroupName }}</h3>
            <span class="user-count">共 {{ userList.length }} 个用户</span>
          </div>
          <div class="header-actions">
            <el-input v-model="userSearchKey" placeholder="搜索用户" clearable :prefix-icon="Search" style="width: 200px" />
            <el-button type="primary" :icon="Plus" @click="openCreateUserDialog">新增用户</el-button>
            <el-button :icon="FolderAdd" @click="openBatchGroupDialog" :disabled="selectedUsers.length === 0">
              批量分组
            </el-button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="table-section">
          <el-table :data="filteredUserList" class="user-table" @selection-change="handleSelectionChange"
            v-loading="loading" element-loading-text="加载中..." stripe>
            <template #empty>
              <div class="empty-state">
                <el-icon :size="48">
                  <User />
                </el-icon>
                <p>暂无用户数据</p>
                <p class="empty-tip">请先在左侧选择分组或添加用户</p>
              </div>
            </template>
            <el-table-column type="selection" width="50" />
            <el-table-column label="用户" min-width="200">
              <template #default="{ row }">
                <div class="user-info">
                  <el-avatar :size="36" :src="row.avatar || defaultAvatar">
                    {{ row.nickName?.charAt(0) }}
                  </el-avatar>
                  <div class="user-detail">
                    <span class="user-name">{{ row.nickName }}</span>
                    <span class="user-account">{{ row.userName }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="分组" min-width="180">
              <template #default="{ row }">
                <div class="tag-group">
                  <el-tag v-for="(name, index) in row.groupNames" :key="index" effect="plain">
                    {{ name }}
                  </el-tag>
                  <span v-if="!row.groupNames?.length" class="no-data">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="角色" min-width="150">
              <template #default="{ row }">
                <div class="tag-group">
                  <el-tag v-for="(role, index) in row.roles" :key="index" type="success" effect="plain">
                    {{ role.roleName }}
                  </el-tag>
                  <span v-if="!row.roles?.length" class="no-data">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openEditUserDialog(row)">
                  编辑
                </el-button>
                <el-button type="danger" link @click="deleteUser(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 新增/编辑分组弹窗 -->
    <el-dialog v-model="groupDialogVisible" :title="groupDialogTitle" width="420px" :close-on-click-modal="false">
      <el-form :model="groupForm" label-width="80px" class="dialog-form">
        <el-form-item label="分组名称" required>
          <el-input v-model="groupForm.groupName" placeholder="请输入分组名称" maxlength="20" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGroupForm" :loading="groupSubmitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑用户抽屉 -->
    <el-drawer v-model="userDrawerVisible" direction="rtl" size="420" :with-header="false" class="user-drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">{{ userDrawerTitle }}</h3>
        <el-button link class="close-btn" @click="userDrawerVisible = false">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>

      <!-- 用户头像区域 -->
      <div class="drawer-avatar-section">
        <el-avatar :size="72" :src="userForm.avatar || defaultAvatar" class="drawer-avatar">
          {{ userForm.nickName?.charAt(0) }}
        </el-avatar>
        <p class="avatar-tip">用户头像</p>
      </div>

      <!-- 表单内容 -->
      <div class="drawer-content">
        <el-form :model="userForm" label-position="top" class="drawer-form">
          <el-form-item label="用户昵称" required>
            <el-input v-model="userForm.nickName" placeholder="请输入用户昵称" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="用户账号" required>
            <el-input v-model="userForm.userName" placeholder="请输入用户账号" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="用户分组">
            <el-cascader v-model="userForm.groupIds" :options="groupTreeData" :props="cascaderProps" clearable
              style="width: 100%" placeholder="请选择分组" />
          </el-form-item>
          <el-form-item label="用户角色">
            <el-select v-model="userForm.roles" multiple placeholder="请选择角色" style="width: 100%">
              <el-option v-for="item in rolesList" :key="item.roleId" :label="item.roleName" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="userForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <el-button type="primary" class="save-btn" @click="submitUserForm" :loading="userSubmitting">
          保存并返回
        </el-button>
      </div>
    </el-drawer>

    <!-- 批量分组弹窗 -->
    <el-dialog v-model="batchGroupDialogVisible" title="批量分组" width="450px" :close-on-click-modal="false">
      <div class="batch-info">
        <el-icon class="batch-icon">
          <InfoFilled />
        </el-icon>
        <span>已选择 <strong>{{ selectedUsers.length }}</strong> 个用户</span>
      </div>
      <el-form label-width="80px" class="dialog-form">
        <el-form-item label="目标分组" required>
          <el-select v-model="batchGroupIds" multiple placeholder="请选择分组" style="width: 100%">
            <el-option v-for="group in flattenGroupOptions" :key="group.id" :label="group.label" :value="group.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchGroupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchGroup" :loading="batchSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Folder, FolderOpened, FolderAdd, Edit, Delete, User, InfoFilled, Close } from '@element-plus/icons-vue'
import {
  getUserGroupTree,
  saveUserGroup,
  deleteUserGroup,
  getGroupUsers,
  batchUserToGroup,
  getRoles,
  addUser,
  editUser,
  deleteUser as deleteUserApi
} from '@/api/userGroup'

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 级联选择器配置
const cascaderProps = {
  value: 'id',
  label: 'nodeName',
  children: 'children',
  multiple: true,
  emitPath: false
}

// 加载状态
const loading = ref(false)
const groupSubmitting = ref(false)
const userSubmitting = ref(false)
const batchSubmitting = ref(false)

// 分组树
const treeRef = ref(null)
const groupTreeData = ref([])
const currentGroupId = ref('')
const groupSearchKey = ref('')

// 过滤分组树
const filteredGroupTree = computed(() => {
  if (!groupSearchKey.value) return groupTreeData.value
  const keyword = groupSearchKey.value.toLowerCase()
  const filter = (groups) => {
    return groups.reduce((acc, group) => {
      const match = group.nodeName?.toLowerCase().includes(keyword)
      const children = group.children?.length ? filter(group.children) : []
      if (match || children.length) {
        acc.push({ ...group, children })
      }
      return acc
    }, [])
  }
  return filter(groupTreeData.value)
})

// 当前分组名称
const currentGroupName = computed(() => {
  if (!currentGroupId.value) return '请选择分组'
  const findName = (groups) => {
    for (const group of groups) {
      if (group.id === currentGroupId.value) return group.nodeName
      if (group.children?.length) {
        const name = findName(group.children)
        if (name) return name
      }
    }
    return null
  }
  return findName(groupTreeData.value) || '用户列表'
})

// 用户列表
const userList = ref([])
const selectedUsers = ref([])
const userSearchKey = ref('')

// 过滤用户列表
const filteredUserList = computed(() => {
  if (!userSearchKey.value) return userList.value
  const keyword = userSearchKey.value.toLowerCase()
  return userList.value.filter(user =>
    user.nickName?.toLowerCase().includes(keyword) ||
    user.userName?.toLowerCase().includes(keyword)
  )
})

// 角色列表
const rolesList = ref([])

// 分组弹窗
const groupDialogVisible = ref(false)
const groupDialogTitle = computed(() => groupForm.id ? '编辑分组' : '新增分组')
const groupForm = reactive({
  id: '',
  groupName: ''
})

// 用户抽屉
const userDrawerVisible = ref(false)
const userDrawerTitle = computed(() => userForm.id ? '编辑用户' : '新增用户')
const userForm = reactive({
  id: '',
  nickName: '',
  userName: '',
  avatar: '',
  groupIds: [],
  roles: [],
  remark: ''
})

// 批量分组弹窗
const batchGroupDialogVisible = ref(false)
const batchGroupIds = ref([])

// 扁平化分组选项
const flattenGroupOptions = computed(() => {
  const flatten = (groups, prefix = '') => {
    let result = []
    groups.forEach(group => {
      const label = prefix ? `${prefix} / ${group.nodeName}` : group.nodeName
      result.push({ id: group.id, label })
      if (group.children?.length) {
        result = result.concat(flatten(group.children, label))
      }
    })
    return result
  }
  return flatten(groupTreeData.value)
})

// 获取分组树
const fetchGroupTree = async () => {
  try {
    const res = await getUserGroupTree()
    groupTreeData.value = res.data || []
  } catch (error) {
    console.error('获取分组树失败:', error)
    ElMessage.error('获取分组列表失败')
  }
}

// 获取角色列表
const fetchRoles = async () => {
  try {
    const res = await getRoles()
    rolesList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 获取分组下的用户
const fetchUsers = async (id) => {
  if (!id) return
  try {
    loading.value = true
    const res = await getGroupUsers(id)
    userList.value = res.data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 点击树节点
const handleNodeClick = (data) => {
  currentGroupId.value = data.id
  fetchUsers(data.id)
}

// ========== 分组操作 ==========

const openCreateGroupDialog = () => {
  groupForm.id = ''
  groupForm.groupName = ''
  groupDialogVisible.value = true
}

const openEditGroupDialog = (group) => {
  groupForm.id = group.id
  groupForm.groupName = group.nodeName
  groupDialogVisible.value = true
}

const submitGroupForm = async () => {
  if (!groupForm.groupName.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }
  try {
    groupSubmitting.value = true
    const res = await saveUserGroup({
      id: groupForm.id || undefined,
      groupName: groupForm.groupName.trim()
    })
    if (res) {
      ElMessage.success(groupForm.id ? '编辑成功' : '新增成功')
      groupDialogVisible.value = false
      fetchGroupTree()
    }
  } catch (error) {
    console.error('保存分组失败:', error)
    ElMessage.error('保存失败')
  } finally {
    groupSubmitting.value = false
  }
}

const deleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(`确定要删除分组「${group.nodeName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteUserGroup(group.id)
    if (res) {
      ElMessage.success('删除成功')
      fetchGroupTree()
      if (currentGroupId.value === group.id) {
        currentGroupId.value = ''
        userList.value = []
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// ========== 用户操作 ==========

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const openCreateUserDialog = () => {
  userForm.id = ''
  userForm.nickName = ''
  userForm.userName = ''
  userForm.avatar = ''
  userForm.groupIds = currentGroupId.value ? [currentGroupId.value] : []
  userForm.roles = []
  userForm.remark = ''
  userDrawerVisible.value = true
}

const openEditUserDialog = (row) => {
  userForm.id = row.id
  userForm.nickName = row.nickName
  userForm.userName = row.userName
  userForm.avatar = row.avatar || ''
  userForm.groupIds = row.groupIds || []
  userForm.roles = row.roles || []
  userForm.remark = row.remark || ''
  userDrawerVisible.value = true
}

const submitUserForm = async () => {
  if (!userForm.nickName.trim()) {
    ElMessage.warning('请输入用户昵称')
    return
  }
  if (!userForm.userName.trim()) {
    ElMessage.warning('请输入用户账号')
    return
  }
  try {
    userSubmitting.value = true
    const params = {
      nickName: userForm.nickName.trim(),
      userName: userForm.userName.trim(),
      groupIds: userForm.groupIds,
      roles: userForm.roles,
      remark: userForm.remark
    }
    let res
    if (userForm.id) {
      params.id = userForm.id
      res = await editUser(params)
    } else {
      res = await addUser(params)
    }
    if (res) {
      ElMessage.success(userForm.id ? '编辑成功' : '新增成功')
      userDrawerVisible.value = false
      if (currentGroupId.value) {
        fetchUsers(currentGroupId.value)
      }
    }
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error('保存失败')
  } finally {
    userSubmitting.value = false
  }
}

const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.nickName}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteUserApi(row.id)
    if (res) {
      ElMessage.success('删除成功')
      if (currentGroupId.value) {
        fetchUsers(currentGroupId.value)
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// ========== 批量分组 ==========

const openBatchGroupDialog = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchGroupIds.value = []
  batchGroupDialogVisible.value = true
}

const submitBatchGroup = async () => {
  if (batchGroupIds.value.length === 0) {
    ElMessage.warning('请选择分组')
    return
  }
  try {
    batchSubmitting.value = true
    const res = await batchUserToGroup({
      userIds: selectedUsers.value.map(u => u.id),
      groupIds: batchGroupIds.value
    })
    if (res) {
      ElMessage.success('批量分组成功')
      batchGroupDialogVisible.value = false
      if (currentGroupId.value) {
        fetchUsers(currentGroupId.value)
      }
    }
  } catch (error) {
    console.error('批量分组失败:', error)
    ElMessage.error('批量分组失败')
  } finally {
    batchSubmitting.value = false
  }
}

// 初始化
onMounted(() => {
  fetchGroupTree()
  fetchRoles()
})
</script>

<style lang="scss">
/* 非 scoped 样式 - 深色主题覆盖 */
html.dark .user-group-page {
  background: #1D1D1D;

  /* ElTree 组件 CSS 变量覆盖 */
  .group-tree .el-tree {
    --el-tree-bg-color: #000000;
    --el-tree-node-hover-bg-color: transparent;
    --el-tree-text-color: #909399;
    --el-tree-expand-icon-color: #909399;
    background: #000000 !important;
  }

  .group-tree :deep(.el-tree-node__content) {
    border-radius: 6px;
    margin-bottom: 4px;
  }

  .group-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: #3b82f6 !important;

    .node-label,
    .node-icon,
    .node-count {
      color: #ffffff !important;
    }
  }

  .group-tree .tree-node {
    padding: 6px 8px;

    .node-label {
      color: #909399;
      font-size: 13px;
    }

    .node-icon {
      color: #909399;
      font-size: 18px;
    }

    .node-count {
      background: #252535;
      color: #909399;
      border-radius: 10px;
      padding: 0 6px;
    }
  }

  /* 覆盖浅色 scoped 样式的 hover 背景 - 使用完整选择器增加优先级 */
  .group-tree .el-tree-node__content:hover {
    background: #252535 !important;

    .node-label,
    .node-icon,
    .node-count {
      color: #ffffff !important;
    }
  }

  /* 选中状态 */
  .group-tree .el-tree-node.is-current>.el-tree-node__content {
    background: #3b82f6 !important;

    .node-label,
    .node-icon,
    .node-count {
      color: #ffffff !important;
    }
  }

  .group-sidebar {
    background: #000000;
    border-right-color: #252535;

    .sidebar-header {
      border-bottom-color: #252535;
    }

    .sidebar-title {
      color: #ffffff;
    }

    .sidebar-search {
      border-bottom-color: #252535;
    }

    .tree-search-input {
      :deep(.el-input__wrapper) {
        background-color: #1e1e2e !important;
        border-color: #252535 !important;
      }

      :deep(.el-input__inner) {
        color: #ffffff !important;
      }

      :deep(.el-input__inner::placeholder) {
        color: #6b6b7b !important;
      }
    }
  }

  .action-icon {
    color: #909399;

    &:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }

    &.delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }

  .empty-tree {
    color: #6b6b7b;
  }

  .user-content {
    .content-card {
      background: #000000;
      border: 1px solid #252535;
    }

    .content-header {
      border-bottom-color: #252535;
    }

    .content-title {
      color: #ffffff;
    }

    .user-count {
      color: #909399;
    }
  }

  .user-name {
    color: #ffffff;
  }

  .user-account {
    color: #909399;
  }

  .no-data {
    color: #6b6b7b;
  }

  .empty-state {
    color: #ffffff;

    .empty-tip {
      color: #ffffff;
    }
  }

  /* 抽屉 */
  .user-drawer {
    :deep(.el-drawer__body) {
      background: #000000;
    }

    .drawer-header {
      border-bottom-color: #252535;
    }

    .drawer-title {
      color: #ffffff;
    }

    .close-btn {
      color: #909399;

      &:hover {
        color: #ffffff;
      }
    }

    .drawer-avatar-section {
      background: #151520;
      border-bottom-color: #252535;
    }

    .drawer-avatar {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .avatar-tip {
      color: #909399;
    }

    .drawer-form {
      :deep(.el-form-item__label) {
        color: #ffffff;
      }
    }

    .drawer-footer {
      border-top-color: #252535;
    }
  }

  .user-table {
    :deep(.el-table__cell) {
      background-color: transparent !important;
      border-bottom-color: #252535;
      color: #ffffff;
    }

    :deep(th.el-table__cell) {
      background: #383838 !important;
      color: #ffffff;
      text-align: center;
    }
  }
}

/* 浅色主题覆盖 */
html.light .user-group-page {
  .tree-search-input {
    :deep(.el-input__wrapper) {
      background-color: #ffffff !important;
      border-color: #dcdfe6 !important;
    }

    :deep(.el-input__inner) {
      color: #303133 !important;
    }

    :deep(.el-input__inner::placeholder) {
      color: #c0c4cc !important;
    }
  }

  .user-table {
    :deep(th.el-table__cell) {
      background: #f5f7fa !important;
      color: var(--el-table-header-text-color) !important;
      text-align: center !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.user-group-page {
  display: flex;
  height: 100%;
  background: #f5f7fa;
  overflow: hidden;
}

/* ========== 左侧分组栏 ========== */
.group-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.sidebar-search {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-search :deep(.el-input__wrapper) {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  box-shadow: none;
  border-radius: 4px;
}

.sidebar-search :deep(.el-input__inner) {
  color: #303133;
}

.group-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.group-tree :deep(.el-tree-node__content) {
  height: auto;
  border-radius: 6px;
  margin-bottom: 4px;
}

.group-tree :deep(.el-tree-node__content:hover) {
  background: #f5f7fa;
}

.group-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #3b82f6;

  .node-label,
  .node-icon,
  .node-count {
    color: #ffffff;
  }
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.node-icon {
  color: #409eff;
  font-size: 18px;
}

.node-label {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-count {
  font-size: 12px;
  color: #909399;
  background: #f0f0f0;
  padding: 0 6px;
  border-radius: 10px;
}

.node-actions {
  display: none;
  gap: 4px;
}

.tree-node:hover .node-actions {
  display: flex;
}

.action-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-icon:hover {
  color: #409eff;
  background: #ecf5ff;
}

.action-icon.delete:hover {
  color: #f56c6c;
  background: #fef0f0;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-tree p {
  margin: 12px 0;
  font-size: 14px;
}

/* ========== 右侧用户列表 ========== */
.user-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.user-count {
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-section {
  flex: 1;
  overflow: auto;
}

.user-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.user-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

.user-table :deep(.el-table-column--selection .cell) {
  text-align: center !important;
  justify-content: center !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-account {
  font-size: 12px;
  color: #909399;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-data {
  color: #c0c4cc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state p {
  margin: 8px 0 0;
  font-size: 14px;
}

.empty-state .empty-tip {
  font-size: 12px;
  color: #c0c4cc;
}

/* ========== 弹窗样式 ========== */
.dialog-form {
  padding: 10px 20px 0;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #409eff;
  font-size: 14px;
}

.batch-icon {
  font-size: 18px;
}

/* ========== 用户抽屉样式 ========== */
.user-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-btn {
  color: #909399;
  font-size: 18px;
}

.close-btn:hover {
  color: #303133;
}

.drawer-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-avatar {
  background: #e6f7ff;
  color: #409eff;
  font-size: 24px;
  font-weight: 500;
}

.avatar-tip {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
}

.drawer-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.drawer-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
}

.save-btn {
  width: 100%;
}

/* ========== 深色模式弹窗样式 ========== */
html.dark .user-group-page {
  .el-dialog {
    background: #101010 !important;
    border: 1px solid #252535 !important;
  }

  .el-dialog__title {
    color: #ffffff !important;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #909399 !important;

    &:hover {
      color: #ffffff !important;
    }
  }

  .dialog-form {
    :deep(.el-form-item__label) {
      color: #ffffff !important;
    }

    :deep(.el-input__wrapper) {
      background: #101010 !important;
      border-color: #252535 !important;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      color: #ffffff !important;
    }

    :deep(.el-textarea__inner) {
      background: #101010 !important;
      border-color: #252535 !important;
      color: #ffffff !important;
    }

    :deep(.el-select .el-input__wrapper) {
      background: #101010 !important;
      border-color: #252535 !important;
    }

    :deep(.el-select .el-input__inner) {
      color: #ffffff !important;
    }
  }

  .batch-info {
    background: rgba(37, 37, 53, 0.3);
    color: #909399;
  }

  /* 用户抽屉深色模式 */
  .user-drawer {
    :deep(.el-drawer) {
      background: #101010 !important;
    }

    .drawer-header {
      border-bottom-color: #252535 !important;
    }

    .drawer-title {
      color: #ffffff !important;
    }

    .drawer-form {
      :deep(.el-form-item__label) {
        color: #ffffff !important;
      }

      :deep(.el-input__wrapper) {
        background: #101010 !important;
        border-color: #252535 !important;
      }

      :deep(.el-input__inner) {
        color: #ffffff !important;
      }

      :deep(.el-textarea__inner) {
        background: #101010 !important;
        border-color: #252535 !important;
        color: #ffffff !important;
      }

      :deep(.el-select .el-input__wrapper) {
        background: #101010 !important;
        border-color: #252535 !important;
      }

      :deep(.el-cascader .el-input__wrapper) {
        background: #101010 !important;
        border-color: #252535 !important;
      }
    }

    .drawer-footer {
      border-top-color: #252535 !important;
    }
  }
}
</style>
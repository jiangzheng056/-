<template>
  <div class="glossary-page" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">专有名词库</h1>
      <div class="header-actions">
        <el-button class="view-btn active">
          <i class="iconfont icon-fk"></i>
        </el-button>
        <el-button class="view-btn" @click="goToListView">
          <i class="iconfont icon-lb"></i>
        </el-button>
        <el-button class="view-btn global-perm-btn" @click="openGlobalPermissionDialog">
          <i class="iconfont icon-permission"></i>
          <span>全局权限</span>
        </el-button>
      </div>
    </div>

    <!-- 名词库卡片网格 -->
    <div class="cards-scroll" ref="scrollRef">
      <div class="cards-grid" v-loading="listLoading">
        <!-- 名词库卡片 -->
        <div
          v-for="item in visibleList"
          :key="item.id"
          class="glossary-card clickable"
          @click="goToDetail(item)"
        >
          <div class="card-header">
            <div class="card-info">
              <el-avatar :size="40" :src="item.avatar" class="card-avatar" />
              <span class="card-title">{{ item.name }}</span>
            </div>
            <el-dropdown trigger="click" @command="handleCommand($event, item)" @click.stop>
              <el-button class="edit-btn" @click.stop>
                <i class="iconfont icon-bj"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">
                    <svg style="font-size: 12px;margin-right: 4px;" class="icon" aria-hidden="true">
                      <use xlink:href="#icon-ss-cmm"></use>
                    </svg>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="permission">
                    <svg style="font-size: 12px;margin-right: 4px;" class="icon" aria-hidden="true">
                      <use xlink:href="#icon-ss-yhqx"></use>
                    </svg>
                    用户权限
                  </el-dropdown-item>
                  <el-dropdown-item command="addSub">
                    <svg style="font-size: 12px;margin-right: 4px;" class="icon" aria-hidden="true">
                      <use xlink:href="#icon-xzzk"></use>
                    </svg>
                    新增子库
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <svg style="font-size: 12px;margin-right: 4px;" class="icon" aria-hidden="true">
                      <use xlink:href="#icon-ss-sck"></use>
                    </svg>
                    删除库
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <p class="card-desc">
            <span class="desc-label">描 述：</span>{{ item.description }}
          </p>

          <div class="card-sublibs">
            <span class="sublib-label">子 库：</span>
            <div class="sublib-tags">
              <el-tag
                v-for="sub in item.subLibs.slice(0, 3)"
                :key="sub"
                class="sublib-tag"
                effect="plain"
              >
                {{ sub }}
              </el-tag>
              <el-tag v-if="item.subLibs.length > 3" class="sublib-tag more" effect="plain">
                +{{ item.subLibs.length - 3 }}
              </el-tag>
            </div>
          </div>

          <div class="card-members">
            <span class="member-label">管理员：</span>
            <div class="avatar-group-custom">
              <el-avatar
                v-for="admin in item.admins.slice(0, 3)"
                :key="'admin-' + admin"
                :size="24"
                :src="admin"
                class="member-avatar"
              />
              <el-avatar v-if="item.admins.length > 3" :size="24" class="member-avatar more">
                +{{ item.admins.length - 3 }}
              </el-avatar>
            </div>
            <el-button class="add-member-btn" circle :icon="Plus"    />

            <span class="member-label member-label-2">成员：</span>
            <div class="avatar-group-custom">
              <el-avatar
                v-for="member in item.members.slice(0, 3)"
                :key="'member-' + member"
                :size="24"
                :src="member"
                class="member-avatar"
              />
              <el-avatar v-if="item.members.length > 3" :size="24" class="member-avatar more">
                +{{ item.members.length - 3 }}
              </el-avatar>
            </div>
            <el-button class="add-member-btn" circle :icon="Plus"    />
          </div>
        </div>

        <!-- 新增名词库卡片 -->
        <div class="add-card" @click="openAddDialog">
          <div class="add-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <span class="add-text">新增名词库</span>
        </div>
      </div>
    </div>

    <!-- 新增/编辑词库弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="isEditMode ? '编辑词库' : '新增词库'"
      width="420px"
      class="glossary-dialog add-dialog"
    >
      <div class="avatar-upload">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          @change="handleAvatarChange"
        >
          <div class="avatar-upload-box">
            <el-icon v-if="!addFormData.avatar" class="upload-icon avatar-uploader-icon" :style="{ color: themeStore.isDark ? '#909399' : '#8c939d' }"><Camera /></el-icon>
            <img v-else :src="addFormData.avatar" class="avatar-preview" loading="lazy" />
          </div>
        </el-upload>
        <span class="avatar-label">名词库图标</span>
      </div>

      <el-form :model="addFormData" label-width="80px" class="dialog-form">
        <el-form-item label="昵称" required>
          <div class="form-input-wrapper">
            <el-input v-model="addFormData.name" placeholder="请输入名词库名称" />
            <el-icon v-if="addFormData.name" class="input-check"><Check /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="词库描述" required>
          <el-input
            v-model="addFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入词库描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddNext">{{ isEditMode ? '确认编辑' : '下一步' }}</el-button>
      </template>
    </el-dialog>

    <!-- 用户权限弹窗 -->
    <el-dialog
      v-model="permissionDialogVisible"
      :title="permissionTitle"
      width="520px"
      class="glossary-dialog permission-dialog"
    >
      <el-form :model="permissionFormData" label-width="140px" class="dialog-form">
        <el-form-item label="用户/用户组选择" required>
          <el-cascader
            v-model="permissionFormData.selectedGroup"
            :options="groupOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择用户/用户组"
            style="width: 100%"
            clearable
          />
        </el-form-item>

        <el-form-item label="权限选择" required>
          <div class="permission-list">
            <el-checkbox v-model="permissionFormData.permissions.view">查看词条</el-checkbox>
            <el-checkbox v-model="permissionFormData.permissions.edit">修改词条</el-checkbox>
            <el-checkbox v-model="permissionFormData.permissions.delete">删除词条</el-checkbox>
            <el-checkbox v-model="permissionFormData.permissions.call">调用词库</el-checkbox>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="permissionDialogVisible = false">上一步</el-button>
        <el-button type="primary" @click="permissionDialogVisible = false">完成</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteDialogVisible"
      width="400px"
      class="glossary-dialog delete-dialog"
      :show-close="false"
    >
      <div class="delete-content">
        <div class="delete-icon-wrapper">
          <el-icon class="delete-warning-icon"><WarningFilled /></el-icon>
        </div>
        <h3 class="delete-title">确定要删除「{{ deleteItemName }}」库？</h3>
        <p class="delete-desc">
          删除后，相关数据将会清除，对应库下的子库也会同时被删除，是否确认删除？
        </p>
      </div>

      <template #footer>
        <div class="delete-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="primary" class="delete-confirm-btn" @click="handleDeleteConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 全局权限管理弹窗 -->
    <el-dialog
      v-model="globalPermissionDialogVisible"
      title="全局权限"
      width="500px"
      class="global-permission-dialog"
      @close="handleClosePermissionDialog"
    >
      <div class="permission-dialog-content">
        <div class="section">
          <h3 class="section-title">用户/用户组选择</h3>
          <el-select v-model="cascaderValue" value-key="id" placeholder="请选择用户/用户组" style="width: 100%;" clearable @change="handleCascaderChange">
            <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item" />
          </el-select>
        </div>
        <div class="section">
          <h3 class="section-title">当前权限</h3>
          <el-checkbox-group v-model="userPermissionForm.authList">
            <el-checkbox v-for="item in nounAuthList" :key="item.authCode" :value="item.authCode" :label="item.authName" />
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleClosePermissionDialog">取消编辑</el-button>
        <el-button type="primary" @click="handleConfirmPermission">确认并应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import {
  Plus,
  Camera,
  Check,
  WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getAllNoun,
  saveNounInfo,
  uploadFile,
  delNoun,
  getAllOrgNode,
  getNounGroupOrUserGlobalAuth,
  changeNounGlobalAuth,
  getNounAuth
} from '@/api/noun'

const router = useRouter()
const themeStore = useThemeStore()

// 加载状态
const listLoading = ref(false)

// 跳转到详情页
const goToDetail = (item) => {
  router.push(`/glossary/${item.id}`)
}

// 跳转到列表视图
const goToListView = () => {
  if (glossaryList.value.length > 0) {
    router.push(`/glossary/${glossaryList.value[0].id}`)
  } else {
    ElMessage.warning('暂无名词库')
  }
}

// ==================== 名词库列表 ====================
const glossaryList = ref([])
const scrollRef = ref(null)
const visibleCount = ref(12) // 同时只渲染12个卡片

// 获取名词库列表
const fetchNounList = async () => {
  try {
    listLoading.value = true
    const res = await getAllNoun({ name: '' })
    if (res && res.data) {
      glossaryList.value = processNounData(res.data || [])
    }
  } catch (error) {
    console.error('获取名词库列表失败:', error)
    ElMessage.error('获取名词库列表失败')
  } finally {
    listLoading.value = false
  }
}

// 处理名词库数据
const processNounData = (data) => {
  return data.map(item => ({
    ...item,
    avatar: item.avatarUrl || '',
    description: item.description || '',
    subLibs: item.childrenList?.map(child => child.name) || [],
    expanded: false,
    admins: [],
    members: []
  }))
}

// 虚拟滚动：只渲染可视区域
const visibleList = computed(() => {
  return glossaryList.value.slice(0, visibleCount.value)
})

// 滚动加载更多
const handleScroll = () => {
  const el = scrollRef.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    visibleCount.value += 6
  }
}

// ==================== 新增/编辑词库弹窗 ====================
const addDialogVisible = ref(false)
const isEditMode = ref(false)
const addFormData = ref({
  id: '',
  avatar: '',
  name: '',
  description: ''
})

const openAddDialog = () => {
  isEditMode.value = false
  addFormData.value = {
    id: '',
    avatar: '',
    name: '',
    description: ''
  }
  addDialogVisible.value = true
}

const handleAvatarChange = async (file) => {
  if (file.raw) {
    try {
      const formData = new FormData()
      formData.append('file', file.raw)
      const res = await uploadFile(formData)
      if (res && (res.code === 200 || res.data)) {
        const realUrl = res.data?.data || res.data || res
        addFormData.value.avatar = realUrl
        ElMessage.success('头像上传成功')
      } else {
        ElMessage.error('头像上传失败')
      }
    } catch (error) {
      ElMessage.error('头像上传失败')
    }
  }
}

const handleAddNext = async () => {
  if (!addFormData.value.name) {
    ElMessage.warning('请输入名词库名称')
    return
  }
  try {
    const params = {
      name: addFormData.value.name,
      description: addFormData.value.description,
      avatarUrl: addFormData.value.avatar
    }
    if (isEditMode.value && addFormData.value.id) {
      params.id = addFormData.value.id
    }
    const res = await saveNounInfo(params)
    if (res) {
      ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
      addDialogVisible.value = false
      fetchNounList()
    }
  } catch (error) {
    ElMessage.error(isEditMode.value ? '编辑失败' : '新增失败')
  }
}

// ==================== 用户权限弹窗 ====================
const permissionDialogVisible = ref(false)
const permissionTitle = ref('用户权限')

const groupOptions = ref([])

const permissionFormData = ref({
  selectedGroup: [],
  permissions: {
    view: true,
    edit: true,
    delete: true,
    call: true
  }
})

// 获取用户/用户组列表
const fetchGroupTree = async () => {
  try {
    const res = await getAllOrgNode()
    if (res && res.data) {
      groupOptions.value = res.data.map(item => ({
        value: item.id,
        label: item.nodeName,
        id: item.id,
        children: item.childrenList?.map(child => ({
          value: child.id,
          label: child.nodeName,
          id: child.id
        })) || []
      }))
    }
  } catch (error) {
    console.error('获取用户组列表失败:', error)
  }
}

const openPermissionDialog = (item) => {
  permissionTitle.value = `${item.name} - 用户权限`
  permissionDialogVisible.value = true
}

// ==================== 全局权限管理 ====================
const globalPermissionDialogVisible = ref(false)
const cascaderValue = ref(null)
const nounAuthList = ref([])
const userPermissionForm = ref({ node: [], authList: [] })

// 获取名词权限列表
const getNounAuthList = async () => {
  try {
    const res = await getNounAuth()
    if (res && res.data) {
      nounAuthList.value = res.data || []
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}

const openGlobalPermissionDialog = () => {
  globalPermissionDialogVisible.value = true
}

const handleClosePermissionDialog = () => {
  globalPermissionDialogVisible.value = false
  clearPermissionForm()
}

const clearPermissionForm = () => {
  userPermissionForm.value = { node: [], authList: [] }
  cascaderValue.value = null
}

const handleCascaderChange = async (data) => {
  try {
    userPermissionForm.value.node = [data]
    const res = await getNounGroupOrUserGlobalAuth({
      id: data.id,
      nodeType: data.children ? 'group' : 'user'
    })
    if (res && res.data) {
      userPermissionForm.value.authList = res.data.map(item => item.authCode)
    }
  } catch (error) {
    userPermissionForm.value.node = []
    console.error('获取用户权限失败:', error)
  }
}

const handleConfirmPermission = async () => {
  try {
    if (!userPermissionForm.value.node.length) {
      return ElMessage.warning('请选择用户/用户组')
    }
    const res = await changeNounGlobalAuth({
      authList: userPermissionForm.value.authList,
      node: userPermissionForm.value.node
    })
    if (res) {
      ElMessage.success('权限设置已保存')
      clearPermissionForm()
      globalPermissionDialogVisible.value = false
    }
  } catch (error) {
    console.error('权限配置异常:', error)
    ElMessage.error('权限配置异常，请重试')
  }
}

// ==================== 删除确认弹窗 ====================
const deleteDialogVisible = ref(false)
const deleteItemName = ref('')
const deleteItemId = ref(null)

const openDeleteDialog = (item) => {
  deleteItemName.value = item.name
  deleteItemId.value = item.id
  deleteDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  try {
    const res = await delNoun(deleteItemId.value)
    if (res) {
      ElMessage.success('删除成功')
      deleteDialogVisible.value = false
      fetchNounList()
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// ==================== 下拉菜单操作 ====================
const handleCommand = (command, item) => {
  switch (command) {
    case 'rename':
      isEditMode.value = true
      addFormData.value = {
        id: item.id,
        avatar: item.avatarUrl || item.avatar || '',
        name: item.name,
        description: item.description || ''
      }
      addDialogVisible.value = true
      break
    case 'permission':
      openPermissionDialog(item)
      break
    case 'addSub':
      ElMessage.info('新增子库功能开发中')
      break
    case 'delete':
      openDeleteDialog(item)
      break
  }
}

// 初始化
onMounted(() => {
  fetchNounList()
  fetchGroupTree()
  getNounAuthList()

  // 滚动加载
  scrollRef.value?.addEventListener('scroll', handleScroll)
})
</script>

<style lang="scss">
/* 非 scoped 样式 - CSS 变量主题定义 */
.glossary-page {
  --bg: #1D1D1D;
  --bg-secondary: #000000;
  --bg-header: #000000;
  --border: #252535;
  --text: #ffffff;
  --text-secondary: #ffffff;
  --text-muted: #909090;
  --text-desc: #606266;
}

/* 浅色主题变量覆盖 */
.light .glossary-page {
  --bg: #ffffff;
  --bg-secondary: #ffffff;
  --bg-header: #ffffff;
  --border: #e4e7ed;
  --text: #303133;
  --text-secondary: #606266;
  --text-muted: #9ca3af;
  --text-desc: #606266;
}

/* 深色模式下编辑按钮样式 */
.dark .glossary-page .edit-btn {
  background: #1e1e2e !important;
  border-color: #252535 !important;
  color: #ffffff !important;

  i {
    color: #ffffff !important;
  }

  &:hover {
    background: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: #fff !important;

    i {
      color: #fff !important;
    }
  }
}

/* 深色模式下上传图标样式 - 全局覆盖 Element Plus 默认样式 */
.dark .glossary-page .glossary-dialog .avatar-uploader .el-icon.avatar-uploader-icon {
  color: #909399 !important;
}

.dark .glossary-page .glossary-dialog .avatar-uploader .el-upload:hover .el-icon.avatar-uploader-icon {
  color: #3b82f6 !important;
}

/* 深色模式下上传图标样式 - 全局覆盖 */
.dark .glossary-page .glossary-dialog {
  .avatar-uploader .avatar-uploader-icon {
    color: #909399 !important;
  }

  .avatar-uploader .el-upload:hover .avatar-uploader-icon {
    color: #3b82f6 !important;
  }
}

/* 浅色模式下弹窗样式 */
.light .glossary-page .glossary-dialog {
  :deep(.el-dialog) {
    background: #ffffff !important;
  }

  .avatar-upload-box {
    background: #ffffff !important;
  }

  .avatar-uploader {
    :deep(.avatar-uploader-icon) {
      color: #8c939d !important;
    }

    :deep(.el-upload:hover .avatar-uploader-icon) {
      color: #3b82f6 !important;
    }
  }

  /* 覆盖 Element Plus 默认上传图标样式 */
  :deep(.avatar-uploader .el-icon.avatar-uploader-icon) {
    color: #8c939d !important;
  }

  :deep(.avatar-uploader .el-upload:hover .el-icon.avatar-uploader-icon) {
    color: #3b82f6 !important;
  }
}

/* 深色模式下弹窗样式 */
.dark .glossary-page .glossary-dialog {
  .avatar-upload-box {
    background: #101010 !important;
    border-color: #252535 !important;
  }

  .avatar-label {
    color: #909399 !important;
  }

  .avatar-uploader {
    :deep(.avatar-uploader-icon) {
      color: #909399 !important;
    }

    :deep(.el-upload:hover .avatar-uploader-icon) {
      color: #3b82f6 !important;
    }
  }

  /* 覆盖 Element Plus 默认上传图标样式 */
  :deep(.avatar-uploader .el-icon.avatar-uploader-icon) {
    color: #909399 !important;
  }

  :deep(.avatar-uploader .el-upload:hover .el-icon.avatar-uploader-icon) {
    color: #3b82f6 !important;
  }
}

/* 浅色模式下编辑按钮样式 */
.light .glossary-page .edit-btn {
  background: #ffffff !important;
  border-color: #e4e7ed !important;
  color: #303133 !important;

  i {
    color: #303133 !important;
  }

  &:hover {
    background: #f5f7fa !important;
    border-color: #3b82f6 !important;
    color: #3b82f6 !important;

    i {
      color: #3b82f6 !important;
    }
  }
}

/* 深色模式下下拉菜单样式 */
.dark .glossary-page {
  .el-dropdown-menu {
    background: #1e1e2e !important;
    border-color: #252535 !important;

    .el-dropdown-menu__item {
      color: #ffffff !important;

      &:hover {
        background: #252535 !important;
      }

      .icon {
        color: #ffffff !important;
      }
    }

    .el-dropdown-menu__item--divided {
      border-top-color: #252535 !important;
    }
  }

  /* 全局覆盖上传图标颜色 - 深色模式 */
  .glossary-dialog {
    .avatar-uploader {
      .el-icon.avatar-uploader-icon {
        color: #909399 !important;
      }

      .el-upload:hover .el-icon.avatar-uploader-icon {
        color: #3b82f6 !important;
      }
    }
  }
}

/* 全局权限弹窗样式 */
.dark .glossary-page .global-permission-dialog {
  .el-dialog {
    background: #101010 !important;
    border-color: #252535 !important;
    border-radius: 8px;
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

  .permission-dialog-content {
    padding: 10px 0;

    .section {
      margin-bottom: 20px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff !important;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #252535 !important;
      }

      .el-select {
        .el-input__wrapper {
          background: #101010 !important;
          border-color: #252535 !important;
          box-shadow: none;
        }

        .el-input__inner {
          color: #ffffff !important;
        }
      }

      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-checkbox {
          margin: 0;

          .el-checkbox__label {
            color: #ffffff !important;
            font-size: 13px;
          }

          .el-checkbox__inner {
            background: #101010 !important;
            border-color: #252535 !important;
          }
        }
      }
    }
  }
}

/* 浅色模式下全局权限弹窗样式 */
.light .glossary-page .global-permission-dialog {
  .el-dialog {
    background: #ffffff !important;
    border-color: #e4e7ed !important;
    border-radius: 8px;
  }

  .el-dialog__title {
    color: #303133 !important;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #909399 !important;

    &:hover {
      color: #303133 !important;
    }
  }

  .permission-dialog-content {
    padding: 10px 0;

    .section {
      margin-bottom: 20px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133 !important;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed !important;
      }

      .el-select {
        .el-input__wrapper {
          background: #ffffff !important;
          border-color: #dcdfe6 !important;
          box-shadow: none;
        }

        .el-input__inner {
          color: #303133 !important;
        }
      }

      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-checkbox {
          margin: 0;

          .el-checkbox__label {
            color: #606266 !important;
            font-size: 13px;
          }

          .el-checkbox__inner {
            background: #ffffff !important;
            border-color: #dcdfe6 !important;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss" scoped>
$primary: #3b82f6;

.glossary-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  background: var(--bg);
  contain: layout paint size; /* 性能优化 */

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    background: var(--bg-secondary);
    padding: 8px 16px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .page-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .view-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 4px 8px;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 4px;

    i { font-size: 14px; }
    span { font-size: 12px; }

    &:hover {
      background: var(--bg-secondary);
      color: var(--text);
    }
    &.active {
      background: $primary;
      color: #fff;
      border-color: $primary;
    }
  }

  /* 滚动区域优化 */
  .cards-scroll {
    flex: 1;
    overflow-y: auto;
    will-change: scroll-position;
    backface-visibility: hidden;
  }

  .cards-grid {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .glossary-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    will-change: transform;
    transform: translateZ(0);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .card-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-avatar {
    border-radius: 8px;
  }

  .card-title {
    font-weight: 500;
    color: var(--text);
    font-size: 14px;
  }

  .edit-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    background: var(--bg-card, #fff);
    border: 1px solid var(--border-light, #FAFAFB);
    color: #000;
    transition: color 0.2s, background 0.2s;

    i {
      font-size: 14px;
    }

    &:hover {
      background: #2F82FE;
      border-color: #2F82FE;
      color: #fff;
    }
  }

  .card-desc {
    font-size: 12px;
    color: var(--text-desc);
    line-height: 1.6;
    margin: 0 0 12px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .desc-label {
    color: var(--text-muted);
  }

  .card-sublibs {
    margin-bottom: 12px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }

  .sublib-label {
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
    line-height: 22px;
  }

  .sublib-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
  }

  .sublib-tag {
    background: #F5F7FA;
    border: 1px solid #E4E7ED;
    color: var(--text-secondary);
    font-size: 12px;
    height: 22px;
    line-height: 22px;
    padding: 0 8px;

    &.more {
      background: #EBEEF5;
    }
  }

  .card-members {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .avatar-group-custom {
    display: flex;
    align-items: center;
  }

  .member-label {
    flex-shrink: 0;
    &-2 { margin-left: 8px; }
  }

  .member-avatar {
    border: 2px solid #fff;
    &.more {
      background: #F5F7FA;
      color: #909399;
      font-size: 11px;
      font-weight: 500;
    }
  }

  .add-member-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px dashed #DCDFE6;
    color: #909399;
    transition: border-color 0.2s, color 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }

  .add-card {
    border: 1px dashed #DCDFE6;
    border-radius: 12px;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: $primary;
    }
  }

  .add-icon {
    width: 40px;
    height: 40px;
    background: #F5F7FA;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 20px;
  }

  .add-text {
    font-size: 14px;
    color: #909399;
  }

  /* 以下原有列表/抽屉样式保留但精简渲染消耗 */
  .list-container, .list-sidebar, .list-main, .edit-drawer {
    contain: layout paint;
  }

  /* 弹窗精简过渡，不卡 */
  .glossary-dialog {
    :deep(.el-dialog) {
      background: #101010 !important;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    :deep(.el-dialog__header) {
      padding: 20px 20px 10px;
    }
    :deep(.el-dialog__title) {
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 500;
    }
    :deep(.el-dialog__headerbtn .el-dialog__close) {
      color: #909399;
    }
    :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
      color: #ffffff;
    }
  }

  .avatar-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
  }
  .avatar-upload-box {
    width: 80px;
    height: 80px;
    border: 2px dashed #3a3a4a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s;
    background: #101010;

    &:hover { border-color: $primary; }
  }
  .upload-icon, .avatar-uploader-icon {
    font-size: 24px;
    color: #909399 !important;
  }
  .avatar-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-label {
    font-size: 12px;
    margin-top: 8px;
    color: #909399 !important;
  }

  .avatar-uploader {
    :deep(.avatar-uploader-icon) {
      color: #909399 !important;
    }

    :deep(.el-upload:hover .avatar-uploader-icon) {
      color: #3b82f6 !important;
    }
  }

  /* 覆盖 Element Plus 默认上传图标样式 */
  :deep(.avatar-uploader .el-icon.avatar-uploader-icon) {
    color: #909399 !important;
  }

  :deep(.avatar-uploader .el-upload:hover .el-icon.avatar-uploader-icon) {
    color: #3b82f6 !important;
  }

  .dialog-form {
    :deep(.el-form-item__label) {
      color: var(--text-secondary);
    }
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      background: var(--bg);
      border: 1px solid var(--border);
      box-shadow: none;
    }
    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      color: var(--text);
    }
  }

  .permission-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    :deep(.el-checkbox__label) {
      color: var(--text-secondary);
      font-size: 13px;
    }
  }

  .form-input-wrapper {
    position: relative;
  }
  .input-check {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #22c55e;
  }

  /* 删除弹窗样式 - 深色模式 */
  .dark .glossary-page .delete-dialog {
    :deep(.el-dialog) {
      background: #101010 !important;
      border-color: #252535 !important;
      border-radius: 8px;
    }

    :deep(.el-dialog__header) {
      display: none;
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }

    .delete-title {
      color: #ffffff !important;
    }

    .delete-desc {
      color: #909399 !important;
    }

    .delete-confirm-btn {
      background: #ffffff !important;
      border-color: #ffffff !important;
      color: #000000 !important;

      &:hover {
        background: #e0e0e0 !important;
        border-color: #e0e0e0 !important;
      }
    }
  }

  /* 删除弹窗样式 - 浅色模式 */
  .light .glossary-page .delete-dialog {
    :deep(.el-dialog) {
      background: #ffffff !important;
      border: 1px solid #E4E7ED;
      border-radius: 8px;
    }

    :deep(.el-dialog__header) {
      display: none;
    }

    :deep(.el-dialog__body) {
      padding: 20px;
    }
  }

  .delete-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .delete-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    background: rgba(239, 68, 68, 0.1);
  }

  .delete-warning-icon {
    font-size: 32px;
    color: #ef4444;
  }

  .delete-title {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: #303133;
  }

  .delete-desc {
    font-size: 12px;
    margin: 0;
    line-height: 1.6;
    color: #909399;
  }

  .delete-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .delete-confirm-btn {
    background: #303133;
    border-color: #303133;

    &:hover {
      background: #4a4a4c;
      border-color: #4a4a4c;
    }
  }
}

/* 响应式 */
@media (max-width: 1400px) {
  .cards-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1100px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .cards-grid { grid-template-columns: 1fr; }
}
</style>
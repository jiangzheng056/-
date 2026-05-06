<template>
  <div class="glossary-detail" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">专有名词库</h1>
      <div class="header-actions">
        <el-button class="view-btn" @click="goToCardView">
          <i class="iconfont icon-fk"></i>
        </el-button>
        <el-button class="view-btn active">
          <i class="iconfont icon-lb"></i>
        </el-button>
        <el-button class="view-btn global-perm-btn" @click="openGlobalPermissionDialog">
          <i class="iconfont icon-permission"></i>
          <span>全局权限</span>
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <!-- 左侧词库树形结构 -->
      <div class="sidebar-tree">
        <!-- 词库标题栏 -->
        <div class="tree-header">
          <el-input v-model="treeSearchKeyword" placeholder="搜索名词库..." class="tree-search-input"
            @keyup.enter="handleTreeSearch">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
            <template #suffix>
              <el-button type="primary" class="add-noun-btn" @click="handleAddNoun">
                <el-icon>
                  <Plus />
                </el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        <!-- 树形结构列表 -->
        <div class="tree-list" v-loading="treeLoading" element-loading-text="加载中...">
          <div v-for="item in nounTreeData" :key="item.id" class="tree-group">
            <!-- 根节点 -->
            <div class="tree-item root-item" :class="{ active: String(selectedNounId) === String(item.id) }"
              @click="handleSelectNoun(item)">
              <div class="tree-item-content">
                <el-icon v-if="item.childrenList && item.childrenList.length" class="expand-icon"
                  @click.stop="toggleExpand(item)">
                  <ArrowDown v-if="item.expanded" />
                  <ArrowRight v-else />
                </el-icon>
                <el-icon v-else class="expand-icon placeholder"></el-icon>

                <el-tooltip :content="item.name" placement="right" :disabled="!isNameOverflow(item.name)">
                  <span class="tree-item-label" ref="nameLabel">{{ item.name }}</span>
                </el-tooltip>
                <el-dropdown trigger="click" @command="handleTreeCommand($event, item)" @click.stop
                  class="tree-item-more">
                  <el-button class="more-btn" @click.stop>
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
                        新增子项
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
            </div>

            <!-- 子节点列表 -->
            <div v-if="item.expanded && item.childrenList && item.childrenList.length" class="tree-children">
              <div v-for="child in item.childrenList" :key="child.id" class="tree-item child-item"
                :class="{ active: String(selectedNounId) === String(child.id) }" @click="handleSelectNoun(child)">
                <div class="tree-item-content">
                  <el-icon class="tree-item-icon file-icon">
                    <Document />
                  </el-icon>
                  <el-tooltip :content="child.name" placement="right" :disabled="!isNameOverflow(child.name)">
                    <span class="tree-item-label" ref="nameLabel">{{ child.name }}</span>
                  </el-tooltip>
                  <el-dropdown trigger="click" @command="handleTreeCommand($event, child)" @click.stop
                    class="tree-item-more">
                    <el-button class="more-btn" @click.stop>
                      <el-icon>
                        <MoreFilled />
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="rename">
                          <el-icon>
                            <Edit />
                          </el-icon>
                          编辑
                        </el-dropdown-item>
                        <el-dropdown-item command="permission">
                          <el-icon>
                            <User />
                          </el-icon>
                          用户权限
                        </el-dropdown-item>
                        <el-dropdown-item command="addSub">
                          <el-icon>
                            <FolderAdd />
                          </el-icon>
                          新增子项
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided>
                          <el-icon class="delete-icon">
                            <Delete />
                          </el-icon>
                          删除库
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧词条表格区域 -->
      <div class="main-content">
        <!-- 表格操作栏 -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button class="toolbar-btn add-entry-btn" @click="handleAddEntry">
              <i style="color: #2F5DFE;" class="iconfont icon-ss-xzh"></i>
              <span>表格新增行</span>
            </el-button>
            <el-button class="toolbar-btn add-language-btn" @click="handleAddLanguage">
              <i class="iconfont icon-ss-xzyy"></i>
              <span>新增语言</span>
            </el-button>
            <el-button class="toolbar-btn batch-delete-btn" @click="handleBatchDelete">
              <i class="iconfont icon-sc2"></i>
              <span>批量删除</span>
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-select v-model="languageFilter" placeholder="全部语言" class="language-select">
              <el-option label="全部语言" value="" />
              <el-option label="中文" value="zh" />
              <el-option label="英文" value="en" />
              <el-option label="日文" value="ja" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="搜索词条..." class="search-input" clearable>
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="table-wrapper">
          <el-table :data="tableData" class="entry-table" height="100%" @selection-change="handleSelectionChange"
            v-loading="tableLoading" element-loading-text="加载中...">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="100" />
            <!-- 动态表头 -->
            <el-table-column v-for="header in headerList" :key="header.code" :prop="header.code" :label="header.name"
              min-width="200">
              <template #default="{ row }">
                <div class="cell-text">{{ row[header.code] }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <div class="action-btns">
                    <el-button class="action-btn edit-btn" @click="handleEditEntry(row)">
                      <i class="iconfont icon-bj"></i>
                    </el-button>
                    <el-button class="action-btn view-btn" @click="handleViewEntry(row)">
                      <i class="iconfont icon-ss-ck"></i>
                    </el-button>
                    <el-button class="action-btn delete-btn" @click="handleDeleteEntry(row)">
                      <i class="iconfont icon-sc2"></i>
                    </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页栏 -->
        <div class="pagination-bar">
          <span class="total-text">共{{ total }}条</span>
          <el-pagination :current-page="currentPage" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="prev, pager, next, sizes, jumper" background @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </div>
    </div>

    <!-- 右侧编辑抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="400" :with-header="false" class="edit-drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">
          {{ isEditMode ? (currentEntry.id ? '编辑词条' : '新增词条') : '查看词条' }}
          <span v-if="currentEntry.id" class="drawer-id">ID: {{ currentEntry.id }}</span>
        </h3>
        <el-button link class="close-btn" @click="drawerVisible = false">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>

      <!-- 标签栏 -->
      <div class="drawer-tabs">
        <div v-for="tab in languageTabs" :key="tab.value" class="drawer-tab"
          :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
          {{ tab.label }}
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="drawer-content">
        <!-- 查看模式：只读显示 -->
        <template v-if="!isEditMode">
          <div class="view-section">
            <p class="view-label">词条内容</p>
            <div class="view-content">{{ getEntryContent() || '暂无内容' }}</div>
          </div>
          <div class="view-section" v-if="termExplanation">
            <p class="view-label">术语解释</p>
            <div class="view-content">{{ termExplanation }}</div>
          </div>
        </template>

        <!-- 编辑模式：可编辑 -->
        <template v-else>
          <div class="edit-section">
            <p class="edit-label">{{ activeTabLabel }}</p>
            <el-input :key="activeTab" v-model="currentEntry[activeTab]" type="textarea" :rows="6"
              placeholder="请输入词条内容" />
          </div>

          <div class="term-section">
            <p class="term-label">术语解释</p>
            <el-input v-model="termExplanation" type="textarea" :rows="4" placeholder="请输入术语解释" />
          </div>
        </template>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <template v-if="isEditMode">
          <el-button type="primary" class="save-btn" @click="handleSaveEntry">保存并返回</el-button>
        </template>
        <template v-else>
          <el-button class="save-btn" @click="drawerVisible = false">关闭</el-button>
        </template>
      </div>
    </el-drawer>

    <!-- 全局权限管理弹窗 -->
    <el-dialog v-model="globalPermissionDialogVisible" title="全局权限" width="500px" class="global-permission-dialog"
      @close="handleClosePermissionDialog">
      <div class="permission-dialog-content">
        <div class="section">
          <h3 class="section-title">用户/用户组选择</h3>
          <el-select v-model="cascaderValue" value-key="id" placeholder="请选择用户/用户组" style="width: 100%;" clearable
            @change="handleCascaderChange">
            <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item" />
          </el-select>
        </div>
        <div class="section">
          <h3 class="section-title">当前权限</h3>
          <el-checkbox-group v-model="userPermissionForm.authList">
            <el-checkbox v-for="item in nounAuthList" :key="item.authCode" :value="item.authCode"
              :label="item.authName" />
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleClosePermissionDialog">取消编辑</el-button>
        <el-button type="primary" @click="handleConfirmPermission">确认并应用</el-button>
      </template>
    </el-dialog>

    <!-- 新增语言组件 -->
    <AddLanguage :visible="addLanguageVisible" :id="selectedNounId" @update:visible="addLanguageVisible = $event"
      @refreshList="handleRefreshLanguage" @closeDialog="handleAddLanguageClose" />

    <!-- 新增行组件 -->
    <AddNewLine :visible="addNewLineVisible" :id="selectedNounId" :listData="headerList"
      @update:visible="addNewLineVisible = $event" @submit="handleAddNewLineSubmit"
      @closeAddNewLine="handleAddNewLineClose" />

    <!-- 用户权限对话框 -->
    <UserPermissionDialog :visible="userPermissionDialogVisible" :noun-id="currentTreeNode?.id || ''"
      @update:visible="userPermissionDialogVisible = $event" @permission-updated="handlePermissionUpdated" />

    <!-- 新增/编辑词库弹窗 -->
    <el-dialog
      v-model="nounDialogVisible"
      :title="nounDialogIsEdit ? '编辑词库' : '新增词库'"
      width="420px"
      class="glossary-dialog add-dialog"
      @close="handleNounDialogClose"
    >
      <div class="avatar-upload">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          @change="handleNounAvatarChange"
        >
          <div class="avatar-upload-box">
            <el-icon v-if="!nounDialogData.avatar" class="upload-icon avatar-uploader-icon" :style="{ color: themeStore.isDark ? '#909399' : '#8c939d' }"><Camera /></el-icon>
            <img v-else :src="nounDialogData.avatar" class="avatar-preview" loading="lazy" />
          </div>
        </el-upload>
        <span class="avatar-label">词库图标</span>
      </div>

      <el-form :model="nounDialogData" label-width="80px" class="dialog-form">
        <el-form-item label="名称" required>
          <div class="form-input-wrapper">
            <el-input v-model="nounDialogData.name" placeholder="请输入词库名称" />
          </div>
        </el-form-item>
        <el-form-item label="描述" required>
          <el-input
            v-model="nounDialogData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入词库描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="nounDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleNounDialogSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import {
  Plus,
  Delete,
  Document,
  EditPen,
  Upload,
  Download,
  Search,
  ArrowDown,
  ArrowRight,
  View,
  Close,
  Grid,
  List,
  MoreFilled,
  Edit,
  User,
  FolderAdd,
  Camera
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAllNoun,
  getTableHeaders,
  getNounEntryDetail,
  nounEntryList,
  saveEntry,
  delTranslation,
  delNoun,
  getAllOrgNode,
  getNounGroupOrUserGlobalAuth,
  changeNounGlobalAuth,
  getNounAuth,
  saveNounInfo,
  uploadFile
} from '@/api/noun'
import AddLanguage from '@/components/AddLanguage/index.vue'
import AddNewLine from '@/components/AddNewLine/index.vue'
import UserPermissionDialog from '@/components/UserPermissionDialog/index.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

// 跳转到卡片视图
const goToCardView = () => {
  router.push('/glossary')
}

// 当前选中的名词库ID（用于词条列表）
const selectedNounId = ref('')

// 加载状态
const tableLoading = ref(false)
const treeLoading = ref(false)

// 名词库树形数据
const nounTreeData = ref([])

// 表格数据
const tableData = ref([])
const headerList = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 筛选
const languageFilter = ref('')
const searchKeyword = ref('')
const treeSearchKeyword = ref('')

// 选中行
const selectedRows = ref([])

// 全局权限管理
const globalPermissionDialogVisible = ref(false)
const cascaderValue = ref(null)
const nounAuthList = ref([])
const userPermissionForm = ref({ node: [], authList: [] })
const groupOptions = ref([])

// 新增语言/新增行组件
const addLanguageVisible = ref(false)
const addNewLineVisible = ref(false)

// 树形节点编辑
const currentTreeNode = ref(null)
const userPermissionDialogVisible = ref(false)

// 名词库编辑对话框
const nounDialogVisible = ref(false)
const nounDialogData = ref({
  id: '',
  avatar: '',
  name: '',
  description: ''
})
const nounDialogIsEdit = ref(false)

// 词库头像上传
const handleNounAvatarChange = async (file) => {
  if (file.raw) {
    try {
      const formData = new FormData()
      formData.append('file', file.raw)
      const res = await uploadFile(formData)
      if (res && (res.code === 200 || res.data)) {
        const realUrl = res.data?.data || res.data || res
        nounDialogData.value.avatar = realUrl
        ElMessage.success('头像上传成功')
      } else {
        ElMessage.error('头像上传失败')
      }
    } catch (error) {
      ElMessage.error('头像上传失败')
    }
  }
}

// 编辑名词库
const handleEditNoun = (node) => {
  nounDialogIsEdit.value = true
  nounDialogData.value = {
    id: node.id,
    avatar: node.avatarUrl || node.icon || '',
    name: node.name,
    description: node.description || ''
  }
  nounDialogVisible.value = true
}

// 处理树形节点命令
const handleTreeCommand = (command, node) => {
  currentTreeNode.value = node
  switch (command) {
    case 'rename':
      handleEditNoun(node)
      break
    case 'permission':
      handleNodePermission(node)
      break
    case 'addSub':
      handleAddSubNode(node)
      break
    case 'delete':
      handleDeleteNode(node)
      break
  }
}

// 节点权限
const handleNodePermission = () => {
  userPermissionDialogVisible.value = true
}

// 新增子节点
const handleAddSubNode = (node) => {
  ElMessage.info(`新增子项：${node.name}`)
  // TODO: 实现新增子项逻辑
}

// 删除节点
const handleDeleteNode = async (node) => {
  try {
    await ElMessageBox.confirm(`确定要删除词库"${node.name}"吗？`, '删除确认', { type: 'warning' })
    const res = await delNoun(node.id)
    if (res && res.code === 200) {
      // 从树形数据中移除节点
      const removeNode = (nodes, id) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes.splice(i, 1)
            return true
          }
          if (nodes[i].childrenList) {
            if (removeNode(nodes[i].childrenList, id)) return true
          }
        }
        return false
      }
      if (removeNode(nounTreeData.value, node.id)) {
        // 如果删除的是当前选中的节点，清空表格
        if (String(selectedNounId.value) === String(node.id)) {
          selectedNounId.value = ''
          tableData.value = []
          headerList.value = []
        }
        ElMessage.success('删除成功')
        fetchNounTree()
      } else {
        ElMessage.error('删除失败，节点未找到')
      }
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除操作异常')
      console.error('删除失败:', error)
    }
  }
}

// 权限更新回调
const handlePermissionUpdated = () => {
  ElMessage.success('权限配置已成功应用')
}

// 名词库对话框关闭
const handleNounDialogClose = () => {
  if (!nounDialogIsEdit.value) {
    nounDialogData.value = {
      id: '',
      avatar: '',
      name: '',
      description: ''
    }
  }
  nounDialogVisible.value = false
}

// 名词库对话框提交
const handleNounDialogSubmit = async () => {
  if (!nounDialogData.value.name) {
    ElMessage.warning('请输入词库名称')
    return
  }
  try {
    const res = await saveNounInfo({
      id: nounDialogData.value.id || undefined,
      avatarUrl: nounDialogData.value.avatar,
      name: nounDialogData.value.name,
      description: nounDialogData.value.description
    })
    if (res && (res.code === 200 || res.data)) {
      ElMessage.success(nounDialogIsEdit.value ? '编辑词库成功！' : '创建词库成功！')
      nounDialogVisible.value = false
      fetchNounTree()
    } else {
      ElMessage.error(res?.message || '操作失败，请重试')
    }
  } catch (error) {
    ElMessage.error(`提交表单异常：${error.message || '请重试'}`)
  }
}

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

// 打开全局权限弹窗
const openGlobalPermissionDialog = () => {
  globalPermissionDialogVisible.value = true
}

// 关闭全局权限弹窗
const handleClosePermissionDialog = () => {
  globalPermissionDialogVisible.value = false
  clearPermissionForm()
}

// 清空权限表单
const clearPermissionForm = () => {
  userPermissionForm.value = { node: [], authList: [] }
  cascaderValue.value = null
}

// 权限选择器变更
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

// 确认全局权限配置
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

// 抽屉相关
const drawerVisible = ref(false)
const isEditMode = ref(false) // 是否编辑模式
const activeTab = ref('')
const currentEntry = ref({})
const termExplanation = ref('')

// 语言标签（动态获取）
const languageTabs = computed(() => {
  return headerList.value.map(item => ({
    value: item.code,
    label: item.name
  }))
})

const activeTabLabel = computed(() => {
  const tab = languageTabs.value.find(t => t.value === activeTab.value)
  return tab ? tab.label : ''
})

const getEntryContent = () => {
  return currentEntry.value[activeTab.value] || ''
}

// 获取名词库树形列表
const fetchNounTree = async () => {
  try {
    treeLoading.value = true
    const res = await getAllNoun({ name: treeSearchKeyword.value })
    if (res && res.data) {
      // 处理树形数据，添加展开状态
      nounTreeData.value = res.data.map(item => ({
        ...item,
        expanded: true
      }))
    }
  } catch (error) {
    console.error('获取名词库列表失败:', error)
    ElMessage.error('获取名词库列表失败')
  } finally {
    treeLoading.value = false
  }
}

// 展开/折叠节点
const toggleExpand = (item) => {
  item.expanded = !item.expanded
}

// 搜索名词库
const handleTreeSearch = () => {
  fetchNounTree()
}

// 新增名词库
const handleAddNoun = () => {
  nounDialogIsEdit.value = false
  nounDialogData.value = {}
  nounDialogVisible.value = true
}

// 选择名词库
const handleSelectNoun = async (item) => {
  selectedNounId.value = item.id
  currentPage.value = 1
  await fetchHeaders()
  fetchEntryList()
}

// 获取表头（语言列表）
const fetchHeaders = async () => {
  if (!selectedNounId.value) return
  try {
    const res = await getTableHeaders(selectedNounId.value)
    if (res && res.data) {
      headerList.value = res.data || []
      if (headerList.value.length) {
        activeTab.value = headerList.value[0].code
      }
    }
  } catch (error) {
    console.error('获取表头失败:', error)
    headerList.value = []
  }
}

// 获取词条列表
const fetchEntryList = async () => {
  if (!selectedNounId.value) return
  try {
    tableLoading.value = true
    const res = await nounEntryList({
      id: selectedNounId.value,
      page: currentPage.value,
      size: pageSize.value,
      sourceLanguage: languageFilter.value,
      sourceText: searchKeyword.value
    })
    if (res && res.data) {
      tableData.value = res.data?.dataInfo?.list || []
      total.value = res.data?.dataInfo?.total || 0
    }
  } catch (error) {
    console.error('获取词条列表失败:', error)
    ElMessage.error('获取词条列表失败')
  } finally {
    tableLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  await fetchNounTree()
  await fetchGroupTree()
  getNounAuthList()
  // 如果有路由参数，选中对应的名词库
  if (route.params.id) {
    selectedNounId.value = route.params.id
    await fetchHeaders()
    fetchEntryList()
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

// 操作方法
// 新增语言
const handleAddLanguage = () => {
  if (!selectedNounId.value) {
    ElMessage.warning('请先选择左侧名词库');
    return
  }
  addLanguageVisible.value = true
}

const handleAddLanguageClose = () => {
  // 关闭弹窗后的回调
}

const handleRefreshLanguage = () => {
  // 刷新语言列表和词条列表
  fetchHeaders()
  fetchEntryList()
}

// 新增行组件相关方法
const handleAddNewLineSubmit = () => {
  // 新增行提交成功后刷新列表
  fetchEntryList()
}

const handleAddNewLineClose = () => {
  // 关闭弹窗后的回调
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的词条')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的${selectedRows.value.length}条词条吗？`, '批量删除确认', { type: 'warning' })
    const ids = selectedRows.value.map(item => item.id)
    const res = await delTranslation({ ids, projectId: selectedNounId.value })
    if (res) {
      ElMessage.success(`成功删除${ids.length}条词条`)
      fetchEntryList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 新增行（词条）
const handleAddEntry = () => {
  if (!selectedNounId.value) {
    ElMessage.warning('请先选择左侧名词库');
    return
  }
  if (headerList.value.length === 0) {
    ElMessage.warning('当前名词库暂无语言配置')
    return
  }
  isEditMode.value = true
  currentEntry.value = { id: '' }
  headerList.value.forEach(lang => {
    currentEntry.value[lang.code] = ''
  })
  termExplanation.value = ''
  activeTab.value = headerList.value[0]?.code || ''
  drawerVisible.value = true
}

// 编辑词条
const handleEditEntry = async (row) => {
  isEditMode.value = true
  try {
    const res = await getNounEntryDetail(selectedNounId.value, row.id)
    if (res && res.data) {
      const data = res.data
      currentEntry.value = {
        id: data.id,
        ...data.termInfo
      }
      termExplanation.value = data.termProfile || ''
      // 初始化所有语言字段
      headerList.value.forEach(lang => {
        if (!currentEntry.value[lang.code]) {
          currentEntry.value[lang.code] = ''
        }
      })
    }
  } catch (error) {
    console.error('获取词条详情失败:', error)
    currentEntry.value = { ...row }
    termExplanation.value = ''
  }
  if (headerList.value.length) {
    activeTab.value = headerList.value[0].code
  }
  drawerVisible.value = true
}

// 查看词条（只读）
const handleViewEntry = async (row) => {
  isEditMode.value = false
  try {
    const res = await getNounEntryDetail(selectedNounId.value, row.id)
    if (res && res.data) {
      const data = res.data
      currentEntry.value = {
        id: data.id,
        ...data.termInfo
      }
      termExplanation.value = data.termProfile || ''
      headerList.value.forEach(lang => {
        if (!currentEntry.value[lang.code]) {
          currentEntry.value[lang.code] = ''
        }
      })
    }
  } catch (error) {
    console.error('获取词条详情失败:', error)
    currentEntry.value = { ...row }
    termExplanation.value = ''
  }
  if (headerList.value.length) {
    activeTab.value = headerList.value[0].code
  }
  drawerVisible.value = true
}

// 删除词条
const handleDeleteEntry = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除ID为${row.id}的词条吗？`, '确认删除', { type: 'warning' })
    const res = await delTranslation({ ids: [row.id], projectId: selectedNounId.value })
    if (res) {
      ElMessage.success('删除成功')
      fetchEntryList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存词条
const handleSaveEntry = async () => {
  try {
    const data = {
      id: currentEntry.value.id || undefined,
      projectId: selectedNounId.value,
      termInfo: {},
      termProfile: termExplanation.value
    }
    headerList.value.forEach(lang => {
      data.termInfo[lang.code] = currentEntry.value[lang.code] || ''
    })
    const res = await saveEntry(data)
    if (res && res.code === 200) {
      ElMessage.success('保存成功')
      drawerVisible.value = false
      fetchEntryList()
    } else {
      ElMessage.error(res?.message || '保存失败，请重试')
    }
  } catch (error) {
    console.error('保存词条失败:', error)
    ElMessage.error('保存失败')
  }
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchEntryList()
}

const handlePageChange = (val) => {
  currentPage.value = val
  fetchEntryList()
}

// 检查名称是否溢出（用于 tooltip 显示）
const isNameOverflow = (name) => {
  return name && name.length > 10 // 简单判断，超过 10 个字符就显示 tooltip
}
</script>

<style lang="scss">
/* 非 scoped 样式 - 主题样式定义 */

/* 深色主题 */
.dark .glossary-detail {
  --bg-page: #1D1D1D;
  --bg-card: #000000;
  --border: #252535;
  --border-light: #252535;
  --text: #ffffff;
  --text-regular: #e0e0e8;
  --text-muted: #909399;
  --bg-input: #1e1e2e;
  --bg-hover: #252535;

  background: #1D1D1D;

  .page-header {
    background: #000000;
    border-color: #252535;

    .page-title {
      color: #ffffff;
    }
  }

  .view-btn {
    background: transparent;
    border-color: #252535;
    color: #909399;

    &:hover {
      background: #252535;
      color: #ffffff;
    }

    &.active {
      background: #3b82f6;
      color: #fff;
      border-color: #3b82f6;
    }
  }

  .sidebar-tree {
    background: #000000;
    border: 1px solid #252535;
    box-shadow: none;

    .tree-header {
      border-bottom-color: #252535;
    }

    .tree-title {
      color: #ffffff;
    }

    .tree-search-input {
      :deep(.el-input__wrapper) {
        background: #1e1e2e !important;
        border: none;
      }

      :deep(.el-input__inner) {
        color: #ffffff !important;
      }

      :deep(.el-input__prefix .el-icon) {
        color: #909399 !important;
      }
    }

    .add-noun-btn {
      background: #1e1e2e;
      border-color: #252535;

      :deep(.el-icon) {
        color: #ffffff !important;
      }

      &:hover {
        background: #3b82f6;
        border-color: #3b82f6;

        :deep(.el-icon) {
          color: #ffffff !important;
        }
      }
    }

    .more-btn {
      background: #1e1e2e;
      border-color: #252535;
      color: #ffffff;

      &:hover {
        background: #3b82f6;
        border-color: #3b82f6;
        color: #fff;
      }
    }

    .tree-actions {
      border-bottom-color: #252535;

      .tree-action-btn {
        background: transparent;
        border-color: #252535;
        color: #909399;

        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
      }
    }
  }

  .main-content {
    background: #000000;
    border: 1px solid #252535;
    box-shadow: none;
  }

  .toolbar-btn {
    color: #ffffff !important;

    i {
      color: #ffffff !important;
    }

    span {
      color: #ffffff !important;
    }
  }

  .batch-delete-btn i {
    color: #ef4444 !important;
  }

  .language-select {
    :deep(.el-input__wrapper) {
      background: #1e1e2e !important;
      border-color: #252535 !important;
    }

    :deep(.el-input__inner) {
      color: #ffffff !important;
    }
  }

  .search-input {
    :deep(.el-input__wrapper) {
      background: #1e1e2e !important;
      border-color: #252535 !important;
    }

    :deep(.el-input__inner) {
      color: #ffffff !important;
    }
  }

  .entry-table {
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

  .pagination-bar {
    border-top-color: #252535;

    .total-text {
      color: #909399;
    }

    :deep(.el-pagination .el-pager li) {
      background-color: #1e1e2e !important;
      color: #ffffff !important;
    }

    :deep(.el-pagination .el-pager li.is-active) {
      background-color: #409EFF !important;
      color: #fff !important;
    }
  }

  /* 抽屉 */
  .edit-drawer {
    :deep(.el-drawer__body) {
      background: #000000;
    }

    .drawer-header {
      border-bottom-color: #252535;
    }

    .drawer-title {
      color: #ffffff;
    }

    .drawer-id {
      color: #909399;
    }

    .close-btn {
      color: #909399;

      &:hover {
        color: #ffffff;
      }
    }

    .drawer-tabs {
      border-bottom-color: #252535;
    }

    .drawer-tab {
      color: #909399;

      &:hover {
        color: #ffffff;
      }

      &.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
      }
    }

    .edit-label,
    .term-label {
      color: #ffffff;
    }

    .term-section {
      border-top-color: #252535;

      :deep(.el-textarea__inner) {
        background: #1e1e2e !important;
        border-color: #252535 !important;
        color: #ffffff !important;
      }
    }

    .drawer-footer {
      border-top-color: #252535;
    }
  }

  /* 操作按钮 */
  .action-btns .action-btn {
    background: #262626 !important;

    i {
      color: #ffffff !important;
    }

    &:hover {
      background: #262626 !important;

      i {
        color: #ffffff !important;
      }
    }

    &.edit-btn:hover {
      background: #262626 !important;

      i {
        color: #ffffff !important;
      }
    }

    &.view-btn:hover {
      background: #00A415 !important;
    }

    &.delete-btn:hover {
      background: #E23A2D !important;
    }
  }

  /* 查看模式 */
  .view-content {
    background: #151520;
    color: #ffffff;
  }

  /* 全局权限弹窗 */
  .global-permission-dialog {
    .el-dialog {
      background: #101010 !important;
      border-color: #252535 !important;
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
      .section {
        .section-title {
          color: #ffffff !important;
          border-bottom-color: #252535 !important;
        }

        .el-select {
          .el-input__wrapper {
            background: #101010 !important;
            border-color: #252535 !important;
          }

          .el-input__inner {
            color: #ffffff !important;
          }
        }

        .el-checkbox__label {
          color: #ffffff !important;
        }

        .el-checkbox__inner {
          background: #101010 !important;
          border-color: #252535 !important;
        }
      }
    }
  }
}

/* 深色主题 - 树形项目 active 样式 */
.dark .glossary-detail .tree-item.active {
  background-color: #3b82f6 !important;
}

.dark .glossary-detail .tree-item.active .tree-item-label,
.dark .glossary-detail .tree-item.active .tree-item-icon,
.dark .glossary-detail .tree-item.active .expand-icon,
.dark .glossary-detail .tree-item.active .tree-item-edit {
  color: #fff !important;
}

/* 浅色主题 */
.light .glossary-detail {
  --bg-page: #f5f7fa;
  --bg-card: #ffffff;
  --border: #e4e7ed;
  --border-light: #F2F2F2;
  --text: #303133;
  --text-regular: #606266;
  --text-muted: #909399;
  --bg-input: #ffffff;
  --bg-hover: #F5F7FA;

  background: #f5f7fa;

  .page-header {
    background: #ffffff;
    border-color: #e4e7ed;

    .page-title {
      color: #303133;
    }
  }

  .view-btn {
    background: transparent;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      background: #f5f7fa;
      color: #303133;
    }

    &.active {
      background: #3b82f6;
      color: #fff;
      border-color: #3b82f6;
    }
  }

  .sidebar-tree {
    background: #ffffff;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .tree-header {
      border-bottom-color: #e4e7ed;
    }

    .tree-title {
      color: #303133;
    }

    .tree-search-input {
      :deep(.el-input__wrapper) {
        background: #ffffff !important;
        border: none;
      }

      :deep(.el-input__inner) {
        color: #303133 !important;
      }

      :deep(.el-input__prefix .el-icon) {
        color: #909399 !important;
      }
    }

    .add-noun-btn {
      background: #ffffff;
      border-color: #e4e7ed;

      :deep(.el-icon) {
        color: #2F82FE !important;
      }

      &:hover {
        background: #f5f7fa;
        border-color: #3b82f6;

        :deep(.el-icon) {
          color: #3b82f6 !important;
        }
      }
    }

    .more-btn {
      background: #ffffff;
      border-color: #e4e7ed;
      color: #303133;

      &:hover {
        background: #f5f7fa;
        border-color: #3b82f6;
        color: #3b82f6;
      }
    }

    .tree-actions {
      border-bottom-color: #e4e7ed;

      .tree-action-btn {
        background: transparent;
        border-color: #e4e7ed;
        color: #606266;

        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
      }
    }
  }

  .main-content {
    background: #ffffff;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .toolbar-btn {
    color: #303133 !important;

    i {
      color: #303133 !important;
    }

    span {
      color: #303133 !important;
    }
  }

  .batch-delete-btn i {
    color: #ef4444 !important;
  }

  .language-select {
    :deep(.el-input__wrapper) {
      background: #ffffff !important;
      border-color: #dcdfe6 !important;
    }

    :deep(.el-input__inner) {
      color: #303133 !important;
    }
  }

  .search-input {
    :deep(.el-input__wrapper) {
      background: #ffffff !important;
      border-color: #dcdfe6 !important;
    }

    :deep(.el-input__inner) {
      color: #303133 !important;
    }
  }

  .entry-table {
    :deep(.el-table__cell) {
      background-color: transparent !important;
      border-bottom-color: #e4e7ed;
      color: #303133;
    }

    :deep(th.el-table__cell) {
      background: #f5f7fa !important;
      color: var(--el-table-header-text-color) !important;
      text-align: center !important;
    }
  }

  .pagination-bar {
    border-top-color: #e4e7ed;

    .total-text {
      color: #606266;
    }

    :deep(.el-pagination .el-pager li) {
      background-color: #ffffff !important;
      color: #606266 !important;
    }

    :deep(.el-pagination .el-pager li.is-active) {
      background-color: #3b82f6 !important;
      color: #fff !important;
    }
  }

  /* 抽屉 */
  .edit-drawer {
    :deep(.el-drawer__body) {
      background: #ffffff;
    }

    .drawer-header {
      border-bottom-color: #e4e7ed;
    }

    .drawer-title {
      color: #303133;
    }

    .drawer-close {
      color: #909399;

      &:hover {
        color: #303133;
      }
    }
  }

  /* 标签页 */
  .term-tabs {
    :deep(.el-tabs__header) {
      border-bottom-color: #e4e7ed;
    }

    :deep(.el-tabs__item) {
      color: #606266;

      &.is-active {
        color: #3b82f6;
      }

      &:hover {
        color: #3b82f6;
      }
    }

    :deep(.el-tabs__nav-wrap::after) {
      background-color: #e4e7ed;
    }
  }

  .term-content {
    color: #303133;
  }

  .term-label {
    color: #606266;
  }

  .term-explanation {
    color: #303133;
  }

  /* 编辑状态 */
  .edit-field {
    border-color: #dcdfe6;
    color: #303133;
    background: #ffffff;

    &:focus {
      border-color: #3b82f6;
    }
  }

  /* 保存按钮 */
  .save-btn {
    background: #3b82f6;
    color: #ffffff;

    &:hover {
      background: #2563eb;
    }
  }

  /* 取消按钮 */
  .cancel-btn {
    background: #ffffff;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      background: #f5f7fa;
      border-color: #c0c4cc;
    }
  }

  /* 操作按钮 */
  .action-btns .action-btn {
    background: #ffffff !important;
    border-color: #e4e7ed !important;

    i {
      color: #606266 !important;
    }

    &:hover {
      background: #f5f7fa !important;

      i {
        color: #3b82f6 !important;
      }
    }

    &.edit-btn:hover {
      background: #f5f7fa !important;

      i {
        color: #3b82f6 !important;
      }
    }

    &.view-btn:hover {
      background: #f0f9eb !important;

      i {
        color: #67c23a !important;
      }
    }

    &.delete-btn:hover {
      background: #fef0f0 !important;

      i {
        color: #f56c6c !important;
      }
    }
  }

  /* 查看模式 */
  .view-content {
    background: #f5f7fa;
    color: #303133;
  }

  /* 全局权限弹窗 */
  .global-permission-dialog {
    .el-dialog {
      background: #ffffff !important;
      border-color: #e4e7ed !important;
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
      .section {
        .section-title {
          color: #303133 !important;
          border-bottom-color: #e4e7ed !important;
        }

        .el-select {
          .el-input__wrapper {
            background: #ffffff !important;
            border-color: #dcdfe6 !important;
          }

          .el-input__inner {
            color: #303133 !important;
          }
        }

        .el-checkbox__label {
          color: #303133 !important;
        }

        .el-checkbox__inner {
          background: #ffffff !important;
          border-color: #dcdfe6 !important;
        }
      }
    }
  }
}

/* 浅色主题 - 树形项目 active 样式 */
.light .glossary-detail .tree-item.active {
  background-color: #3b82f6 !important;
}

.light .glossary-detail .tree-item.active .tree-item-label,
.light .glossary-detail .tree-item.active .tree-item-icon,
.light .glossary-detail .tree-item.active .expand-icon,
.light .glossary-detail .tree-item.active .tree-item-edit {
  color: #fff !important;
}
</style>

<style scoped>

.glossary-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  gap: 20px;
  background: var(--bg-page, #f5f7fa);
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: var(--bg-card, #fff);
  padding: 8px 16px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--border, #E4E7ED);
}

.page-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #303133);
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
  border: 1px solid #E4E7ED;
  color: #606266;
  padding: 4px 8px;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-btn i {
  font-size: 14px;
}

.view-btn span {
  font-size: 12px;
}

.view-btn:hover {
  background: #F5F7FA;
  color: #303133;
}

.view-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.view-btn.global-perm-btn i {
  font-size: 16px;
}

/* 内容区域 */
.detail-content {
  flex: 1;
  display: flex;
  overflow: visible;
  min-height: 0;
}

/* 左侧树形结构 */
.sidebar-tree {
  width: 280px;
  min-width: 280px;
  background: var(--bg-card, #fff);
  box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.tree-header {
  padding: 16px 8px;
  border-bottom: 1px solid var(--border, #E4E7ED);
}

.tree-search-input {
  width: 100%;
}

.tree-search-input :deep(.el-input__wrapper) {
  background: var(--bg-input, #F8F8F8);
  border: none;
  box-shadow: none;
  border-radius: 6px;
  padding: 8px 10px;
}

.tree-search-input :deep(.el-input__inner) {
  color: var(--text, #606266);
}

.tree-search-input :deep(.el-input__prefix) {
  display: flex;
  align-items: center;
}

.tree-search-input :deep(.el-input__prefix .el-icon) {
  color: #909399;
  font-size: 18px;
}

.tree-search-input :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  padding-right: 8px;
}

.add-noun-btn {
  min-width: 20px;
  width: 20px;
  height: 20px;
  padding: 0;
  background: var(--bg-card, #fff);
  border-radius: 5px;
  border: 1px solid var(--border-light, #FAFAFB);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-noun-btn :deep(.el-icon) {
  font-size: 14px;
  color: var(--text-primary, #2F82FE);
  font-weight: bold;
}

.add-noun-btn:hover {
  background: #2F82FE;
  border-color: #2F82FE;
}

.add-noun-btn:hover :deep(.el-icon) {
  color: #2F82FE;
}

.more-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-light, #FAFAFB);
  color: #000;
}

.more-btn:hover {
  background: #2F82FE;
  border: 1px solid #2F82FE;
  color: #fff;
}

.tree-actions {
  padding: 12px;
  border-bottom: 1px solid var(--border, #E4E7ED);
  display: flex;
  gap: 8px;
}

.tree-action-btn {
  flex: 1;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border, #DCDFE6);
  color: var(--text-regular, #606266);
  font-size: 12px;
}

.tree-action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.tree-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tree-item {
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 4px;
  background: transparent;
  transition: background-color 0.2s;
}

.tree-item:hover {
  background-color: var(--bg-hover, #f5f7fa);
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.tree-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-regular, #606266);
}

/* 根节点样式 */
.root-item {
  margin-bottom: 2px;
}

/* 子节点样式 */
.tree-children {
  padding-left: 16px;
}

.child-item {
  padding: 6px 12px;
}

.child-item .tree-item-icon {
  font-size: 12px;
}

.tree-item-more {
  margin-left: auto;
  opacity: 1;
  transition: opacity 0.2s;
}

.delete-icon {
  color: #ef4444;
  margin-right: 4px;
}

.tree-item-icon {
  font-size: 14px;
  color: var(--text-muted, #909399);
}

.folder-icon {
  color: #3b82f6;
}

.file-icon {
  color: var(--text-muted, #909399);
}

.expand-icon {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.expand-icon.placeholder {
  visibility: hidden;
}

.tree-item-edit {
  opacity: 0;
  color: var(--text-muted, #909399);
}

.tree-item:hover .tree-item-edit {
  opacity: 1;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  margin-left: 36px;
  background: var(--bg-card, #fff);
  border-radius: 8px;
  box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.02);
  padding: 16px;
}

.table-toolbar {
  padding: 0 0 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: transparent;
  border-radius: 0;
  margin-bottom: 14px;
  box-shadow: none;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-left .toolbar-btn i {
  font-size: 12px;
  margin-right: 4px;
}

.add-entry-btn {
  background: #3b82f6;
  border: none;
  color: #fff;
}

.add-entry-btn:hover {
  background: #2563eb;
}

.add-entry-btn i {
  color: #fff;
}

.add-language-btn i {
  color: #00A415;
}

.batch-delete-btn i {
  color: #E23A2D;
}

.toolbar-btn {
  background: transparent;
  border: 1px solid var(--border, #DCDFE6);
  color: var(--text-regular, #606266);
}

.toolbar-btn:hover {
  background: var(--bg-hover, #F5F7FA);
  color: var(--text, #303133);
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.language-select {
  width: 120px;
}

.language-select :deep(.el-input__wrapper) {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #DCDFE6);
  box-shadow: none;
}

.language-select :deep(.el-input__inner) {
  color: var(--text-regular, #606266);
}

.search-input {
  width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, #DCDFE6);
  box-shadow: none;
}

.search-input :deep(.el-input__inner) {
  color: var(--text-regular, #606266);
}

/* 表格 */
.table-wrapper {
  background: transparent;
  padding: 0;
  box-shadow: none;
  flex: 1;
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.entry-table {
  --el-table-bg-color: var(--bg-card, #fff);
  --el-table-tr-bg-color: var(--bg-card, #fff);
  --el-table-header-bg-color: var(--bg-hover, #F5F7FA);
  --el-table-row-hover-bg-color: var(--bg-hover, #F5F7FA);
  --el-table-border-color: var(--border, #E4E7ED);
  --el-table-text-color: var(--text-regular, #606266);
  --el-table-header-text-color: var(--text-muted, #909399);
}

.entry-table :deep(.el-scrollbar__wrap) {
  overflow-x: auto;
}

.entry-table :deep(.el-table__cell) {
  border-bottom: 1px solid var(--border, #E4E7ED);
}

.entry-table :deep(.el-table__header-wrapper .el-table__cell) {
  border-bottom: 1px solid var(--border, #E4E7ED);
}

.entry-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

.entry-table :deep(.el-table-column--selection .cell) {
  text-align: center !important;
  justify-content: center !important;
}

.cell-text {
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 分页 */
.pagination-bar {
  padding: 16px 0 0 0;
  border-top: 1px solid var(--border-light, #F2F2F2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}

.total-text {
  font-size: 13px;
  color: var(--text-muted, #909399);
}

.pagination-bar :deep(.el-pagination) {
  --el-pagination-bg-color: var(--bg-card, #fff);
  --el-pagination-text-color: var(--text-regular, #606266);
  --el-pagination-button-bg-color: var(--bg-card, #fff);
  --el-pagination-button-color: var(--text-regular, #606266);
  --el-pagination-hover-color: #3b82f6;
}

/* 抽屉样式 */
.edit-drawer :deep(.el-drawer__body) {
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
  border-bottom: 1px solid #E4E7ED;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-id {
  font-size: 13px;
  font-weight: 400;
  color: #909399;
}

.close-btn {
  color: #909399;
  font-size: 18px;
}

.close-btn:hover {
  color: #303133;
}

.drawer-tabs {
  display: flex;
  border-bottom: 1px solid #E4E7ED;
}

.drawer-tab {
  padding: 12px 20px;
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.drawer-tab:hover {
  color: #606266;
}

.drawer-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.drawer-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.edit-section {
  margin-bottom: 20px;
}

.edit-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 12px 0;
}

.term-section {
  border-top: 1px solid #E4E7ED;
  padding-top: 16px;
}

.term-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 12px 0;
}

.term-section :deep(.el-textarea__inner) {
  background: #fff;
  border: 1px solid #DCDFE6;
  color: #606266;
  box-shadow: none;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #E4E7ED;
}

.save-btn {
  width: 100%;
}

/* 查看模式样式 */
.view-section {
  margin-bottom: 20px;
}

.view-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
}

.view-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  min-height: 60px;
}

/* 操作按钮组 */
.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn i {
  font-size: 12px;
  color: #19181C;
}

.action-btn:hover {
  background: #2F5DFE;
}

.action-btn:hover i {
  color: #ffffff;
}

.action-btn.edit-btn:hover {
  background: #2F5DFE;
}

.action-btn.view-btn:hover {
  background: #00A415;
}

.action-btn.delete-btn:hover {
  background: #E23A2D;
}

/* 全局权限弹窗样式 */
.global-permission-dialog .el-dialog {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
}

.global-permission-dialog .el-dialog__title {
  color: #303133;
}

.global-permission-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #909399;
}

.global-permission-dialog .el-dialog__headerbtn .el-dialog__close:hover {
  color: #303133;
}

.global-permission-dialog .permission-dialog-content {
  padding: 10px 0;
}

.global-permission-dialog .permission-dialog-content .section {
  margin-bottom: 20px;
}

.global-permission-dialog .permission-dialog-content .section .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #E4E7ED;
}

/* 新增/编辑词库弹窗样式 */
.glossary-dialog.add-dialog .el-dialog {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 12px;
}

.glossary-dialog.add-dialog .avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.glossary-dialog.add-dialog .avatar-upload-box {
  width: 80px;
  height: 80px;
  border: 2px dashed #DCDFE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
  background: #fff;
}

.glossary-dialog.add-dialog .avatar-upload-box:hover {
  border-color: #409eff;
}

.glossary-dialog.add-dialog .upload-icon,
.glossary-dialog.add-dialog .avatar-uploader-icon {
  font-size: 24px;
  color: #8c939d;
}

.glossary-dialog.add-dialog .avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.glossary-dialog.add-dialog .avatar-label {
  font-size: 12px;
  margin-top: 8px;
  color: #909399;
}

.glossary-dialog.add-dialog .dialog-form .el-form-item__label {
  color: #606266;
}

.glossary-dialog.add-dialog .dialog-form .el-input__wrapper,
.glossary-dialog.add-dialog .dialog-form .el-textarea__inner {
  background: #fff;
  border: 1px solid #DCDFE6;
  box-shadow: none;
}

.glossary-dialog.add-dialog .dialog-form .el-input__inner,
.glossary-dialog.add-dialog .dialog-form .el-textarea__inner {
  color: #303133;
}

/* 深色模式下新增/编辑词库弹窗样式 */
html.dark .glossary-dialog.add-dialog .el-dialog {
  background: #101010;
  border-color: #252535;
}

html.dark .glossary-dialog.add-dialog .avatar-upload-box {
  background: #101010;
  border-color: #3a3a4a;
}

html.dark .glossary-dialog.add-dialog .avatar-upload-box:hover {
  border-color: #3b82f6;
}

html.dark .glossary-dialog.add-dialog .upload-icon,
html.dark .glossary-dialog.add-dialog .avatar-uploader-icon {
  color: #909399 !important;
}

html.dark .glossary-dialog.add-dialog .avatar-label {
  color: #909399;
}

html.dark .glossary-dialog.add-dialog .dialog-form .el-form-item__label {
  color: #ffffff;
}

html.dark .glossary-dialog.add-dialog .dialog-form .el-input__wrapper,
html.dark .glossary-dialog.add-dialog .dialog-form .el-textarea__inner {
  background: #1e1e2e;
  border-color: #252535;
}

html.dark .glossary-dialog.add-dialog .dialog-form .el-input__inner,
html.dark .glossary-dialog.add-dialog .dialog-form .el-textarea__inner {
  color: #ffffff;
}

.global-permission-dialog .permission-dialog-content .section .el-select .el-input__wrapper {
  background: #fff;
  border-color: #E4E7ED;
  box-shadow: none;
}

.global-permission-dialog .permission-dialog-content .section .el-select .el-input__inner {
  color: #303133;
}

.global-permission-dialog .permission-dialog-content .section .el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.global-permission-dialog .permission-dialog-content .section .el-checkbox-group .el-checkbox {
  margin: 0;
}

.global-permission-dialog .permission-dialog-content .section .el-checkbox-group .el-checkbox .el-checkbox__label {
  color: #606266;
  font-size: 13px;
}
</style>
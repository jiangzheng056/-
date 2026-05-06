<template>
  <div class="layout-container" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <div class="logo-box">
          <img src="@/assets/logo.png" alt="">
        </div>
        <span v-if="!isCollapsed">翻译管理系统</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-title">主菜单</div>
          <el-menu :default-active="activeMenu" mode="vertical" :collapse="isCollapsed" :active-text-color="'#3b82f6'"
            class="sidebar-menu">
            <el-menu-item index="/home" @click="$router.push('/home')">
              <i class="iconfont icon-index mr10"></i>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/glossary" @click="$router.push('/glossary')">
              <i class="iconfont icon-zymck mr10"></i>
              <span>专有名词库</span>
            </el-menu-item>
            <el-sub-menu index="translate">
              <template #title>
                <i class="iconfont icon-ss-fy mr10"></i>
                <span>翻译</span>
              </template>
              <el-menu-item index="/translate/single" @click="$router.push('/translate/single')">单次翻译</el-menu-item>
              <el-menu-item index="/translate/batch" @click="$router.push('/translate/batch')">批量翻译</el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/task" @click="$router.push('/task')">
              <i class="iconfont icon-ss-rwlb mr10"></i>
              <span>任务列表</span>
            </el-menu-item>
            <el-sub-menu index="billing">
              <template #title>
                <i class="iconfont icon-ss-zdgl mr10"></i>
                <span>账单管理</span>
              </template>
              <el-menu-item index="/billing/balance" @click="$router.push('/billing/balance')">余额</el-menu-item>
              <el-menu-item index="/billing/usage" @click="$router.push('/billing/usage')">用量明细</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="system">
              <template #title>
                <i class="iconfont icon-ss-xtsz mr10"></i>
                <span>系统管理</span>
              </template>
              <el-menu-item index="/system/user-group" @click="$router.push('/system/user-group')">用户分组</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>


      </nav>

      <!-- 主题切换 -->
      <div class="theme-switch">
        <div class="theme-toggle-wrapper">
          <button class="theme-option" :class="{ active: !themeStore.isDark }" @click="toggleTheme">
            <el-icon>
              <Sunny />
            </el-icon>
            <span>浅色</span>
          </button>
          <button class="theme-option" :class="{ active: themeStore.isDark }" @click="toggleTheme">
            <el-icon>
              <Moon />
            </el-icon>
            <span>深色</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-left">
          <el-button class="collapse-btn" @click="toggleSidebar">
            <el-icon>
              <Fold v-if="!isCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <el-input v-model="searchKeyword" placeholder="关键词查找..." class="search-input" @input="handleSearchInput"
            clearable @clear="clearSearch">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-right">
          <span class="company-name">成都琦玉网络科技有限公司</span>
          <el-badge :value="1" :max="99" class="notification-badge">
            <el-icon class="notification-icon">
              <Bell />
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand" trigger="hover">
            <div class="user-info">
              <el-avatar :size="32" class="avatar">
                <el-icon>
                  <User />
                </el-icon>
              </el-avatar>
              <span class="username">{{ userStore.nickName || userStore.name || '用户' }}</span>
              <el-icon class="dropdown-icon">
                <ArrowDown />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon>
                    <User />
                  </el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon>
                    <SwitchButton />
                  </el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import useUserStore from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Grid,
  HomeFilled,
  Notebook,
  Document,
  List,
  Money,
  Setting,
  QuestionFilled,
  Tools,
  Sunny,
  Moon,
  Search,
  Bell,
  User,
  ArrowDown,
  Fold,
  Expand,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)
const searchKeyword = ref('')
const isCollapsed = ref(false)

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    clearSearch()
    return
  }
  // 在当前页面内容中搜索高亮
  highlightSearchText(searchKeyword.value)
}

// 输入时触发搜索
const handleSearchInput = () => {
  handleSearch()
}

// 清空搜索
const clearSearch = () => {
  const contentWrapper = document.querySelector('.content-wrapper')
  if (contentWrapper) {
    clearHighlights(contentWrapper)
  }
}

// 高亮搜索文本
const highlightSearchText = (keyword) => {
  const contentWrapper = document.querySelector('.content-wrapper')
  if (!contentWrapper) return

  // 清除之前的高亮
  clearHighlights(contentWrapper)

  // 创建正则表达式
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')

  // 递归查找并高亮文本节点
  highlightNodes(contentWrapper, regex, keyword)

  // 滚动到第一个匹配项
  const firstMatch = contentWrapper.querySelector('.search-highlight')
  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const count = contentWrapper.querySelectorAll('.search-highlight').length
    ElMessage.success(`找到 ${count} 处匹配`)
  } else {
    ElMessage.info('未找到匹配内容')
  }
}

// 清除高亮
const clearHighlights = (container) => {
  const highlights = container.querySelectorAll('.search-highlight')
  highlights.forEach(el => {
    const parent = el.parentNode
    parent.replaceChild(document.createTextNode(el.textContent), el)
    parent.normalize()
  })
}

// 转义正则表达式特殊字符
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 递归查找文本节点并高亮
const highlightNodes = (node, regex, keyword) => {
  const childNodes = node.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]

    // 跳过脚本和样式标签
    if (child.nodeType === 1 && (child.tagName === 'SCRIPT' || child.tagName === 'STYLE')) {
      continue
    }

    // 跳过已存在的高亮标签
    if (child.nodeType === 1 && child.className === 'search-highlight') {
      continue
    }

    // 文本节点
    if (child.nodeType === 3) {
      const text = child.textContent
      if (text.trim() && text.toLowerCase().includes(keyword.toLowerCase())) {
        const fragment = document.createDocumentFragment()
        // 使用字符串分割而不是正则来避免 lastIndex 问题
        const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'))
        parts.forEach(part => {
          if (part.toLowerCase() === keyword.toLowerCase()) {
            const span = document.createElement('span')
            span.className = 'search-highlight'
            span.textContent = part
            fragment.appendChild(span)
          } else {
            fragment.appendChild(document.createTextNode(part))
          }
        })
        node.replaceChild(fragment, child)
      }
    } else if (child.nodeType === 1) {
      // 元素节点，递归处理
      highlightNodes(child, regex, keyword)
    }
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转个人中心（暂未实现）
      ElMessage.info('个人中心功能开发中')
      break
    case 'logout':
      logout()
      break
  }
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userStore.logOut()
      ElMessage.success('退出成功')
      router.push('/login')
    } catch (error) {
      console.error('退出失败:', error)
      // 即使退出失败也跳转登录页
      router.push('/login')
    }
  }).catch(() => { })
}

// 获取用户信息
onMounted(async () => {
  try {
    await userStore.getInfo()
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

// 路由变化时清除高亮
watch(() => route.path, () => {
  const contentWrapper = document.querySelector('.content-wrapper')
  if (contentWrapper) {
    clearHighlights(contentWrapper)
  }
  // 清空搜索框
  searchKeyword.value = ''
})
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #0d0d14;
  color: #e0e0e8;
}

/* 侧边栏 */
.sidebar {
  width: 256px;
  height: 100vh;
  background: #000000;
  border-right: 1px solid #252535;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .logo {
  justify-content: center;
  padding: 0;
}

.sidebar.collapsed .nav-group-title {
  display: none;
}

.sidebar.collapsed .theme-switch {
  padding: 8px;
}

.sidebar.collapsed .theme-toggle-btn {
  padding: 10px;
}

.sidebar.collapsed .theme-toggle-btn span {
  display: none;
}

/* 折叠状态弹出菜单样式 */
.sidebar-menu :deep(.el-menu--collapse .el-sub-menu__title span),
.sidebar-menu :deep(.el-menu--collapse .el-menu-item span) {
  height: 0;
  width: 0;
  overflow: hidden;
  visibility: hidden;
  display: inline-block;
}

.sidebar-menu :deep(.el-menu--collapse .el-sub-menu__icon-arrow) {
  display: none;
}

/* 折叠状态下图标居中 */
.sidebar.collapsed .sidebar-menu :deep(.el-menu-item) {
  justify-content: center !important;
  padding: 0 20px !important;
}

.sidebar.collapsed .sidebar-menu :deep(.el-sub-menu__title) {
  justify-content: center !important;
  padding: 0 20px !important;
}

.sidebar.collapsed .sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar.collapsed .sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

.sidebar.collapsed .sidebar-menu :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
  display: none !important;
}

/* 弹出子菜单样式 - 深色主题 */
.sidebar-menu :deep(.el-menu--vertical .el-menu--popup) {
  background: #1e1e2e !important;
  border: 1px solid #252535;
  min-width: 180px;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item) {
  background: transparent !important;
  color: #a0a0b0 !important;
  height: 40px;
  line-height: 40px;
}

.sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item:hover) {
  background: #252535 !important;
  color: #e0e0e8 !important;
}

.sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item.is-active) {
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.1) !important;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid #252535;
}

.logo-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
  }
}

.logo-icon {
  font-size: 16px;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 0;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #3a3a4a;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.nav-group {
  margin-bottom: 24px;
}

.nav-group-title {
  padding: 0 24px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6b6b7b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-menu {
  border-right: none;
  padding: 0 8px;
  background: transparent !important;
}

.sidebar-menu :deep(.el-menu) {
  background: transparent !important;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 4px;
  height: 44px;
  background: transparent !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #1e1e2e;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border-right: 3px solid #3b82f6;
}

/* 子菜单样式 */
.sidebar-menu :deep(.el-sub-menu__title) {
  border-radius: 8px;
  margin-bottom: 4px;
  height: 44px;
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #1e1e2e;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 48px !important;
  height: 40px;
  min-width: auto;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #3b82f6;
}

.help-badge {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switch {
  padding: 16px;
  border-top: 1px solid #252535;
  display: flex;
  justify-content: center;
}

.theme-toggle-wrapper {
  display: flex;
  background: #2a2a3a;
  border-radius: 20px;
  padding: 4px;
  gap: 4px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.3s;
}

.theme-option .el-icon {
  font-size: 16px;
}

.theme-option:hover {
  color: #e0e0e8;
}

.theme-option.active {
  background: #000000;
  color: #ffffff;
}

/* 主内容区 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1D1D1D;
}

/* 顶部导航 */
.header {
  height: 64px;
  background: #000000;
  border-bottom: 1px solid #252535;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid #252535;
  color: #a0a0b0;
  border-radius: 8px;
}

.collapse-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.search-input {
  height: 32px;
  width: 384px;
}

html.dark .search-input .el-input__wrapper {
  background: #212121 !important;
  border: 1px solid #252535 !important;
  box-shadow: none !important;
  border-radius: 8px;
}

html.dark .search-input .el-input__inner {
  color: #e0e0e8 !important;
}

html.dark .search-input .el-input__inner::placeholder {
  color: #6b6b7b !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.company-name {
  font-size: 14px;
  color: #a0a0b0;
}

.notification-badge {
  cursor: pointer;
}

.notification-icon {
  font-size: 18px;
  color: #a0a0b0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.avatar {
  background: #3b82f6;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e8;
}

.dropdown-icon {
  font-size: 12px;
  color: #6b6b7b;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
}

/* ===== 浅色主题 ===== */
html.light .layout-container {
  background-color: #f5f7fa;
  color: #303133;
}

.light .layout-container .sidebar {
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
}

.light .layout-container .logo {
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
}

.light .layout-container .nav-group-title {
  color: #9ca3af;
}

.light .layout-container .sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #f3f4f6;
}

.light .layout-container .sidebar-menu :deep(.el-menu-item.is-active) {
  background: #eff6ff;
  border-right: 3px solid #3b82f6;
}

.light .layout-container .sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: #f3f4f6;
}

.light .layout-container .sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #3b82f6;
}

/* 浅色主题侧边栏字体颜色 */
.light .layout-container .sidebar-menu :deep(.el-menu-item) {
  color: #606266 !important;
}

.light .layout-container .sidebar-menu :deep(.el-sub-menu__title) {
  color: #606266 !important;
}

.light .layout-container .sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item) {
  color: #606266 !important;
}

.light .layout-container .sidebar-menu :deep(.el-menu--vertical .el-menu--popup) {
  background: #fff !important;
  border: 1px solid #e4e7ed;
}

.light .layout-container .sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item:hover) {
  background: #f5f7fa !important;
  color: #303133 !important;
}

.light .layout-container .sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item.is-active) {
  color: #3b82f6 !important;
  background: #eff6ff !important;
}

.light .layout-container .sidebar-nav::-webkit-scrollbar-thumb {
  background: #dcdfe6;
}

.light .layout-container .theme-switch {
  border-top: 1px solid #e4e7ed;
}

.light .layout-container .theme-toggle-wrapper {
  background: #f0f0f0;
}

.light .layout-container .theme-option {
  color: #909399;
}

.light .layout-container .theme-option:hover {
  color: #303133;
}

.light .layout-container .theme-option.active {
  background: #ffffff;
  color: #303133;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.light .layout-container .main {
  background: #ffffff;
}

.light .layout-container .header {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.light .layout-container .search-input :deep(.el-input__wrapper) {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.light .layout-container .search-input :deep(.el-input__inner) {
  color: #303133;
}

.light .layout-container .company-name {
  color: #606266;
}

.light .layout-container .notification-icon {
  color: #606266;
}

.light .layout-container .username {
  color: #303133;
}

.light .layout-container .collapse-btn {
  border-color: #e4e7ed;
  color: #606266;
}

.light .layout-container .collapse-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

/* 深色主题侧边栏字体颜色 */
.sidebar-menu :deep(.el-menu-item) {
  color: #ffffff !important;
  background: transparent !important;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  color: #ffffff !important;
  background: transparent !important;
}

.sidebar-menu :deep(.el-menu--vertical .el-menu--popup .el-menu-item) {
  color: #ffffff !important;
}

/* 深色主题弹出子菜单样式 */
.sidebar-menu :deep(.el-menu--vertical .el-menu--popup) {
  background: #1e1e2e !important;
}

/* 用户下拉菜单样式 */
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  font-size: 16px;
}

.mr10 {
  margin-right: 10px;
}
</style>
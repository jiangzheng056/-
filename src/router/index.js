import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layout/index.vue'),
      redirect: '/home',
      children: [
        { path: 'home', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
        { path: 'glossary', name: 'Glossary', component: () => import('@/views/Glossary.vue'), meta: { title: '专有名词库' } },
        { path: 'glossary/:id', name: 'GlossaryDetail', component: () => import('@/views/GlossaryDetail.vue'), meta: { title: '名词库详情' } },
        { path: 'translate/single', name: 'TranslateSingle', component: () => import('@/views/TranslateSingle.vue'), meta: { title: '单次翻译' } },
        { path: 'translate/batch', name: 'TranslateBatch', component: () => import('@/views/TranslateBatch.vue'), meta: { title: '批量翻译' } },
        { path: 'task', name: 'Task', component: () => import('@/views/Task.vue'), meta: { title: '任务列表' } },
        { path: 'billing/balance', name: 'Balance', component: () => import('@/views/Balance.vue'), meta: { title: '余额' } },
        { path: 'billing/usage', name: 'Usage', component: () => import('@/views/Usage.vue'), meta: { title: '用量明细' } },
        { path: 'system/user-group', name: 'UserGroup', component: () => import('@/views/UserGroup.vue'), meta: { title: '用户分组' } },
        { path: 'help', name: 'Help', component: () => import('@/views/Help.vue'), meta: { title: '帮助中心' } },
        { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { title: '设置' } },
      ]
    }
  ]
})

// 白名单 - 无需登录即可访问的路径
const whiteList = ['/login']

// 路由守卫
router.beforeEach((to) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = to.meta.title + ' - 翻译管理系统'
  }

  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 已登录，跳转到首页
      return { path: '/home' }
    }
    // 已登录，放行
    return true
  } else {
    // 未登录
    if (whiteList.indexOf(to.path) !== -1) {
      // 在白名单中，直接进入
      return true
    }
    // 不在白名单中，跳转到登录页
    return { path: '/login', query: { redirect: to.path } }
  }
})

export default router
<template>
  <div class="login-container" :class="themeStore.isDark ? 'dark' : 'light'">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <el-icon class="logo-icon">
            <Grid />
          </el-icon>
        </div>
        <h1 class="title">翻译管理系统</h1>
        <p class="subtitle">游戏文案翻译后台</p>
      </div>

      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入账号" size="large" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" prefix-icon="Lock"
            show-password @keyup.enter="handleLogin" />
        </el-form-item>

        <el-form-item prop="code" v-if="captchaEnabled">
          <div class="code-input-wrapper">
            <el-input v-model="loginForm.code" placeholder="请输入验证码" size="large" prefix-icon="Picture"
              @keyup.enter="handleLogin" />
            <div class="code-image" @click="getCode">
              <img v-if="codeUrl" :src="codeUrl" alt="验证码" />
              <span v-else>获取验证码</span>
            </div>
          </div>
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="login-btn" @click="handleLogin">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>© 2026 成都琦玉网络科技有限公司</span>
      </div>
    </div>

    <!-- 主题切换 -->
    <div class="theme-toggle" @click="toggleTheme">
      <el-icon v-if="themeStore.isDark">
        <Sunny />
      </el-icon>
      <el-icon v-else>
        <Moon />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Grid, Sunny, Moon } from '@element-plus/icons-vue'
import Cookies from 'js-cookie'
import useUserStore from '@/stores/user'
import { getCodeImg } from '@/api/login'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()

const loginRef = ref(null)
const loading = ref(false)
const codeUrl = ref('')
const captchaEnabled = ref(true)
const redirect = ref(undefined)

const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }],
  code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
}

// 获取验证码
const getCode = async () => {
  try {
    const res = await getCodeImg()
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = 'data:image/gif;base64,' + res.img
      loginForm.value.uuid = res.uuid
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 获取记住的密码
const getCookie = () => {
  const username = Cookies.get('username')
  const password = Cookies.get('password')
  const rememberMe = Cookies.get('rememberMe')
  loginForm.value = {
    // username: username || '',
    // password: password || '',
    username: 'admin',
    password: 'admin123',
    rememberMe: rememberMe === 'true',
    code: '',
    uuid: ''
  }
}

// 登录处理
const handleLogin = () => {
  loginRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      // 记住密码
      if (loginForm.value.rememberMe) {
        Cookies.set('username', loginForm.value.username, { expires: 30 })
        Cookies.set('password', loginForm.value.password, { expires: 30 })
        Cookies.set('rememberMe', loginForm.value.rememberMe, { expires: 30 })
      } else {
        Cookies.remove('username')
        Cookies.remove('password')
        Cookies.remove('rememberMe')
      }

      try {
        await userStore.login(loginForm.value)
        ElMessage.success('登录成功')
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== 'redirect') {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || '/home', query: otherQueryParams })
      } catch (error) {
        loading.value = false
        if (captchaEnabled.value) {
          getCode()
        }
      }
    }
  })
}

// 切换主题
const toggleTheme = () => {
  themeStore.toggleTheme()
}

onMounted(() => {
  getCode()
  getCookie()
  redirect.value = route.query && route.query.redirect
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0d0d14 0%, #1a1a2e 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.login-box {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 40px;
  background: rgba(21, 21, 32, 0.9);
  border: 1px solid #252535;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 32px;
  color: #fff;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #6b6b7b;
}

.login-form {
  margin-top: 20px;
}

.login-form :deep(.el-input__wrapper) {
  background: #1e1e2e;
  border: 1px solid #252535;
  box-shadow: none;
  border-radius: 8px;
  height: 44px;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #3b82f6;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.login-form :deep(.el-input__inner) {
  color: #e0e0e8;
  font-size: 14px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #6b6b7b;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-form-item__error) {
  padding-top: 4px;
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input-wrapper .el-input {
  flex: 1;
}

.code-image {
  width: 120px;
  height: 44px;
  background: #1e1e2e;
  border: 1px solid #252535;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.2s;
}

.code-image:hover {
  border-color: #3b82f6;
}

.code-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.code-image span {
  font-size: 12px;
  color: #6b6b7b;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-options :deep(.el-checkbox__label) {
  color: #a0a0b0;
  font-size: 13px;
}

.login-options :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #252535;
}

.login-footer span {
  font-size: 12px;
  color: #6b6b7b;
}

.theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid #252535;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.theme-toggle:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.theme-toggle .el-icon {
  font-size: 20px;
  color: #a0a0b0;
}

/* 浅色主题 */
.light .login-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.light .login-container::before {
  background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.05) 0%, transparent 50%);
}

.light .login-container .login-box {
  background: rgba(255, 255, 255, 0.9);
  border-color: #e4e7ed;
}

.light .login-container .title {
  color: #303133;
}

.light .login-container .login-form :deep(.el-input__wrapper) {
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.light .login-container .login-form :deep(.el-input__inner) {
  color: #303133;
}

.light .login-container .code-image {
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.light .login-container .login-options :deep(.el-checkbox__label) {
  color: #606266;
}

.light .login-container .login-footer {
  border-top-color: #e4e7ed;
}

.light .login-container .theme-toggle {
  background: rgba(255, 255, 255, 0.8);
  border-color: #e4e7ed;
}

.light .login-container .theme-toggle .el-icon {
  color: #606266;
}
</style>
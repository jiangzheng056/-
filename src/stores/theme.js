import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 从 localStorage 或系统偏好获取初始主题
  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem('app_theme')
      if (saved) return saved === 'dark'
    } catch (e) {}

    // 检测系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }
    return false
  }

  const isDark = ref(getInitialTheme())

  // 应用主题到 DOM
  const applyTheme = (dark) => {
    const html = document.documentElement
    if (dark) {
      html.classList.remove('light')
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
  }

  // 初始化应用主题
  applyTheme(isDark.value)

  // 监听主题变化
  watch(isDark, (newVal) => {
    applyTheme(newVal)
    try {
      localStorage.setItem('app_theme', newVal ? 'dark' : 'light')
    } catch (e) {}
  })

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  // 监听系统主题变化（仅在用户未手动设置时跟随）
  const setupSystemThemeListener = () => {
    if (!window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const hasUserPreference = localStorage.getItem('app_theme') !== null

    if (hasUserPreference) return // 用户已设置，不跟随系统

    const handleChange = (e) => {
      isDark.value = e.matches
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
    }
  }

  setupSystemThemeListener()

  return {
    isDark,
    toggleTheme
  }
})
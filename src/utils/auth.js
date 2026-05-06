/**
 * 认证相关工具函数
 */

import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

export function getToken() {
  const token = Cookies.get(TokenKey)
  console.log('获取Token:', token)
  return token
}

export function setToken(token) {
  console.log('设置Token:', token)
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  console.log('移除Token')
  return Cookies.remove(TokenKey)
}
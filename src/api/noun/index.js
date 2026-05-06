/**
 * 名词库相关 API
 */

import request from '@/utils/request'

// ==================== 名词库管理 ====================

/**
 * 获取名词库列表（树形结构）
 * @param {Object} data - 查询参数
 */
export function getAllNoun(data) {
  return request({
    url: '/noun/getAllNoun',
    method: 'post',
    data
  })
}

/**
 * 获取用户可调用的名词库列表（下拉选择用）
 * @param {Object} data - 查询参数
 */
export function getUserCallAllNoun(data) {
  return request({
    url: '/noun/getUserCallAllNoun',
    method: 'post',
    data
  })
}

/**
 * 保存名词库（新增/编辑）
 * @param {Object} data - 名词库数据
 */
export function saveNounInfo(data) {
  return request({
    url: '/noun/saveNounInfo',
    method: 'post',
    data
  })
}

/**
 * 删除名词库
 * @param {String|Number} id - 名词库ID
 */
export function delNoun(id) {
  return request({
    url: `/noun/delNoun/${id}`,
    method: 'delete'
  })
}

/**
 * 获取名词库详情
 * @param {String|Number} id - 名词库ID
 */
export function getNounDetail(id) {
  return request({
    url: '/noun/getNounDetail',
    method: 'get',
    params: { id }
  })
}

// ==================== 词条管理 ====================

/**
 * 获取词条列表
 * @param {Object} data - 查询参数
 * @param {String} data.id - 名词库ID
 * @param {Number} data.page - 页码
 * @param {Number} data.size - 每页条数
 * @param {String} data.sourceLanguage - 源语言
 * @param {String} data.sourceText - 搜索关键词
 * @param {String} data.termId - 词条ID
 */
export function nounEntryList(data) {
  return request({
    url: '/noun/nounEntryList',
    method: 'post',
    data
  })
}

/**
 * 获取词条表头（语言列表）
 * @param {String|Number} id - 名词库ID
 */
export function getTableHeaders(id) {
  return request({
    url: '/noun/getTableHeaders',
    method: 'get',
    params: { id }
  })
}

/**
 * 获取词条详情
 * @param {String|Number} projectId - 名词库ID
 * @param {String|Number} id - 词条ID
 */
export function getNounEntryDetail(projectId, id) {
  return request({
    url: `/noun/getNounEntryDetail/${projectId}`,
    method: 'get',
    params: { id }
  })
}

/**
 * 保存词条（新增/编辑）
 * @param {Object} data - 词条数据
 */
export function saveEntry(data) {
  return request({
    url: '/noun/saveEntry',
    method: 'post',
    data
  })
}

/**
 * 删除词条
 * @param {Object} data - 删除参数
 * @param {Array} data.ids - 词条ID数组
 * @param {String|Number} data.projectId - 名词库ID
 */
export function delTranslation(data) {
  return request({
    url: '/noun/delTranslation',
    method: 'post',
    data
  })
}

/**
 * 新增语言
 * @param {Object} data - 语言数据
 */
export function saveLanguage(data) {
  return request({
    url: '/noun/saveLanguage',
    method: 'post',
    data
  })
}

/**
 * 获取所有可添加的语言
 */
export function getLanguages() {
  return request({
    url: '/noun/getLanguages',
    method: 'get'
  })
}

/**
 * 上传文件
 * @param {FormData} data - 文件数据
 */
export function uploadFile(data) {
  return request({
    url: '/file/uploadFile',
    method: 'post',
    data
  })
}

// ==================== 权限管理 ====================

/**
 * 获取名词库权限列表
 */
export function getNounAuth() {
  return request({
    url: '/noun/auth/getNounGlobalAllAuth',
    method: 'get'
  })
}

/**
 * 获取所有组织节点（用户/用户组树）
 */
export function getAllOrgNode() {
  return request({
    url: '/noun/auth/getAllOrgNode',
    method: 'get'
  })
}

/**
 * 获取用户/用户组全局权限
 * @param {Object} data - 查询参数
 * @param {String|Number} data.id - 用户/用户组ID
 * @param {String} data.nodeType - 节点类型
 */
export function getNounGroupOrUserGlobalAuth(data) {
  return request({
    url: '/noun/auth/getNounGroupOrUserGlobalAuth',
    method: 'post',
    data
  })
}

/**
 * 修改全局权限
 * @param {Object} data - 权限数据
 * @param {Array} data.authList - 权限列表
 * @param {Array} data.node - 节点信息
 */
export function changeNounGlobalAuth(data) {
  return request({
    url: '/noun/auth/nounGlobalAuth',
    method: 'post',
    data
  })
}

/**
 * 获取单个名词库权限
 * @param {String|Number} nounId - 名词库ID
 */
export function getSingleNounAuth(nounId) {
  return request({
    url: '/noun/auth/getNounAllAuth',
    method: 'get',
    params: { nounId }
  })
}

/**
 * 获取用户/用户组对单个词库的权限
 * @param {Object} data - 查询参数
 */
export function getNounGroupOrUserAuth(data) {
  return request({
    url: '/noun/auth/getNounGroupOrUserAuth',
    method: 'post',
    data
  })
}

/**
 * 保存名词库用户权限
 * @param {Object} data - 权限数据
 */
export function saveNounUserAuth(data) {
  return request({
    url: '/noun/auth/nounAuth',
    method: 'post',
    data
  })
}
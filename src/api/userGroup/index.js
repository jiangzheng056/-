/**
 * 用户分组相关 API
 */

import request from '@/utils/request'

// ==================== 分组管理 ====================

/**
 * 获取用户分组树
 */
export function getUserGroupTree() {
  return request({
    url: '/system/userGroup/getGroupTree',
    method: 'get'
  })
}

/**
 * 新增/编辑用户分组
 * @param {Object} data - 分组数据
 * @param {String|Number} data.id - 分组ID（编辑时必填）
 * @param {String} data.groupName - 分组名称
 */
export function saveUserGroup(data) {
  return request({
    url: '/system/userGroup/save',
    method: 'post',
    data
  })
}

/**
 * 删除用户分组
 * @param {String|Number} id - 分组ID
 */
export function deleteUserGroup(id) {
  return request({
    url: `/system/userGroup/${id}`,
    method: 'delete'
  })
}

/**
 * 获取分组下的用户列表
 * @param {String|Number} id - 分组ID
 */
export function getGroupUsers(id) {
  return request({
    url: '/system/userGroup/getGroupUserByNodeId',
    method: 'get',
    params: { id }
  })
}

/**
 * 批量设置用户分组
 * @param {Object} data - 参数
 * @param {Array} data.userIds - 用户ID数组
 * @param {Array} data.groupIds - 分组ID数组
 */
export function batchUserToGroup(data) {
  return request({
    url: '/system/userGroup/batchUserToGroup',
    method: 'post',
    data
  })
}

// ==================== 用户管理 ====================

/**
 * 获取角色列表
 */
export function getRoles() {
  return request({
    url: '/user/getRoles',
    method: 'get'
  })
}

/**
 * 新增用户
 * @param {Object} data - 用户数据
 * @param {String} data.nickName - 昵称
 * @param {String} data.userName - 账号
 * @param {Array} data.groupIds - 分组ID数组
 * @param {Array} data.roles - 角色数组
 * @param {String} data.remark - 备注
 */
export function addUser(data) {
  return request({
    url: '/user/add',
    method: 'post',
    data
  })
}

/**
 * 编辑用户
 * @param {Object} data - 用户数据
 */
export function editUser(data) {
  return request({
    url: '/user/edit',
    method: 'put',
    data
  })
}

/**
 * 删除用户
 * @param {String|Number} id - 用户ID
 */
export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}
/**
 * 账单相关 API
 */

import request from '@/utils/request'

// ==================== 账单查询 ====================

/**
 * 获取账单列表
 * @param {Object} data - 查询参数
 * @param {Number} data.page - 页码
 * @param {Number} data.size - 每页条数
 * @param {String} data.billTime - 账期（YYYY-MM格式）
 */
export function getBillList(data) {
  return request({
    url: '/bill/billQuery',
    method: 'post',
    data
  })
}

// ==================== 账户信息 ====================

/**
 * 获取用户账户信息（余额等）
 */
export function getAccountInfo() {
  return request({
    url: '/bill/getUserAccountInfo',
    method: 'get'
  })
}

// ==================== 充值 ====================

/**
 * 创建充值订单
 * @param {Object} data - 充值参数
 * @param {Number} data.amount - 充值金额（分）
 * @param {Number} data.payMethod - 支付方式：1=微信，2=支付宝，3=对公转账
 */
export function createRechargeOrder(data) {
  return request({
    url: '/bill/recharge',
    method: 'post',
    data
  })
}

/**
 * 查询支付状态
 * @param {String|Number} orderId - 订单ID
 */
export function checkPayStatus(orderId) {
  return request({
    url: '/bill/checkPayStatus',
    method: 'get',
    params: { orderId }
  })
}
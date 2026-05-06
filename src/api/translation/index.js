/**
 * 翻译相关 API
 */

import request from '@/utils/request'

// ==================== 基础配置 ====================

/**
 * 获取支持的模型列表
 */
export function getModelList() {
  return request({
    url: '/translation/getSupportModel',
    method: 'get'
  })
}

/**
 * 获取支持的语言列表
 */
export function getLanguageList() {
  return request({
    url: '/translation/getSupportLanguage',
    method: 'get'
  })
}

// ==================== 单次翻译 ====================

/**
 * 单次翻译
 * @param {Object} data - 翻译参数
 * @param {String} data.text - 待翻译文本
 * @param {String|Number} data.modelId - 模型ID
 * @param {String|Number} data.projectId - 名词库ID（可选）
 * @param {Array} data.targetLanguages - 目标语言数组
 */
export function singleTranslation(data) {
  return request({
    url: '/translation/translation',
    method: 'post',
    data
  })
}

/**
 * 查看单次翻译结果
 * @param {String|Number} id - 任务ID
 */
export function getTranslationResult(id) {
  return request({
    url: '/translation/viewTranslationRecord',
    method: 'get',
    params: { id }
  })
}

// ==================== 批量翻译 ====================

/**
 * 批量翻译文档
 * @param {FormData} formData - FormData 对象，包含 modelId, projectId, targetLanguage, files
 */
export function batchTranslation(formData) {
  return request({
    url: '/translation/batchTranslation',
    method: 'post',
    data: formData
  })
}

/**
 * 上传翻译文件
 * @param {File} file - 文件对象
 * @param {Function} onProgress - 上传进度回调
 */
export function uploadTranslationFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/translation/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

// ==================== 任务管理 ====================

/**
 * 获取翻译任务记录列表
 * @param {Object} data - 查询参数
 * @param {Number} data.page - 页码
 * @param {Number} data.size - 每页条数
 * @param {Number} data.taskType - 任务类型：1=单文本翻译，2=批量翻译
 * @param {Number} data.queryType - 查询类型
 */
export function getTranslationHistory(data) {
  return request({
    url: '/translation/getTranslationTaskRecord',
    method: 'post',
    data
  })
}

/**
 * 删除翻译任务记录
 * @param {Array} ids - 任务ID数组
 */
export function delTaskList(ids) {
  return request({
    url: '/translation/delTranslationTaskRecord',
    method: 'post',
    data: ids
  })
}

/**
 * 终止翻译任务
 * @param {Array} ids - 任务ID数组
 */
export function stopTask(ids) {
  return request({
    url: '/translation/stopTask',
    method: 'post',
    data: ids
  })
}

/**
 * 重置任务排序
 * @param {Object} data - 排序参数
 * @param {String|Number} data.id - 任务ID
 * @param {Number} data.index - 新索引位置
 * @param {Number} data.page - 当前页码
 * @param {Number} data.size - 每页条数
 */
export function resetTaskOrder(data) {
  return request({
    url: '/translation/resetTaskOrder',
    method: 'post',
    data
  })
}

/**
 * 下载翻译记录
 * @param {String|Number} id - 任务ID
 */
export function downloadRecord(id) {
  return request({
    url: '/translation/downloadRecord',
    method: 'get',
    params: { id }
  })
}

/**
 * 获取翻译记录字节流
 * @param {String|Number} id - 任务ID
 */
export function getRecodeByte(id) {
  return request({
    url: '/translation/getRecodeByte',
    method: 'get',
    params: { id }
  })
}
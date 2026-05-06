<template>
  <div class="batch-translate-page" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 页面标题 -->
    <h2 class="page-title">批量翻译</h2>

    <!-- 上传区域整体卡片 -->
    <div class="upload-section">
      <!-- 文件上传区域 -->
      <div class="upload-area" @click="triggerFileInput">
        <div class="upload-icon">
          <el-icon><Upload /></el-icon>
        </div>
        <p class="upload-text">拖动文件到此区域上传或点击上传文件</p>
        <p class="upload-tip">文件大小不超过 25M</p>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden-input"
          @change="handleFileUpload"
          accept=".docx,.xlsx,.xls"
          multiple
        />
      </div>

      <!-- 配置栏 -->
      <div class="config-bar">
        <el-select
          v-model="selectedDict"
          placeholder="请选择专有名词库"
          class="config-select"
          clearable
        >
          <template #prefix>
            <i class="iconfont icon-zymck1 config-icon"></i>
          </template>
          <el-option
            v-for="item in glossaryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>

        <el-select
          v-model="selectedModel"
          placeholder="选择模型"
          class="config-select"
          clearable
        >
          <template #prefix>
            <i class="iconfont icon-ss-mx config-icon"></i>
          </template>
          <el-option
            v-for="item in modelOptions"
            :key="item.id"
            :label="item.modelName"
            :value="item.id"
          />
        </el-select>

        <el-select
          v-model="selectedLang"
          placeholder="翻译语言"
          class="config-select"
          clearable
        >
          <template #prefix>
            <i class="iconfont icon-ss-yy1 config-icon"></i>
          </template>
          <el-option
            v-for="item in languageOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          />
        </el-select>

        <el-button type="primary" class="translate-btn" @click="startTranslate">
          开始翻译
        </el-button>
      </div>

      <!-- 已上传文件列表 -->
      <div class="uploaded-files" v-if="uploadedFiles.length > 0">
        <div
          v-for="file in uploadedFiles"
          :key="file.id"
          class="file-card"
        >
          <div class="file-icon" :class="file.type === 'docx' ? 'docx' : 'xlsx'">
            <span>{{ file.type === 'docx' ? 'W' : 'X' }}</span>
          </div>
          <p class="file-name">{{ file.name }}</p>
          <p class="file-size">{{ file.size }}</p>
          <div class="file-footer">
            <span class="file-time">{{ file.uploadTime }}</span>
            <el-link type="primary" @click="downloadFile(file)">
              <el-icon><Download /></el-icon>
            </el-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 翻译历史记录 -->
    <div class="history-section">
      <div class="history-header">
        <h3 class="section-title">翻译历史记录</h3>
        <el-button type="primary"    @click="fetchHistoryList">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>

      <el-table :data="historyList" class="history-table" v-loading="historyLoading" element-loading-text="加载中...">
        <template #empty>
          <div class="empty-text">暂无数据</div>
        </template>
        <el-table-column prop="sourceText" label="文档名称" min-width="200" align="center">
          <template #default="{ row }">
            <span class="doc-name">{{ row.sourceText || '- -' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="启动时间" width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="taskStatus" label="任务状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.taskStatus)"   >
              {{ getStatusText(row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taskNum" label="任务ID" width="140" align="center">
          <template #default="{ row }">
            <span class="task-id">{{ row.taskNum || row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <el-icon class="action-icon view"><View /></el-icon>
              <el-icon
                class="action-icon delete"
                v-if="row.taskStatus === 0 || row.taskStatus === 1"
                @click="stopTaskHandler(row)"
              >
                <Close />
              </el-icon>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          background
            
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.size"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50]"
          @size-change="(size) => { pagination.size = size; pagination.page = 1; fetchHistoryList() }"
          @current-change="(page) => { pagination.page = page; fetchHistoryList() }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download, View, Close, Refresh } from '@element-plus/icons-vue'
import {
  getModelList,
  getLanguageList,
  batchTranslation,
  getTranslationHistory,
  stopTask
} from '@/api/translation'
import { getUserCallAllNoun } from '@/api/noun'

const themeStore = useThemeStore()

// 文件上传
const fileInputRef = ref(null)
const triggerFileInput = () => fileInputRef.value?.click()

const handleFileUpload = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    for (let file of files) {
      uploadedFiles.value.push({
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.name.endsWith('.docx') ? 'docx' : 'xlsx',
        size: formatFileSize(file.size),
        uploadTime: new Date().toLocaleString(),
        rawFile: file
      })
    }
    ElMessage.success(`已选择 ${files.length} 个文件`)
  }
}

// 配置项
const selectedDict = ref('')
const selectedModel = ref('')
const selectedLang = ref('')

// 下拉选项
const glossaryOptions = ref([])
const modelOptions = ref([])
const languageOptions = ref([])

// 获取名词库列表
const fetchGlossaryOptions = async () => {
  try {
    const res = await getUserCallAllNoun({})
    if (res && res.data) {
      glossaryOptions.value = res.data || []
    }
  } catch (error) {
    console.error('获取名词库列表失败:', error)
  }
}

// 获取模型列表
const fetchModelOptions = async () => {
  try {
    const res = await getModelList()
    if (res && res.data) {
      modelOptions.value = res.data || []
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}

// 获取语言列表
const fetchLanguageOptions = async () => {
  try {
    const res = await getLanguageList()
    if (res && res.data) {
      languageOptions.value = res.data || []
    }
  } catch (error) {
    console.error('获取语言列表失败:', error)
  }
}

// 开始翻译
const startTranslate = async () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.warning('请先上传文件')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请选择模型')
    return
  }
  if (!selectedLang.value) {
    ElMessage.warning('请选择翻译语言')
    return
  }

  try {
    // 使用 FormData 上传文件
    const formData = new FormData()
    formData.append('modelId', selectedModel.value)
    formData.append('projectId', selectedDict.value || '')
    formData.append('targetLanguages', selectedLang.value)

    // 添加文件
    uploadedFiles.value.forEach(file => {
      if (file.rawFile) {
        formData.append('files', file.rawFile, file.name)
      }
    })

    const res = await batchTranslation(formData)
    if (res) {
      ElMessage.success('翻译任务已提交')
      uploadedFiles.value = []
      fetchHistoryList()
    }
  } catch (error) {
    console.error('翻译失败:', error)
    ElMessage.error('翻译请求失败')
  }
}

// 已上传文件列表
const uploadedFiles = ref([])

const downloadFile = (file) => {
  ElMessage.success(`开始下载：${file.name}`)
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'kb'
  return (bytes / (1024 * 1024)).toFixed(0) + 'MB'
}

// 历史记录
const historyList = ref([])
const historyLoading = ref(false)
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 获取历史记录
const fetchHistoryList = async () => {
  try {
    historyLoading.value = true
    const res = await getTranslationHistory({
      page: pagination.page,
      size: pagination.size,
      taskType: 2, // 批量翻译
      queryType: 1
    })
    if (res && res.data) {
      historyList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  } finally {
    historyLoading.value = false
  }
}

const getStatusText = (status) => {
  const map = {
    0: '等待执行',
    1: '翻译中',
    2: '翻译完成',
    3: '翻译失败',
    4: '终止中',
    5: '已终止'
  }
  return map[status] || status
}

// 状态标签类型
const getStatusType = (status) => {
  const map = {
    0: 'primary',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'danger',
    5: 'info'
  }
  return map[status] || 'default'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '- -'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 终止任务
const stopTaskHandler = async (row) => {
  try {
    await ElMessageBox.confirm('确定要终止这个任务吗？', '确认终止', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await stopTask([row.id])
    if (res) {
      ElMessage.success('终止成功')
      fetchHistoryList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('终止任务失败:', error)
      ElMessage.error('终止失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchGlossaryOptions()
  fetchModelOptions()
  fetchLanguageOptions()
  fetchHistoryList()
})
</script>

<style>
/* 非 scoped 样式 - 深色主题 */
html.dark .batch-translate-page,
.batch-translate-page.dark {
  --bg-page: #1D1D1D;
  --bg-card: #000000;
  --border: #252535;
  --text: #ffffff;
  --text-regular: #e0e0e8;
  --text-muted: #909399;
  --bg-input: #1e1e2e;
  --bg-hover: #252535;
  background: var(--bg-page);
}

html.dark .batch-translate-page .config-select,
.batch-translate-page.dark .config-select {
  --el-input-icon-color: #ffffff;
  --el-text-color-placeholder: #ffffff;
}

html.dark .batch-translate-page .config-select .config-icon,
.batch-translate-page.dark .config-select .config-icon {
  color: #ffffff !important;
}

html.dark .batch-translate-page .config-select :deep(.el-input__wrapper),
.batch-translate-page.dark .config-select :deep(.el-input__wrapper) {
  background: var(--bg-input);
  border-color: var(--border);
  box-shadow: none !important;
}

html.dark .batch-translate-page .config-select :deep(.el-input__inner),
.batch-translate-page.dark .config-select :deep(.el-input__inner) {
  color: var(--text) !important;
}

html.dark .batch-translate-page .config-select :deep(.el-input__inner::placeholder),
html.dark .batch-translate-page .config-select :deep(.el-select__placeholder),
.batch-translate-page.dark .config-select :deep(.el-input__inner::placeholder),
.batch-translate-page.dark .config-select :deep(.el-select__placeholder) {
  color: #ffffff !important;
}

html.dark .batch-translate-page .config-select :deep(.el-select__prefix),
html.dark .batch-translate-page .config-select :deep(.el-select__suffix),
.batch-translate-page.dark .config-select :deep(.el-select__prefix),
.batch-translate-page.dark .config-select :deep(.el-select__suffix) {
  color: #ffffff !important;
}

html.dark .batch-translate-page .page-title,
html.dark .batch-translate-page .section-title,
.batch-translate-page.dark .page-title,
.batch-translate-page.dark .section-title {
  color: #ffffff;
}

html.dark .batch-translate-page .upload-section,
html.dark .batch-translate-page .history-section,
.batch-translate-page.dark .upload-section,
.batch-translate-page.dark .history-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: none;
}

html.dark .batch-translate-page .upload-area,
.batch-translate-page.dark .upload-area {
  background: #212121;
  border-color: #3a3a4a;
}

html.dark .batch-translate-page .upload-icon,
.batch-translate-page.dark .upload-icon {
  background: rgba(64, 158, 255, 0.2);
}

html.dark .batch-translate-page .upload-icon .el-icon,
.batch-translate-page.dark .upload-icon .el-icon {
  color: #3b82f6;
}

html.dark .batch-translate-page .upload-text,
.batch-translate-page.dark .upload-text {
  color: #ffffff;
}

html.dark .batch-translate-page .uploaded-files,
.batch-translate-page.dark .uploaded-files {
  border-top-color: var(--border);
}

html.dark .batch-translate-page .file-card,
.batch-translate-page.dark .file-card {
  background: #252535;
  border-color: #3a3a4a;
}

html.dark .batch-translate-page .file-name,
.batch-translate-page.dark .file-name {
  color: #ffffff;
}

html.dark .batch-translate-page .config-bar,
.batch-translate-page.dark .config-bar {
  border-top-color: var(--border);
}

html.dark .batch-translate-page .history-table :deep(.el-table__body tr),
.batch-translate-page.dark .history-table :deep(.el-table__body tr) {
  background-color: #000000 !important;
}

html.dark .batch-translate-page .history-table :deep(td.el-table__cell),
.batch-translate-page.dark .history-table :deep(td.el-table__cell) {
  background-color: transparent !important;
  border-bottom-color: #252535 !important;
  color: #ffffff !important;
}

html.dark .batch-translate-page .history-table :deep(.el-table__body tr:hover),
.batch-translate-page.dark .history-table :deep(.el-table__body tr:hover) {
  background-color: #252535 !important;
}

html.dark .batch-translate-page .history-table :deep(.el-table__body tr:hover td),
.batch-translate-page.dark .history-table :deep(.el-table__body tr:hover td) {
  background-color: #252535 !important;
}

html.dark .batch-translate-page .history-table :deep(th.el-table__cell),
.batch-translate-page.dark .history-table :deep(th.el-table__cell) {
  background: #383838 !important;
  border-bottom-color: #252535 !important;
  color: #ffffff !important;
  text-align: center !important;
}

html.dark .batch-translate-page .history-table :deep(.el-loading-mask),
.batch-translate-page.dark .history-table :deep(.el-loading-mask) {
  background-color: rgba(30, 30, 46, 0.8) !important;
}

html.dark .batch-translate-page .history-table :deep(.el-loading-spinner .circular),
.batch-translate-page.dark .history-table :deep(.el-loading-spinner .circular) {
  stroke: #409eff;
}

html.dark .batch-translate-page .history-table :deep(.el-loading-spinner .el-loading-text),
.batch-translate-page.dark .history-table :deep(.el-loading-spinner .el-loading-text) {
  color: #909399;
}

html.dark .batch-translate-page .section-title,
.batch-translate-page.dark .section-title {
  border-bottom-color: #409eff;
}

/* 浅色主题 */
html.light .batch-translate-page,
.batch-translate-page.light {
  --bg-page: #f5f7fa;
  --bg-card: #ffffff;
  --border: #e4e7ed;
  --text: #303133;
  --text-regular: #606266;
  --text-muted: #909399;
  --bg-input: #ffffff;
  --bg-hover: #F5F7FA;
  background: var(--bg-page);
}

html.light .batch-translate-page .config-select,
.batch-translate-page.light .config-select {
  --el-input-icon-color: #000000;
  --el-text-color-placeholder: #000000;
}

html.light .batch-translate-page .config-select .config-icon,
.batch-translate-page.light .config-select .config-icon {
  color: #000000 !important;
}

html.light .batch-translate-page .config-select :deep(.el-input__wrapper),
.batch-translate-page.light .config-select :deep(.el-input__wrapper) {
  background: var(--bg-input);
  border-color: var(--border);
  box-shadow: none !important;
}

html.light .batch-translate-page .config-select :deep(.el-input__inner),
.batch-translate-page.light .config-select :deep(.el-input__inner) {
  color: var(--text) !important;
}

html.light .batch-translate-page .config-select :deep(.el-input__inner::placeholder),
html.light .batch-translate-page .config-select :deep(.el-select__placeholder),
.batch-translate-page.light .config-select :deep(.el-input__inner::placeholder),
.batch-translate-page.light .config-select :deep(.el-select__placeholder) {
  color: #000000 !important;
}

html.light .batch-translate-page .config-select :deep(.el-select__prefix),
html.light .batch-translate-page .config-select :deep(.el-select__suffix),
.batch-translate-page.light .config-select :deep(.el-select__prefix),
.batch-translate-page.light .config-select :deep(.el-select__suffix) {
  color: #000000 !important;
}

html.light .batch-translate-page .page-title,
html.light .batch-translate-page .section-title,
.batch-translate-page.light .page-title,
.batch-translate-page.light .section-title {
  color: var(--text);
}

html.light .batch-translate-page .upload-section,
html.light .batch-translate-page .history-section,
.batch-translate-page.light .upload-section,
.batch-translate-page.light .history-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

html.light .batch-translate-page .upload-area,
.batch-translate-page.light .upload-area {
  background: #fafafa;
  border-color: #dcdfe6;
}

html.light .batch-translate-page .upload-icon,
.batch-translate-page.light .upload-icon {
  background: #ecf5ff;
}

html.light .batch-translate-page .upload-icon .el-icon,
.batch-translate-page.light .upload-icon .el-icon {
  color: #409eff;
}

html.light .batch-translate-page .upload-text,
.batch-translate-page.light .upload-text {
  color: #606266;
}

html.light .batch-translate-page .uploaded-files,
.batch-translate-page.light .uploaded-files {
  border-top-color: var(--border);
}

html.light .batch-translate-page .file-card,
.batch-translate-page.light .file-card {
  background: #fafafa;
  border-color: #e4e7ed;
}

html.light .batch-translate-page .file-name,
.batch-translate-page.light .file-name {
  color: #303133;
}

html.light .batch-translate-page .config-bar,
.batch-translate-page.light .config-bar {
  border-top-color: var(--border);
}

html.light .batch-translate-page .history-table,
.batch-translate-page.light .history-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: var(--bg-card);
  --el-table-header-bg-color: var(--bg-hover);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border);
  --el-table-text-color: var(--text);
  --el-table-header-text-color: var(--text-regular);
}

html.light .batch-translate-page .history-table :deep(.el-table__cell),
.batch-translate-page.light .history-table :deep(.el-table__cell) {
  color: var(--text);
  border-bottom-color: var(--border);
}

html.light .batch-translate-page .history-table :deep(th.el-table__cell),
.batch-translate-page.light .history-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: var(--el-table-header-text-color) !important;
  text-align: center !important;
}

html.light .batch-translate-page .section-title,
.batch-translate-page.light .section-title {
  border-bottom-color: #409eff;
}

html.light .batch-translate-page .history-table :deep(.el-loading-mask),
.batch-translate-page.light .history-table :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

html.light .batch-translate-page .history-table :deep(.el-loading-spinner .circular),
.batch-translate-page.light .history-table :deep(.el-loading-spinner .circular) {
  stroke: #3b82f6;
}

html.light .batch-translate-page .history-table :deep(.el-loading-spinner .el-loading-text),
.batch-translate-page.light .history-table :deep(.el-loading-spinner .el-loading-text) {
  color: var(--text-regular);
}
</style>

<style scoped>
.batch-translate-page {
  padding: 20px;
  background: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
  flex-shrink: 0;
}

/* 上传区域整体卡片 */
.upload-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  width: 56px;
  height: 56px;
  background: #ecf5ff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.upload-icon .el-icon {
  font-size: 24px;
  color: #409eff;
}

.upload-text {
  color: #606266;
  margin: 0 0 4px 0;
  font-size: 14px;
}

.upload-tip {
  color: #f56c6c;
  font-size: 12px;
  margin: 0;
}

.hidden-input {
  display: none;
}

/* 已上传文件列表 */
.uploaded-files {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.file-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  background: #fafafa;
  transition: box-shadow 0.2s;
}

.file-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.file-icon span {
  font-size: 18px;
  font-weight: bold;
}

.file-icon.docx {
  background: #ecf5ff;
  color: #409eff;
}

.file-icon.xlsx {
  background: #f0f9eb;
  color: #67c23a;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px 0;
}

.file-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* 配置栏 */
.config-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.config-select {
  width: 180px;
}

.config-select .config-icon {
  font-size: 16px;
  color: var(--text-muted);
}

.config-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--border, #e4e7ed) inset;
  padding-left: 32px;
}

.config-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border, #c0c4cc) inset;
}

.translate-btn {
  margin-left: auto;
}

/* 历史记录 */
.history-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 2px solid #409eff;
}

.history-table {
  flex: 1;
}

.history-table :deep(.el-table__cell) {
  padding: 12px 0;
  color: #303133;
  font-size: 14px;
}

.history-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

/* 文档名称列占满剩余空间，超出省略 */
.history-table :deep(.el-table-column--sourceText) {
  min-width: auto;
}

.history-table :deep(.el-table-column--sourceText .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 任务 ID 去除背景色 */
.task-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #666;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.translating {
  background: #409eff;
}

.status-dot.queuing {
  background: #e6a23c;
}

.status-dot.failed {
  background: #f56c6c;
}

.action-btns {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.action-icon:hover {
  color: #606266;
}

.action-icon.view {
  color: #409eff;
}

.action-icon.delete {
  color: #f56c6c;
}

/* 分页 */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 12px;
  flex-shrink: 0;
}

.pagination-bar :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: #3b82f6;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.doc-name {
  color: #333;
}

.task-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #666;
}

/* 深色模式覆盖 */
html.dark .history-table :deep(.el-table__cell),
.batch-translate-page.dark .history-table :deep(.el-table__cell) {
  color: #ffffff !important;
}

html.dark .history-table :deep(th.el-table__cell),
.batch-translate-page.dark .history-table :deep(th.el-table__cell) {
  color: #ffffff !important;
}

html.dark .doc-name,
.batch-translate-page.dark .doc-name {
  color: #ffffff !important;
}

html.dark .task-id,
.batch-translate-page.dark .task-id {
  color: #ffffff !important;
}
</style>
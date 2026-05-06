<template>
  <div class="translate-page" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 单次翻译模块 -->
    <section class="translate-section">
      <h1 class="page-title">单次翻译</h1>
      <div class="translate-card">
        <el-input v-model="sourceText" type="textarea" placeholder="输入需要进行翻译的文字..." class="source-input"
          :disabled="translating" />
        <div class="translate-options">
          <el-select v-model="selectedGlossary" placeholder="请选择专有名词库" class="option-select" clearable>
            <template #prefix>
              <i class="iconfont icon-zymck1 option-icon"></i>
            </template>
            <el-option v-for="item in glossaryOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-model="selectedModel" placeholder="选择模型" class="option-select" clearable>
            <template #prefix>
              <i class="iconfont icon-ss-mx option-icon"></i>
            </template>
            <el-option v-for="item in modelOptions" :key="item.id" :label="item.modelName" :value="item.id" />
          </el-select>
          <el-select v-model="selectedLanguages" placeholder="翻译语言" class="option-select lang-select" clearable multiple
            collapse-tags>
            <template #prefix>
              <i class="iconfont icon-ss-yy1 option-icon"></i>
            </template>
            <el-option v-for="item in languageOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
          <el-button type="primary" class="translate-btn" @click="handleTranslate" :loading="translating">
            <el-icon v-if="!translating">
              <Position />
            </el-icon>
            <span>开始翻译</span>
          </el-button>
        </div>
        <div class="target-wrapper">
          <el-input v-model="targetText" type="textarea" placeholder="译文" class="target-input" readonly />
          <div class="copy-btn" @click="handleCopy" :class="{ disabled: !targetText }">
            <el-icon>
              <CopyDocument />
            </el-icon>
            <span>复制</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 翻译历史记录 -->
    <section class="history-section">
      <div class="history-header">
        <h2 class="section-title">正在进行的任务</h2>
        <el-button type="primary"    @click="fetchHistoryList">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新列表
        </el-button>
      </div>
      <el-table :data="historyData" style="width: 100%" class="history-table" v-loading="historyLoading"
        element-loading-text="加载中...">
        <template #empty>
          <div class="empty-text">暂无数据</div>
        </template>
        <el-table-column prop="sourceText" label="翻译内容" min-width="180">
          <template #default="{ row }">
            <span class="doc-name">{{ row.sourceText || '- -' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="allTotalWord" label="字数统计" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.allTotalWord || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="翻译时间" width="300" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ formatTimeRange(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="任务状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.taskStatus)"   >
              {{ getStatusText(row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taskNum" label="任务ID" width="180" align="center">
          <template #default="{ row }">
            <span class="task-id">{{ row.taskNum || row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="danger" size="small" :disabled="!(row.taskStatus === 0 || row.taskStatus === 1)"
              @click="handleStopTask(row)" class="danger-btn">
              <el-icon>
                <Warning />
              </el-icon>
              终止
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteHistory(row)" class="danger-btn">
              <el-icon>
                <Delete />
              </el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination background    layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total" :page-size="pagination.size" :current-page="pagination.page"
          :page-sizes="[7, 10, 20, 50]" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import {
  CopyDocument,
  Delete,
  Position,
  Refresh,
  Warning,
  Folder,
  Cpu,
  ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getModelList,
  getLanguageList,
  singleTranslation,
  getTranslationHistory,
  delTaskList,
  stopTask
} from '@/api/translation'
import { getUserCallAllNoun } from '@/api/noun'

const themeStore = useThemeStore()

// 翻译相关
const sourceText = ref('')
const targetText = ref('')
const selectedGlossary = ref('')
const selectedModel = ref('')
const selectedLanguages = ref([])
const translating = ref(false)

// 下拉选项
const glossaryOptions = ref([])
const modelOptions = ref([])
const languageOptions = ref([])

// 历史记录
const historyData = ref([])
const historyLoading = ref(false)
const pagination = reactive({
  page: 1,
  size: 7,
  total: 0
})

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

// 获取历史记录
const fetchHistoryList = async () => {
  try {
    historyLoading.value = true
    const res = await getTranslationHistory({
      page: pagination.page,
      size: pagination.size,
      taskType: 1,
      queryType: 1
    })
    if (res && res.data) {
      historyData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 执行翻译
const handleTranslate = async () => {
  if (!sourceText.value.trim()) {
    ElMessage.warning('请输入需要翻译的内容')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请选择翻译模型')
    return
  }
  if (selectedLanguages.value.length === 0) {
    ElMessage.warning('请选择目标语言')
    return
  }

  try {
    translating.value = true
    const params = {
      text: sourceText.value,
      modelId: selectedModel.value,
      projectId: selectedGlossary.value || undefined,
      targetLanguages: selectedLanguages.value
    }
    const res = await singleTranslation(params)
    if (res) {
      ElMessage.success('翻译任务已提交，请等待执行完成')
      sourceText.value = ''
      fetchHistoryList()
    }
  } catch (error) {
    console.error('翻译失败:', error)
    ElMessage.error('翻译请求失败')
  } finally {
    translating.value = false
  }
}

// 复制译文
const handleCopy = () => {
  if (targetText.value) {
    navigator.clipboard.writeText(targetText.value)
    ElMessage.success('已复制到剪贴板')
  }
}

// 终止任务
const handleStopTask = async (row) => {
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

// 删除历史记录
const handleDeleteHistory = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？删除后不可恢复！', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await delTaskList([row.id])
    if (res) {
      ElMessage.success('删除成功')
      fetchHistoryList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页切换
const handlePageChange = (page) => {
  pagination.page = page
  fetchHistoryList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchHistoryList()
}

// 格式化时间范围
const formatTimeRange = (row) => {
  if (!row.createTime) return '- -'
  const start = formatTime(row.createTime)
  const end = row.endTime ? formatTime(row.endTime) : ''
  return end ? `${start} ~ ${end}` : start
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 状态文本
const getStatusText = (status) => {
  const map = {
    0: '等待执行',
    1: '执行中',
    2: '执行完成',
    3: '执行失败',
    4: '终止中',
    5: '已终止'
  }
  return map[status] || '未知'
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

// 初始化
onMounted(() => {
  fetchGlossaryOptions()
  fetchModelOptions()
  fetchLanguageOptions()
  fetchHistoryList()
})
</script>

<style>
/* 非 scoped 样式 - 主题样式定义 */

html.dark .translate-page,
.translate-page.dark {
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

html.dark .translate-page .option-select,
.translate-page.dark .option-select {
  --el-input-icon-color: #ffffff;
  --el-text-color-placeholder: #ffffff;
}

html.dark .translate-page .option-select .option-icon,
.translate-page.dark .option-select .option-icon {
  color: #ffffff !important;
}

html.dark .translate-page .option-select :deep(.el-input__inner::placeholder),
.translate-page.dark .option-select :deep(.el-input__inner::placeholder) {
  color: #ffffff !important;
}

html.dark .translate-page .page-title,
html.dark .translate-page .section-title,
.translate-page.dark .page-title,
.translate-page.dark .section-title {
  color: #ffffff;
}

html.dark .translate-page .translate-card,
html.dark .translate-page .history-section,
.translate-page.dark .translate-card,
.translate-page.dark .history-section {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: none;
}

html.dark .translate-page .source-input :deep(.el-textarea__inner),
html.dark .translate-page .target-input :deep(.el-textarea__inner),
.translate-page.dark .source-input :deep(.el-textarea__inner),
.translate-page.dark .target-input :deep(.el-textarea__inner) {
  background: var(--bg-input);
  border-color: var(--border);
  color: var(--text);
}

html.dark .translate-page .source-input :deep(.el-textarea__inner::placeholder),
html.dark .translate-page .target-input :deep(.el-textarea__inner::placeholder),
.translate-page.dark .source-input :deep(.el-textarea__inner::placeholder),
.translate-page.dark .target-input :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted);
}

html.dark .translate-page .source-input :deep(.el-textarea__inner:focus),
html.dark .translate-page .target-input :deep(.el-textarea__inner:focus),
.translate-page.dark .source-input :deep(.el-textarea__inner:focus),
.translate-page.dark .target-input :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
}

html.dark .translate-page .option-select :deep(.el-input__wrapper),
.translate-page.dark .option-select :deep(.el-input__wrapper) {
  background: var(--bg-input);
  border-color: var(--border);
  box-shadow: none !important;
}

html.dark .translate-page .option-select :deep(.el-input__inner),
.translate-page.dark .option-select :deep(.el-input__inner) {
  color: var(--text) !important;
}

html.dark .translate-page .option-select :deep(.el-input__inner::placeholder),
.translate-page.dark .option-select :deep(.el-input__inner::placeholder) {
  color: #ffffff !important;
}

html.dark .translate-page .option-select .option-icon,
.translate-page.dark .option-select .option-icon {
  color: #ffffff !important;
}

html.dark .translate-page .option-select :deep(.el-select__prefix),
html.dark .translate-page .option-select :deep(.el-select__suffix),
html.dark .translate-page .option-select :deep(.el-input__prefix),
html.dark .translate-page .option-select :deep(.el-input__suffix),
.translate-page.dark .option-select :deep(.el-select__prefix),
.translate-page.dark .option-select :deep(.el-select__suffix),
.translate-page.dark .option-select :deep(.el-input__prefix),
.translate-page.dark .option-select :deep(.el-input__suffix) {
  color: #ffffff !important;
}

html.dark .translate-page .option-select :deep(.el-select__placeholder),
.translate-page.dark .option-select :deep(.el-select__placeholder) {
  color: #ffffff !important;
}

html.dark .translate-page .copy-btn,
.translate-page.dark .copy-btn {
  background: var(--bg-input);
  color: var(--text-muted);
}

html.dark .translate-page .copy-btn:hover,
.translate-page.dark .copy-btn:hover {
  background: var(--bg-hover);
  color: #3b82f6;
}

html.dark .translate-page .history-table,
.translate-page.dark .history-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-input);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border);
  --el-table-text-color: var(--text);
  --el-table-header-text-color: var(--text);
}

html.dark .translate-page .history-table :deep(.el-table__cell),
.translate-page.dark .history-table :deep(.el-table__cell) {
  color: var(--text);
  border-bottom-color: var(--border);
}

/* 字数统计、翻译时间、任务状态、任务 ID 列居中 */
html.dark .translate-page .history-table :deep(.el-table__cell:nth-child(2)),
html.dark .translate-page .history-table :deep(.el-table__cell:nth-child(3)),
html.dark .translate-page .history-table :deep(.el-table__cell:nth-child(4)),
html.dark .translate-page .history-table :deep(.el-table__cell:nth-child(5)) {
  text-align: center;
}

/* 深色模式下操作按钮样式 - 红底白字 */
html.dark .translate-page .history-table :deep(.danger-btn),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger) {
  color: #ffffff !important;
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

html.dark .translate-page .history-table :deep(.danger-btn .el-icon),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger .el-icon) {
  color: #ffffff !important;
}

html.dark .translate-page .history-table :deep(.danger-btn:hover),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger:hover) {
  background-color: #f88f8f !important;
  border-color: #f88f8f !important;
  color: #ffffff !important;
}

html.dark .translate-page .history-table :deep(.danger-btn:hover .el-icon),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger:hover .el-icon) {
  color: #ffffff !important;
}

html.dark .translate-page .history-table :deep(.danger-btn.is-disabled),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger.is-disabled) {
  color: #909399 !important;
  background-color: #424242 !important;
  border-color: #424242 !important;
}

html.dark .translate-page .history-table :deep(.danger-btn.is-disabled .el-icon),
html.dark .translate-page .history-table :deep(.danger-btn.el-button--danger.is-disabled .el-icon) {
  color: #909399 !important;
}

html.dark .translate-page .history-table :deep(th.el-table__cell),
.translate-page.dark .history-table :deep(th.el-table__cell) {
  background: var(--bg-input);
  color: var(--text);
  text-align: center;
}

html.dark .translate-page .doc-name,
.translate-page.dark .doc-name {
  color: var(--text);
}

html.dark .translate-page .time-text,
.translate-page.dark .time-text {
  color: var(--text);
}

html.dark .translate-page .task-id,
.translate-page.dark .task-id {
  color: var(--text-muted);
  background: var(--bg-input);
}

html.dark .translate-page .pagination-bar,
.translate-page.dark .pagination-bar {
  border-top-color: var(--border);
}

html.dark .translate-page .pagination-bar :deep(.el-pagination),
.translate-page.dark .pagination-bar :deep(.el-pagination) {
  --el-pagination-bg-color: var(--bg-input);
  --el-pagination-button-bg-color: var(--bg-input);
  --el-pagination-hover-color: #3b82f6;
}

html.dark .translate-page .pagination-bar :deep(.el-pagination .el-pager li),
.translate-page.dark .pagination-bar :deep(.el-pagination .el-pager li) {
  background: var(--bg-input);
  color: var(--text);
}

html.dark .translate-page .pagination-bar :deep(.el-pagination .el-pager li.is-active),
.translate-page.dark .pagination-bar :deep(.el-pagination .el-pager li.is-active) {
  background: #3b82f6;
  color: #fff;
}

html.dark .translate-page .pagination-bar :deep(.el-pagination .el-select .el-input__wrapper),
.translate-page.dark .pagination-bar :deep(.el-pagination .el-select .el-input__wrapper) {
  background: var(--bg-input);
  border-color: var(--border);
}

html.dark .translate-page .pagination-bar :deep(.el-pagination .el-select .el-input__inner),
.translate-page.dark .pagination-bar :deep(.el-pagination .el-select .el-input__inner) {
  color: var(--text);
}

html.dark .translate-page .pagination-bar :deep(.el-pagination__total),
html.dark .translate-page .pagination-bar :deep(.el-pagination__jump),
.translate-page.dark .pagination-bar :deep(.el-pagination__total),
.translate-page.dark .pagination-bar :deep(.el-pagination__jump) {
  color: var(--text);
}

html.dark .translate-page .empty-text,
.translate-page.dark .empty-text {
  color: var(--text-muted);
}

html.dark .translate-page .history-table :deep(.el-loading-mask),
.translate-page.dark .history-table :deep(.el-loading-mask) {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

html.dark .translate-page .history-table :deep(.el-loading-spinner .circular),
.translate-page.dark .history-table :deep(.el-loading-spinner .circular) {
  stroke: #409eff;
}

html.dark .translate-page .history-table :deep(.el-loading-spinner .el-loading-text),
.translate-page.dark .history-table :deep(.el-loading-spinner .el-loading-text) {
  color: var(--text-muted);
}

/* 深色模式下操作按钮样式 */
html.dark .translate-page .history-table :deep(.el-button--link) {
  color: #ffffff !important;
}

html.dark .translate-page .history-table :deep(.el-button--link .el-icon) {
  color: #ffffff !important;
}

html.dark .translate-page .history-table :deep(.el-button--link.is-disabled) {
  color: #606266 !important;
}

html.dark .translate-page .history-table :deep(.el-button--link.is-disabled .el-icon) {
  color: #606266 !important;
}

/* 浅色主题 */
html.light .translate-page,
.translate-page.light {
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

html.light .translate-page .option-select,
.translate-page.light .option-select {
  --el-input-icon-color: #000000;
  --el-text-color-placeholder: #000000;
}

html.light .translate-page .option-select .option-icon,
.translate-page.light .option-select .option-icon {
  color: #000000 !important;
}

html.light .translate-page .page-title,
html.light .translate-page .section-title,
.translate-page.light .page-title,
.translate-page.light .section-title {
  color: var(--text);
}

html.light .translate-page .translate-card,
html.light .translate-page .history-section,
.translate-page.light .translate-card,
.translate-page.light .history-section {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

html.light .translate-page .source-input :deep(.el-textarea__inner),
html.light .translate-page .target-input :deep(.el-textarea__inner),
.translate-page.light .source-input :deep(.el-textarea__inner),
.translate-page.light .target-input :deep(.el-textarea__inner) {
  background: var(--bg-input);
  border-color: var(--border);
  color: var(--text);
}

html.light .translate-page .source-input :deep(.el-textarea__inner::placeholder),
html.light .translate-page .target-input :deep(.el-textarea__inner::placeholder),
.translate-page.light .source-input :deep(.el-textarea__inner::placeholder),
.translate-page.light .target-input :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted);
}

html.light .translate-page .source-input :deep(.el-textarea__inner:focus),
html.light .translate-page .target-input :deep(.el-textarea__inner:focus),
.translate-page.light .source-input :deep(.el-textarea__inner:focus),
.translate-page.light .target-input :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
}

html.light .translate-page .option-select :deep(.el-input__wrapper),
.translate-page.light .option-select :deep(.el-input__wrapper) {
  background: var(--bg-input);
  border-color: var(--border);
  box-shadow: none !important;
}

html.light .translate-page .option-select,
.translate-page.light .option-select {
  --el-input-icon-color: #000000;
  --el-text-color-placeholder: #000000;
}

html.light .translate-page .option-select :deep(.el-input__inner),
.translate-page.light .option-select :deep(.el-input__inner) {
  color: var(--text) !important;
}

html.light .translate-page .option-select :deep(.el-input__inner::placeholder),
.translate-page.light .option-select :deep(.el-input__inner::placeholder) {
  color: #000000 !important;
}

html.light .translate-page .option-select .option-icon,
.translate-page.light .option-select .option-icon {
  color: #000000 !important;
}

html.light .translate-page .option-select :deep(.el-select__prefix),
html.light .translate-page .option-select :deep(.el-select__suffix),
html.light .translate-page .option-select :deep(.el-input__prefix),
html.light .translate-page .option-select :deep(.el-input__suffix),
.translate-page.light .option-select :deep(.el-select__prefix),
.translate-page.light .option-select :deep(.el-select__suffix),
.translate-page.light .option-select :deep(.el-input__prefix),
.translate-page.light .option-select :deep(.el-input__suffix) {
  color: #000000 !important;
}

html.light .translate-page .option-select :deep(.el-select__placeholder),
.translate-page.light .option-select :deep(.el-select__placeholder) {
  color: #000000 !important;
}

html.light .translate-page .copy-btn,
.translate-page.light .copy-btn {
  background: var(--bg-hover);
  color: var(--text-regular);
}

html.light .translate-page .copy-btn:hover,
.translate-page.light .copy-btn:hover {
  background: var(--border);
  color: #3b82f6;
}

html.light .translate-page .history-table,
.translate-page.light .history-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: var(--bg-card);
  --el-table-header-bg-color: var(--bg-hover);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border);
  --el-table-text-color: var(--text);
  --el-table-header-text-color: var(--text-regular);
}

html.light .translate-page .history-table :deep(.el-table__cell),
.translate-page.light .history-table :deep(.el-table__cell) {
  color: var(--text);
  border-bottom-color: var(--border);
}

/* 字数统计、翻译时间、任务状态、任务 ID 列居中 */
html.light .translate-page .history-table :deep(.el-table__cell:nth-child(2)),
html.light .translate-page .history-table :deep(.el-table__cell:nth-child(3)),
html.light .translate-page .history-table :deep(.el-table__cell:nth-child(4)),
html.light .translate-page .history-table :deep(.el-table__cell:nth-child(5)) {
  text-align: center;
}

html.light .translate-page .history-table :deep(th.el-table__cell),
.translate-page.light .history-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: var(--el-table-header-text-color) !important;
  text-align: center !important;
}

html.light .translate-page .doc-name,
.translate-page.light .doc-name {
  color: var(--text);
}

html.light .translate-page .time-text,
.translate-page.light .time-text {
  color: var(--text);
}

html.light .translate-page .task-id,
.translate-page.light .task-id {
  color: var(--text-regular);
  background: var(--bg-hover);
}

html.light .translate-page .pagination-bar,
.translate-page.light .pagination-bar {
  border-top-color: var(--border);
}

html.light .translate-page .pagination-bar :deep(.el-pagination),
.translate-page.light .pagination-bar :deep(.el-pagination) {
  --el-pagination-bg-color: var(--bg-card);
  --el-pagination-button-bg-color: var(--bg-card);
  --el-pagination-hover-color: #3b82f6;
}

html.light .translate-page .pagination-bar :deep(.el-pagination .el-pager li),
.translate-page.light .pagination-bar :deep(.el-pagination .el-pager li) {
  background: var(--bg-card);
  color: var(--text-regular);
}

html.light .translate-page .pagination-bar :deep(.el-pagination .el-pager li.is-active),
.translate-page.light .pagination-bar :deep(.el-pagination .el-pager li.is-active) {
  background: #3b82f6;
  color: #fff;
}

html.light .translate-page .pagination-bar :deep(.el-pagination .el-select .el-input__wrapper),
.translate-page.light .pagination-bar :deep(.el-pagination .el-select .el-input__wrapper) {
  background: var(--bg-card);
  border-color: var(--border);
}

html.light .translate-page .pagination-bar :deep(.el-pagination .el-select .el-input__inner),
.translate-page.light .pagination-bar :deep(.el-pagination .el-select .el-input__inner) {
  color: var(--text);
}

html.light .translate-page .pagination-bar :deep(.el-pagination__total),
html.light .translate-page .pagination-bar :deep(.el-pagination__jump),
.translate-page.light .pagination-bar :deep(.el-pagination__total),
.translate-page.light .pagination-bar :deep(.el-pagination__jump) {
  color: var(--text-regular);
}

html.light .translate-page .empty-text,
.translate-page.light .empty-text {
  color: var(--text-muted);
}

html.light .translate-page .history-table :deep(.el-loading-mask),
.translate-page.light .history-table :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

html.light .translate-page .history-table :deep(.el-loading-spinner .circular),
.translate-page.light .history-table :deep(.el-loading-spinner .circular) {
  stroke: #3b82f6;
}

html.light .translate-page .history-table :deep(.el-loading-spinner .el-loading-text),
.translate-page.light .history-table :deep(.el-loading-spinner .el-loading-text) {
  color: var(--text-regular);
}
</style>

<style scoped>
.translate-page {
  padding: 20px;
  background: var(--bg-page, #f5f7fa);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 12px 0;
  flex-shrink: 0;
}

.translate-section {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.translate-card {
  background-color: var(--bg-card, #fff);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.source-input {
  margin-bottom: 12px;
}

.source-input :deep(.el-textarea) {
  height: 120px;
}

.source-input :deep(.el-textarea__inner) {
  height: 120px !important;
  border-radius: 4px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
  padding: 10px 12px;
  resize: none;
}

.source-input :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted) !important;
}

.source-input :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
}

.translate-options {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-select {
  width: 180px;
}

.option-select .option-icon {
  font-size: 16px;
  color: var(--text-muted);
}

.lang-select {
  width: 240px;
}

.option-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--border, #e4e7ed) inset;
  padding-left: 32px;
}

.option-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border, #c0c4cc) inset;
}

.option-select :deep(.el-input__inner) {
  color: var(--text);
}

.translate-btn {
  margin-left: auto;
  border-radius: 8px;
  padding: 0 20px;
  height: 36px;
  font-weight: 500;
}

.target-wrapper {
  position: relative;
}

.target-input :deep(.el-textarea) {
  height: 120px;
}

.target-input :deep(.el-textarea__inner) {
  height: 120px !important;
  background: var(--bg-input);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
  padding: 10px 12px;
  padding-right: 60px;
  resize: none;
}

.target-input :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted) !important;
}

.copy-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
  background: var(--bg-input);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.copy-btn:hover {
  color: #3b82f6;
  background: var(--bg-hover);
}

.copy-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 历史记录 */
.history-section {
  background-color: var(--bg-card);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.more-link {
  font-size: 13px;
}

.history-table {
  --el-table-border-color: var(--border);
  --el-table-header-bg-color: var(--bg-hover);
  --el-table-row-hover-bg-color: var(--bg-hover);
  flex: 1;
}

.history-table :deep(.el-table__cell) {
  padding: 12px 0;
  color: var(--text);
  font-size: 14px;
}

.history-table :deep(th.el-table__cell) {
  font-weight: 500;
  background: #f5f7fa !important;
  color: #606266 !important;
  font-size: 13px;
  text-align: center !important;
}

.doc-name {
  color: var(--text);
}

.time-text {
  color: var(--text-muted);
  font-size: 13px;
}

.task-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
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
  flex-shrink: 0;
}

.status-text {
  font-size: 13px;
  color: var(--text);
}

.action-icon {
  margin: 0 6px;
  font-size: 15px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
}

.action-icon:hover {
  color: var(--text-regular);
}

.action-icon.view {
  color: #3b82f6;
}

.action-icon.view:hover {
  color: #2563eb;
}

.action-icon.delete {
  color: #f56c6c;
}

.action-icon.delete:hover {
  color: #ef4444;
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
  color: var(--text-muted);
  padding: 40px 0;
}
</style>

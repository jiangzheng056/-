<template>
  <div class="task-list-page">
    <!-- 页面标题与筛选栏 -->
    <div class="page-header">
      <h5 class="page-title">任务列表</h5>
      <div class="filter-bar">
        <el-input v-model="filterName" placeholder="输入任务相关名称" class="filter-input" clearable :prefix-icon="Search"
          @keyup.enter="handleSearch" />
        <el-select v-model="filterType" placeholder="任务类型" class="filter-select" clearable @change="handleSearch">
          <el-option label="单次翻译" :value="1" />
          <el-option label="批量翻译" :value="2" />
        </el-select>
        <el-date-picker v-model="filterStartTime" type="datetime" placeholder="任务启动时间" class="filter-date"
          value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" clearable />
        <el-date-picker v-model="filterEndTime" type="datetime" placeholder="任务完成时间" class="filter-date"
          value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" clearable />
        <el-button class="icon-btn" @click="handleSearch" :loading="tableLoading">
          <el-icon>
            <Search />
          </el-icon>
        </el-button>
        <el-button class="icon-btn ml0" @click="fetchTaskList">
          <el-icon>
            <Refresh />
          </el-icon>
        </el-button>
        <el-button type="danger" class="ml0" plain @click="handleBatchDelete" :disabled="!selectedRows.length">
          <el-icon>
            <Delete />
          </el-icon>
          <span>批量删除</span>
        </el-button>
      </div>
    </div>

    <!-- 任务表格 -->
    <div class="table-section">
      <el-table ref="tableRef" :data="taskList" class="task-table" @selection-change="handleSelectionChange"
        v-loading="tableLoading" element-loading-text="加载中..." stripe>
        <template #empty>
          <div class="empty-text">暂无数据</div>
        </template>
        <el-table-column type="selection" align="center" :selectable="selectable" width="55" />
        <el-table-column prop="sourceText" label="任务名称" min-width="180">
          <template #default="{ row }">
            <span class="task-name">{{ row.sourceText || '- -' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="taskType" label="任务类型" width="120" align="center">
          <template #default="{ row }">
            <div class="type-center">
              <div :class="row.taskType === 1 ? 'type-single' : 'type-batch'">
                {{ row.taskType === 1 ? '单次翻译' : '批量翻译' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="启动时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ formatTime(row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="完成时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ row.endTime ? formatTime(row.endTime) : '- -' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="taskStatus" label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <span class="status-dot" :style="{ backgroundColor: getStatusColor(row.taskStatus) }"></span>
              <span :class="getStatusClass(row.taskStatus)">
                {{ getStatusText(row.taskStatus) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="taskNum" label="任务编号" width="140" align="center" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button class="action-btn download-btn" :disabled="row.taskStatus === 3 || row.taskStatus === 4"
                @click="downloadTask(row)" circle>
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button class="action-btn view-btn" :disabled="row.taskStatus === 3 || row.taskStatus === 4"
                @click="viewDetail(row)" circle>
                <el-icon><View /></el-icon>
              </el-button>
              <el-button class="action-btn delete-btn" @click="deleteTask(row)" circle>
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination background layout="sizes, prev, pager, next, jumper, total" :current-page="currentPage"
          :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" @current-change="handlePageChange"
          @size-change="handleSizeChange" />
      </div>
    </div>

    <!-- 查看翻译结果弹窗 -->
    <el-dialog v-model="dialogVisible" title="翻译结果详情" :width="800" @close="handleDialogClose"
      class="task-dialog">
      <div v-if="dialogLoading" class="dialog-loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="resultData.type === 'batch'" class="batch-result">
        <el-table :data="resultData.tableData" border stripe max-height="400px">
          <el-table-column v-for="col in resultData.tableColumns" :key="col.prop" :prop="col.prop" :label="col.label"
            min-width="120" />
        </el-table>
      </div>
      <div v-else class="no-result">
        暂无数据
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, Download, View, Loading } from '@element-plus/icons-vue'
import {
  getTranslationHistory,
  delTaskList,
  downloadRecord,
  getTranslationResult
} from '@/api/translation'

const router = useRouter()

// 查看弹窗相关
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const resultData = ref({
  type: '',  // 'batch'
  tableData: [],
  tableColumns: []
})

// 弹窗关闭回调
const handleDialogClose = () => {
  resultData.value = {
    type: '',
    tableData: [],
    tableColumns: []
  }
}

// 筛选条件
const filterType = ref(undefined)
const filterStartTime = ref('')
const filterEndTime = ref('')
const filterName = ref('')

// 任务列表数据
const taskList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])
const tableLoading = ref(false)

// 获取任务列表
const fetchTaskList = async () => {
  try {
    tableLoading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    // 任务类型筛选
    if (filterType.value) {
      params.taskType = filterType.value
    }
    // 任务名称搜索
    if (filterName.value) {
      params.taskName = filterName.value
    }
    // 时间筛选
    if (filterStartTime.value) {
      params.startTime = filterStartTime.value
    }
    if (filterEndTime.value) {
      params.endTime = filterEndTime.value
    }

    const res = await getTranslationHistory(params)
    if (res && res.data) {
      taskList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    tableLoading.value = false
  }
}

const getStatusColor = (status) => {
  const colorMap = {
    0: '#3751FE',
    1: '#E17F00',
    2: '#00A415',
    3: '#E30000',
    4: '#E30000',
    5: '#E30000'
  }
  return colorMap[status] || '#3751FE'
}

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

// 获取状态样式类名
const getStatusClass = (status) => {
  const classMap = {
    0: 'status-blue',
    1: 'status-yellow',
    2: 'status-green',
    3: 'status-red',
    4: 'status-red',
    5: 'status-red'
  }
  return classMap[status] || ''
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

// 表格多选
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchTaskList()
}

// 查看详情
const viewDetail = (row) => {
  if (row.taskType === 1) {
    // 单次翻译 - 跳转到单次翻译页面查看
    router.push({
      path: '/translate/single',
      query: { id: row.id }
    })
  } else if (row.taskType === 2) {
    // 批量翻译 - 显示详情弹窗
    dialogVisible.value = true
    dialogLoading.value = true
    resultData.value = {
      type: '',
      tableData: [],
      tableColumns: []
    }

    getTranslationResult(row.id).then(res => {
      if (res.code === 200) {
        const header = res.data.tableHeaders || []
        const records = res.data.records || []

        // 处理表头
        const columns = header.map(h => ({
          prop: h.code || h.name,
          label: h.name || h.code
        }))
        resultData.value.tableColumns = columns

        // 处理表格数据
        resultData.value.tableData = records.map(record => {
          const row = {}
          columns.forEach(col => {
            row[col.prop] = record[col.prop] || ''
          })
          return row
        })

        resultData.value.type = 'batch'
      } else {
        ElMessage.error(res?.message || '获取翻译结果失败')
      }
    }).catch(err => {
      console.error('获取翻译结果失败:', err)
      ElMessage.error('获取翻译结果失败，请稍后重试')
    }).finally(() => {
      dialogLoading.value = false
    })
  }
}

// 下载任务
const downloadTask = async (row) => {
  try {
    const res = await downloadRecord(row.id)
    if (res && res.data) {
      // 构造a标签触发下载
      const link = document.createElement('a')
      link.href = res.data
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link)
        }
        ElMessage.success('下载已开始')
      }, 200)
    }
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 删除单个任务
const deleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务「${row.sourceText || row.taskNum}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })
    const res = await delTaskList([row.id])
    if (res) {
      ElMessage.success('删除成功')
      fetchTaskList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的任务')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个任务吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })
    const ids = selectedRows.value.map(item => item.id)
    const res = await delTaskList(ids)
    if (res) {
      ElMessage.success('删除成功')
      fetchTaskList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页切换
const handlePageChange = (page) => {
  currentPage.value = page
  fetchTaskList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchTaskList()
}

// 选择框过滤 - 可选择状态
const selectable = (row) => {
  // 等待执行和执行中的任务不能被选择删除
  return ![0, 1].includes(row.taskStatus)
}

// 初始化
onMounted(() => {
  fetchTaskList()
})
</script>

<style lang="scss">
/* 非 scoped 样式 - 深色主题覆盖 */
html.dark .task-list-page {
  background: #1D1D1D;

  .page-title {
    color: #ffffff;
  }
}

/* 筛选栏输入框深色样式 */
html.dark .task-list-page .filter-select .el-input__wrapper,
html.dark .task-list-page .filter-date .el-input__wrapper,
html.dark .task-list-page .filter-input .el-input__wrapper {
  background-color: #212121 !important;
  border: 1px solid #252535 !important;
  box-shadow: none !important;
  height: 32px !important;
  padding: 0 8px !important;
}

/* 强制覆盖时间选择器高度 */
html.dark .task-list-page .filter-date.el-date-editor {
  height: 32px !important;
}

html.dark .task-list-page .filter-date .el-input__wrapper {
  height: 32px !important;
}

html.dark .task-list-page .el-input__inner {
  color: #ffffff !important;
}

html.dark .task-list-page .el-input__inner::placeholder {
  color: #6b6b7b !important;
}

html.dark .task-list-page .el-select .el-input__inner {
  color: #ffffff !important;
}

html.dark .task-list-page .el-date-editor .el-input__inner {
  color: #ffffff !important;
}

html.dark .task-list-page .filter-bar .el-button {
  height: 32px !important;
}

html.dark .task-list-page .filter-bar .el-button:hover {
  border-color: #252535 !important;
}

html.dark .task-list-page .filter-select .el-input__inner,
html.dark .task-list-page .filter-date .el-input__inner,
html.dark .task-list-page .filter-input .el-input__inner {
  color: #ffffff !important;
}

html.dark .task-list-page .filter-select .el-input__inner::placeholder,
html.dark .task-list-page .filter-date .el-input__inner::placeholder,
html.dark .task-list-page .filter-input .el-input__inner::placeholder {
  color: #6b6b7b !important;
}

html.dark .task-list-page .icon-btn {
  background: #262626;
  border: none;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

html.dark .task-list-page .icon-btn :deep(.el-icon) {
  color: #909399;
}

html.dark .task-list-page .icon-btn:hover {
  background: #2F5DFE;
}

html.dark .task-list-page .icon-btn:hover :deep(.el-icon) {
  color: #ffffff !important;
}

/* 深色模式下危险按钮样式 */
html.dark .task-list-page .el-button--danger {
  background-color: #101010 !important;
  border-color: #4a4a4a !important;
  color: #ffffff !important;
}

html.dark .task-list-page .el-button--danger :deep(.el-icon) {
  color: #f56c6c !important;
}

html.dark .task-list-page .el-button--danger span {
  color: #ffffff !important;
}

html.dark .task-list-page .el-button--danger:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

html.dark .task-list-page .el-button--danger:hover :deep(.el-icon),
html.dark .task-list-page .el-button--danger:hover span {
  color: #ffffff !important;
}

html.dark .task-list-page {

  /* 表格内容颜色覆盖 - 直接在 html.dark 下定义以获得更高优先级 */
  .task-table .el-table__body td {
    color: #ffffff !important;
  }

  .task-table .el-table__body .cell {
    color: #ffffff !important;
  }

  .task-table .task-name {
    color: #ffffff !important;
  }

  /* 状态圆点样式已在 scoped 样式中定义，此处无需重复 */

  /* 排除任务类型标签 */
  .task-table .el-table__body .cell .type-single,
  .task-table .el-table__body .cell .type-batch {
    color: #2F5DFE !important;
  }

  .table-section {
    background: #000000;
    border: 1px solid #252535;
  }

  .task-table {

    /* 表头单元格 */
    :deep(th.el-table__cell) {
      background: #383838 !important;
      color: #ffffff !important;
      text-align: center;
    }

    /* tbody 行 */
    :deep(.el-table__body tr) {
      background-color: transparent !important;
    }

    :deep(.el-table__body tr:hover) {
      background-color: #252535 !important;

      td {
        background-color: #252535 !important;
      }
    }

    :deep(.el-table__body tr.el-table__row--striped) {
      background-color: rgba(255, 255, 255, 0.02) !important;
    }

    /* 任务类型标签样式 */
    .type-center {
      .type-single {
        color: #2F5DFE;
        background: #E9EEFF;
      }

      .type-batch {
        color: #2F5DFE;
        background: #E9EEFF;
        box-shadow: 4px 4px 0 #8DA7FF;
      }
    }
  }

  .pagination-bar {
    border-top-color: #252535;

    :deep(.el-pagination .el-pager li) {
      background-color: #1e1e2e !important;
      color: #ffffff !important;
    }

    :deep(.el-pagination .el-pager li.is-active) {
      background-color: #409EFF !important;
      color: #fff !important;
    }
  }

  /* 操作按钮组 */
  .action-btns {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .action-btn {
    width: 20px;
    height: 20px;
    min-width: 20px !important;
    padding: 0 !important;
    border: none !important;
    background: #262626 !important;
    box-shadow: 0px 0px 2px 1px rgba(255, 255, 255, 0.1) !important;
    border-radius: 5px !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn :deep(.el-icon) {
    font-size: 14px;
    color: #ffffff;
  }

  .action-btn:disabled {
    opacity: 0.5;
  }

  .action-btn:disabled :deep(.el-icon) {
    color: #606266;
  }

  .action-btn.download-btn:hover:not(:disabled) {
    background: #2F5DFE !important;
  }

  .action-btn.view-btn:hover:not(:disabled) {
    background: #00A415 !important;
  }

  .action-btn.delete-btn:hover:not(:disabled) {
    background: #E23A2D !important;
  }

  .action-btn:hover:not(:disabled) :deep(.el-icon) {
    color: #ffffff !important;
  }
}

/* 浅色主题覆盖 */
html.light .task-list-page .filter-select .el-input__wrapper,
html.light .task-list-page .filter-date .el-input__wrapper,
html.light .task-list-page .filter-input .el-input__wrapper {
  background-color: #ffffff !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: none !important;
  height: 32px !important;
  padding: 0 8px !important;
}

/* 强制覆盖时间选择器高度 */
html.light .task-list-page .filter-date.el-date-editor {
  height: 32px !important;
}

html.light .task-list-page .filter-date .el-input__wrapper {
  height: 32px !important;
}

/* 浅色模式下图标按钮样式 */
html.light .task-list-page .icon-btn {
  background: #f5f7fa;
  border: 1px solid #dcdfe6 !important;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

html.light .task-list-page .icon-btn :deep(.el-icon) {
  color: #606266;
}

html.light .task-list-page .icon-btn:hover {
  background: #2F5DFE;
  border-color: #2F5DFE !important;
}

html.light .task-list-page .icon-btn:hover :deep(.el-icon) {
  color: #ffffff !important;
}

/* 浅色模式下批量删除按钮样式 */
html.light .task-list-page .el-button--danger {
  background-color: #ffffff !important;
  border-color: #f56c6c !important;
  color: #f56c6c !important;
}

html.light .task-list-page .el-button--danger :deep(.el-icon) {
  color: #f56c6c !important;
}

html.light .task-list-page .el-button--danger:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

html.light .task-list-page .el-button--danger:hover :deep(.el-icon) {
  color: #ffffff !important;
}

html.light .task-list-page .filter-select .el-input__inner,
html.light .task-list-page .filter-date .el-input__inner,
html.light .task-list-page .filter-input .el-input__inner {
  color: #303133 !important;
  font-size: 12px;
}

html.light .task-list-page .filter-select .el-input__inner::placeholder,
html.light .task-list-page .filter-date .el-input__inner::placeholder,
html.light .task-list-page .filter-input .el-input__inner::placeholder {
  color: #c0c4cc !important;
}

/* 浅色模式下状态文字样式 */

html.light .task-list-page .task-table th.el-table__cell {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

/* 浅色模式下图标按钮样式 */
html.light .task-list-page .icon-btn {
  background: #ffffff;
  border: 1px solid #dcdfe6 !important;
}

html.light .task-list-page .icon-btn :deep(.el-icon) {
  color: #606266;
}

html.light .task-list-page .icon-btn:hover {
  background: #2F5DFE;
  border-color: #2F5DFE !important;
}

html.light .task-list-page .icon-btn:hover :deep(.el-icon) {
  color: #ffffff !important;
}

/* 浅色模式下批量删除按钮样式 */
html.light .task-list-page .el-button--danger {
  background-color: #ffffff !important;
  border-color: #E8E8E8 !important;
  color: #303133 !important;
}

html.light .task-list-page .el-button--danger :deep(.el-icon) {
  color: #f56c6c !important;
}

html.light .task-list-page .el-button--danger span {
  color: #303133 !important;
}

html.light .task-list-page .el-button--danger:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

html.light .task-list-page .el-button--danger:hover :deep(.el-icon),
html.light .task-list-page .el-button--danger:hover span {
  color: #ffffff !important;
}

/* 翻译结果弹窗样式 */
.task-list-page .dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
}

.task-list-page .dialog-loading .el-icon {
  font-size: 32px;
  color: #3b82f6;
}

.task-list-page .no-result {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.task-list-page .batch-result .el-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(0, 0, 0, 0.02);
  --el-table-border-color: #e4e7ed;
  --el-table-text-color: #303133;
  --el-table-header-text-color: #606266;
}

/* 深色模式下弹窗样式 */
html.dark .task-list-page .el-dialog,
html.dark .el-dialog.task-dialog {
  background: #101010 !important;
  border: 1px solid #252535 !important;
}

html.dark .el-dialog__header,
html.dark .el-dialog.task-dialog .el-dialog__header {
  border-bottom-color: #252535 !important;
}

html.dark .el-dialog__title,
html.dark .task-list-page .el-dialog__title,
html.dark .el-dialog.task-dialog .el-dialog__title {
  color: #ffffff !important;
}

html.dark .el-dialog__headerbtn .el-dialog__close,
html.dark .el-dialog.task-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #a0a0b0 !important;

  &:hover {
    color: #3b82f6 !important;
  }
}

html.dark .task-list-page .dialog-loading {
  color: #a0a0b0;
}

html.dark .task-list-page .no-result {
  color: #6b6b7b;
}

html.dark .task-list-page .batch-result .el-table {
  --el-table-bg-color: #101010 !important;
  --el-table-tr-bg-color: #101010 !important;
  --el-table-header-bg-color: #101010 !important;
  --el-table-row-hover-bg-color: #1a1a1a !important;
  --el-table-border-color: #252535 !important;
  --el-table-text-color: #ffffff !important;
  --el-table-header-text-color: #ffffff !important;
}

/* 浅色模式下弹窗样式 */
html.light .task-list-page .el-dialog,
html.light .el-dialog.task-dialog {
  background: #ffffff !important;
  border: 1px solid #e4e7ed !important;
}

html.light .el-dialog__header,
html.light .el-dialog.task-dialog .el-dialog__header {
  border-bottom-color: #e4e7ed !important;
}

html.light .el-dialog__title,
html.light .task-list-page .el-dialog__title,
html.light .el-dialog.task-dialog .el-dialog__title {
  color: #303133 !important;
}

html.light .el-dialog__headerbtn .el-dialog__close,
html.light .el-dialog.task-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #606266 !important;
}

html.light .task-list-page .dialog-loading {
  color: #909399;
}

html.light .task-list-page .no-result {
  color: #909399;
}

html.light .task-list-page .batch-result .el-table {
  --el-table-bg-color: #ffffff !important;
  --el-table-tr-bg-color: #ffffff !important;
  --el-table-header-bg-color: #f5f7fa !important;
  --el-table-row-hover-bg-color: #f5f7fa !important;
  --el-table-border-color: #e4e7ed !important;
  --el-table-text-color: #303133 !important;
  --el-table-header-text-color: #606266 !important;
}
</style>

<style lang="scss" scoped>
.task-list-page {
  padding: 20px;
  background: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #000;
}

.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.filter-select {
  width: 120px;
}

.filter-date {
  width: 180px;
}

.filter-input {
  width: 200px;
}

.filter-bar .el-button {
  height: 32px;
}

.icon-btn {
  padding: 0 !important;
  width: 32px !important;
  height: 32px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff !important;
  border: 1px solid #dcdfe6 !important;
}

.icon-btn :deep(.el-icon) {
  font-size: 16px;
  color: #606266;
}

.icon-btn:hover {
  background: #2F5DFE !important;
  border-color: #2F5DFE !important;
}

.icon-btn:hover :deep(.el-icon) {
  color: #ffffff !important;
}

/* 批量删除按钮样式 */
.filter-bar .el-button--danger {
  background-color: #ffffff !important;
  border-color: #E8E8E8 !important;
  color: #303133 !important;
  height: 32px !important;
  padding: 0 12px !important;
}

.filter-bar .el-button--danger :deep(.el-icon) {
  color: #f56c6c !important;
}

.filter-bar .el-button--danger span {
  color: #303133 !important;
}

.filter-bar .el-button--danger:hover {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.filter-bar .el-button--danger:hover :deep(.el-icon),
.filter-bar .el-button--danger:hover span {
  color: #ffffff !important;
}

/* 统一输入框和日期选择器高度 */
.filter-bar .el-input__wrapper,
.filter-bar .el-select .el-input__wrapper,
.filter-bar .el-date-editor .el-input__wrapper {
  height: 32px !important;
  padding: 0 8px !important;
  box-shadow: none !important;
}

.filter-bar .el-input,
.filter-bar .el-select,
.filter-bar .el-date-editor {
  flex-shrink: 0;
}

/* 表格区域 */
.table-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-table {
  flex: 1;
}

.task-table :deep(.el-table__cell) {
  padding: 12px 0;
  color: #303133;
  font-size: 14px;
}

.task-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

.task-table :deep(.el-table-column--selection .cell) {
  text-align: center !important;
  justify-content: center !important;
}

/* 任务类型 tag 样式 */
.task-table :deep(.el-tag--primary) {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: rgba(64, 158, 255, 0.2) !important;
  color: #409eff !important;
}

.task-table :deep(.el-tag--success) {
  background-color: rgba(103, 194, 58, 0.1) !important;
  border-color: rgba(103, 194, 58, 0.2) !important;
  color: #67c23a !important;
}

.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* 状态颜色 */
.status-blue {
  color: #3751FE !important;
}

.status-blue.status-dot {
  background-color: #3751FE !important;
}

.status-yellow {
  color: #E17F00 !important;
}

.status-yellow.status-dot {
  background-color: #E17F00 !important;
}

.status-green {
  color: #00A415 !important;
}

.status-green.status-dot {
  background-color: #00A415 !important;
}

.status-red {
  color: #E30000 !important;
}

.status-red.status-dot {
  background-color: #E30000 !important;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.task-name {
  color: #333;
}

/* 任务类型标签样式 */
.type-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-single {
  display: inline-block;
  color: #2F5DFE;
  text-align: center;
  height: 20px;
  padding: 0px 12px;
  margin: 4px;
  border-radius: 4px;
  background: #E9EEFF;
  font-size: 12px;
}

.type-batch {
  display: inline-block;
  color: #2F5DFE;
  text-align: center;
  height: 20px;
  padding: 0px 10px;
  margin: 4px;
  border-radius: 4px;
  background: #E9EEFF;
  box-shadow: 4px 4px 0 #8DA7FF;
  font-size: 12px;
}

/* 分页 */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

/* 操作按钮组 - 浅色主题样式 */
.action-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 20px;
  height: 20px;
  min-width: 20px !important;
  padding: 0 !important;
  border: none !important;
  background: #ffffff !important;
  box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.1) !important;
  border-radius: 5px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn :deep(.el-icon) {
  font-size: 14px;
  color: #606266;
}

.action-btn:disabled {
  opacity: 0.5;
}

.action-btn:disabled :deep(.el-icon) {
  color: #c0c4cc;
}

.action-btn.download-btn:hover:not(:disabled) {
  background: #2F5DFE !important;
}

.action-btn.view-btn:hover:not(:disabled) {
  background: #00A415 !important;
}

.action-btn.delete-btn:hover:not(:disabled) {
  background: #E23A2D !important;
}

.action-btn:hover:not(:disabled) :deep(.el-icon) {
  color: #ffffff !important;
}

.ml0 {
  margin-left: 0;
}
</style>
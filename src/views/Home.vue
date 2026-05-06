<template>
  <div class="home-page" :class="themeStore.isDark ? 'dark' : 'light'">
    <!-- 可滚动内容区 -->
    <div class="content-scroll">
      <!-- 欢迎语 -->
      <div class="welcome-section">
        <h1 class="welcome-title">Hi, Yong</h1>
        <p class="welcome-subtitle">欢迎来到，游戏文案翻译后台界面</p>
      </div>
      <!-- 统计卡片区域 -->
      <div class="stats-section">
        <!-- 左侧统计卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon ">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-ss-wcrw"></use>
              </svg>
            </div>
            <div class="stat-number">{{ stats.completed }}</div>
            <div class="stat-label">翻译完成任务</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon ">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-ss-fyzrw"></use>
              </svg>
            </div>
            <div class="stat-number">{{ stats.translating }}</div>
            <div class="stat-label">翻译中的任务</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon ">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-ss-pdrw"></use>
              </svg>
            </div>
            <div class="stat-number">{{ stats.queueing }}</div>
            <div class="stat-label">排队中的任务</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon ">
              <svg class="icon" aria-hidden="true">
                <use xlink:href="#icon-sbrw"></use>
              </svg>
            </div>
            <div class="stat-number">{{ stats.failed }}</div>
            <div class="stat-label">翻译失败的任务</div>
          </div>
        </div>

        <!-- Tokens 消耗统计图表 -->
        <div class="chart-card token-chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Tokens 消耗统计</h3>
          </div>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot blue"></span>
              本周数据
            </span>
            <span class="legend-item">
              <span class="legend-dot orange"></span>
              上周数据
            </span>
          </div>
          <div class="chart-container" ref="tokenChartRef"></div>
          <div class="chart-labels">
            <span>周一</span>
            <span>周二</span>
            <span>周三</span>
            <span>周四</span>
            <span>周五</span>
            <span>周六</span>
            <span>周天</span>
          </div>
        </div>
      </div>

      <!-- 下方内容区 -->
      <div class="bottom-section">
        <!-- 翻译任务记录表格 -->
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">翻译任务记录</h3>
            <el-input v-model="tableSearch" placeholder="关键词查找..." class="table-search" clearable
              @keyup.enter="handleTableSearch" @clear="handleTableSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
          <el-table size="default" :data="taskList" style="width: 100%" class="task-table" v-loading="loading"
            element-loading-text="加载中...">
            <el-table-column prop="name" label="任务名称" min-width="180">
              <template #default="{ row }">
                <span class="task-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="180">
              <template #default="{ row }">
                <div class="type-center">
                  <div :class="row.type === 'single' ? 'type-single' : 'type-batch'">
                    {{ row.type === 'single' ? '单次翻译' : '批量翻译' }}
                  </div>
                </div>

              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="启动时间" width="140">
              <template #default="{ row }">
                <div class="time-cell">{{ row.startTime }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="endTime" label="完成时间" width="140">
              <template #default="{ row }">
                <div class="time-cell">{{ row.endTime }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="任务状态" width="120">
              <template #default="{ row }">
                <span class="status-badge" :class="getStatusClass(row.status)">
                  <span class="status-dot"></span>
                  {{ row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="任务 ID" width="180">
              <template #default="{ row }">
                <span class="task-id">{{ row.id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="right">
              <template #default="{ row }">
                <div class="action-btns">
                  <el-button class="action-btn download" @click="handleDownload(row)">
                    <el-icon>
                      <Download />
                    </el-icon>
                  </el-button>
                  <el-button class="action-btn view" @click="handleView(row)">
                    <el-icon>
                      <View />
                    </el-icon>
                  </el-button>
                  <el-button class="action-btn delete" @click="handleDelete(row)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页器 -->
          <div class="pagination-wrapper">
            <el-pagination :current-page="pagination.page" :page-size="pagination.size" :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" background   
              @size-change="handleSizeChange" @current-change="handlePageChange" />
          </div>
        </div>

        <!-- 右侧账户余额 -->
        <div class="balance-section">
          <div class="balance-card">
            <h3 class="balance-title">账户余额统计</h3>
            <div class="balance-chart-container">
              <div class="balance-chart" ref="balanceChartRef"></div>
              <div class="balance-center">
                <span class="balance-amount">{{ balanceData.totalBalance.toFixed(2) }}</span>
                <span class="balance-unit">总余额 (元)</span>
              </div>
            </div>
            <div class="balance-legend">
              <div class="balance-legend-item">
                <span class="legend-dot green"></span>
                <span class="legend-label">充值余额</span>
                <span class="legend-value">{{ balanceData.rechargeBalance.toFixed(2) }}</span>
              </div>
              <div class="balance-legend-item">
                <span class="legend-dot blue"></span>
                <span class="legend-label">赠送余额</span>
                <span class="legend-value">{{ balanceData.giftBalance.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看翻译结果弹窗 -->
    <el-dialog v-model="dialogVisible" title="翻译结果详情" width="800px" :close-on-click-modal="false" append-to-body
      @close="handleDialogClose" class="result-dialog">
      <div v-if="dialogLoading" class="dialog-loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="resultData.type === 'single'" class="single-result">
        <div class="result-item">
          <div class="result-label">原文</div>
          <div class="result-content">{{ resultData.originalText }}</div>
        </div>
        <div class="result-item" v-for="(item, index) in resultData.translations" :key="index">
          <div class="result-label">{{ item.language }}</div>
          <div class="result-content">{{ item.text }}</div>
        </div>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import {
  Search,
  Loading,
  Download,
  View,
  Delete
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getTranslationHistory, delTaskList, downloadRecord, getTranslationResult } from '@/api/translation'
import { getAccountInfo } from '@/api/bill'
import { ElMessage, ElMessageBox } from 'element-plus'

const themeStore = useThemeStore()
const tableSearch = ref('')
const tokenChartRef = ref(null)
const balanceChartRef = ref(null)
const loading = ref(false)

// 保存图表实例
let tokenChartInstance = null
let balanceChartInstance = null

// 统计数据
const stats = ref({
  completed: 0,    // 翻译完成
  translating: 0,  // 翻译中
  queueing: 0,     // 排队中
  failed: 0        // 翻译失败
})

// 任务列表
const taskList = ref([])

// 分页数据
const pagination = ref({
  page: 1,
  size: 10,
  total: 0
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const resultData = ref({
  type: '',  // 'single' 或 'batch'
  originalText: '',
  translations: [],
  tableData: [],
  tableColumns: []
})

// 账户余额数据
const balanceData = ref({
  rechargeBalance: 0,  // 充值余额
  giftBalance: 0,      // 赠送余额
  totalBalance: 0      // 总余额
})

// 计算统计数据
const calculateStats = (list) => {
  stats.value = {
    completed: list.filter(item => item.taskStatus === 2).length,
    translating: list.filter(item => item.taskStatus === 1).length,
    queueing: list.filter(item => item.taskStatus === 0).length,
    failed: list.filter(item => [3, 4, 5].includes(item.taskStatus)).length
  }
}

// 格式化任务类型
const formatTaskType = (type) => {
  const typeMap = {
    1: 'single',
    2: 'batch'
  }
  return typeMap[type] || 'single'
}

// 格式化任务状态
const formatTaskStatus = (status) => {
  const statusMap = {
    0: '排队中',
    1: '翻译中',
    2: '翻译完成',
    3: '翻译失败',
    4: '终止中',
    5: '已终止'
  }
  return statusMap[status] || '未知'
}

// 格式化时间
const formatTime = (dateStr) => {
  if (!dateStr) return '- -'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}\n${hours}:${minutes}:${seconds}`
}

// 处理 API 返回的任务数据
const processTaskData = (data) => {
  return data.map(item => ({
    id: item.id,
    name: item.sourceText || '- -',
    type: formatTaskType(item.taskType),
    taskType: item.taskType,
    startTime: formatTime(item.startTime),
    endTime: formatTime(item.endTime),
    status: formatTaskStatus(item.taskStatus),
    taskStatus: item.taskStatus,
    taskNum: item.taskNum
  }))
}

// 获取任务列表
const fetchTaskList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.value.page,
      size: pagination.value.size
    }
    // 添加搜索条件
    if (tableSearch.value) {
      params.taskName = tableSearch.value
    }
    const res = await getTranslationHistory(params)
    if (res && res.data) {
      const list = res.data.list || []
      taskList.value = processTaskData(list)
      pagination.value.total = res.data.total || 0
      calculateStats(list)
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理表格搜索
const handleTableSearch = () => {
  pagination.value.page = 1
  fetchTaskList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 1
  fetchTaskList()
}

// 页码改变
const handlePageChange = (page) => {
  pagination.value.page = page
  fetchTaskList()
}

// 获取账户余额
const fetchAccountInfo = async () => {
  try {
    const res = await getAccountInfo()
    if (res && res.data) {
      // 接口返回的是分，需要转换为元
      const recharge = (res.data.rechargeBalance || 0) / 100
      const gift = (res.data.giftBalance || 0) / 100
      balanceData.value = {
        rechargeBalance: recharge,
        giftBalance: gift,
        totalBalance: recharge + gift
      }
      // 更新余额图表
      updateBalanceChart()
    }
  } catch (error) {
    console.error('获取账户信息失败:', error)
  }
}

const getStatusClass = (status) => {
  const map = {
    '翻译中': 'status-translating',
    '翻译完成': 'status-completed',
    '翻译失败': 'status-failed',
    '排队中': 'status-queueing',
    '终止中': 'status-failed',
    '已终止': 'status-failed'
  }
  return map[status] || ''
}

const handleDownload = async (row) => {
  if (!row?.id) {
    ElMessage.warning('无效的任务 ID')
    return
  }
  // 任务状态 3=翻译失败，4=终止中 不可下载
  if (row.taskStatus === 3 || row.taskStatus === 4) {
    ElMessage.warning('该任务不可下载')
    return
  }
  try {
    const res = await downloadRecord(row.id)
    if (res && res.data) {
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
    ElMessage.error('下载失败，请重试')
  }
}

// 查看翻译结果
const handleView = async (row) => {
  // 任务状态 3=翻译失败，4=终止中 不可查看
  if (row.taskStatus === 3 || row.taskStatus === 4) {
    ElMessage.warning('该任务不可查看')
    return
  }

  dialogVisible.value = true
  dialogLoading.value = true
  resultData.value = {
    type: '',
    originalText: '',
    translations: [],
    tableData: [],
    tableColumns: []
  }

  try {
    const res = await getTranslationResult(row.id)
    if (res && res.code === 200 && res.data) {
      const data = res.data

      if (row.taskType === 1 || row.type === 'single') {
        // 单次翻译结果
        resultData.value.type = 'single'
        resultData.value.originalText = data.originalText || data.sourceText || ''

        // 处理翻译结果
        if (data.translations) {
          resultData.value.translations = data.translations
        } else {
          // 从其他字段解析
          const translations = []
          Object.keys(data).forEach(key => {
            if (key !== 'originalText' && key !== 'sourceText' && key !== 'id') {
              translations.push({
                language: key,
                text: data[key]
              })
            }
          })
          resultData.value.translations = translations
        }
      } else {
        // 批量翻译结果
        resultData.value.type = 'batch'

        // 处理表头
        const headers = data.tableHeaders || []
        const columns = headers.map(h => ({
          prop: h.code || h.name,
          label: h.name || h.code
        }))
        resultData.value.tableColumns = columns

        // 处理表格数据
        const records = data.records || []
        resultData.value.tableData = records.map(record => {
          const row = {}
          columns.forEach(col => {
            row[col.prop] = record[col.prop] || ''
          })
          return row
        })
      }
    } else {
      ElMessage.error(res?.msg || '获取翻译结果失败')
    }
  } catch (error) {
    console.error('获取翻译结果失败:', error)
    ElMessage.error('获取翻译结果失败')
  } finally {
    dialogLoading.value = false
  }
}

// 关闭弹窗
const handleDialogClose = () => {
  resultData.value = {
    type: '',
    originalText: '',
    translations: [],
    tableData: [],
    tableColumns: []
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await delTaskList([row.id])
    if (res && res.code === 200) {
      ElMessage.success('删除成功')
      fetchTaskList()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel') return
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

// 获取图表配置
const getChartColors = () => ({
  bgColor: themeStore.isDark ? '#151520' : '#ffffff',
  textColor: themeStore.isDark ? '#a0a0b0' : '#9ca3af',
  splitLineColor: themeStore.isDark ? '#252535' : '#f3f4f6',
  tooltipBg: themeStore.isDark ? '#1e1e2e' : '#ffffff',
  tooltipBorder: themeStore.isDark ? '#252535' : '#e5e7eb'
})

// 初始化 Tokens 消耗统计图表
const initTokenChart = () => {
  if (!tokenChartRef.value) return

  if (tokenChartInstance) {
    tokenChartInstance.dispose()
  }

  const colors = getChartColors()
  tokenChartInstance = echarts.init(tokenChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.textColor },
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#3b82f6', width: 1, type: 'dashed' }
      }
    },
    grid: {
      left: 0,
      right: 0,
      top: 20,
      bottom: 10,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周天'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: {
        lineStyle: { color: colors.splitLineColor }
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.textColor,
        fontSize: 11,
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '本周数据',
        type: 'line',
        smooth: true,
        data: [5, 8, 35, 20, 40, 5, 40],
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 0,
        emphasis: { symbolSize: 6, itemStyle: { color: '#3b82f6' } }
      },
      {
        name: '上周数据',
        type: 'line',
        smooth: true,
        data: [15, 35, 30, 50, 25, 95, 50],
        lineStyle: { color: '#fb923c', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 146, 60, 0.4)' },
            { offset: 1, color: 'rgba(251, 146, 60, 0)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 0,
        emphasis: { symbolSize: 6, itemStyle: { color: '#fb923c' } }
      }
    ]
  }

  tokenChartInstance.setOption(option)
}

// 初始化账户余额环形图
const initBalanceChart = () => {
  if (!balanceChartRef.value) return

  if (balanceChartInstance) {
    balanceChartInstance.dispose()
  }

  balanceChartInstance = echarts.init(balanceChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c}',
      backgroundColor: themeStore.isDark ? '#1e1e2e' : '#ffffff',
      borderColor: themeStore.isDark ? '#252535' : '#e5e7eb',
      textStyle: { color: themeStore.isDark ? '#a0a0b0' : '#1f2937' }
    },
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        padAngle: 2,
        itemStyle: {
          borderRadius: 8
        },
        data: [
          { value: balanceData.value.rechargeBalance, name: '充值余额', itemStyle: { color: '#22c55e' } },
          { value: balanceData.value.giftBalance, name: '赠送余额', itemStyle: { color: '#3b82f6' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  }

  balanceChartInstance.setOption(option)
}

// 更新余额图表数据
const updateBalanceChart = () => {
  if (!balanceChartInstance) return
  balanceChartInstance.setOption({
    series: [{
      data: [
        { value: balanceData.value.rechargeBalance, name: '充值余额', itemStyle: { color: '#22c55e' } },
        { value: balanceData.value.giftBalance, name: '赠送余额', itemStyle: { color: '#3b82f6' } }
      ]
    }]
  })
}

// 初始化所有图表
const initCharts = () => {
  initTokenChart()
  initBalanceChart()
}

// 响应窗口大小变化
const handleResize = () => {
  tokenChartInstance?.resize()
  balanceChartInstance?.resize()
}

// 监听主题变化，重新渲染图表
watch(() => themeStore.isDark, () => {
  nextTick(() => {
    initCharts()
  })
})

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
  window.addEventListener('resize', handleResize)
  // 获取数据
  fetchTaskList()
  fetchAccountInfo()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  tokenChartInstance?.dispose()
  balanceChartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
// SCSS 变量定义
$bg-dark: #1D1D1D;
$bg-dark-secondary: #000000;
$bg-dark-header: #000000;
$bg-light: #f5f7fa;
$bg-white: #ffffff;
$border-dark: #252535;
$border-light: #e4e7ed;
$primary: #3b82f6;
$text-dark: #ffffff;
$text-dark-secondary: #ffffff;
$text-dark-muted: #909090;
$text-light: #303133;
$text-light-secondary: #606266;
$text-light-muted: #9ca3af;

.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $bg-dark;

  .content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    > * {
      flex-shrink: 0;
    }
  }

  .welcome-section {
    flex-shrink: 0;
    margin-bottom: 4px;
  }

  .welcome-title {
    font-size: 18px;
    font-weight: 700;
    color: $text-dark;
    margin-bottom: 2px;
  }

  .welcome-subtitle {
    font-size: 12px;
    color: $text-dark-muted;
  }

  .stats-section {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 12px;
    flex-shrink: 0;

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;

      .stat-card {
        background: var(--card-bg, #000000);
        border: 1px solid var(--card-border, $border-dark);
        padding: 12px;
        cursor: pointer;
        transition: transform 0.2s;
        height: 100%;
        position: relative;
        z-index: 2;
        overflow: hidden;

        &:hover {
          transform: translateY(-2px);
        }

        // 翻译完成任务 - 左上角圆角
        &:nth-child(1) {
          border-radius: 10px 0 0 0;
        }

        // 翻译中的任务 - 右上角圆角
        &:nth-child(2) {
          border-radius: 0 10px 0 0;
          margin-left: -1px;
        }

        // 排队中的任务 - 左下角圆角
        &:nth-child(3) {
          border-radius: 0 0 0 10px;
          margin-top: -1px;
        }

        // 翻译失败的任务 - 右下角圆角
        &:nth-child(4) {
          border-radius: 0 0 10px 0;
          margin-left: -1px;
          margin-top: -1px;
        }
      }
    }

    .stat-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 14px;
      background: #1D1D1D;
    }

    .stat-number {
      font-size: 20px;
      font-weight: 700;
      color: $text-dark;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 12px;
      color: $text-dark-muted;
    }
  }

  .chart-card {
    background: #000000;
    border: 1px solid $border-dark;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 2;

    .chart-container {
      flex: 1;
      min-height: 0;
      height: 100px;
    }
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    margin-bottom: 4px;
  }

  .chart-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-dark;
  }

  .chart-legend {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: $text-dark-secondary;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.blue {
      background: #3b82f6;
    }

    &.orange {
      background: #fb923c;
    }

    &.green {
      background: #22c55e;
    }
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 8px;
    font-size: 12px;
    color: $text-dark-muted;
    flex-shrink: 0;
  }

  .bottom-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 12px;
    height: 55vh;
    flex-shrink: 0;
  }

  .table-card {
    background: #000000;
    border: 1px solid $border-dark;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 1;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid $border-dark;
      flex-shrink: 0;
    }

    .table-title {
      font-size: 13px;
      font-weight: 600;
      color: $text-dark;
    }

    .task-table {
      flex: 1;
      min-height: 0;
      overflow: hidden;

      :deep(.el-table__body tr) {
        height: 36px;
      }

      :deep(.el-table__cell) {
        padding: 6px 0;
        font-size: 13px;
      }

      :deep(.el-table) {
        max-height: 100%;
      }

      :deep(.el-table__body-wrapper) {
        overflow: hidden;
      }
    }

    .pagination-wrapper {
      padding: 6px 10px;
      flex-shrink: 0;
    }
  }

  .table-search {
    width: 160px;

    :deep(.el-input__wrapper) {
      background: $bg-dark-secondary;
      border: 1px solid $border-dark;
      box-shadow: none;
      border-radius: 6px;
      height: 28px;
    }

    :deep(.el-input__inner) {
      color: $text-dark;
      font-size: 12px;
    }
  }

  .task-table {
    :deep(.el-table__row td) {
      padding: 4px 0;
    }

    :deep(.el-table__header th) {
      text-align: center;
      background-color: #383838 !important;
      border-bottom: 1px solid $border-dark !important;
      font-size: 13px;
      color: $text-dark;
    }

    :deep(.el-table__footer-wrapper td) {
      border-top: 1px solid $border-dark !important;
    }

    :deep(.el-table__body tr) {
      background-color: #000000 !important;
      height: 36px;
    }

    :deep(td.el-table__cell) {
      background-color: transparent !important;
      border-bottom: 1px solid $border-dark !important;
      font-size: 13px;
    }

    :deep(.el-table--border::after),
    :deep(.el-table--border::before),
    :deep(.el-table--border .el-table__inner-wrapper::after),
    :deep(.el-table__inner-wrapper::before) {
      background-color: $border-dark !important;
    }

    :deep(.el-loading-mask) {
      background-color: rgba(21, 21, 32, 0.8);
    }

    :deep(.el-loading-spinner .circular) {
      stroke: $primary;
    }

    :deep(.el-loading-spinner .el-loading-text) {
      color: $text-dark-secondary;
    }
  }

  .task-name {
    font-weight: 500;
    font-size: 14px;
    color: $text-dark;
  }

  .type-center {
    display: flex;
    align-items: center;
    justify-content: center;

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
  }


  .time-cell {
    font-size: 12px;
    line-height: 1.4;
    color: $text-dark-secondary;
    text-align: center;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 500;
  }

  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .status-translating {
    color: $text-dark-secondary;

    .status-dot {
      background: #2F82FE;
      animation: pulse 1.5s infinite;
    }
  }

  .status-queueing {
    color: $text-dark-secondary;

    .status-dot {
      background: #f97316;
    }
  }

  .status-completed {
    color: $text-dark-secondary;

    .status-dot {
      background: #00A415;
    }
  }

  .status-failed {
    color: $text-dark-secondary;

    .status-dot {
      background: #E23A2D;
    }
  }

  @keyframes pulse {

    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  .task-id {
    font-family: monospace;
    font-size: 14px;
    color: $text-dark-secondary;
    text-align: center;
  }

  .action-btns {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: #FAFAFB;
    color: $text-dark-muted;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #fff;
    }

    &.download:hover {
      background: #00A415;
    }

    &.view:hover {
      background: #2F5DFE;
    }

    &.delete:hover {
      background: #E23A2D;
    }
  }

  .pagination-wrapper {
    padding: 8px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid $border-dark;
    flex-shrink: 0;

    :deep(.el-pagination) {
      --el-pagination-bg-color: transparent;
      --el-pagination-button-bg-color: #1e1e2e;
      --el-pagination-hover-color: #3b82f6;
      --el-pagination-button-color: #a0a0b0;
      --el-pagination-page-color: #a0a0b0;
      font-size: 12px;
    }

    :deep(.el-pagination .el-pager li) {
      background: $bg-dark-secondary;
      color: $text-dark-secondary;
      border: 1px solid $border-dark;
      margin: 0 2px;
      border-radius: 4px;
      height: 24px;
      min-width: 24px;
      font-size: 12px;

      &:hover {
        color: $primary;
        border-color: $primary;
      }

      &.is-active {
        background: $primary;
        color: #fff;
        border-color: $primary;
      }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
      background: $bg-dark-secondary;
      color: $text-dark-secondary;
      border: 1px solid $border-dark;
      border-radius: 4px;
      padding: 0 8px;
      height: 24px;
      font-size: 12px;

      &:hover {
        color: $primary;
        border-color: $primary;
      }
    }

    :deep(.el-pagination .el-select .el-input__wrapper) {
      background: $bg-dark-secondary;
      border-color: $border-dark;
    }

    :deep(.el-pagination .el-select .el-input__inner) {
      color: $text-dark-secondary;
    }

    :deep(.el-pagination__total),
    :deep(.el-pagination__jump) {
      color: $text-dark-secondary;
    }

    :deep(.el-pagination__editor .el-input__wrapper) {
      background: $bg-dark-secondary;
      border-color: $border-dark;
    }

    :deep(.el-pagination__editor .el-input__inner) {
      color: $text-dark-secondary;
    }
  }

  .balance-section {
    display: flex;
  }

  .balance-card {
    background: #000000;
    border: 1px solid $border-dark;
    border-radius: 10px;
    padding: 12px;
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .balance-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-dark;
    margin-bottom: 8px;
  }

  .balance-chart-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 180px;
    min-height: 0;
  }

  .balance-chart {
    width: 100%;
    height: 100%;
  }

  .balance-center {
    position: absolute;
    text-align: center;
  }

  .balance-amount {
    font-size: 32px;
    font-weight: 700;
    color: $text-dark;
  }

  .balance-unit {
    display: block;
    font-size: 13px;
    color: $text-dark-muted;
    margin-top: 4px;
  }

  .balance-legend {
    margin-top: 8px;
  }

  .balance-legend-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .legend-label {
    color: $text-dark-secondary;
    flex: 1;
    margin-left: 10px;
  }

  .legend-value {
    font-weight: 600;
    color: $text-dark;
  }

  // 浅色主题
  &.light {
    background: $bg-light;

    .welcome-title {
      color: $text-light;
    }

    .welcome-subtitle {
      color: $text-light-muted;
    }

    .stats-cards .stat-card {
      background: $bg-white;
      border-color: $border-light;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .stat-card {
      background: $bg-white;
      border-color: $border-light;
    }

    .stat-number {
      color: $text-light;
    }

    .stat-label {
      color: $text-light-muted;
    }

    .stat-icon {
      background: rgba(0, 0, 0, 0.05);
    }

    .chart-card {
      background: $bg-white;
      border-color: $border-light;
    }

    .chart-title {
      color: $text-light;
    }

    .chart-legend {
      color: $text-light-muted;
    }

    .chart-labels {
      color: $text-light-muted;
    }

    .legend-item {
      color: #000;
    }

    .table-card {
      background: $bg-white;
      border-color: $border-light;
    }

    .table-header {
      border-bottom-color: $border-light;
    }

    .table-title {
      color: $text-light;
    }

    .table-search {
      :deep(.el-input__wrapper) {
        background: $bg-light;
        border-color: $border-light;
      }

      :deep(.el-input__inner) {
        color: $text-light;
      }
    }

    .task-table {
      --el-table-bg-color: #ffffff !important;
      --el-table-tr-bg-color: #ffffff !important;
      --el-table-header-bg-color: #f5f7fa !important;
      --el-table-row-hover-bg-color: #f5f7fa !important;
      --el-table-border-color: #e4e7ed !important;
      --el-table-text-color: #303133 !important;
      --el-table-header-text-color: #606266 !important;

      :deep(.el-table__body tr) {
        background-color: #ffffff !important;

        &:hover>td {
          background-color: #f5f7fa !important;
        }
      }

      :deep(.el-table__body td) {
        color: #303133 !important;
      }

      :deep(.el-table__header th) {
        background-color: #f5f7fa !important;
        border-bottom: 1px solid $border-light !important;
        text-align: center !important;
        color: #606266 !important;
      }

      :deep(.el-table__footer-wrapper td) {
        border-top: 1px solid $border-light !important;
      }

      :deep(td.el-table__cell) {
        background-color: transparent !important;
        border-bottom: 1px solid $border-light !important;
      }

      :deep(.el-table--border::after),
      :deep(.el-table--border::before),
      :deep(.el-table--border .el-table__inner-wrapper::after),
      :deep(.el-table__inner-wrapper::before) {
        background-color: $border-light !important;
      }

      :deep(.el-loading-mask) {
        background-color: rgba(255, 255, 255, 0.8);
      }
    }

    .task-name {
      color: #000000;
    }

    .task-id {
      color: #000000;
    }

    .time-cell {
      color: #606266;
    }

    .status-badge {
      color: #000000;
    }

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

    .action-btn {
      background: #FAFAFB;
    }

    .balance-card {
      background: $bg-white;
      border-color: $border-light;
    }

    .balance-title {
      color: $text-light;
    }

    .balance-amount {
      color: $text-light;
    }

    .balance-unit {
      color: $text-light-muted;
    }

    .legend-label {
      color: $text-light-secondary;
    }

    .legend-value {
      color: $text-light;
    }

    .pagination-wrapper {
      border-top-color: $border-light;

      :deep(.el-pagination .el-pager li) {
        background: $bg-light;
        color: $text-light-secondary;
        border-color: $border-light;

        &:hover {
          color: $primary;
          border-color: $primary;
        }

        &.is-active {
          background: $primary;
          color: #fff;
          border-color: $primary;
        }
      }

      :deep(.btn-prev),
      :deep(.btn-next) {
        background: $bg-light;
        color: $text-light-secondary;
        border-color: $border-light;

        &:hover {
          color: $primary;
          border-color: $primary;
        }
      }

      :deep(.el-pagination .el-select .el-input__wrapper) {
        background: $bg-light;
        border-color: $border-light;
      }

      :deep(.el-pagination .el-select .el-input__inner) {
        color: $text-light-secondary;
      }

      :deep(.el-pagination__total),
      :deep(.el-pagination__jump) {
        color: $text-light-secondary;
      }

      :deep(.el-pagination__editor .el-input__wrapper) {
        background: $bg-light;
        border-color: $border-light;
      }

      :deep(.el-pagination__editor .el-input__inner) {
        color: $text-light-secondary;
      }
    }
  }
}
</style>

<style lang="scss">
/* 深色模式下弹窗样式（默认） */
.result-dialog .el-dialog {
  background: #101010 !important;
  border: 1px solid #252535;
  border-radius: 12px;
}

.result-dialog .el-dialog__header {
  border-bottom: 1px solid #252535;
  padding: 16px 20px;
}

.result-dialog .el-dialog__title {
  color: #ffffff !important;
  font-weight: 600;
}

.result-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #a0a0b0;

  &:hover {
    color: #3b82f6;
  }
}

.result-dialog .el-dialog__body {
  padding: 20px;
  color: #ffffff !important;
}

.result-dialog .dialog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #a0a0b0;
  gap: 12px;

  .el-icon {
    font-size: 32px;
    color: #3b82f6;
  }
}

.result-dialog .single-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-dialog .result-item {
  background: #101010 !important;
  border: 1px solid #252535;
  border-radius: 8px;
  padding: 12px 16px;
}

.result-dialog .result-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.result-dialog .result-content {
  font-size: 14px;
  color: #ffffff !important;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-dialog .batch-result .el-table {
  --el-table-bg-color: #101010 !important;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #101010 !important;
  --el-table-row-hover-bg-color: #1a1a1a;
  --el-table-border-color: #252535;
  --el-table-text-color: #ffffff !important;
  --el-table-header-text-color: #ffffff !important;
}

.result-dialog .no-result {
  text-align: center;
  padding: 40px;
  color: #6b6b7b;
}

/* 浅色模式下弹窗样式 */
.light .result-dialog .el-dialog {
  background: #ffffff !important;
  border-color: #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.light .result-dialog .el-dialog__header {
  border-bottom-color: #e4e7ed;
}

.light .result-dialog .el-dialog__title {
  color: #303133 !important;
}

.light .result-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #606266;

  &:hover {
    color: #3b82f6;
  }
}

.light .result-dialog .el-dialog__body {
  color: #303133 !important;
}

.light .result-dialog .dialog-loading {
  color: #909399;

  .el-icon {
    color: #3b82f6;
  }
}

.light .result-dialog .result-item {
  background: #ffffff !important;
  border: 1px solid #e4e7ed;
}

.light .result-dialog .result-label {
  color: #909399;
}

.light .result-dialog .result-content {
  color: #303133 !important;
}

.light .result-dialog .batch-result .el-table {
  --el-table-bg-color: #ffffff !important;
  --el-table-tr-bg-color: #ffffff !important;
  --el-table-header-bg-color: #f5f7fa !important;
  --el-table-row-hover-bg-color: #f5f7fa !important;
  --el-table-border-color: #e4e7ed !important;
  --el-table-text-color: #303133 !important;
  --el-table-header-text-color: #606266 !important;
}

.light .result-dialog .no-result {
  color: #909399;
}
</style>

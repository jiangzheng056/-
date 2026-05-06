<template>
  <div class="usage-page">
    <!-- 标题 -->
    <h2 class="page-title">账单列表</h2>

    <!-- 账单查询 -->
    <div class="query-section">
      <div class="query-bar">
        <span class="query-label">账单查询</span>
        <el-date-picker
          v-model="queryMonth"
          type="month"
          placeholder="选择月份"
          class="query-date"
          value-format="YYYY-MM"
          clearable
        />
        <el-button type="primary" @click="handleQuery">查询</el-button>
      </div>
    </div>

    <!-- 账单表格 -->
    <div class="table-section">
      <el-table :data="billList" class="bill-table" v-loading="loading" element-loading-text="加载中..." :cell-style="{ textAlign: 'center' }" :header-cell-style="{ textAlign: 'center' }">
        <template #empty>
          <div class="empty-text">暂无数据</div>
        </template>
        <el-table-column prop="billTime" label="账期" width="120">
          <template #default="{ row }">
            <span>{{ formatBillTime(row.billTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="useAmount" label="消费总额(元)" width="160">
          <template #default="{ row }">
            <span class="consumption-value">-{{ formatAmount(row.useAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="surplusAmount" label="余额(元)" width="160">
          <template #default="{ row }">
            <span>{{ formatAmount(row.surplusAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="useToken" label="token用量" min-width="180">
          <template #default="{ row }">
            <span>{{ formatToken(row.useToken) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-tooltip content="查看详情" placement="top">
              <el-button
                type="primary"
                  
                circle
                @click="viewDetail(row)"
              >
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="total-text">共 {{ total }} 条</span>
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[12, 20, 50, 100]"
          :total="total"
          layout="sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import { getBillList } from '@/api/bill'

// 查询月份
const queryMonth = ref('')

// 账单列表数据
const billList = ref([])

// 分页
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 加载状态
const loading = ref(false)

// 获取账单列表
const fetchBillList = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (queryMonth.value) {
      params.billTime = queryMonth.value
    }
    const res = await getBillList(params)
    if (res && res.data) {
      billList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取账单列表失败:', error)
    ElMessage.error('获取账单列表失败')
  } finally {
    loading.value = false
  }
}

// 查询操作
const handleQuery = () => {
  currentPage.value = 1
  fetchBillList()
}

// 查看详情
const viewDetail = (row) => {
  ElMessage.info(`查看账期 ${formatBillTime(row.billTime)} 的详情`)
}

// 格式化账期
const formatBillTime = (time) => {
  if (!time) return '- -'
  return time.substring(0, 7)
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '- -'
  const num = Number(amount)
  if (isNaN(num)) return '- -'
  return num === 0 ? '0.00' : (num / 100).toFixed(4)
}

// 格式化Token用量
const formatToken = (token) => {
  if (!token && token !== 0) return '- -'
  return Number(token).toLocaleString()
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchBillList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchBillList()
}

// 初始化
onMounted(() => {
  fetchBillList()
})
</script>

<style lang="scss">
/* 非 scoped 样式 - 深色主题覆盖 */
html.dark .usage-page {
  background: #1D1D1D;

  .page-title {
    color: #ffffff;
    border-bottom-color: #000000;
  }

  .query-section,
  .table-section {
    background: #000000;
    border: 1px solid #252535;
  }

  .query-label {
    color: #909399;
  }

  .query-date {
    :deep(.el-input__wrapper) {
      background-color: #1e1e2e !important;
      border-color: #252535 !important;
    }

    :deep(.el-input__inner) {
      color: #ffffff !important;
    }

    :deep(.el-input__inner::placeholder) {
      color: #6b6b7b !important;
    }
  }

  .bill-table {
    :deep(.el-table__cell) {
      background-color: transparent !important;
      border-bottom-color: #252535;
    }

    :deep(th.el-table__cell) {
      background: #383838 !important;
      color: #ffffff !important;
      text-align: center;
    }
  }

  /* 覆盖 scoped 样式的表格内容字体颜色 */
  .bill-table .el-table__cell {
    color: #ffffff !important;
  }

  .bill-table .el-table__body .cell {
    color: #ffffff !important;
  }

  .consumption-value {
    color: #f56c6c;
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

    .total-text {
      color: #909399;
    }
  }
}

/* 浅色主题覆盖 */
html.light .usage-page {
  .bill-table {
    :deep(th.el-table__cell) {
      background: #f5f7fa !important;
      color: var(--el-table-header-text-color) !important;
      text-align: center !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.usage-page {
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
  padding-bottom: 4px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
  flex-shrink: 0;
}

/* 查询区域 */
.query-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.query-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-label {
  font-size: 14px;
  color: #606266;
}

.query-date {
  width: 150px;
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

.bill-table {
  flex: 1;
}

.bill-table :deep(.el-table__cell) {
  padding: 12px 0;
  color: #303133;
  font-size: 14px;
}

.bill-table :deep(th.el-table__cell) {
  background: #f5f7fa !important;
  color: #606266 !important;
  text-align: center !important;
}

.consumption-value {
  color: #f56c6c;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 分页 */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.total-text {
  font-size: 13px;
  color: #909399;
}
</style>
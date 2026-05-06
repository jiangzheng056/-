<template>
  <div class="billing-page">
    <h2 class="page-title">账单管理</h2>

    <!-- 余额概览区域 -->
    <div class="balance-overview">
      <!-- 账户总余额 -->
      <div class="balance-card-zye">
        <div class="balance-title">
          <div class="balance-icon orange">
            <img src="@/assets/img/zye.png" alt="">
          </div>
          <p class="balance-label">账户总余额</p>
        </div>
        <div class="balance-info">
          <div class="balance-value">
            <div class="balance-number">{{ formatAmount(totalBalance) }}</div>
            <div class="balance-unit">/ 元</div>
          </div>
          <div class="tonkens-info">
            <div class="balance-tip">TokenS  </div>
            <div class="token-count">
             ≈ {{ tokenCount.toLocaleString() }}
            </div>
          </div>

        </div>
      </div>

      <!-- 充值余额 -->
      <div class="balance-card-czye">
       <div class="balance-title">
          <div class="balance-icon orange">
            <img src="@/assets/img/czye.png" alt="">
          </div>
          <p class="balance-label">充值余额</p>
        </div>
        <div class="balance-info">
          <div class="balance-value">
            <div class="balance-number">{{ formatAmount(rechargeBalance) }}</div>
            <div class="balance-unit">/ 元</div>
          </div>
        </div>
      </div>

      <!-- 赠送余额 -->
      <div class="balance-card-zsye">
       <div class="balance-title">
          <div class="balance-icon orange">
            <img src="@/assets/img/czye.png" alt="">
          </div>
          <p class="balance-label">赠送余额</p>
        </div>
        <div class="balance-info">
          <div class="balance-value">
            <div class="balance-number">{{ formatAmount(giftBalance) }}</div>
            <div class="balance-unit">/ 元</div>
          </div>
        </div>
      </div>

      <!-- 最近使用情况图表 -->
      <div class="balance-card-syqk chart-card">
        <div class="chart-header">
          <p class="chart-label">最近使用情况</p>
          <span class="chart-range">近 7 天</span>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 在线充值区域 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">在线充值</h3>
      </div>
      <div class="recharge-amounts">
        <el-button v-for="amount in rechargeAmounts" :key="amount"
          :type="!isCustomAmount && selectedAmount === amount ? 'primary' : 'default'" @click="selectAmount(amount)">
          {{ amount }}元
        </el-button>
        <el-button :type="isCustomAmount ? 'primary' : 'default'" @click="selectCustomAmount">其它金额</el-button>
      </div>
      <div class="custom-amount-wrapper" v-if="isCustomAmount">
        <el-input v-model="customAmount" placeholder="请输入自定义金额" class="custom-input" />
        <el-button type="primary" @click="confirmRecharge" class="confirm-btn">确认下一步</el-button>
      </div>
      <div class="confirm-wrapper" v-else>
        <el-button type="primary" @click="confirmRecharge" class="confirm-btn">确认下一步</el-button>
      </div>
      <p class="recharge-tip">注：暂时不支持在线支付，请联系项目管理员进行储值</p>
    </div>

    <!-- 确认订单区域 -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">确认订单</h3>
      </div>
      <div class="order-info">
        <div class="order-header">
          <div class="order-user">
            <el-avatar :size="40" :src="avatarUrl" />
            <div class="user-info">
              <p class="user-name">yongliu</p>
              <p class="user-company">成都埼玉网络科技有限公司</p>
            </div>
          </div>
          <div class="order-meta">
            <p>下单时间: 2026.03.10 15:31:23</p>
            <p>订单编号: 132456131346513</p>
          </div>
        </div>
        <el-divider />
        <div class="order-details">
          <div class="order-row">
            <span class="order-label">产品名称</span>
            <span class="order-value">tokensky充值</span>
          </div>
          <div class="order-row">
            <span class="order-label">订单总额</span>
            <span class="order-value">¥100.00</span>
          </div>
          <div class="order-row">
            <span class="order-label">价值tokens</span>
            <span class="order-value">10,000,000</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付方式区域 -->
    <div class="section-card-bottom">
      <div class="section-header">
        <h3 class="section-title">支付方式</h3>
      </div>
      <div class="payment-content">
        <!-- 扫码支付 -->
        <div class="payment-qr">
          <div class="qr-code">
            <el-icon :size="80">
              <Grid />
            </el-icon>
          </div>
          <div class="qr-info">
            <p class="qr-amount">应付金额 <span class="price">¥100.00</span></p>
            <div class="pay-icons">
              <el-icon class="pay-icon wechat">
                <ChatDotRound />
              </el-icon>
              <el-icon class="pay-icon alipay">
                <Wallet />
              </el-icon>
              <span class="pay-text">支持微信, 支付宝扫码支付</span>
            </div>
            <p class="qr-deadline">请您在 16:00 前完成支付, 到时间后订单将自动取消。</p>
          </div>
        </div>

        <!-- 对公支付 -->
        <div class="payment-company">
          <div class="company-header">
            <el-icon class="company-icon">
              <Document />
            </el-icon>
            <span class="company-title">对公支付</span>
          </div>
          <p class="company-desc">获取对公支付详情信息, 支付完成后我们会尽快确认到账并开通服务</p>
          <el-button @click="showCompanyPayInfo">我要对公支付</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Promotion, Present, Grid, ChatDotRound, Wallet, Document } from '@element-plus/icons-vue'
import { getAccountInfo } from '@/api/bill'
import * as echarts from 'echarts'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 余额数据
const totalBalance = ref(0)
const rechargeBalance = ref(0)
const giftBalance = ref(0)
const avatarUrl = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')
const chartRef = ref(null)
const chartInstance = ref(null)

// 获取图表颜色配置
const getChartColors = () => ({
  bgColor: themeStore.isDark ? '#151520' : '#ffffff',
  textColor: themeStore.isDark ? '#a0a0b0' : '#9ca3af',
  splitLineColor: themeStore.isDark ? '#252535' : '#f3f4f6',
  tooltipBg: themeStore.isDark ? '#1e1e2e' : '#ffffff',
  tooltipBorder: themeStore.isDark ? '#252535' : '#e5e7eb'
})

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '- -'
  const num = Number(amount)
  if (isNaN(num)) return '- -'
  return num === 0 ? '0' : (num / 100).toFixed(2)
}

// 计算Token数量（假设1元=10万tokens）
const tokenCount = computed(() => {
  return Math.floor(totalBalance.value / 100 * 100000)
})

// 获取账户信息
const fetchAccountInfo = async () => {
  try {
    const res = await getAccountInfo()
    if (res && res.data) {
      rechargeBalance.value = res.data.rechargeBalance || 0
      giftBalance.value = res.data.giftBalance || 0
      totalBalance.value = rechargeBalance.value + giftBalance.value
    }
  } catch (error) {
    console.error('获取账户信息失败:', error)
  }
}

// 充值金额
const rechargeAmounts = ref([10, 50, 100, 1000, 2000, 5000])
const selectedAmount = ref(100)
const isCustomAmount = ref(false)
const customAmount = ref('')
const payMethod = ref(1) // 1=微信，2=支付宝，3=对公

// 选择预设金额
const selectAmount = (amount) => {
  isCustomAmount.value = false
  selectedAmount.value = amount
}

// 选择自定义金额
const selectCustomAmount = () => {
  isCustomAmount.value = true
  customAmount.value = ''
}

// 确认充值
const confirmRecharge = () => {
  const amount = isCustomAmount.value ? customAmount.value : selectedAmount.value
  if (!amount || Number(amount) <= 0) {
    ElMessage.warning('请输入有效的充值金额')
    return
  }
  ElMessage.success(`确认充值 ¥${amount}`)
}

// 对公支付
const showCompanyPayInfo = () => {
  ElMessage.info('显示对公支付账户信息弹窗')
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  const colors = getChartColors()
  chartInstance.value = echarts.init(chartRef.value)

  // 模拟近 7 天的 Token 消耗数据（单位：tokens）
  const chartData = [5000000, 2000000, 18000000, 4000000, 6000000, 2500000, 3500000]
  const dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周天']

  const option = {
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.textColor, fontSize: 13 },
      formatter: (params) => {
        const value = params.value
        let displayValue
        if (value >= 100000000) {
          displayValue = (value / 100000000).toFixed(2) + '亿'
        } else if (value >= 10000) {
          displayValue = (value / 10000).toFixed(2) + 'w'
        } else {
          displayValue = value
        }
        return `${params.name}<br/>消耗：${displayValue} tokens`
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      top: '15%',
      bottom: '20%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: colors.textColor,
        fontSize: 12,
        margin: 4
      }
    },
    yAxis: {
      type: 'value',
      show: false,
      splitLine: {
        show: false
      }
    },
    series: [
      {
        name: 'Token 消耗',
        type: 'bar',
        barWidth: '35%',
        barCategoryGap: '15%',
        data: chartData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.3)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  chartInstance.value.setOption(option)
}

// 初始化
onMounted(() => {
  fetchAccountInfo()
  nextTick(() => {
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})

// 响应窗口大小变化
const handleResize = () => {
  chartInstance.value?.resize()
}

// 监听主题变化，重新渲染图表
watch(() => themeStore.isDark, () => {
  nextTick(() => {
    initChart()
  })
})
</script>

<style lang="scss">
/* 非 scoped 样式 - 深色主题覆盖 */
html.dark .billing-page {
  background: #1D1D1D;

  .page-title {
    color: #ffffff;
  }

  .balance-card-zye,
  .balance-card-czye,
  .balance-card-zsye,
  .balance-card-syqk,
  .section-card,
  .section-card-bottom {
    background: #000000;
    border: 1px solid #252535;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  .section-card-bottom .section-title {
    color: #ffffff;
  }

  .payment-content {
    border-color: #252535;
  }

  .qr-code {
    border-color: #252535;
    background: #1e1e2e;
  }

  .qr-amount {
    color: #ffffff;

    .price {
      color: #f56c6c;
    }
  }

  .pay-text {
    color: #909399;
  }

  .pay-icon.wechat {
    color: #67c23a;
  }

  .pay-icon.alipay {
    color: #409eff;
  }

  .company-icon {
    color: #3b82f6;
  }

  .company-title {
    color: #ffffff;
  }

  .company-desc {
    color: #909399;
  }

  .section-card-bottom .el-button {
    background: #1e1e2e;
    border-color: #252535;
    color: #ffffff;

    &:hover {
      background: #252535;
      border-color: #3b82f6;
      color: #3b82f6;
    }
  }

  

  .balance-label,
  .balance-unit,
  .chart-label,
  .user-company,
  .order-meta,
  .order-label,
  .recharge-tip,
  .pay-text,
  .qr-deadline,
  .company-desc {
    color: #909399;
  }

  .balance-number,
  .user-name,
  .order-value,
  .section-title,
  .company-title,
  .qr-amount {
    color: #ffffff;
  }

  .balance-tip,
  .chart-range,
  .section-step,
  .qr-amount .price {
    color: #c0c4cc;
  }

  .chart-card {
    background: #000000;
  }

  .chart-container {
    height: 100px;
  }

  .chart-labels {
    color: #a0a0b0;
  }

  .order-info {
    border-color: #252535;
  }
}
</style>

<style lang="scss" scoped>
.billing-page {
  padding: 20px;
  background: #f5f7fa;
  height: 100%;
  overflow-y: auto;
}

/* 余额概览 */
.balance-overview {
  margin-top: 10px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 16px;
  flex-wrap: wrap;
}

.balance-card-zye {
  width: 25%;
  min-width: 350px;
  height: 150px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.balance-card-czye {
  min-width: 280px;
  height: 150px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
.balance-card-zsye {
  min-width: 280px;
  height: 150px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
.balance-card-syqk {
  flex: 1;
  min-width: 200px;
  height: 150px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.balance-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.balance-icon .el-icon {
  font-size: 24px;
}

.balance-title {
  text-align: center;
}

.balance-icon {
  width: 60px;
  height: 60px;

  img {
    width: 100%;
    height: 100%;
  }
}

.balance-icon.blue {
  background: #e6f7ff;
  color: #1890ff;
}

.balance-icon.green {
  background: #f6ffed;
  color: #52c41a;
}

.balance-label {
  font-size: 13px;
  color: #909399;
  margin: 0 0 4px 0;
}

.balance-value {
  align-items: baseline;
  gap: 4px;
}

.balance-number {
  font-size: 28px;
  font-weight: 800;
  color: #303133;
}

.balance-unit {
  font-size: 13px;
  color: #909399;
}

.balance-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin: 4px 0 0 0;
}

.chart-card {
  flex-direction: column;
  align-items: stretch;
  padding: 12px;
  box-sizing: border-box;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.chart-label {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.chart-range {
  font-size: 12px;
  color: #c0c4cc;
}

.chart-container {
  width: 100%;
  height: calc(100% - 20px);
  flex: 1;
}

/* 区块卡片 */
.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 10px;
}

.section-card-bottom {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.balance-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 120px);

  .tonkens-info {
    .balance-tip {
      font-size: 14px;
      font-weight: bold;
      color: #FEA333;
    }

    .token-count {
      font-size: 12px;
    }
  }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 2px solid #409eff;
}

.section-step {
  font-size: 12px;
  color: #c0c4cc;
}

/* 充值 */
.recharge-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;

  .el-button {
    height: 32px;
  }
}

.custom-amount-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  .custom-input {
    width: 200px;
    height: 32px;

    :deep(.el-input__wrapper) {
      height: 32px;
    }

    :deep(.el-input__inner) {
      height: 32px;
      line-height: 32px;
    }
  }
}

.confirm-wrapper {
  margin-bottom: 12px;
}

.confirm-btn {
  height: 32px;
}

.recharge-tip {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 0 0;
}

/* 订单信息 */
.order-info {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
}

.user-company {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.order-meta {
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.order-meta p {
  margin: 0 0 4px 0;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.order-row {
  display: flex;
  justify-content: space-between;
}

.order-label {
  font-size: 13px;
  color: #909399;
}

.order-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

/* 支付方式 */
.payment-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.payment-qr {
  display: flex;
  gap: 16px;
}

.qr-code {
  width: 100px;
  height: 100px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #303133;
  flex-shrink: 0;
}

.qr-amount {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #303133;
}

.qr-amount .price {
  color: #f56c6c;
  font-weight: 600;
}

.pay-icons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pay-icon {
  font-size: 20px;
}

.pay-icon.wechat {
  color: #67c23a;
}

.pay-icon.alipay {
  color: #409eff;
}

.pay-text {
  font-size: 12px;
  color: #909399;
}

.qr-deadline {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.payment-company {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.company-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.company-icon {
  color: #409eff;
  font-size: 18px;
}

.company-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.company-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 12px 0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .balance-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .payment-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .balance-overview {
    grid-template-columns: 1fr;
  }

  .order-details {
    grid-template-columns: 1fr;
  }
}
</style>
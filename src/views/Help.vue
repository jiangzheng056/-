<template>
  <div class="page-container">
    <h1 class="page-title">帮助中心</h1>
    <div class="placeholder-content">
      <p>帮助中心页面开发中...</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss">
/* 非 scoped 样式 - 深色主题覆盖 */
html.dark .page-container {
  background: #1D1D1D;

  .page-title {
    color: #ffffff;
  }

  .placeholder-content {
    background: #000000;
    border: 1px solid #252535;
  }
}
</style>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin-bottom: 16px;
}

.placeholder-content {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  color: #909399;
}
</style>
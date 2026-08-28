<template>
  <div class="dashboard-container">
    <!-- 欢迎栏 -->
    <el-card shadow="never" class="welcome-card mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <el-avatar :size="56" icon="UserFilled" class="bg-primary text-white" />
          <div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">
              您好，{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}，祝您开心每一天！
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              所属部门：{{ userStore.userInfo?.dept?.deptName || '集团总部' }} | 当前角色：{{ userStore.roles.join(', ') || '超级管理员' }}
            </p>
          </div>
        </div>
        <div class="flex gap-6 text-right">
          <div>
            <div class="text-xs text-gray-400">系统环境</div>
            <div class="text-lg font-semibold text-gray-700 dark:text-gray-200">NestJS + Vue3</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">权限引擎</div>
            <div class="text-lg font-semibold text-primary">CASL Ability</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 指标卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">系统用户</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">128</div>
          </div>
          <div class="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <el-icon :size="24"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">角色权限</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">8</div>
          </div>
          <div class="p-3 bg-green-50 text-green-500 rounded-xl">
            <el-icon :size="24"><Avatar /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">功能菜单</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">46</div>
          </div>
          <div class="p-3 bg-purple-50 text-purple-500 rounded-xl">
            <el-icon :size="24"><Menu /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">审计操作日志</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">1,492</div>
          </div>
          <div class="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <el-icon :size="24"><Document /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 趋势图表与快捷入口 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <el-card shadow="never" class="lg:col-span-2 chart-card">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-bold">接口调用与访问趋势 (近 7 日)</span>
            <el-tag size="small" type="success">实时统计</el-tag>
          </div>
        </template>
        <div ref="chartRef" class="h-72 w-full" />
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="font-bold">系统技术架构信息</span>
        </template>
        <div class="system-info text-sm space-y-3">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">后端基础架构</span>
            <span class="font-medium">NestJS 10.x + TypeORM</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">前端技术基座</span>
            <span class="font-medium">Vue 3.5+ + Vite 6 + TS</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">UI 组件库</span>
            <span class="font-medium">Element Plus 2.9+</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">数据库与缓存</span>
            <span class="font-medium">MySQL 8.0 + Redis 7.0</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">接口文档</span>
            <span class="font-medium">Swagger / Knife4j 双 UI</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-500">认证与双 Token</span>
            <span class="font-medium text-green-600">Access(15m) / Refresh(7d)</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'API 请求量',
        type: 'line',
        smooth: true,
        data: [120, 232, 301, 434, 590, 330, 410],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.02)' },
          ]),
        },
        itemStyle: {
          color: '#409EFF',
        },
      },
      {
        name: '操作日志数',
        type: 'line',
        smooth: true,
        data: [45, 98, 120, 180, 240, 150, 210],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.4)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.02)' },
          ]),
        },
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  });
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}
</style>

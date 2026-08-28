<template>
  <div class="dashboard-container">
    <!-- 欢迎栏 -->
    <el-card shadow="never" class="welcome-card mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <el-avatar :size="56" icon="UserFilled" class="bg-primary text-white" />
          <div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">
              {{ $t('dashboard.welcome', { name: userStore.userInfo?.nickname || userStore.userInfo?.username || $t('dashboard.defaultRole') }) }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ $t('dashboard.department', { dept: userStore.userInfo?.dept?.deptName || $t('dashboard.defaultDept') }) }} | 
              {{ $t('dashboard.currentRole', { role: userStore.roles.join(', ') || $t('dashboard.defaultRole') }) }}
            </p>
          </div>
        </div>
        <div class="flex gap-6 text-right">
          <div>
            <div class="text-xs text-gray-400">{{ $t('dashboard.systemEnv') }}</div>
            <div class="text-lg font-semibold text-gray-700 dark:text-gray-200">NestJS + Vue3</div>
          </div>
          <div>
            <div class="text-xs text-gray-400">{{ $t('dashboard.authEngine') }}</div>
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
            <div class="text-sm text-gray-500">{{ $t('dashboard.systemUsers') }}</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">128</div>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl">
            <el-icon :size="24"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">{{ $t('dashboard.rolePerms') }}</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">8</div>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-xl">
            <el-icon :size="24"><Avatar /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">{{ $t('dashboard.funcMenus') }}</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">46</div>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-xl">
            <el-icon :size="24"><Menu /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">{{ $t('dashboard.auditLogs') }}</div>
            <div class="text-2xl font-bold mt-1 text-gray-800 dark:text-white">1,492</div>
          </div>
          <div class="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl">
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
            <span class="font-bold">{{ $t('dashboard.apiChartTitle') }}</span>
            <el-tag size="small" type="success">{{ $t('dashboard.realTimeStats') }}</el-tag>
          </div>
        </template>
        <div ref="chartRef" class="h-72 w-full" />
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="font-bold">{{ $t('dashboard.archInfo') }}</span>
        </template>
        <div class="system-info text-sm space-y-3">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">{{ $t('dashboard.backendArch') }}</span>
            <span class="font-medium">NestJS 10.x + TypeORM</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">{{ $t('dashboard.frontendTech') }}</span>
            <span class="font-medium">Vue 3.5+ + Vite 6 + TS</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">{{ $t('dashboard.uiLib') }}</span>
            <span class="font-medium">Element Plus 2.9+</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">{{ $t('dashboard.dbCache') }}</span>
            <span class="font-medium">MySQL 8.0 + Redis 7.0</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500">{{ $t('dashboard.apiDoc') }}</span>
            <span class="font-medium">Swagger / Knife4j 双 UI</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-500">{{ $t('dashboard.authDualToken') }}</span>
            <span class="font-medium text-green-600">Access(15m) / Refresh(7d)</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

const { t } = useI18n();
const userStore = useUserStore();
const appStore = useAppStore();

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const isDark = appStore.theme === 'dark';
  const textColor = isDark ? '#a0a0a0' : '#606266';
  const splitLineColor = isDark ? '#2c2c32' : '#f0f2f5';

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: [t('dashboard.apiRequests'), t('dashboard.logCount')],
      textStyle: { color: textColor },
      top: 0,
      right: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLabel: { color: textColor },
      data: [
        t('dashboard.days.mon'),
        t('dashboard.days.tue'),
        t('dashboard.days.wed'),
        t('dashboard.days.thu'),
        t('dashboard.days.fri'),
        t('dashboard.days.sat'),
        t('dashboard.days.sun'),
      ],
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [
      {
        name: t('dashboard.apiRequests'),
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
        name: t('dashboard.logCount'),
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

watch(
  [() => appStore.language, () => appStore.theme],
  () => {
    initChart();
  },
);

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}
</style>

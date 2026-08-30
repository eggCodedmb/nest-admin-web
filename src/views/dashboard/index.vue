<template>
  <div class="dashboard-container space-y-5">
    <el-alert
      v-if="overviewError"
      :title="$t('dashboard.overviewUnavailable')"
      type="warning"
      show-icon
      closable
      @close="loadOverview"
    />
    <!-- 顶部工作台问候与状态栏 -->
    <el-card shadow="never" class="welcome-card !border-none !rounded-2xl">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- 用户信息与动态时段问候 -->
        <div class="flex items-center gap-4">
          <div class="relative">
            <el-avatar :size="64" icon="UserFilled" class="user-avatar shadow-md" />
            <span class="online-indicator" />
          </div>
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                {{ greetingText }}，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || $t('dashboard.defaultRole') }}
              </h2>
              <el-tag effect="light" type="primary" round size="small" class="font-medium">
                {{ userStore.roles.join(', ') || $t('dashboard.defaultRole') }}
              </el-tag>
            </div>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-4 flex-wrap">
              <span class="flex items-center gap-1">
                <el-icon><OfficeBuilding /></el-icon>
                {{ $t('dashboard.department', { dept: userStore.userInfo?.dept?.deptName || $t('dashboard.defaultDept') }) }}
              </span>
              <span class="hidden sm:inline-block text-gray-300 dark:text-gray-600">|</span>
              <span class="flex items-center gap-1">
                <el-icon><Clock /></el-icon>
                {{ userStore.userInfo?.loginDate ? `上次登录：${formatDate(userStore.userInfo.loginDate)}` : '当前系统运行就绪' }}
              </span>
            </p>
          </div>
        </div>

        <!-- 右侧快速状态栏 -->
        <div class="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
          <div class="text-center sm:text-right">
            <div class="text-xs text-gray-400 font-medium">{{ $t('dashboard.pendingTasks') }}</div>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              6 <span class="text-xs font-normal text-gray-400">项</span>
            </div>
          </div>
          <div class="text-center sm:text-right">
            <div class="text-xs text-gray-400 font-medium">{{ $t('dashboard.systemAlerts') }}</div>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              0 <span class="text-xs font-normal text-gray-400">条</span>
            </div>
          </div>
          <div class="text-center sm:text-right">
            <div class="text-xs text-gray-400 font-medium">{{ $t('dashboard.serviceStatus') }}</div>
            <div class="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-500">
              <span :class="['status-pulse', overviewLoading ? 'bg-amber-400' : 'bg-emerald-500']" />
              {{ overviewLoading ? $t('dashboard.dataLoading') : overviewError ? $t('dashboard.dataUnavailable') : $t('dashboard.healthy') }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 4 大核心 KPI 统计矩阵 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 用户总数 -->
      <el-card shadow="hover" class="metric-card !rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ $t('dashboard.systemUsers') }}</span>
          <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <el-icon :size="20"><User /></el-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{{ formatNumber(overview?.metrics.userCount) }}</div>
        <div class="flex items-center gap-2 mt-3 text-xs">
          <span class="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            <el-icon><Top /></el-icon> --
          </span>
          <span class="text-gray-400">{{ $t('dashboard.userGrowth') }}</span>
        </div>
      </el-card>

      <!-- 今日 API 调用 -->
      <el-card shadow="hover" class="metric-card !rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ $t('dashboard.todayCalls') }}</span>
          <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <el-icon :size="20"><Lightning /></el-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{{ formatNumber(overview?.metrics.todayCalls) }}</div>
        <div class="flex items-center gap-2 mt-3 text-xs">
          <span class="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            <el-icon><Top /></el-icon> --
          </span>
          <span class="text-gray-400">{{ $t('dashboard.qpsPeak') }} --</span>
        </div>
      </el-card>

      <!-- 操作审计日志 -->
      <el-card shadow="hover" class="metric-card !rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ $t('dashboard.auditLogs') }}</span>
          <div class="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <el-icon :size="20"><Document /></el-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mt-2">{{ formatNumber(overview?.metrics.auditLogCount) }}</div>
        <div class="flex items-center gap-2 mt-3 text-xs">
          <span class="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold">
            {{ overview?.metrics.successRate ?? '--' }}% {{ $t('dashboard.successRate') }}
          </span>
          <span class="text-gray-400">全量合规留痕</span>
        </div>
      </el-card>

      <!-- 存储与资源配额 -->
      <el-card shadow="hover" class="metric-card !rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{{ $t('dashboard.storageUsage') }}</span>
          <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <el-icon :size="20"><FolderOpened /></el-icon>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mt-2">
            64.2 <span class="text-sm font-normal text-gray-400">GB</span>
        </div>
        <div class="mt-2.5">
          <el-progress :percentage="42.8" :stroke-width="6" color="#f59e0b" :show-text="false" />
          <div class="flex justify-between text-[11px] text-gray-400 mt-1">
            <span>{{ $t('dashboard.storageUsed') }} 42.8%</span>
            <span>{{ $t('dashboard.storageTotal') }} 150 GB</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 高频快捷操作矩阵 -->
    <el-card shadow="never" class="!rounded-2xl">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
            <span class="w-1.5 h-4 bg-indigo-600 rounded-full" />
            {{ $t('dashboard.quickNavTitle') }}
          </div>
          <span class="text-xs text-gray-400">{{ $t('dashboard.quickNavSub') }}</span>
        </div>
      </template>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div
          v-for="item in quickShortcuts"
          :key="item.path"
          class="shortcut-btn group"
          @click="handleNavigate(item)"
        >
          <div :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm', item.bgClass]">
            <el-icon :size="24" :class="item.textClass">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {{ $t(item.titleKey) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 中部：流量趋势图表 + 实时操作审计日志 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- API 流量与日志趋势图 -->
      <el-card shadow="never" class="lg:col-span-2 !rounded-2xl h-full flex flex-col" body-class="flex-1 flex flex-col justify-between">
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                <span class="w-1.5 h-4 bg-indigo-600 rounded-full" />
                {{ $t('dashboard.apiChartTitle') }}
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ $t('dashboard.apiChartSub') }}</p>
            </div>
            <div class="flex items-center gap-2">
              <el-radio-group v-model="chartTimeRange" size="small" @change="handleTimeRangeChange">
                <el-radio-button value="7d">{{ $t('dashboard.chartDays7') }}</el-radio-button>
                <el-radio-button value="30d">{{ $t('dashboard.chartDays30') }}</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        <div ref="chartRef" class="h-72 w-full flex-1" />
      </el-card>

      <!-- 实时操作审计流水 -->
      <el-card shadow="never" class="!rounded-2xl h-full flex flex-col" body-class="flex-1 flex flex-col justify-between">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
              <span class="w-1.5 h-4 bg-emerald-500 rounded-full" />
              {{ $t('dashboard.recentActivity') }}
            </div>
            <el-button link type="primary" size="small" @click="router.push('/system/log')">
              {{ $t('dashboard.viewAll') }} &rarr;
            </el-button>
          </div>
        </template>

        <div v-loading="overviewLoading" class="flex-1 space-y-4 py-1 min-h-36">
          <div v-for="log in recentActivities" :key="log.id" class="flex items-start gap-3">
            <span :class="['w-2 h-2 rounded-full mt-1.5 flex-shrink-0', log.status === 1 ? 'bg-emerald-500' : 'bg-red-500']" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{{ log.operator }}</span>
                <span class="text-[10px] text-gray-400 flex-shrink-0">{{ formatActivityTime(log.time) }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {{ log.action }}:
                <span class="text-indigo-600 dark:text-indigo-400 font-mono">{{ log.target }}</span>
              </p>
            </div>
          </div>
          <el-empty v-if="!overviewLoading && recentActivities.length === 0" :description="$t('dashboard.noActivity')" :image-size="56" />
        </div>

        <div class="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
          🛡️ CASL Ability 细粒度策略防护
        </div>
      </el-card>
    </div>

    <!-- 底部：服务器监控 + 技术基座 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- 服务器与运行时资源监控 -->
      <el-card shadow="never" class="lg:col-span-2 !rounded-2xl h-full flex flex-col" body-class="flex-1 flex flex-col justify-between">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
              <span class="w-1.5 h-4 bg-purple-600 rounded-full" />
              {{ $t('dashboard.serverMonitor') }}
            </div>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
              {{ runtimeLabel }}
            </span>
          </div>
        </template>

        <div
          class="grid gap-4"
          :class="overview?.runtime?.disk ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'"
        >
          <!-- CPU 使用率 -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{{ $t('dashboard.cpuUsage') }}</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ overview?.runtime?.cpuUsage !== undefined ? `${overview.runtime.cpuUsage}%` : '--' }}</span>
            </div>
            <div class="mt-2.5">
              <el-progress :percentage="overview?.runtime?.cpuUsage || 0" :stroke-width="6" color="#10b981" :show-text="false" />
            </div>
            <div class="text-[11px] text-gray-400 mt-2">{{ overview?.runtime?.cpuCores ? `${overview.runtime.cpuCores} 核心` : '--' }}</div>
          </div>

          <!-- 系统内存占用 -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{{ $t('dashboard.memUsage') }}</span>
              <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ overview?.runtime?.memoryUsage !== undefined ? `${overview.runtime.memoryUsage}%` : '--' }}</span>
            </div>
            <div class="mt-2.5">
              <el-progress :percentage="overview?.runtime?.memoryUsage || 0" :stroke-width="6" color="#6366f1" :show-text="false" />
            </div>
            <div class="text-[11px] text-gray-400 mt-2">已用 {{ formatBytes(overview?.runtime?.memoryUsed) }} / {{ formatBytes(overview?.runtime?.memoryTotal) }}</div>
          </div>

          <!-- 磁盘存储空间 (生产/Linux 服务器环境呈现) -->
          <div v-if="overview?.runtime?.disk" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{{ $t('dashboard.diskUsage') }}</span>
              <span class="font-bold text-amber-600 dark:text-amber-400">{{ overview?.runtime?.disk?.usage !== undefined ? `${overview.runtime.disk.usage}%` : '--' }}</span>
            </div>
            <div class="mt-2.5">
              <el-progress :percentage="overview?.runtime?.disk?.usage || 0" :stroke-width="6" color="#f59e0b" :show-text="false" />
            </div>
            <div class="text-[11px] text-gray-400 mt-2 flex justify-between">
              <span>已用 {{ formatBytes(overview?.runtime?.disk?.used) }} / {{ formatBytes(overview?.runtime?.disk?.total) }}</span>
              <span v-if="overview?.runtime?.disk?.free" class="text-gray-400">余 {{ formatBytes(overview?.runtime?.disk?.free) }}</span>
            </div>
          </div>

          <!-- Redis 缓存命中率 -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{{ $t('dashboard.redisHitRate') }}</span>
              <span class="font-bold text-purple-600 dark:text-purple-400">{{ overview?.runtime?.redis?.connected ? `${overview.runtime.redis.hitRate}%` : '--' }}</span>
            </div>
            <div class="mt-2.5">
              <el-progress :percentage="overview?.runtime?.redis?.connected ? overview.runtime.redis.hitRate : 0" :stroke-width="6" color="#a855f7" :show-text="false" />
            </div>
            <div class="text-[11px] text-gray-400 mt-2">{{ $t('dashboard.redisKeys') }}: {{ overview?.runtime?.redis?.connected ? formatNumber(overview.runtime.redis.keys) : '--' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 系统技术架构信息 -->
      <el-card shadow="never" class="!rounded-2xl h-full flex flex-col" body-class="flex-1 flex flex-col justify-between">
        <template #header>
          <div class="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
            <span class="w-1.5 h-4 bg-blue-600 rounded-full" />
            {{ $t('dashboard.archInfo') }}
          </div>
        </template>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.backendArch') }}</span>
            <span class="font-medium font-mono text-gray-700 dark:text-gray-200">NestJS 10 + TypeORM</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.frontendTech') }}</span>
            <span class="font-medium font-mono text-gray-700 dark:text-gray-200">Vue 3.5 + Vite 6 + TS</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.uiLib') }}</span>
            <span class="font-medium font-mono text-gray-700 dark:text-gray-200">Element Plus + UnoCSS</span>
          </div>
          <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.dbCache') }}</span>
            <span class="font-medium font-mono text-gray-700 dark:text-gray-200">MySQL 8.0 + Redis 7</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.authDualToken') }}</span>
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">Access(15m) / Refresh(7d)</span>
          </div>
        </div>

        <div class="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
          <span>Version: v1.0.0</span>
          <a
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {{ $t('dashboard.knifeDoc') }} <el-icon><TopRight /></el-icon>
          </a>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';
import {
  User,
  UserFilled,
  Document,
  FolderOpened,
  OfficeBuilding,
  Clock,
  Top,
  TopRight,
  Lightning,
} from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';
import { getDashboardOverview, type DashboardOverview } from '@/api/dashboard';
import { getConfigValueByKey } from '@/api/system/config';
import { formatDate } from '@/utils/date';

const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();
const appStore = useAppStore();
const overview = ref<DashboardOverview | null>(null);
const overviewLoading = ref(false);
const overviewError = ref(false);
let overviewTimer: number | undefined;
const defaultRefreshInterval = 30000;

const recentActivities = computed(() => overview.value?.recentActivities || []);
const runtimeLabel = computed(() => {
  const runtime = overview.value?.runtime;
  if (!runtime) return t('dashboard.runtimeLoading');
  return `${runtime.nodeVersion} / ${runtime.platform} ${runtime.arch}`;
});

const docUrl = computed(() => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (base.startsWith('http') && !base.includes('localhost')) return `${base}/doc.html`;
  return '/doc.html';
});

const formatNumber = (value?: number) => (value === undefined ? '--' : new Intl.NumberFormat().format(value));
const formatBytes = (value?: number) => {
  if (value === undefined) return '--';
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
};
const formatActivityTime = (value: string) => {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return date.toLocaleDateString();
};

const loadOverview = async () => {
  overviewLoading.value = true;
  overviewError.value = false;
  try {
    overview.value = await getDashboardOverview(chartTimeRange.value);
    initChart();
  } catch {
    overviewError.value = true;
  } finally {
    overviewLoading.value = false;
  }
};

const scheduleOverviewRefresh = (interval: number) => {
  if (overviewTimer) window.clearInterval(overviewTimer);
  if (interval > 0) {
    overviewTimer = window.setInterval(() => void loadOverview(), interval);
  }
};

const loadRefreshInterval = async () => {
  try {
    const setting = await getConfigValueByKey('sys.dashboard.refreshInterval');
    const seconds = Number(setting.configValue);
    const interval = setting.status === 0 && !setting.configValue
      ? defaultRefreshInterval
      : setting.status === 1 && Number.isFinite(seconds) && seconds > 0
        ? Math.min(Math.max(seconds, 5), 3600) * 1000
        : 0;
    scheduleOverviewRefresh(interval);
  } catch {
    scheduleOverviewRefresh(defaultRefreshInterval);
  }
};

// 动态问候语 (根据当前小时切换)
const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return t('dashboard.greetings.morning');
  } else if (hour >= 11 && hour < 14) {
    return t('dashboard.greetings.noon');
  } else if (hour >= 14 && hour < 18) {
    return t('dashboard.greetings.afternoon');
  } else {
    return t('dashboard.greetings.evening');
  }
});

// 快捷操作配置
const quickShortcuts = [
  {
    titleKey: 'dashboard.addUser',
    path: '/system/user',
    icon: 'User',
    bgClass: 'bg-blue-50 dark:bg-blue-900/40',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    titleKey: 'dashboard.roleConfig',
    path: '/system/role',
    icon: 'Lock',
    bgClass: 'bg-purple-50 dark:bg-purple-900/40',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    titleKey: 'dashboard.menuConfig',
    path: '/system/menu',
    icon: 'Menu',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/40',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    titleKey: 'dashboard.paramConfig',
    path: '/system/config',
    icon: 'Setting',
    bgClass: 'bg-amber-50 dark:bg-amber-900/40',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    titleKey: 'dashboard.operLog',
    path: '/system/log',
    icon: 'Document',
    bgClass: 'bg-cyan-50 dark:bg-cyan-900/40',
    textClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    titleKey: 'dashboard.knifeDoc',
    path: 'http://localhost:3000/api-docs',
    isExternal: true,
    icon: 'Link',
    bgClass: 'bg-rose-50 dark:bg-rose-900/40',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
];

const handleNavigate = (item: (typeof quickShortcuts)[0]) => {
  if (item.isExternal) {
    window.open(item.path, '_blank');
  } else {
    router.push(item.path);
  }
};

// 图表配置与生命周期
const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
const chartTimeRange = ref<'7d' | '30d'>('7d');

const initChart = () => {
  if (!chartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const isDark = appStore.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const splitLineColor = isDark ? '#334155' : '#f1f5f9';
  const currentData = overview.value?.trend || { labels: [], apiRequests: [], auditLogs: [] };

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#f8fafc' : '#0f172a',
      },
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
      top: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: splitLineColor } },
      data: currentData.labels,
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
        data: currentData.apiRequests,
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.45)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
          ]),
        },
        itemStyle: {
          color: '#6366f1',
        },
        lineStyle: {
          width: 3,
        },
      },
      {
        name: t('dashboard.logCount'),
        type: 'line',
        smooth: true,
        data: currentData.auditLogs,
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
          ]),
        },
        itemStyle: {
          color: '#10b981',
        },
        lineStyle: {
          width: 2.5,
        },
      },
    ],
  });
};

const handleTimeRangeChange = () => {
  void loadOverview();
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
  void loadOverview();
  void loadRefreshInterval();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (overviewTimer) window.clearInterval(overviewTimer);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.dashboard-container :deep(.el-card) {
  border-radius: 1rem;
}

.dashboard-container :deep(.el-card__header) {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dashboard-container :deep(.el-card__body) {
  padding: 1.25rem;
}

.welcome-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.03) 100%);
  border: 1px solid var(--el-border-color-lighter);
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #ffffff;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background-color: #10b981;
  border: 2.5px solid var(--el-bg-color-overlay, #ffffff);
  border-radius: 9999px;
}

.status-pulse {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 9999px;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.metric-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.shortcut-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 0.5rem;
  border-radius: 0.875rem;
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.25s ease;
}

.shortcut-btn:hover {
  border-color: #6366f1;
  background-color: rgba(99, 102, 241, 0.04);
  transform: translateY(-2px);
}
</style>

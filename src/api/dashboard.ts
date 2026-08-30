import request from '@/utils/request';

export interface DashboardOverview {
  metrics: {
    userCount: number;
    todayCalls: number;
    auditLogCount: number;
    successRate: number;
  };
  trend: {
    labels: string[];
    apiRequests: number[];
    auditLogs: number[];
  };
  recentActivities: Array<{
    id: number;
    operator: string;
    time: string;
    action: string;
    target: string;
    status: number;
  }>;
  runtime: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    cpuUsage: number;
    cpuCores: number;
    memoryUsage: number;
    memoryUsed: number;
    memoryTotal: number;
    disk?: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
    redis: {
      connected: boolean;
      keys: number;
      hitRate: number;
    };
  };
  generatedAt: string;
}

export function getDashboardOverview(range: '7d' | '30d' = '7d') {
  return request<any, DashboardOverview>({
    url: '/dashboard/overview',
    method: 'get',
    params: { range },
  });
}

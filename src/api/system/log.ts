import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { OperLogEntity } from '@/types/system';

export function getOperLogList(params?: {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  operName?: string;
  businessType?: number;
  status?: number;
}) {
  return request<any, PageResult<OperLogEntity>>({
    url: '/system/log/list',
    method: 'get',
    params,
  });
}

export function getOperLog(id: number) {
  return request<any, OperLogEntity>({
    url: `/system/log/${id}`,
    method: 'get',
  });
}

export function cleanOperLog() {
  return request<any, { message: string }>({
    url: '/system/log/clean',
    method: 'delete',
  });
}

export function deleteOperLogs(ids: string | number[]) {
  const idsStr = Array.isArray(ids) ? ids.join(',') : ids;
  return request<any, { message: string }>({
    url: `/system/log/${idsStr}`,
    method: 'delete',
  });
}

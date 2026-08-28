import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { ConfigEntity } from '@/types/system';

export function getConfigList(params?: { pageNum?: number; pageSize?: number; configName?: string; configKey?: string; configType?: number }) {
  return request<any, PageResult<ConfigEntity>>({
    url: '/system/config/list',
    method: 'get',
    params,
  });
}

export function getConfigValueByKey(configKey: string) {
  return request<any, { configKey: string; configValue: string }>({
    url: `/system/config/key/${configKey}`,
    method: 'get',
  });
}

export function getConfig(id: number) {
  return request<any, ConfigEntity>({
    url: `/system/config/${id}`,
    method: 'get',
  });
}

export function createConfig(data: Partial<ConfigEntity>) {
  return request<any, ConfigEntity>({
    url: '/system/config',
    method: 'post',
    data,
  });
}

export function updateConfig(id: number, data: Partial<ConfigEntity>) {
  return request<any, ConfigEntity>({
    url: `/system/config/${id}`,
    method: 'put',
    data,
  });
}

export function deleteConfig(id: number) {
  return request<any, { message: string }>({
    url: `/system/config/${id}`,
    method: 'delete',
  });
}

export function clearConfigCache() {
  return request<any, { message: string }>({
    url: '/system/config/cache/clear',
    method: 'delete',
  });
}

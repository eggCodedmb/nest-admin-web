import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { DictTypeEntity, DictDataEntity } from '@/types/system';

// ============= 字典类型 API =============

export function getDictTypeList(params?: { pageNum?: number; pageSize?: number; dictName?: string; dictType?: string; status?: number }) {
  return request<any, PageResult<DictTypeEntity>>({
    url: '/system/dict/type/list',
    method: 'get',
    params,
  });
}

export function getAllDictTypes() {
  return request<any, DictTypeEntity[]>({
    url: '/system/dict/type/all',
    method: 'get',
  });
}

export function getDictType(id: number) {
  return request<any, DictTypeEntity>({
    url: `/system/dict/type/${id}`,
    method: 'get',
  });
}

export function createDictType(data: Partial<DictTypeEntity>) {
  return request<any, DictTypeEntity>({
    url: '/system/dict/type',
    method: 'post',
    data,
  });
}

export function updateDictType(id: number, data: Partial<DictTypeEntity>) {
  return request<any, DictTypeEntity>({
    url: `/system/dict/type/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDictType(id: number) {
  return request<any, { message: string }>({
    url: `/system/dict/type/${id}`,
    method: 'delete',
  });
}

// ============= 字典数据 API =============

export function getDictDataList(params?: { pageNum?: number; pageSize?: number; dictType?: string; dictLabel?: string; status?: number }) {
  return request<any, PageResult<DictDataEntity>>({
    url: '/system/dict/data/list',
    method: 'get',
    params,
  });
}

export function getDictDataByType(dictType: string) {
  return request<any, DictDataEntity[]>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'get',
  });
}

export function getDictData(id: number) {
  return request<any, DictDataEntity>({
    url: `/system/dict/data/${id}`,
    method: 'get',
  });
}

export function createDictData(data: Partial<DictDataEntity>) {
  return request<any, DictDataEntity>({
    url: '/system/dict/data',
    method: 'post',
    data,
  });
}

export function updateDictData(id: number, data: Partial<DictDataEntity>) {
  return request<any, DictDataEntity>({
    url: `/system/dict/data/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDictData(id: number) {
  return request<any, { message: string }>({
    url: `/system/dict/data/${id}`,
    method: 'delete',
  });
}

export function clearDictCache() {
  return request<any, { message: string }>({
    url: '/system/dict/cache/clear',
    method: 'delete',
  });
}

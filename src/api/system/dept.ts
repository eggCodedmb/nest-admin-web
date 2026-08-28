import request from '@/utils/request';
import type { DeptEntity } from '@/types/system';

export function getDeptTree(params?: { deptName?: string; status?: number }) {
  return request<any, DeptEntity[]>({
    url: '/system/dept/tree',
    method: 'get',
    params,
  });
}

export function getDeptList(params?: { deptName?: string; status?: number }) {
  return request<any, DeptEntity[]>({
    url: '/system/dept/list',
    method: 'get',
    params,
  });
}

export function getDept(id: number) {
  return request<any, DeptEntity>({
    url: `/system/dept/${id}`,
    method: 'get',
  });
}

export function createDept(data: Partial<DeptEntity>) {
  return request<any, DeptEntity>({
    url: '/system/dept',
    method: 'post',
    data,
  });
}

export function updateDept(id: number, data: Partial<DeptEntity>) {
  return request<any, DeptEntity>({
    url: `/system/dept/${id}`,
    method: 'put',
    data,
  });
}

export function deleteDept(id: number) {
  return request<any, { message: string }>({
    url: `/system/dept/${id}`,
    method: 'delete',
  });
}

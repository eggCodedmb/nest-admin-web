import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { RoleEntity } from '@/types/system';

export interface QueryRoleParams {
  pageNum?: number;
  pageSize?: number;
  roleName?: string;
  roleKey?: string;
  status?: number;
}

export function getRoleList(params?: QueryRoleParams) {
  return request<any, PageResult<RoleEntity>>({
    url: '/system/role/list',
    method: 'get',
    params,
  });
}

export function getAllRoles() {
  return request<any, RoleEntity[]>({
    url: '/system/role/all',
    method: 'get',
  });
}

export function getRole(id: number) {
  return request<any, RoleEntity>({
    url: `/system/role/${id}`,
    method: 'get',
  });
}

export function createRole(data: Partial<RoleEntity> & { menuIds?: number[]; deptIds?: number[] }) {
  return request<any, RoleEntity>({
    url: '/system/role',
    method: 'post',
    data,
  });
}

export function updateRole(id: number, data: Partial<RoleEntity> & { menuIds?: number[]; deptIds?: number[] }) {
  return request<any, RoleEntity>({
    url: `/system/role/${id}`,
    method: 'put',
    data,
  });
}

export function updateRoleDataScope(id: number, data: { dataScope: number; deptIds?: number[] }) {
  return request<any, RoleEntity>({
    url: `/system/role/${id}/data-scope`,
    method: 'put',
    data,
  });
}

export function changeRoleStatus(id: number, status: number) {
  return request<any, { message: string }>({
    url: `/system/role/${id}/status`,
    method: 'put',
    data: { status },
  });
}

export function deleteRole(id: number) {
  return request<any, { message: string }>({
    url: `/system/role/${id}`,
    method: 'delete',
  });
}

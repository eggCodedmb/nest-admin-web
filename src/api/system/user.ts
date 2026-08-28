import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { UserEntity } from '@/types/system';

export interface QueryUserParams {
  pageNum?: number;
  pageSize?: number;
  username?: string;
  phone?: string;
  status?: number;
  deptId?: number;
}

export function getUserList(params?: QueryUserParams) {
  return request<any, PageResult<UserEntity>>({
    url: '/system/user/list',
    method: 'get',
    params,
  });
}

export function getUser(id: number) {
  return request<any, UserEntity>({
    url: `/system/user/${id}`,
    method: 'get',
  });
}

export function createUser(data: Partial<UserEntity>) {
  return request<any, UserEntity>({
    url: '/system/user',
    method: 'post',
    data,
  });
}

export function updateUser(id: number, data: Partial<UserEntity>) {
  return request<any, UserEntity>({
    url: `/system/user/${id}`,
    method: 'put',
    data,
  });
}

export function resetUserPassword(id: number, password: string) {
  return request<any, { message: string }>({
    url: `/system/user/${id}/reset-password`,
    method: 'put',
    data: { password },
  });
}

export function changeUserStatus(id: number, status: number) {
  return request<any, { message: string }>({
    url: `/system/user/${id}/status`,
    method: 'put',
    data: { status },
  });
}

export function deleteUser(id: number) {
  return request<any, { message: string }>({
    url: `/system/user/${id}`,
    method: 'delete',
  });
}

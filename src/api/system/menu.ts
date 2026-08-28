import request from '@/utils/request';
import type { RouteVo } from '@/types/router';
import type { MenuEntity } from '@/types/system';

export function getRouters() {
  return request<any, RouteVo[]>({
    url: '/system/menu/routers',
    method: 'get',
  });
}

export function getMenuTree(params?: { menuName?: string; status?: number }) {
  return request<any, MenuEntity[]>({
    url: '/system/menu/tree',
    method: 'get',
    params,
  });
}

export function getMenuList(params?: { menuName?: string; status?: number }) {
  return request<any, MenuEntity[]>({
    url: '/system/menu/list',
    method: 'get',
    params,
  });
}

export function getMenu(id: number) {
  return request<any, MenuEntity>({
    url: `/system/menu/${id}`,
    method: 'get',
  });
}

export function createMenu(data: Partial<MenuEntity>) {
  return request<any, MenuEntity>({
    url: '/system/menu',
    method: 'post',
    data,
  });
}

export function updateMenu(id: number, data: Partial<MenuEntity>) {
  return request<any, MenuEntity>({
    url: `/system/menu/${id}`,
    method: 'put',
    data,
  });
}

export function deleteMenu(id: number) {
  return request<any, { message: string }>({
    url: `/system/menu/${id}`,
    method: 'delete',
  });
}

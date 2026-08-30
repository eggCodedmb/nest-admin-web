import request from '@/utils/request';
import type { CategoryEntity } from '@/types/article';

export function getCategoryTree(params?: { name?: string; status?: number }) {
  return request<any, CategoryEntity[]>({
    url: '/article/category/tree',
    method: 'get',
    params,
  });
}

export function getCategoryList(params?: { name?: string; status?: number }) {
  return request<any, CategoryEntity[]>({
    url: '/article/category/list',
    method: 'get',
    params,
  });
}

export function getCategory(id: number | string) {
  return request<any, CategoryEntity>({
    url: `/article/category/${id}`,
    method: 'get',
  });
}

export function createCategory(data: Partial<CategoryEntity>) {
  return request<any, CategoryEntity>({
    url: '/article/category',
    method: 'post',
    data,
  });
}

export function updateCategory(id: number | string, data: Partial<CategoryEntity>) {
  return request<any, CategoryEntity>({
    url: `/article/category/${id}`,
    method: 'put',
    data,
  });
}

export function deleteCategory(id: number | string) {
  return request<any, { message: string }>({
    url: `/article/category/${id}`,
    method: 'delete',
  });
}

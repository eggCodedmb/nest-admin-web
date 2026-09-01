import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { ArticleEntity } from '@/types/article';

export function getArticleList(params?: {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  categoryId?: number;
  status?: number;
  isTop?: number;
  isRecommend?: number;
  recommendFactor?: number;
  authorId?: number;
}) {
  return request<any, PageResult<ArticleEntity>>({
    url: '/article/post/list',
    method: 'get',
    params,
  });
}

export function getArticle(id: number | string) {
  return request<any, ArticleEntity>({
    url: `/article/post/${id}`,
    method: 'get',
  });
}

export function createArticle(data: Partial<ArticleEntity>) {
  return request<any, ArticleEntity>({
    url: '/article/post',
    method: 'post',
    data,
  });
}

export function updateArticle(id: number | string, data: Partial<ArticleEntity>) {
  return request<any, ArticleEntity>({
    url: `/article/post/${id}`,
    method: 'put',
    data,
  });
}

export function submitArticleAudit(id: number | string) {
  return request<any, ArticleEntity>({
    url: `/article/post/${id}/submit`,
    method: 'post',
  });
}

export function updateArticleStatus(
  id: number | string,
  data: {
    status?: number;
    isTop?: number;
    isRecommend?: number;
    recommendWeight?: number;
    recommendFactor?: number;
    recommendExpireAt?: string | null;
  },
) {
  return request<any, ArticleEntity>({
    url: `/article/post/${id}/status`,
    method: 'put',
    data,
  });
}

export function deleteArticle(id: number | string) {
  return request<any, { message: string }>({
    url: `/article/post/${id}`,
    method: 'delete',
  });
}

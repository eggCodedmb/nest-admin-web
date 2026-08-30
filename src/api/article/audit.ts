import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type { ArticleEntity, AuditLogEntity } from '@/types/article';

export function getAuditList(params?: {
  pageNum?: number;
  pageSize?: number;
  title?: string;
  categoryId?: number;
  status?: number;
}) {
  return request<any, PageResult<ArticleEntity>>({
    url: '/article/audit/list',
    method: 'get',
    params,
  });
}

export function executeAuditAction(data: {
  articleId: number;
  auditResult: number; // 1通过 2驳回 3下架
  auditComment?: string;
}) {
  return request<any, any>({
    url: '/article/audit/action',
    method: 'post',
    data,
  });
}

export function getArticleAuditLogs(articleId: number | string) {
  return request<any, AuditLogEntity[]>({
    url: `/article/audit/logs/${articleId}`,
    method: 'get',
  });
}

import request from '@/utils/request';
import type { PageResult } from '@/types/api';
import type {
  RecommendRuleEntity,
  SimulateRecommendDto,
  UpdateArticleRecommendControlDto,
  RecommendedArticleItem,
  ArticleEntity,
} from '@/types/article';

// 1. 获取推荐策略规则列表 (分页)
export function getRecommendRuleList(params?: {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  algorithmType?: string;
  status?: number;
}) {
  return request<any, PageResult<RecommendRuleEntity>>({
    url: '/article/recommend/config/list',
    method: 'get',
    params,
  });
}

// 2. 获取所有启用的策略规则
export function getAllRecommendRules() {
  return request<any, RecommendRuleEntity[]>({
    url: '/article/recommend/config/all',
    method: 'get',
  });
}

// 3. 获取当前全局默认激活策略
export function getActiveRecommendRule() {
  return request<any, RecommendRuleEntity>({
    url: '/article/recommend/config/active',
    method: 'get',
  });
}

// 4. 获取单个策略详情
export function getRecommendRule(id: number | string) {
  return request<any, RecommendRuleEntity>({
    url: `/article/recommend/config/${id}`,
    method: 'get',
  });
}

// 5. 新增推荐策略
export function createRecommendRule(data: Partial<RecommendRuleEntity>) {
  return request<any, RecommendRuleEntity>({
    url: '/article/recommend/config',
    method: 'post',
    data,
  });
}

// 6. 修改推荐策略
export function updateRecommendRule(id: number | string, data: Partial<RecommendRuleEntity>) {
  return request<any, RecommendRuleEntity>({
    url: `/article/recommend/config/${id}`,
    method: 'put',
    data,
  });
}

// 7. 设为全局默认激活策略
export function setActiveRecommendRule(id: number | string) {
  return request<any, RecommendRuleEntity>({
    url: `/article/recommend/config/${id}/active`,
    method: 'put',
  });
}

// 8. 删除推荐策略
export function deleteRecommendRule(id: number | string) {
  return request<any, { message: string }>({
    url: `/article/recommend/config/${id}`,
    method: 'delete',
  });
}

// 9. 算法实时沙盘试算与排名预测 (Live Simulator)
export function simulateRecommend(data: SimulateRecommendDto) {
  return request<
    any,
    {
      totalCandidates: number;
      recommendedCount: number;
      simulatedList: RecommendedArticleItem[];
    }
  >({
    url: '/article/recommend/simulate',
    method: 'post',
    data,
  });
}

// 10. 获取算法推荐文章流 (Feed API)
export function getRecommendFeed(params?: {
  limit?: number;
  categoryId?: number;
  tags?: string;
}) {
  return request<any, any[]>({
    url: '/article/recommend/feed',
    method: 'get',
    params,
  });
}

// 11. 单篇文章推荐干预设置
export function updateArticleRecommendControl(
  id: number | string,
  data: UpdateArticleRecommendControlDto,
) {
  return request<any, ArticleEntity>({
    url: `/article/recommend/article/${id}/control`,
    method: 'put',
    data,
  });
}

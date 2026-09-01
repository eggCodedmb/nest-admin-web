export interface CategoryEntity {
  id: number;
  parentId: number;
  mpath?: string;
  name: string;
  slug?: string;
  icon?: string;
  orderNum: number;
  status: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: CategoryEntity[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
  children?: TocItem[];
}

export interface ArticleEntity {
  id: number;
  categoryId: number;
  authorId: number;
  authorName?: string;
  categoryName?: string;
  title: string;
  slug?: string;
  summary?: string;
  coverImage?: string;
  content: string;
  contentHtml?: string;
  tocData?: TocItem[];
  tags?: string;
  sourceType: number; // 1原创 2转载 3翻译
  sourceUrl?: string;
  status: number; // 0草稿 1待审 2发布 3驳回 4下架
  isTop: number;
  isRecommend: number;
  recommendWeight?: number;
  recommendFactor?: number;
  recommendExpireAt?: string | null;
  allowComment: number;
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendWeightsConfig {
  viewWeight: number; // 浏览量权重 (0-100)
  likeWeight: number; // 点赞数权重 (0-100)
  commentWeight: number; // 评论数权重 (0-100)
  timeDecayRate: number; // 半衰期指数 Gravity (0.1-3.0)
  tagMatchWeight: number; // 标签相关度权重 (0-100)
  categoryMatchWeight: number; // 分类相关度权重 (0-100)
  manualBoostWeight: number; // 人工推荐置顶提权加成 (0-100)
}

export interface ColdStartConfig {
  enableColdStart: boolean;
  boostDays: number;
  boostScoreMultiplier: number;
  minImpressionsThreshold: number;
}

export interface DiversityConfig {
  maxPerCategory: number;
  exploreRate: number;
  dedupHistoryDays: number;
}

export interface RecommendRuleEntity {
  id: number;
  name: string;
  ruleCode: string;
  algorithmType: string;
  weights: RecommendWeightsConfig;
  coldStartConfig: ColdStartConfig;
  diversityConfig: DiversityConfig;
  status: number;
  isDefault: number;
  description?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoreBreakdown {
  interactionScore: number;
  viewComponent: number;
  likeComponent: number;
  commentComponent: number;
  timeDecayFactor: number;
  hoursSincePublish: number;
  coldStartMultiplier: number;
  isColdStartApplied: boolean;
  manualBoostScore: number;
  relevanceScore: number;
  finalScore: number;
}

export interface RecommendedArticleItem extends ArticleEntity {
  scoreBreakdown: ScoreBreakdown;
  simulatedRank?: number;
  rankDelta?: number;
}

export interface SimulateRecommendDto {
  weights: RecommendWeightsConfig;
  coldStartConfig?: ColdStartConfig;
  diversityConfig?: DiversityConfig;
  limit?: number;
  contextCategoryId?: number;
  contextTags?: string;
}

export interface UpdateArticleRecommendControlDto {
  isRecommend?: number;
  recommendWeight?: number;
  recommendFactor?: number;
  recommendExpireAt?: string | null;
}

export interface AuditLogEntity {
  id: number;
  articleId: number;
  auditorId: number;
  auditorName?: string;
  previousStatus: number;
  currentStatus: number;
  auditResult: number; // 1通过 2驳回 3下架
  auditComment?: string;
  createdAt: string;
}

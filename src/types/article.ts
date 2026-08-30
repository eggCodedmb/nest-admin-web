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
  allowComment: number;
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

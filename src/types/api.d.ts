/**
 * 全局统一接口响应结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * 分页请求基础参数
 */
export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}

/**
 * 分页响应统一包装
 */
export interface PageResult<T = any> {
  rows: T[];
  total: number;
}

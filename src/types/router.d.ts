import { RouteRecordRaw } from 'vue-router';

/**
 * 后端下发的动态路由节点模型
 */
export interface RouteVo {
  name: string;
  path: string;
  hidden: boolean;
  redirect?: string;
  component: string;
  alwaysShow?: boolean;
  meta: {
    title: string;
    icon: string;
    noCache: boolean;
    link?: string;
  };
  children?: RouteVo[];
}

export type AppCustomRouteRecordRaw = RouteRecordRaw & {
  hidden?: boolean;
  alwaysShow?: boolean;
};

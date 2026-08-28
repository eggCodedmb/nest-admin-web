import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';
import { constantRoutes } from '@/router';
import { getRouters } from '@/api/system/menu';
import type { RouteVo, AppCustomRouteRecordRaw } from '@/types/router';
import Layout from '@/layout/index.vue';
import ParentView from '@/components/ParentView/index.vue';

// 懒加载所有视图组件
const modules = import.meta.glob('../../views/**/*.vue');

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as RouteRecordRaw[],
    dynamicRoutes: [] as RouteRecordRaw[],
    sidebarRouters: [] as RouteRecordRaw[],
  }),
  actions: {
    setRoutes(newRoutes: RouteRecordRaw[]) {
      this.dynamicRoutes = newRoutes;
      this.routes = constantRoutes.concat(newRoutes);
      this.sidebarRouters = constantRoutes.concat(newRoutes);
    },

    async generateRoutes() {
      const routerVos = await getRouters();
      const sdata = JSON.parse(JSON.stringify(routerVos));
      const rdata = JSON.parse(JSON.stringify(routerVos));
      const defaultData = JSON.parse(JSON.stringify(routerVos));

      const sidebarRoutes = this.filterAsyncRouter(sdata);
      const rewriteRoutes = this.filterAsyncRouter(rdata, false, true);
      const defaultRoutes = this.filterAsyncRouter(defaultData);

      this.sidebarRouters = constantRoutes.concat(sidebarRoutes);
      this.setRoutes(rewriteRoutes);

      return rewriteRoutes;
    },

    filterAsyncRouter(asyncRouterMap: RouteVo[], lastRouter = false, type = false): RouteRecordRaw[] {
      return asyncRouterMap.filter((route) => {
        if (type && route.children) {
          route.children = this.filterChildren(route.children);
        }

        const routeRecord = route as unknown as AppCustomRouteRecordRaw;

        if (route.component) {
          // Layout ParentView 组件特殊处理
          if (route.component === 'Layout') {
            routeRecord.component = Layout;
          } else if (route.component === 'ParentView') {
            routeRecord.component = ParentView;
          } else {
            routeRecord.component = this.loadView(route.component);
          }
        }

        if (route.children != null && route.children && route.children.length) {
          routeRecord.children = this.filterAsyncRouter(route.children, true, type);
        } else {
          delete routeRecord.children;
          delete routeRecord.redirect;
        }
        return true;
      }) as unknown as RouteRecordRaw[];
    },

    filterChildren(childrenMap: RouteVo[], lastRouter: any = false) {
      let children: RouteVo[] = [];
      childrenMap.forEach((el) => {
        if (el.children && el.children.length) {
          if (el.component === 'ParentView' && !lastRouter) {
            el.children.forEach((c) => {
              c.path = `${el.path}/${c.path}`;
              if (c.children && c.children.length) {
                children = children.concat(this.filterChildren(c.children, c));
                return;
              }
              children.push(c);
            });
            return;
          }
        }
        children = children.concat(el);
      });
      return children;
    },

    loadView(view: string) {
      let res;
      for (const path in modules) {
        const dir = path.split('views/')[1].split('.vue')[0];
        if (dir === view || dir === `${view}/index`) {
          res = () => modules[path]();
          break;
        }
      }
      return res || (() => import('@/views/error/404.vue'));
    },
  },
});

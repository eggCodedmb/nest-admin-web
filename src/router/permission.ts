import router from './index';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { getToken } from '@/utils/auth';
import { useUserStore } from '@/store/modules/user';
import { usePermissionStore } from '@/store/modules/permission';

NProgress.configure({ showSpinner: false });
const whiteList = ['/login', '/404'];

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const hasToken = getToken();

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' });
      NProgress.done();
    } else {
      const userStore = useUserStore();
      const permissionStore = usePermissionStore();

      if (userStore.roles.length === 0) {
        try {
          // 1. 获取用户信息与权限标识
          await userStore.getInfo();
          // 2. 动态拉取路由表
          const accessRoutes = await permissionStore.generateRoutes();
          // 3. 动态注册路由
          accessRoutes.forEach((route) => router.addRoute(route));
          // 4. 404 兜底路由必须在最后添加
          router.addRoute({
            path: '/:pathMatch(.*)*',
            redirect: '/404',
            meta: { hidden: true },
          });
          // 5. 确保路由加载完毕
          next({ ...to, replace: true });
        } catch (error) {
          await userStore.logout();
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
          NProgress.done();
        }
      } else {
        next();
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

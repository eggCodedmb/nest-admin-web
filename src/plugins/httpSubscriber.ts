import { ElMessage, ElMessageBox } from 'element-plus';
import NProgress from 'nprogress';
import { httpEventBus, HttpEventType } from '@/utils/httpEvents';
import { useUserStore } from '@/store/modules/user';
import router from '@/router';

let isExpiredModalShowing = false;

export function setupHttpSubscribers() {
  // 1. 订阅进度条生命周期
  httpEventBus.on(HttpEventType.REQUEST_START, () => {
    NProgress.start();
  });

  httpEventBus.on(HttpEventType.REQUEST_END, () => {
    NProgress.done();
  });

  // 2. 订阅业务错误提示 (code !== 200)
  httpEventBus.on(HttpEventType.BUSINESS_ERROR, ({ message }) => {
    ElMessage.error({
      message,
      duration: 3000,
    });
  });

  // 3. 订阅权限不足提示 (403 Forbidden)
  httpEventBus.on(HttpEventType.FORBIDDEN, ({ message }) => {
    ElMessage.warning({
      message: message || '您无权访问该资源或执行此操作',
      duration: 3000,
    });
  });

  // 4. 订阅网络断开 / 500 异常
  httpEventBus.on(HttpEventType.NETWORK_ERROR, ({ message }) => {
    ElMessage.error({
      message: message || '网络通信异常，请稍后重试',
      duration: 4000,
    });
  });

  // 5. 订阅认证过期 (401 / Refresh Token 失败) —— 单例防抖提示
  httpEventBus.on(HttpEventType.AUTH_EXPIRED, ({ message }) => {
    if (isExpiredModalShowing) return;
    isExpiredModalShowing = true;

    ElMessageBox.alert(message || '当前登录状态已失效，请重新登录', '系统安全提示', {
      confirmButtonText: '重新登录',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showClose: false,
    })
      .then(async () => {
        isExpiredModalShowing = false;
        const userStore = useUserStore();
        await userStore.resetToken();
        const currentPath = router.currentRoute.value.fullPath;
        if (!currentPath.includes('/login')) {
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      })
      .catch(() => {
        isExpiredModalShowing = false;
      });
  });
}

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getToken, getRefreshToken, setToken, setRefreshToken, removeTokens } from './auth';
import { httpEventBus, HttpEventType } from './httpEvents';
import type { ApiResponse } from '@/types/api';

let isRefreshing = false;
let requestsQueue: Array<(token: string) => void> = [];

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    httpEventBus.emit(HttpEventType.REQUEST_START, { url: config.url });
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    httpEventBus.emit(HttpEventType.REQUEST_END, {});
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    httpEventBus.emit(HttpEventType.REQUEST_END, { url: response.config.url });
    const res = response.data;

    // 200 / 201 视作业务操作成功
    if (res.code === 200 || res.code === 201) {
      return res.data;
    }

    // 业务错误：通过事件总线对外发布，不直接耦合 UI 弹窗
    httpEventBus.emit(HttpEventType.BUSINESS_ERROR, {
      code: res.code,
      message: res.message || '业务操作异常',
      data: res.data,
      url: response.config.url,
    });

    return Promise.reject(new Error(res.message || 'Business Error'));
  },
  async (error) => {
    httpEventBus.emit(HttpEventType.REQUEST_END, { url: error.config?.url });
    const originalRequest = error.config;

    // 1. 处理 401 Unauthorized 与双 Token 刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 若是登录接口自身返回 401，直接发布业务错误事件（账号或密码错误）
      if (originalRequest.url?.includes('/auth/login')) {
        httpEventBus.emit(HttpEventType.BUSINESS_ERROR, {
          code: 401,
          message: error.response.data?.message || '账号或密码错误',
          url: originalRequest.url,
        });
        return Promise.reject(error);
      }

      // 如果已经在刷新中，将当前请求放入挂起重试队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          requestsQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(service(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        removeTokens();
        httpEventBus.emit(HttpEventType.AUTH_EXPIRED, { message: '登录凭据缺失，请重新登录' });
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
          { refreshToken },
        );

        if (response.data.code === 200) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          setToken(accessToken);
          setRefreshToken(newRefreshToken);

          httpEventBus.emit(HttpEventType.TOKEN_REFRESH_SUCCESS, {
            accessToken,
            refreshToken: newRefreshToken,
          });

          // 重新执行队列中的待办请求
          requestsQueue.forEach((callback) => callback(accessToken));
          requestsQueue = [];

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return service(originalRequest);
        } else {
          throw new Error('Refresh Token Invalid');
        }
      } catch (err) {
        requestsQueue = [];
        removeTokens();
        httpEventBus.emit(HttpEventType.AUTH_EXPIRED, { message: '登录会话已过期，请重新登录' });
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. 处理 403 Forbidden
    if (error.response?.status === 403) {
      httpEventBus.emit(HttpEventType.FORBIDDEN, {
        message: error.response.data?.message || '您无权执行此操作',
        url: originalRequest?.url,
      });
      return Promise.reject(error);
    }

    // 3. 处理常规网络异常 (500 / 超时 / 离线)
    const errorMsg = error.response?.data?.message || error.message || '网络连接异常，请检查网络';
    httpEventBus.emit(HttpEventType.NETWORK_ERROR, {
      status: error.response?.status,
      message: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg,
      error,
    });

    return Promise.reject(error);
  },
);

export default service;

import request from '@/utils/request';
import type { UserEntity } from '@/types/system';

export interface CaptchaResult {
  uuid: string;
  img: string;
}

export interface CaptchaStatusResult {
  enabled: boolean;
}

export interface LoginParams {
  username: string;
  password: string;
  code?: string;
  uuid?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ProfileResult {
  user: UserEntity;
  roles: string[];
  permissions: string[];
}

// 1. 获取图形验证码
export function getCaptcha() {
  return request<any, CaptchaResult>({
    url: '/auth/captcha',
    method: 'get',
  });
}

export function getCaptchaStatus() {
  return request<any, CaptchaStatusResult>({
    url: '/auth/captcha/status',
    method: 'get',
  });
}

// 2. 账号密码登录
export function login(data: LoginParams) {
  return request<any, LoginResult>({
    url: '/auth/login',
    method: 'post',
    data,
  });
}

// 3. 刷新 Token
export function refreshToken(data: { refreshToken: string }) {
  return request<any, LoginResult>({
    url: '/auth/refresh',
    method: 'post',
    data,
  });
}

// 4. 退出登录
export function logout() {
  return request<any, { message: string }>({
    url: '/auth/logout',
    method: 'post',
  });
}

// 5. 获取当前登录用户信息与权限
export function getProfile() {
  return request<any, ProfileResult>({
    url: '/auth/profile',
    method: 'get',
  });
}

import { defineStore } from 'pinia';
import { login as loginApi, logout as logoutApi, getProfile, LoginParams } from '@/api/auth';
import { getToken, setToken, setRefreshToken, removeTokens } from '@/utils/auth';
import type { UserEntity } from '@/types/system';

interface UserState {
  token: string;
  userInfo: UserEntity | null;
  roles: string[];
  permissions: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    userInfo: null,
    roles: [],
    permissions: [],
  }),
  actions: {
    // 登录
    async login(loginForm: LoginParams) {
      const res = await loginApi(loginForm);
      this.token = res.accessToken;
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      return res;
    },

    // 获取用户信息与权限
    async getInfo() {
      const res = await getProfile();
      this.userInfo = res.user;
      this.roles = res.roles || [];
      this.permissions = res.permissions || [];
      return res;
    },

    // 退出系统
    async logout() {
      try {
        if (this.token) {
          await logoutApi();
        }
      } finally {
        this.resetToken();
      }
    },

    // 重置并清除 Token
    resetToken() {
      this.token = '';
      this.userInfo = null;
      this.roles = [];
      this.permissions = [];
      removeTokens();
    },

    // 凭据过期重置
    resetTokenAndRedirect() {
      this.resetToken();
      window.location.href = '/login';
    },
  },
});

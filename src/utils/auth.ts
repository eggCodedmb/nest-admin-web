const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export function getToken(): string {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function setToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const REMEMBER_ME_KEY = 'admin_remember_login';

export interface RememberedLogin {
  username: string;
  password?: string;
  rememberMe: boolean;
}

export function getRememberedLogin(): RememberedLogin | null {
  try {
    const raw = localStorage.getItem(REMEMBER_ME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        username: parsed.username || '',
        password: parsed.password ? atob(parsed.password) : '',
        rememberMe: Boolean(parsed.rememberMe),
      };
    }
  } catch {
    // ignore parse/decode error
  }
  return null;
}

export function setRememberedLogin(data: { username: string; password?: string; rememberMe: boolean }): void {
  try {
    const payload = {
      username: data.username,
      password: data.password ? btoa(data.password) : '',
      rememberMe: data.rememberMe,
    };
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage error
  }
}

export function removeRememberedLogin(): void {
  localStorage.removeItem(REMEMBER_ME_KEY);
}

/**
 * HTTP 核心事件枚举与 Payload 强类型约束
 */
export enum HttpEventType {
  /** 认证过期 / 刷新 Token 失败 (401) */
  AUTH_EXPIRED = 'HTTP:AUTH_EXPIRED',
  /** 权限不足，CASL/RBAC 拦截 (403) */
  FORBIDDEN = 'HTTP:FORBIDDEN',
  /** 业务逻辑错误 (code !== 200) */
  BUSINESS_ERROR = 'HTTP:BUSINESS_ERROR',
  /** 网络离线 / 超时 / 500 异常 */
  NETWORK_ERROR = 'HTTP:NETWORK_ERROR',
  /** 刷新 Token 成功 */
  TOKEN_REFRESH_SUCCESS = 'HTTP:TOKEN_REFRESH_SUCCESS',
  /** 请求生命周期开始 */
  REQUEST_START = 'HTTP:REQUEST_START',
  /** 请求生命周期结束 */
  REQUEST_END = 'HTTP:REQUEST_END',
}

export interface BusinessErrorPayload {
  code: number;
  message: string;
  data?: any;
  url?: string;
}

export interface AuthExpiredPayload {
  message: string;
  url?: string;
}

export interface NetworkErrorPayload {
  status?: number;
  message: string;
  error?: any;
}

export type HttpEventPayloadMap = {
  [HttpEventType.AUTH_EXPIRED]: AuthExpiredPayload;
  [HttpEventType.FORBIDDEN]: { message: string; url?: string };
  [HttpEventType.BUSINESS_ERROR]: BusinessErrorPayload;
  [HttpEventType.NETWORK_ERROR]: NetworkErrorPayload;
  [HttpEventType.TOKEN_REFRESH_SUCCESS]: { accessToken: string; refreshToken: string };
  [HttpEventType.REQUEST_START]: { url?: string };
  [HttpEventType.REQUEST_END]: { url?: string };
};

type EventHandler<T> = (payload: T) => void;

class HttpEventBus {
  private handlers = new Map<HttpEventType, Set<EventHandler<any>>>();

  /** 订阅事件 */
  on<K extends HttpEventType>(type: K, handler: EventHandler<HttpEventPayloadMap[K]>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  /** 取消订阅 */
  off<K extends HttpEventType>(type: K, handler: EventHandler<HttpEventPayloadMap[K]>) {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
    }
  }

  /** 发布事件 */
  emit<K extends HttpEventType>(type: K, payload: HttpEventPayloadMap[K]) {
    const set = this.handlers.get(type);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[HttpEventBus] Error in event handler for ${type}:`, e);
        }
      });
    }
  }

  /** 清空所有订阅 */
  clear() {
    this.handlers.clear();
  }
}

export const httpEventBus = new HttpEventBus();

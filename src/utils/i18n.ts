import { i18n } from '@/locales';

/**
 * 翻译路由/菜单标题
 * 若在当前语言包中存在匹配项则翻译，否则返回原始标题
 */
export function tRouteTitle(title?: string | unknown): string {
  if (!title || typeof title !== 'string') return typeof title === 'string' ? title : '';
  const key = `menu.${title}`;
  if (i18n.global.te(key)) {
    return i18n.global.t(key);
  }
  return title;
}

/**
 * 全局便捷翻译函数
 */
export function t(key: string, args?: Record<string, any>): string {
  return i18n.global.t(key, args as any);
}

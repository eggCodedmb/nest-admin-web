import { createI18n } from 'vue-i18n';
import type { App } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import 'dayjs/locale/ja';

import zhCN from './lang/zh-CN';
import enUS from './lang/en-US';
import jaJP from './lang/ja-JP';

export type LanguageType = 'zh-CN' | 'en-US' | 'ja-JP';

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
};

export const defaultLanguage: LanguageType = 'zh-CN';

export function getInitialLanguage(): LanguageType {
  const saved = localStorage.getItem('nest_language') as LanguageType;
  if (saved && messages[saved]) {
    return saved;
  }
  const browserLang = navigator.language;
  if (browserLang.startsWith('en')) {
    return 'en-US';
  }
  if (browserLang.startsWith('ja')) {
    return 'ja-JP';
  }
  return defaultLanguage;
}

export function syncDayjsLocale(lang: LanguageType) {
  const map: Record<LanguageType, string> = {
    'zh-CN': 'zh-cn',
    'en-US': 'en',
    'ja-JP': 'ja',
  };
  dayjs.locale(map[lang] || 'zh-cn');
}

const initialLang = getInitialLanguage();
syncDayjsLocale(initialLang);

export const i18n = createI18n({
  legacy: false,
  locale: initialLang,
  fallbackLocale: defaultLanguage,
  messages,
});

export function setupI18n(app: App) {
  app.use(i18n);
}

export function changeI18nLanguage(lang: LanguageType) {
  i18n.global.locale.value = lang;
  localStorage.setItem('nest_language', lang);
  syncDayjsLocale(lang);
}

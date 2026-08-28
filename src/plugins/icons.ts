import type { App } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 历史/第三方（如若依/vue-element-admin）图标名称到 Element Plus 图标组件的映射
export const legacyIconMap: Record<string, string> = {
  setting: 'Setting',
  system: 'Setting',
  user: 'User',
  users: 'UserFilled',
  peoples: 'UserFilled',
  people: 'User',
  role: 'UserFilled',
  'tree-table': 'Menu',
  tree: 'OfficeBuilding',
  dept: 'OfficeBuilding',
  dict: 'Collection',
  dictionary: 'Collection',
  edit: 'Edit',
  form: 'Document',
  log: 'Document',
  logs: 'Document',
  config: 'Tools',
  tool: 'Tools',
  tools: 'Tools',
  message: 'Message',
  nested: 'Fold',
  component: 'Menu',
  chart: 'PieChart',
  table: 'Grid',
  guide: 'Guide',
  swagger: 'Document',
  dashboard: 'Odometer',
};

function kebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase();
}

export function setupIcons(app: App) {
  // 1. 注册所有官方 Element Plus 图标组件 (PascalCase)
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);

    // 同时注册小写与中划线形式（如 user-filled, userfilled）以便于灵活匹配
    const lower = key.toLowerCase();
    const kebab = kebabCase(key);

    if (lower !== key) {
      app.component(lower, component);
    }
    if (kebab !== lower && kebab !== key) {
      app.component(kebab, component);
    }
  }

  // 2. 注册兼容别名
  for (const [alias, target] of Object.entries(legacyIconMap)) {
    const comp = (ElementPlusIconsVue as Record<string, any>)[target];
    if (comp) {
      app.component(alias, comp);
    }
  }
}

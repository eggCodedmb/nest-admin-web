import { createApp } from 'vue';
import App from './App.vue';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';

// 图标插件与样式
import { setupIcons } from './plugins/icons';
import 'virtual:uno.css';
import 'virtual:svg-icons-register';
import '@/assets/styles/index.scss';

// 路由与状态
import router from './router';
import './router/permission';
import { setupStore } from './store';

// 国际化插件
import { setupI18n } from './locales';

// 主题初始化
import { initTheme } from './utils/theme';

// 指令与发布订阅插件
import { setupDirectives } from './directive';
import { setupHttpSubscribers } from './plugins/httpSubscriber';

const app = createApp(App);

// 初始化并应用暗亮主题
initTheme();

// 注册所有图标及兼容映射
setupIcons(app);

// 注册 Store、国际化与路由
setupStore(app);
setupI18n(app);
app.use(router);
app.use(ElementPlus);

// 注册自定义权限指令 (v-hasPermi, v-hasRole)
setupDirectives(app);

// 注册网络层发布-订阅解耦监听器
setupHttpSubscribers();

app.mount('#app');

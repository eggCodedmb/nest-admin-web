import { createApp } from 'vue';
import App from './App.vue';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// 图标插件与样式
import { setupIcons } from './plugins/icons';
import 'virtual:uno.css';
import 'virtual:svg-icons-register';
import '@/assets/styles/index.scss';

// 路由与状态
import router from './router';
import './router/permission';
import { setupStore } from './store';

// 指令与发布订阅插件
import { setupDirectives } from './directive';
import { setupHttpSubscribers } from './plugins/httpSubscriber';

const app = createApp(App);

// 注册所有图标及兼容映射
setupIcons(app);

// 注册 Store 与 路由
setupStore(app);
app.use(router);
app.use(ElementPlus);

// 注册自定义权限指令 (v-hasPermi, v-hasRole)
setupDirectives(app);

// 注册网络层发布-订阅解耦监听器
setupHttpSubscribers();

app.mount('#app');

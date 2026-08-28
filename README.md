# Nest Admin Web (Vue 3 + Vite + TypeScript + Element Plus)

基于 Vue 3 + Vite 6 + TypeScript + Element Plus + Pinia 构建的企业级通用中后台前端管理系统，配套 [Nest Admin Server](https://github.com/eggCodedmb/nest-admin-server.git) 后端服务。

---

## 🌟 核心特性

- **现代技术栈**：Vue 3.5 (Composition API / `<script setup>`) + Vite 6 + TypeScript 5 + UnoCSS
- **组件库与图标**：Element Plus 2.9 + Element Plus Icons + SVG 图标自动加载 + 全局图标别名映射
- **动态权限体系**：
  - 基于后端接口动态生成路由与多级侧边栏菜单
  - 按钮级别权限控制（`v-permission` 自定义指令及 CASL Ability 规则引擎）
  - 数据权限（全部、本部门、本部门及以下、自定义、仅本人）
- **通用业务组件**：
  - `ProTable`：高度可配置的通用查询表格（内置搜索展开/收起、列显隐配置、分页联动、操作栏插槽）
  - `IconSelect`：可视化图标选择器，支持实时搜索与分页选择
- **状态管理与持久化**：Pinia + `pinia-plugin-persistedstate` 实现用户认证 Token、用户信息、系统标签页及主题设置持久化
- **网络请求封装**：Axios 深度封装，统一响应拦截、Token 无感刷新、防重复提交与全屏加载动画

---

## 🗂 项目结构

```text
src/
├── api/                # 后端接口定义 (按业务模块划分)
│   ├── auth.ts         # 认证相关 (登录/退出/验证码/刷新Token)
│   └── system/         # 系统管理 (用户/角色/部门/菜单/字典/参数/日志)
├── assets/             # 静态资源 (SVG 图标、图片、全局样式)
├── components/         # 全局通用组件 (ProTable, IconSelect 等)
├── directive/          # 自定义指令 (v-permission 等)
├── hooks/              # 通用 Composition API Hooks
├── layout/             # 系统布局 (Sidebar, Navbar, TagsView, AppMain)
├── plugins/            # 插件配置 (Element Plus, Icons 全局注册)
├── router/             # 路由配置与全局路由守卫 (权限过滤、进度条)
├── store/              # Pinia 状态管理 (user, permission, tagsView, app)
├── types/              # TypeScript 类型声明
├── utils/              # 通用工具函数 (request, auth, date, tree)
└── views/              # 业务页面
    ├── auth/           # 登录页
    ├── dashboard/      # 工作台 / 仪表盘
    └── system/         # 系统管理页面
        ├── user/       # 用户管理
        ├── role/       # 角色管理
        ├── dept/       # 部门管理
        ├── menu/       # 菜单管理
        ├── dict/       # 字典管理
        ├── config/     # 参数配置
        └── log/        # 操作与访问日志
```

---

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/eggCodedmb/nest-admin-web.git
cd nest-admin-web
```

### 2. 安装依赖

推荐使用 `pnpm`：

```bash
pnpm install
```

### 3. 配置环境变量

检查或根据实际后端服务地址修改 `.env.development`：

```env
VITE_APP_TITLE = 'NestJS Enterprise Admin'
VITE_API_BASE_URL = 'http://localhost:3000'
VITE_PORT = 5173
```

### 4. 启动开发服务器

```bash
pnpm dev
```

本地服务默认运行在 `http://localhost:5173`。

---

## 📦 生产构建

```bash
# 执行类型检查并打包生产代码
pnpm build

# 预览生产构建产物
pnpm preview
```

---

## 🔗 配套后端

- 后端仓库：[nest-admin-server](https://github.com/eggCodedmb/nest-admin-server.git)

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import UnoCSS from 'unocss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      vue(),
      UnoCSS(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Vue 核心全家桶 (精确定位，不误伤其他带 vue 名称的第三方组件)
              if (
                /[\\/]node_modules[\\/](vue|@vue|vue-router|pinia|pinia-plugin-persistedstate)[\\/]/.test(id)
              ) {
                return 'vue-vendor';
              }
              // 2. Element Plus UI 组件库及图标
              if (
                /[\\/]node_modules[\\/](element-plus|@element-plus)[\\/]/.test(id)
              ) {
                return 'element-plus';
              }
              // 3. ECharts 图表库
              if (
                /[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)
              ) {
                return 'echarts';
              }
              // 4. Markdown 编辑器相关组件与庞大子依赖单独拆分
              if (/[\\/]node_modules[\\/](@codemirror|codemirror)[\\/]/.test(id)) {
                return 'vendor-codemirror';
              }
              if (/[\\/]node_modules[\\/](highlight\.js|prismjs)[\\/]/.test(id)) {
                return 'vendor-highlight';
              }
              if (/[\\/]node_modules[\\/](katex)[\\/]/.test(id)) {
                return 'vendor-katex';
              }
              if (/[\\/]node_modules[\\/](mermaid)[\\/]/.test(id)) {
                return 'vendor-mermaid';
              }
              if (/[\\/]node_modules[\\/](md-editor-v3|markdown-it)[\\/]/.test(id)) {
                return 'md-editor';
              }
              // 5. 国际化
              if (
                /[\\/]node_modules[\\/](vue-i18n|@intlify)[\\/]/.test(id)
              ) {
                return 'i18n';
              }
              // 6. 通用工具库
              if (
                /[\\/]node_modules[\\/](axios|dayjs|lodash-es|nprogress|@casl)[\\/]/.test(id)
              ) {
                return 'vendor-utils';
              }
            }
          },
        },
      },
    },
  };
});

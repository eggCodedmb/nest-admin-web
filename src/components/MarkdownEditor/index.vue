<template>
  <div class="markdown-editor-wrapper w-full" :class="{ 'is-dark': isDark }">
    <MdEditor
      :id="editorId"
      :model-value="modelValue"
      :theme="theme || (isDark ? 'dark' : 'light')"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      :placeholder="placeholder"
      :disabled="disabled"
      :preview-only="previewOnly"
      :toolbars="toolbars"
      :style="{ height: typeof height === 'number' ? `${height}px` : height }"
      class="custom-md-editor"
      @update:model-value="handleValueChange"
      @on-html-changed="handleHtmlChange"
      @on-upload-img="handleUploadImg"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MdEditor, ToolbarNames, Themes, PreviewThemes } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { uploadFile } from '@/api/tools/storage';
import { useAppStore } from '@/store/modules/app';
import { ElMessage } from 'element-plus';

interface Props {
  modelValue?: string;
  editorId?: string;
  placeholder?: string;
  disabled?: boolean;
  previewOnly?: boolean;
  height?: string | number;
  theme?: Themes;
  previewTheme?: PreviewThemes;
  codeTheme?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  editorId: 'md-editor-instance',
  placeholder: '请输入正文 (支持 Markdown 排版，可直接粘贴或拖拽图片)...',
  disabled: false,
  previewOnly: false,
  height: '620px',
  theme: undefined,
  previewTheme: 'github',
  codeTheme: 'atom',
});

const appStore = useAppStore();
const isDark = computed(() => appStore.theme === 'dark');

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'htmlChanged', html: string): void;
}>();

const toolbars: ToolbarNames[] = [
  'bold',
  'underline',
  'italic',
  '-',
  'title',
  'strikeThrough',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog',
];

const handleValueChange = (val: string) => {
  emit('update:modelValue', val);
};

const handleHtmlChange = (html: string) => {
  emit('htmlChanged', html);
};

const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  try {
    const uploadPromises = files.map(async (file) => {
      const res: any = await uploadFile(file);
      return res?.url || res?.data?.url || '';
    });
    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter((url) => !!url);
    callback(validUrls);
    if (validUrls.length > 0) {
      ElMessage.success(`成功上传 ${validUrls.length} 张图片`);
    }
  } catch (error) {
    ElMessage.error('图片上传失败，请重试');
  }
};
</script>

<style scoped>
.markdown-editor-wrapper {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 编辑器整体外边框与圆角 */
:deep(.md-editor) {
  border-radius: 12px;
  border-color: var(--el-border-color-lighter);
  font-family: inherit;
}

/* 工具栏容器尺寸调大与内边距优化 */
:deep(.md-editor-toolbar-wrapper) {
  padding: 6px 10px;
  min-height: 48px;
  background-color: #fafafa;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
}

/* 单个工具栏图标按钮尺寸调大 */
:deep(.md-editor-toolbar-item) {
  width: 34px !important;
  height: 34px !important;
  margin: 0 2px !important;
  border-radius: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #4b5563 !important;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.md-editor-toolbar-item:hover) {
  background-color: rgba(0, 0, 0, 0.07) !important;
  color: var(--el-color-primary) !important;
  transform: translateY(-1px);
}

:deep(.md-editor-toolbar-item:active) {
  transform: translateY(0);
}

/* 工具栏 SVG 图标放大 */
:deep(.md-editor-toolbar-item .md-editor-icon),
:deep(.md-editor-toolbar-item svg) {
  width: 20px !important;
  height: 20px !important;
  font-size: 20px !important;
}

/* 分隔线调大优化 */
:deep(.md-editor-toolbar-divider) {
  height: 22px !important;
  margin: 0 6px !important;
  border-left: 1px solid var(--el-border-color-lighter);
  opacity: 0.7;
}

/* 下拉菜单（如标题 H1-H6 等）样式优化 */
:deep(.md-editor-dropdown) {
  border-radius: 10px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  padding: 6px !important;
}

:deep(.md-editor-menu-item) {
  border-radius: 6px !important;
  padding: 6px 12px !important;
  font-size: 14px !important;
  transition: background-color 0.2s;
}

/* 暗色模式适配 (Dark Mode) */
.markdown-editor-wrapper.is-dark :deep(.md-editor) {
  border-color: #28282c;
  background-color: #18181c;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-toolbar-wrapper) {
  background-color: #1f1f24;
  border-bottom-color: #28282c;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-toolbar-item) {
  color: #9ca3af !important;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-toolbar-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #60a5fa !important;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-toolbar-divider) {
  border-left-color: #374151;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-content) {
  background-color: #18181c;
}

.markdown-editor-wrapper.is-dark :deep(.md-editor-preview) {
  background-color: #18181c;
  color: #e5eaf3;
}
</style>

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
  border-radius: 6px;
  overflow: hidden;
}
:deep(.md-editor) {
  border-radius: 6px;
  border-color: var(--el-border-color-lighter);
}
.markdown-editor-wrapper.is-dark :deep(.md-editor) {
  border-color: #28282c;
  background-color: #18181c;
}
.markdown-editor-wrapper.is-dark :deep(.md-editor-toolbar-wrapper) {
  background-color: #1f1f24;
  border-bottom-color: #28282c;
}
.markdown-editor-wrapper.is-dark :deep(.md-editor-content) {
  background-color: #18181c;
}
.markdown-editor-wrapper.is-dark :deep(.md-editor-preview) {
  background-color: #18181c;
  color: #e5eaf3;
}
</style>

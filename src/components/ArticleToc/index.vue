<template>
  <div class="article-toc-panel bg-gray-50/70 dark:bg-dark-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-3 w-full">
    <div class="toc-header font-bold text-gray-700 dark:text-gray-200 text-sm mb-3 flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
      <div class="flex items-center gap-1.5">
        <el-icon class="text-primary text-base"><Operation /></el-icon>
        <span>文章大纲目录</span>
      </div>
      <el-tag v-if="flatList.length > 0" size="small" type="info" round>{{ flatList.length }} 节</el-tag>
    </div>

    <!-- 方案1: 若绑定了 editorId，则直接使用 MdCatalog 原生高亮大纲 -->
    <div v-if="editorId" class="md-catalog-box">
      <el-scrollbar :max-height="maxHeight">
        <MdCatalog
          :editor-id="editorId"
          :scroll-element="scrollElement"
          :theme="isDark ? 'dark' : 'light'"
        />
      </el-scrollbar>
    </div>

    <!-- 方案2: 纯 TOC JSON 数据渲染 (支持平滑跳转与自适应缩进) -->
    <div v-else>
      <el-scrollbar :max-height="maxHeight">
        <div v-if="flatList.length === 0" class="text-gray-400 dark:text-gray-500 text-xs py-4 text-center">
          暂无章节大纲
        </div>
        <ul v-else class="toc-tree space-y-1 pr-2">
          <li
            v-for="item in flatList"
            :key="item.id"
            :class="[
              'toc-item cursor-pointer text-xs py-1.5 px-2 rounded transition-all duration-150 truncate select-none',
              activeId === item.id
                ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium border-l-2 border-primary'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100/80 dark:hover:bg-gray-700/60',
            ]"
            :style="{ paddingLeft: `${Math.max(0, item.level - 1) * 14 + 8}px` }"
            :title="item.text"
            @click="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </li>
        </ul>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MdCatalog } from 'md-editor-v3';
import { Operation } from '@element-plus/icons-vue';
import { useAppStore } from '@/store/modules/app';
import type { TocItem } from '@/types/article';

interface Props {
  editorId?: string;
  scrollElement?: string | HTMLElement;
  tocData?: TocItem[];
  maxHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  editorId: '',
  scrollElement: undefined,
  tocData: () => [],
  maxHeight: '520px',
});

const appStore = useAppStore();
const isDark = computed(() => appStore.theme === 'dark');

const activeId = ref<string>('');

const flatList = computed(() => {
  const result: { id: string; text: string; level: number }[] = [];
  const traverse = (items: TocItem[]) => {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      result.push({ id: item.id, text: item.text, level: item.level });
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  };
  traverse(props.tocData);
  return result;
});

const scrollToHeading = (id: string) => {
  activeId.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>

<style scoped>
.article-toc-panel {
  box-sizing: border-box;
}
:deep(.md-editor-catalog) {
  font-size: 13px;
}
:deep(.md-editor-catalog-dark) {
  color: #c0c4cc;
}
:deep(.md-editor-catalog-dark .md-editor-catalog-active > span) {
  color: var(--el-color-primary, #409eff);
}
</style>

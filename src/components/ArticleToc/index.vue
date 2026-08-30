<template>
  <div class="article-toc-panel bg-gray-50/70 dark:bg-dark-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-3 w-full">
    <div class="toc-header font-bold text-gray-700 dark:text-gray-200 text-sm mb-3 flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
      <div class="flex items-center gap-1.5">
        <el-icon class="text-primary text-base"><Operation /></el-icon>
        <span>文章大纲目录</span>
      </div>
      <el-tag v-if="flatList.length > 0" size="small" type="info" round>{{ flatList.length }} 节</el-tag>
    </div>

    <!-- 方案1: 若绑定了 editorId，使用 MdCatalog 原生大纲并绑定高精度滑块定位与智能平滑跳转 -->
    <div v-if="editorId" class="md-catalog-box" @click.capture="handleContainerClick">
      <el-scrollbar :max-height="maxHeight">
        <MdCatalog
          :editor-id="editorId"
          :scroll-element="scrollElement"
          :theme="isDark ? 'dark' : 'light'"
          :on-click="handleCatalogClick"
          :on-active="handleCatalogActive"
          @on-click="handleCatalogClick"
          @on-active="handleCatalogActive"
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
            v-for="(item, idx) in flatList"
            :key="item.id || idx"
            :class="[
              'toc-item cursor-pointer text-xs py-1.5 px-2 rounded transition-all duration-150 truncate select-none',
              activeId === item.id
                ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium border-l-2 border-primary'
                : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100/80 dark:hover:bg-gray-700/60',
            ]"
            :style="{ paddingLeft: `${Math.max(0, item.level - 1) * 14 + 8}px` }"
            :title="item.text"
            @click="scrollToHeadingByItem(item, idx + 1)"
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

// 字符串纯净归一化工具函数
const cleanText = (str: string) => {
  return (str || '')
    .replace(/[\s\u00A0\u200B#*_~`]/g, '')
    .toLowerCase();
};

// 查找目标标题 DOM 元素 (四重精准探测)
const findHeadingElement = (item: { text?: string; id?: string; index?: number }): HTMLElement | null => {
  const root = props.editorId ? document.getElementById(props.editorId) : document;
  if (!root) return null;

  const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
  if (headings.length === 0) {
    const globalHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    if (globalHeadings.length === 0) return null;
    headings.push(...globalHeadings);
  }

  const targetText = cleanText(item.text || '');

  // 1. 按精准序号探测 (如果 item.index 有效)
  if (typeof item.index === 'number' && item.index >= 1 && item.index <= headings.length) {
    const candidate = headings[item.index - 1];
    const candidateText = cleanText(candidate.textContent || '');
    if (!targetText || candidateText.includes(targetText) || targetText.includes(candidateText)) {
      return candidate;
    }
  }

  // 2. 按归一化文本包含或完全相等探测
  if (targetText) {
    for (const h of headings) {
      const hText = cleanText(h.textContent || '');
      if (hText === targetText || hText.includes(targetText) || targetText.includes(hText)) {
        return h;
      }
    }
  }

  // 3. 按 ID 探测
  if (item.id) {
    const byId = document.getElementById(item.id);
    if (byId) return byId;
  }
  if (item.text) {
    const byTextId = document.getElementById(item.text);
    if (byTextId) return byTextId;
  }

  // 4. 若 index 在合理范围内，直接取第 N 个标题
  if (typeof item.index === 'number' && item.index >= 1 && item.index <= headings.length) {
    return headings[item.index - 1];
  }

  return null;
};

// 通用平滑滚动执行器
const performSmoothScroll = (targetEle: HTMLElement) => {
  let container: HTMLElement | null = null;
  if (typeof props.scrollElement === 'string') {
    container = document.querySelector(props.scrollElement);
  } else if (props.scrollElement instanceof HTMLElement) {
    container = props.scrollElement;
  }

  if (!container) {
    let parent = targetEle.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        container = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }

  if (container) {
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEle.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;
    const targetOffset = targetRect.top - containerRect.top + currentScrollTop;
    container.scrollTo({
      top: Math.max(0, targetOffset - 16),
      behavior: 'smooth',
    });
  } else {
    targetEle.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// 🎯 高精度滑块 (md-editor-catalog-indicator) 坐标纠偏与校准算法
const handleCatalogActive = (_tocItem: any, ele: HTMLElement) => {
  if (!ele) return;
  const catalogBox = ele.closest('.md-editor-catalog') as HTMLElement;
  const indicator = catalogBox?.querySelector('.md-editor-catalog-indicator') as HTMLElement;

  if (catalogBox && indicator) {
    const boxRect = catalogBox.getBoundingClientRect();
    const spanEle = ele.querySelector(':scope > span') || ele;
    const spanRect = spanEle.getBoundingClientRect();

    // 智能计算相对目录外框的真实像素偏移量，精准居中于文字行高
    const exactTop = spanRect.top - boxRect.top + Math.max(0, (spanRect.height - 18) / 2);
    indicator.style.top = `${exactTop}px`;
    indicator.style.display = 'block';
  }
};

// 方案1: MdCatalog 点击回调
const handleCatalogClick = (e: MouseEvent, item: any) => {
  e.preventDefault();
  e.stopPropagation();
  const targetEle = findHeadingElement(item);
  if (targetEle) {
    performSmoothScroll(targetEle);
  }
};

// 方案1 兜底: 捕获容器点击事件
const handleContainerClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const linkWrapper = target.closest('.md-editor-catalog-link') as HTMLElement;
  const rawText = (linkWrapper?.querySelector('span')?.textContent || target.textContent || '').trim();

  if (rawText) {
    let index: number | undefined;
    if (linkWrapper) {
      const allLinks = Array.from(document.querySelectorAll('.md-editor-catalog-link'));
      const idx = allLinks.indexOf(linkWrapper);
      if (idx !== -1) {
        index = idx + 1;
      }
    }

    const targetEle = findHeadingElement({ text: rawText, index });
    if (targetEle) {
      e.preventDefault();
      e.stopPropagation();
      performSmoothScroll(targetEle);
    }
  }
};

// 方案2: 纯 JSON 大纲点击跳转
const scrollToHeadingByItem = (item: { text: string; id?: string }, index: number) => {
  activeId.value = item.id || '';
  const targetEle = findHeadingElement({ text: item.text, id: item.id, index });
  if (targetEle) {
    performSmoothScroll(targetEle);
  }
};
</script>

<style scoped>
.article-toc-panel {
  box-sizing: border-box;
}
:deep(.md-editor-catalog) {
  font-size: 13px;
  position: relative;
}
:deep(.md-editor-catalog-link) {
  cursor: pointer !important;
  transition: all 0.2s ease;
  border-radius: 6px;
  padding: 4px 6px !important;
}
:deep(.md-editor-catalog-link:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
.article-toc-panel:has(.md-editor-catalog-dark) :deep(.md-editor-catalog-link:hover) {
  background-color: rgba(255, 255, 255, 0.06);
}

/* 🎯 指示器滑块精准优化 */
:deep(.md-editor-catalog-indicator) {
  width: 3.5px !important;
  height: 18px !important;
  border-radius: 4px !important;
  background-color: var(--el-color-primary, #409eff) !important;
  left: 0 !important;
  transition: top 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 🎯 当前激活项的文字高亮与柔和背景胶囊 */
:deep(.md-editor-catalog-active > span) {
  color: var(--el-color-primary, #409eff) !important;
  font-weight: 600 !important;
}
:deep(.md-editor-catalog-active) {
  background-color: rgba(64, 158, 255, 0.08) !important;
}

/* 暗色模式适配 (Dark Mode) */
:deep(.md-editor-catalog-dark) {
  color: #9ca3af;
}
:deep(.md-editor-catalog-dark .md-editor-catalog-active) {
  background-color: rgba(64, 158, 255, 0.16) !important;
}
:deep(.md-editor-catalog-dark .md-editor-catalog-active > span) {
  color: #60a5fa !important;
}
</style>

<template>
  <div class="article-editor-page min-h-screen bg-gray-50/60 dark:bg-dark-950 flex flex-col">
    <!-- 1. 顶部极简毛玻璃导航栏 (Zen Navbar) -->
    <header class="zen-header sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-dark-900/85 border-b border-gray-200/70 dark:border-gray-800/80 px-4 lg:px-8 py-2.5 transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <!-- 左侧：返回 + 面包屑与状态指示 -->
        <div class="flex items-center gap-3 min-w-0">
          <el-button
            link
            class="back-btn p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-gray-300"
            @click="handleBack"
          >
            <el-icon :size="18"><Back /></el-icon>
          </el-button>

          <div class="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          <div class="flex items-center gap-2 min-w-0">
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {{ form.id ? '编辑文章' : '撰写新文章' }}
            </span>

            <span
              class="status-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusBadgeClass"
            >
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="statusDotClass" />
              {{ getStatusText(form.status) }}
            </span>
          </div>

          <!-- 统计指标 (字数 & 预估阅读耗时) -->
          <div class="hidden md:flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 pl-2">
            <span>{{ wordCount }} 字</span>
            <span>·</span>
            <span>约 {{ readTime }} 分钟阅读</span>
          </div>
        </div>

        <!-- 右侧：操作按钮组 -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- 大纲显隐切换 -->
          <el-tooltip :content="showToc ? '收起大纲' : '展开大纲'" placement="bottom">
            <el-button
              circle
              size="small"
              :type="showToc ? 'primary' : 'default'"
              :plain="!showToc"
              @click="showToc = !showToc"
            >
              <el-icon><Operation /></el-icon>
            </el-button>
          </el-tooltip>

          <!-- 属性设置抽屉触发按钮 -->
          <el-badge :is-dot="!form.categoryId" class="settings-badge">
            <el-button
              size="small"
              class="rounded-lg gap-1"
              :type="drawerVisible ? 'primary' : 'default'"
              :plain="!drawerVisible"
              @click="drawerVisible = true"
            >
              <el-icon><Setting /></el-icon>
              <span class="hidden sm:inline">发布设置</span>
            </el-button>
          </el-badge>

          <div class="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

          <!-- 保存草稿 -->
          <el-button
            size="small"
            class="rounded-lg"
            :loading="draftLoading"
            @click="handleSaveDraft"
          >
            保存草稿
          </el-button>

          <!-- 提交审核 -->
          <el-button
            size="small"
            type="warning"
            class="rounded-lg shadow-sm"
            :loading="submitLoading"
            @click="handleSubmitAudit"
          >
            提交审核
          </el-button>

          <!-- 直接发布 (需要权限) -->
          <el-button
            v-hasPermi="['article:post:publish']"
            size="small"
            type="primary"
            class="rounded-lg shadow-sm font-medium"
            :loading="publishLoading"
            @click="handleDirectPublish"
          >
            直接发布
          </el-button>
        </div>
      </div>
    </header>

    <!-- 2. 主体创作画布 (Focus Writing Canvas) -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex gap-6 items-start">
      <!-- 左侧主编辑区域 -->
      <div class="flex-1 min-w-0 bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 p-6 lg:p-8 space-y-6 transition-colors">
        <!-- 无界大标题输入框 (Notion 沉浸式风格) -->
        <div class="title-wrapper border-b border-gray-100 dark:border-gray-800/80 pb-4">
          <input
            v-model="form.title"
            type="text"
            placeholder="输入文章大标题..."
            maxlength="120"
            class="w-full text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0 transition-colors"
          />
          <div class="flex items-center justify-between text-xs text-gray-400 mt-2">
            <span v-if="form.summary" class="truncate max-w-xl text-gray-500 dark:text-gray-400 italic">
              摘要：{{ form.summary }}
            </span>
            <span v-else class="text-gray-300 dark:text-gray-600">未设置摘要（可在右侧设置中一键提取）</span>
            <span class="ml-auto flex-shrink-0">{{ form.title.length }}/120</span>
          </div>
        </div>

        <!-- Markdown 编辑器组件 -->
        <div class="editor-container">
          <MarkdownEditor
            editor-id="post-markdown-editor"
            v-model="form.content"
            height="720px"
            placeholder="开始撰写您的精彩内容 (支持 Markdown、表格、数学公式、图表，可直接粘贴或拖拽图片)..."
            @html-changed="handleHtmlChanged"
          />
        </div>
      </div>

      <!-- 右侧浮动章节目录 (TOC) -->
      <aside
        v-if="showToc"
        class="w-64 lg:w-72 sticky top-20 flex-shrink-0 transition-all duration-300"
      >
        <div class="bg-white dark:bg-dark-900 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 p-3.5">
          <ArticleToc editor-id="post-markdown-editor" max-height="680px" />
        </div>
      </aside>
    </main>

    <!-- 3. 文章属性配置抽屉 (Slide-over Settings Drawer) -->
    <el-drawer
      v-model="drawerVisible"
      title="文章发布属性设置"
      size="420px"
      direction="rtl"
      class="article-settings-drawer"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="space-y-4 px-1">
        <!-- 1. 所属分类 -->
        <el-form-item label="所属技术分类" prop="categoryId" required>
          <el-tree-select
            v-model="form.categoryId"
            :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            value-key="id"
            placeholder="请选择所属技术分类"
            check-strictly
            clearable
            class="w-full"
          />
        </el-form-item>

        <!-- 2. 文章封面 -->
        <el-form-item label="文章封面大图">
          <div class="w-full">
            <div
              v-if="form.coverImage"
              class="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-dark-800 aspect-video flex items-center justify-center"
            >
              <img :src="form.coverImage" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <el-button size="small" type="danger" circle icon="Delete" @click="form.coverImage = ''" />
              </div>
            </div>

            <el-upload
              v-else
              :show-file-list="false"
              :http-request="customUploadCover"
              class="w-full"
            >
              <div class="w-full aspect-video border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-50/50 dark:bg-dark-800/40 hover:bg-primary/5">
                <div class="p-3 rounded-full bg-primary/10 text-primary mb-1.5">
                  <el-icon class="text-xl"><Plus /></el-icon>
                </div>
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300">点击或拖拽上传封面</span>
                <span class="text-[11px] text-gray-400 mt-0.5">推荐 16:9 高清配图 (PNG/JPG)</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <!-- 3. 文章摘要 -->
        <el-form-item label="文章摘要">
          <div class="w-full space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">用于列表卡片展示与 SEO 检索</span>
              <el-button
                link
                type="primary"
                size="small"
                class="text-xs gap-1"
                @click="handleAutoSummary"
              >
                <el-icon><MagicStick /></el-icon>
                从正文自动提取
              </el-button>
            </div>
            <el-input
              v-model="form.summary"
              type="textarea"
              :rows="3"
              placeholder="概括文章核心要点 (未填写时将自动提取正文首段)..."
              maxlength="500"
              show-word-limit
            />
          </div>
        </el-form-item>

        <!-- 4. 标签与自定义别名 -->
        <div class="grid grid-cols-1 gap-4 pt-1">
          <el-form-item label="文章标签 (Tags)">
            <el-input
              v-model="form.tags"
              placeholder="多个标签用英文逗号分隔，如: Vue3,NestJS"
            />
          </el-form-item>

          <el-form-item label="自定义访问路径 (Slug)">
            <el-input
              v-model="form.slug"
              placeholder="例如: vue3-reactive-guide"
            >
              <template #prefix>
                <span class="text-xs text-gray-400">/post/</span>
              </template>
            </el-input>
          </el-form-item>
        </div>

        <el-divider class="!my-3" />

        <!-- 5. 运营开关卡片组 -->
        <div class="space-y-3 bg-gray-50 dark:bg-dark-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
          <span class="text-xs font-bold text-gray-700 dark:text-gray-300 block">运营属性</span>

          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm text-gray-800 dark:text-gray-200">置顶展示</span>
              <span class="text-[11px] text-gray-400">在文章列表首屏置顶高亮</span>
            </div>
            <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm text-gray-800 dark:text-gray-200">编辑推荐</span>
              <span class="text-[11px] text-gray-400">标记为推荐精选文章</span>
            </div>
            <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm text-gray-800 dark:text-gray-200">允许读者评论</span>
              <span class="text-[11px] text-gray-400">控制文章底部互动评论区</span>
            </div>
            <el-switch v-model="form.allowComment" :active-value="1" :inactive-value="0" />
          </div>
        </div>

        <!-- 6. 来源类型 -->
        <div class="space-y-2 pt-1">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300 block">内容来源</span>
          <el-radio-group v-model="form.sourceType" class="w-full">
            <el-radio-button
              v-for="dict in art_source_type"
              :key="dict.dictValue"
              :value="Number(dict.dictValue)"
            >
              {{ dict.dictLabel }}
            </el-radio-button>
          </el-radio-group>

          <el-input
            v-if="form.sourceType !== 1"
            v-model="form.sourceUrl"
            placeholder="请填写原文权威链接 https://..."
            class="mt-2"
          />
        </div>
      </el-form>

      <template #footer>
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <el-button @click="drawerVisible = false">完成设置</el-button>
          <el-button type="primary" @click="handleSaveDraft">保存并应用</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import {
  Back,
  Plus,
  Delete,
  Setting,
  Operation,
  MagicStick,
} from '@element-plus/icons-vue';
import MarkdownEditor from '@/components/MarkdownEditor/index.vue';
import ArticleToc from '@/components/ArticleToc/index.vue';
import { getCategoryTree } from '@/api/article/category';
import { getArticle, createArticle, updateArticle, submitArticleAudit } from '@/api/article/post';
import { uploadFile } from '@/api/tools/storage';
import { useDict } from '@/hooks/useDict';

const route = useRoute();
const router = useRouter();

const { art_source_type } = useDict('art_source_type');

const categoryTree = ref<any[]>([]);
const draftLoading = ref(false);
const submitLoading = ref(false);
const publishLoading = ref(false);
const drawerVisible = ref(false);
const showToc = ref(true);
const formRef = ref<FormInstance>();

const form = reactive({
  id: undefined as number | undefined,
  title: '',
  categoryId: undefined as number | undefined,
  summary: '',
  coverImage: '',
  content: '',
  contentHtml: '',
  tags: '',
  slug: '',
  isTop: 0,
  isRecommend: 0,
  allowComment: 1,
  sourceType: 1,
  sourceUrl: '',
  status: 0,
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入文章大标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
};

const wordCount = computed(() => {
  if (!form.content) return 0;
  return form.content.replace(/\s+/g, '').length;
});

const readTime = computed(() => {
  const count = wordCount.value;
  return Math.max(1, Math.ceil(count / 400));
});

const statusBadgeClass = computed(() => {
  switch (form.status) {
    case 1:
      return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
    case 2:
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    case 3:
      return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
    case 4:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
  }
});

const statusDotClass = computed(() => {
  switch (form.status) {
    case 1:
      return 'bg-amber-500';
    case 2:
      return 'bg-emerald-500';
    case 3:
      return 'bg-rose-500';
    case 4:
      return 'bg-gray-400';
    default:
      return 'bg-blue-500';
  }
});

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '草稿箱',
    1: '待审核',
    2: '已发布',
    3: '已驳回',
    4: '已下架',
  };
  return map[status] || '草稿箱';
};

const loadCategoryData = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
};

const loadArticleDetail = async (id: number) => {
  const res: any = await getArticle(id);
  Object.assign(form, {
    id: Number(res.id),
    title: res.title || '',
    categoryId: res.categoryId ? Number(res.categoryId) : undefined,
    summary: res.summary || '',
    coverImage: res.coverImage || '',
    content: res.content || '',
    contentHtml: res.contentHtml || '',
    tags: res.tags || '',
    slug: res.slug || '',
    isTop: res.isTop ?? 0,
    isRecommend: res.isRecommend ?? 0,
    allowComment: res.allowComment ?? 1,
    sourceType: res.sourceType ?? 1,
    sourceUrl: res.sourceUrl || '',
    status: res.status ?? 0,
  });
};

const handleHtmlChanged = (html: string) => {
  form.contentHtml = html;
};

const handleAutoSummary = () => {
  if (!form.content) {
    ElMessage.warning('正文为空，无法提取摘要');
    return;
  }
  const clean = form.content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`*_\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  form.summary = clean.slice(0, 150);
  ElMessage.success('已自动提取前 150 字作为摘要');
};

const customUploadCover = async (options: any) => {
  try {
    const res: any = await uploadFile(options.file);
    form.coverImage = res?.url || res?.data?.url || '';
    ElMessage.success('封面图片上传成功');
  } catch {
    ElMessage.error('封面上传失败');
  }
};

const buildSubmitPayload = (customStatus?: number) => {
  return {
    title: form.title,
    categoryId: Number(form.categoryId),
    summary: form.summary || '',
    coverImage: form.coverImage || '',
    content: form.content || '',
    contentHtml: form.contentHtml || '',
    tags: form.tags || '',
    slug: form.slug || '',
    isTop: Number(form.isTop ?? 0),
    isRecommend: Number(form.isRecommend ?? 0),
    allowComment: Number(form.allowComment ?? 1),
    sourceType: Number(form.sourceType ?? 1),
    sourceUrl: form.sourceUrl || '',
    status: customStatus !== undefined ? customStatus : Number(form.status ?? 0),
  };
};

const handleSaveDraft = async () => {
  if (!form.title) {
    ElMessage.warning('请至少填写文章标题');
    return;
  }
  if (!form.categoryId) {
    drawerVisible.value = true;
    ElMessage.warning('请在右侧设置中选择所属分类');
    return;
  }
  draftLoading.value = true;
  try {
    const payload = buildSubmitPayload(0);
    if (form.id) {
      await updateArticle(form.id, payload);
      ElMessage.success('草稿更新成功');
    } else {
      const res: any = await createArticle(payload);
      form.id = Number(res.id);
      ElMessage.success('草稿保存成功');
    }
  } finally {
    draftLoading.value = false;
  }
};

const handleSubmitAudit = async () => {
  if (!form.title) {
    ElMessage.warning('请填写文章大标题');
    return;
  }
  if (!form.categoryId) {
    drawerVisible.value = true;
    ElMessage.warning('请在右侧设置中选择所属分类');
    return;
  }
  submitLoading.value = true;
  try {
    let articleId = form.id;
    const payload = buildSubmitPayload(0);
    if (articleId) {
      await updateArticle(articleId, payload);
    } else {
      const res: any = await createArticle(payload);
      articleId = Number(res.id);
      form.id = articleId;
    }
    await submitArticleAudit(articleId!);
    ElMessage.success('文章已成功提交审核，请等待审批');
    router.push('/article/post');
  } finally {
    submitLoading.value = false;
  }
};

const handleDirectPublish = async () => {
  if (!form.title) {
    ElMessage.warning('请填写文章大标题');
    return;
  }
  if (!form.categoryId) {
    drawerVisible.value = true;
    ElMessage.warning('请在右侧设置中选择所属分类');
    return;
  }
  publishLoading.value = true;
  try {
    const payload = buildSubmitPayload(2);
    if (form.id) {
      await updateArticle(form.id, payload);
      ElMessage.success('文章发布成功');
    } else {
      const res: any = await createArticle(payload);
      form.id = Number(res.id);
      ElMessage.success('文章发布成功');
    }
    router.push('/article/post');
  } finally {
    publishLoading.value = false;
  }
};

const handleBack = () => {
  router.push('/article/post');
};

onMounted(() => {
  loadCategoryData();
  const editId = route.query.id ? Number(route.query.id) : undefined;
  if (editId) {
    loadArticleDetail(editId);
  }
});
</script>

<style scoped>
.zen-header {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}
.title-wrapper input::placeholder {
  font-weight: 700;
}
:deep(.article-settings-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 700;
}
:deep(.article-settings-drawer .el-drawer__body) {
  padding: 16px 20px;
}
</style>

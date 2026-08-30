<template>
  <div class="article-edit-container p-4 bg-gray-50 min-h-screen">
    <!-- 顶部操作条 (Sticky) -->
    <div class="sticky top-0 z-10 bg-white shadow-sm rounded-lg p-3.5 mb-4 flex items-center justify-between border border-gray-100">
      <div class="flex items-center gap-3">
        <el-button icon="Back" @click="handleBack">返回列表</el-button>
        <span class="text-base font-bold text-gray-800">
          {{ form.id ? '编辑文章' : '撰写新文章' }}
        </span>
        <el-tag v-if="form.status !== undefined" size="small" :type="getStatusTagType(form.status)">
          {{ getStatusText(form.status) }}
        </el-tag>
      </div>

      <div class="flex items-center gap-2">
        <el-button :loading="draftLoading" @click="handleSaveDraft">
          保存草稿
        </el-button>
        <el-button type="warning" :loading="submitLoading" @click="handleSubmitAudit">
          提交审核
        </el-button>
        <el-button v-hasPermi="['article:post:publish']" type="primary" :loading="publishLoading" @click="handleDirectPublish">
          直接发布
        </el-button>
      </div>
    </div>

    <!-- 表单主体 -->
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <!-- 左侧核心编辑区 (占 3 列) -->
        <div class="xl:col-span-3 space-y-4">
          <!-- 标题输入卡片 -->
          <el-card shadow="never" class="border-gray-100">
            <el-form-item label="文章标题" prop="title" class="mb-0">
              <el-input
                v-model="form.title"
                size="large"
                placeholder="请输入文章标题 (建议30字以内)..."
                maxlength="120"
                show-word-limit
              />
            </el-form-item>
          </el-card>

          <!-- Markdown 编辑器与浮动大纲卡片 -->
          <el-card shadow="never" class="border-gray-100">
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- Markdown 核心编辑器组件 -->
              <div class="flex-1 min-w-0">
                <el-form-item label="文章正文 (Markdown 格式)" prop="content" class="mb-0">
                  <MarkdownEditor
                    editor-id="post-markdown-editor"
                    v-model="form.content"
                    height="700px"
                    placeholder="输入 Markdown 正文，支持表格、代码块、数学公式，可直接粘贴/拖拽图片..."
                    @html-changed="handleHtmlChanged"
                  />
                </el-form-item>
              </div>

              <!-- 右侧实时章节大纲 (TOC) -->
              <div class="w-full lg:w-64 flex-shrink-0">
                <ArticleToc editor-id="post-markdown-editor" max-height="660px" />
              </div>
            </div>
          </el-card>

          <!-- 摘要卡片 -->
          <el-card shadow="never" class="border-gray-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">文章摘要</span>
              <el-button link type="primary" size="small" @click="handleAutoSummary">从正文自动提取</el-button>
            </div>
            <el-form-item prop="summary" class="mb-0">
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="简要概括文章主旨，未填写时系统将自动提取正文首段..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-card>
        </div>

        <!-- 右侧元数据配置侧边栏 (占 1 列) -->
        <div class="xl:col-span-1 space-y-4">
          <!-- 分类与封面 -->
          <el-card shadow="never" class="border-gray-100">
            <template #header>
              <span class="font-bold text-gray-800 text-sm">发布属性配置</span>
            </template>

            <el-form-item label="所属分类" prop="categoryId">
              <el-tree-select
                v-model="form.categoryId"
                :data="categoryTree"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                value-key="id"
                placeholder="选择文章分类"
                check-strictly
                class="w-full"
              />
            </el-form-item>

            <el-form-item label="文章封面" prop="coverImage">
              <div class="w-full">
                <div v-if="form.coverImage" class="relative group mb-2">
                  <img :src="form.coverImage" class="w-full h-36 object-cover rounded-lg border border-gray-200" />
                  <div
                    class="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity"
                  >
                    <el-button size="small" type="danger" circle icon="Delete" @click="form.coverImage = ''" />
                  </div>
                </div>
                <el-upload
                  v-else
                  :show-file-list="false"
                  :http-request="customUploadCover"
                  class="w-full"
                >
                  <div class="w-full h-32 border-2 border-dashed border-gray-200 hover:border-primary rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                    <el-icon class="text-2xl text-gray-400"><Plus /></el-icon>
                    <span class="text-xs text-gray-500 mt-1">上传封面图片</span>
                  </div>
                </el-upload>
              </div>
            </el-form-item>

            <el-form-item label="文章标签 (Tags)">
              <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如: NestJS,Vue3" />
            </el-form-item>

            <el-form-item label="自定义 Slug (URL)">
              <el-input v-model="form.slug" placeholder="例如: nestjs-vue3-guide" />
            </el-form-item>
          </el-card>

          <!-- 运营开关配置 -->
          <el-card shadow="never" class="border-gray-100">
            <template #header>
              <span class="font-bold text-gray-800 text-sm">运营与来源</span>
            </template>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">置顶文章</span>
                <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">推荐文章</span>
                <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-700">允许评论</span>
                <el-switch v-model="form.allowComment" :active-value="1" :inactive-value="0" />
              </div>

              <el-divider class="my-2" />

              <el-form-item label="内容来源" class="mb-2">
                <el-radio-group v-model="form.sourceType">
                  <el-radio :value="1">原创</el-radio>
                  <el-radio :value="2">转载</el-radio>
                  <el-radio :value="3">翻译</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="form.sourceType !== 1" label="原文链接">
                <el-input v-model="form.sourceUrl" placeholder="https://..." />
              </el-form-item>
            </div>
          </el-card>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Plus, Back } from '@element-plus/icons-vue';
import MarkdownEditor from '@/components/MarkdownEditor/index.vue';
import ArticleToc from '@/components/ArticleToc/index.vue';
import { getCategoryTree } from '@/api/article/category';
import { getArticle, createArticle, updateArticle, submitArticleAudit } from '@/api/article/post';
import { uploadFile } from '@/api/tools/storage';
import type { ArticleEntity } from '@/types/article';

const route = useRoute();
const router = useRouter();

const categoryTree = ref<any[]>([]);
const draftLoading = ref(false);
const submitLoading = ref(false);
const publishLoading = ref(false);
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
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
  content: [{ required: true, message: '文章正文不能为空', trigger: 'blur' }],
};

const getStatusTagType = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'info',
  };
  return map[status] || 'info';
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '草稿',
    1: '待审核',
    2: '已发布',
    3: '已驳回',
    4: '已下架',
  };
  return map[status] || '草稿';
};

const loadCategoryData = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
};

const loadArticleDetail = async (id: number) => {
  const res: any = await getArticle(id);
  Object.assign(form, {
    id: res.id,
    title: res.title,
    categoryId: res.categoryId,
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
  // 过滤掉 markdown 标题与标记，提取纯文本前 150 字
  const clean = form.content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`*_\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  form.summary = clean.slice(0, 150);
  ElMessage.success('已自动提取正文摘要');
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

const handleSaveDraft = async () => {
  if (!form.title) {
    ElMessage.warning('请至少填写文章标题');
    return;
  }
  draftLoading.value = true;
  try {
    form.status = 0; // 草稿
    if (form.id) {
      await updateArticle(form.id, form);
      ElMessage.success('草稿更新成功');
    } else {
      const res: any = await createArticle(form);
      form.id = res.id;
      ElMessage.success('草稿保存成功');
    }
  } finally {
    draftLoading.value = false;
  }
};

const handleSubmitAudit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      let articleId = form.id;
      if (articleId) {
        await updateArticle(articleId, { ...form, status: 0 });
      } else {
        const res: any = await createArticle({ ...form, status: 0 });
        articleId = res.id;
        form.id = articleId;
      }
      await submitArticleAudit(articleId!);
      ElMessage.success('文章已成功提交审核，请等待审批');
      router.push('/article/post');
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDirectPublish = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    publishLoading.value = true;
    try {
      form.status = 2; // 直接发布
      if (form.id) {
        await updateArticle(form.id, form);
        ElMessage.success('文章发布成功');
      } else {
        const res: any = await createArticle(form);
        form.id = res.id;
        ElMessage.success('文章发布成功');
      }
      router.push('/article/post');
    } finally {
      publishLoading.value = false;
    }
  });
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

<template>
  <el-dialog
    v-model="visible"
    title="文章审阅与合规审批工作台"
    width="90%"
    top="3vh"
    destroy-on-close
    append-to-body
    class="modern-audit-dialog"
  >
    <div v-loading="loading" class="flex flex-col lg:flex-row gap-6 h-[80vh]">
      <!-- 1. 左侧：高质感阅读排版视窗 (Editorial Reader View - 68%) -->
      <div class="flex-1 overflow-y-auto pr-3 space-y-6" id="audit-reader-scroll-wrapper">
        <!-- 头部文章元信息卡片 (Hero Meta Banner) -->
        <div class="bg-gradient-to-br from-gray-50/90 to-gray-100/50 dark:from-dark-800/90 dark:to-dark-800/40 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 space-y-4">
          <!-- 标题与状态行 -->
          <div class="flex items-start gap-3">
            <el-tag v-if="article?.isTop === 1" size="small" type="danger" effect="dark" class="mt-1">
              置顶
            </el-tag>
            <el-tag v-if="article?.isRecommend === 1" size="small" type="warning" effect="plain" class="mt-1">
              推荐
            </el-tag>
            <h1 class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
              {{ article?.title }}
            </h1>
          </div>

          <!-- 作者、分类、时间与标签元数据 -->
          <div class="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700/40">
            <div class="flex items-center gap-1.5">
              <el-avatar :size="20" class="bg-primary/20 text-primary text-[10px] font-bold">
                {{ (article?.authorName || 'A')[0] }}
              </el-avatar>
              <span>作者：<strong class="text-gray-800 dark:text-gray-200">{{ article?.authorName }}</strong></span>
            </div>

            <div class="flex items-center gap-1">
              <el-icon class="text-primary"><Folder /></el-icon>
              <span>分类：<strong class="text-gray-800 dark:text-gray-200">{{ article?.categoryName }}</strong></span>
            </div>

            <div class="flex items-center gap-1">
              <el-icon><Clock /></el-icon>
              <span>提交时间：{{ article?.updatedAt || article?.createdAt }}</span>
            </div>

            <div v-if="article?.tags" class="flex items-center gap-1">
              <el-icon><CollectionTag /></el-icon>
              <span class="flex gap-1">
                <el-tag
                  v-for="tag in article.tags.split(',')"
                  :key="tag"
                  size="small"
                  type="info"
                  class="rounded-full text-[11px]"
                >
                  {{ tag.trim() }}
                </el-tag>
              </span>
            </div>
          </div>

          <!-- 摘要引用卡片 -->
          <div
            v-if="article?.summary"
            class="summary-quote relative bg-white dark:bg-dark-900/90 p-3.5 rounded-xl border-l-4 border-primary border-t border-r border-b border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed shadow-sm"
          >
            <strong class="text-gray-800 dark:text-gray-100 font-semibold">【文章摘要】</strong>
            {{ article?.summary }}
          </div>
        </div>

        <!-- 封面大图展示 -->
        <div
          v-if="article?.coverImage"
          class="cover-box w-full max-h-72 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
        >
          <img :src="article?.coverImage" class="w-full h-full object-cover" />
        </div>

        <!-- Markdown 正文排版 (纯预览模式，无编辑框与工具栏) -->
        <div class="article-body-wrapper bg-white dark:bg-dark-900 p-6 lg:p-8 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-sm">
          <MarkdownEditor
            editor-id="audit-markdown-view"
            :model-value="article?.content || ''"
            preview-only
            height="auto"
          />
        </div>
      </div>

      <!-- 2. 右侧：现代化控制台 (Right Inspector Console - 32%) -->
      <aside class="w-full lg:w-88 xl:w-96 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200/70 dark:border-gray-800 lg:pl-6 pt-4 lg:pt-0">
        <!-- 顶部 Tab 切换：采用规范的 Element Plus el-tabs，原生 100% 适配暗黑模式 -->
        <div class="flex-1 overflow-hidden flex flex-col min-h-0">
          <el-tabs v-model="rightTab" class="audit-inspector-tabs w-full flex-1 flex flex-col min-h-0" stretch>
            <!-- 选项卡 1：章节大纲 -->
            <el-tab-pane label="章节大纲 (TOC)" name="toc" class="h-full overflow-hidden">
              <div class="pt-1 h-full">
                <ArticleToc
                  editor-id="audit-markdown-view"
                  scroll-element="#audit-reader-scroll-wrapper"
                  max-height="340px"
                />
              </div>
            </el-tab-pane>

            <!-- 选项卡 2：审核历史时间线 -->
            <el-tab-pane :label="`审核轨迹 (${auditLogs.length})`" name="logs" class="h-full overflow-hidden">
              <div class="pt-1 h-full">
                <el-scrollbar max-height="340px" class="pr-2">
                  <div v-if="auditLogs.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-10">
                    暂无历史流转记录
                  </div>
                  <el-timeline v-else class="pt-2">
                    <el-timeline-item
                      v-for="log in auditLogs"
                      :key="log.id"
                      :timestamp="log.createdAt"
                      :type="log.auditResult === 1 ? 'success' : 'danger'"
                      size="small"
                    >
                      <div class="text-xs space-y-1">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-gray-800 dark:text-gray-200">{{ log.auditorName }}</span>
                          <el-tag size="small" :type="log.auditResult === 1 ? 'success' : 'danger'" class="rounded-full">
                            {{ log.auditResult === 1 ? '审核通过' : '审核驳回' }}
                          </el-tag>
                        </div>
                        <div
                          v-if="log.auditComment"
                          class="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700/60"
                        >
                          {{ log.auditComment }}
                        </div>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </el-scrollbar>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 底部：决策与处理控制区 (Decision Hub) -->
        <div class="border-t border-gray-200/80 dark:border-gray-800 pt-4 mt-3 space-y-3 bg-white dark:bg-dark-900">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-gray-800 dark:text-gray-200">审阅决策与批注</span>
            <span class="text-[11px] text-gray-400">驳回时意见必填</span>
          </div>

          <!-- 常用快捷批注 Tag 气泡 (Element Plus Tag 原生适配深色) -->
          <div class="quick-tags flex flex-wrap gap-1.5">
            <el-tag
              v-for="tag in presetComments"
              :key="tag"
              size="small"
              class="cursor-pointer hover:scale-105 transition-transform select-none"
              type="info"
              effect="plain"
              @click="applyPresetComment(tag)"
            >
              + {{ tag }}
            </el-tag>
          </div>

          <!-- 批注输入框 -->
          <el-input
            v-model="auditComment"
            type="textarea"
            :rows="3"
            placeholder="填写具体的审批意见或驳回改进建议..."
            maxlength="300"
            show-word-limit
          />

          <!-- 决策按钮组 -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <el-button
              type="danger"
              plain
              class="w-full rounded-xl"
              :loading="actionLoading"
              v-hasPermi="['article:audit:reject']"
              @click="handleAction(2)"
            >
              驳回退回
            </el-button>

            <el-button
              type="success"
              class="w-full rounded-xl shadow-sm"
              :loading="actionLoading"
              v-hasPermi="['article:audit:approve']"
              @click="handleAction(1)"
            >
              通过并发布
            </el-button>
          </div>
        </div>
      </aside>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Folder, Clock, CollectionTag } from '@element-plus/icons-vue';
import MarkdownEditor from '@/components/MarkdownEditor/index.vue';
import ArticleToc from '@/components/ArticleToc/index.vue';
import { getArticle } from '@/api/article/post';
import { executeAuditAction, getArticleAuditLogs } from '@/api/article/audit';
import type { ArticleEntity, AuditLogEntity } from '@/types/article';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const actionLoading = ref(false);
const rightTab = ref<'toc' | 'logs'>('toc');

const article = ref<ArticleEntity | null>(null);
const auditLogs = ref<AuditLogEntity[]>([]);
const auditComment = ref('');

const presetComments = [
  '内容翔实，排版规范，准予发布',
  '部分配图失效或链接异常',
  '代码块建议补充注释与语言标识',
  '缺少核心论据，建议充实内容',
  '内容涉嫌侵权或转载来源不合规',
];

const applyPresetComment = (text: string) => {
  if (!auditComment.value) {
    auditComment.value = text;
  } else {
    auditComment.value += `；${text}`;
  }
};

const open = async (articleId: number) => {
  visible.value = true;
  loading.value = true;
  auditComment.value = '';
  rightTab.value = 'toc';

  try {
    const [articleRes, logsRes]: any = await Promise.all([
      getArticle(articleId),
      getArticleAuditLogs(articleId),
    ]);
    article.value = articleRes;
    auditLogs.value = logsRes || [];
  } finally {
    loading.value = false;
  }
};

const handleAction = async (result: number) => {
  if (!article.value?.id) return;

  if (result === 2 && (!auditComment.value || !auditComment.value.trim())) {
    ElMessage.warning('驳回时请务必在右侧输入驳回原因与修改意见');
    return;
  }

  actionLoading.value = true;
  try {
    await executeAuditAction({
      articleId: Number(article.value.id),
      auditResult: result,
      auditComment: auditComment.value || (result === 1 ? '内容审核通过，准予发布。' : ''),
    });
    ElMessage.success(result === 1 ? '审核通过，文章已正式发布' : '文章已成功驳回并退回修改');
    visible.value = false;
    emit('success');
  } finally {
    actionLoading.value = false;
  }
};

defineExpose({
  open,
});
</script>

<style scoped>
:deep(.modern-audit-dialog.el-dialog) {
  border-radius: 18px;
  overflow: hidden;
}
:deep(.modern-audit-dialog .el-dialog__header) {
  padding: 16px 24px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 700;
}
:deep(.modern-audit-dialog .el-dialog__body) {
  padding: 20px 24px;
}
:deep(.audit-inspector-tabs .el-tabs__header) {
  margin-bottom: 8px;
}
.summary-quote {
  border-left-width: 4px;
}
</style>

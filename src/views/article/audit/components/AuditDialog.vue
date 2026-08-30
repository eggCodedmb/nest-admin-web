<template>
  <el-dialog
    v-model="visible"
    title="文章审核与内容审阅"
    width="85%"
    top="4vh"
    destroy-on-close
    append-to-body
    class="audit-preview-dialog"
  >
    <div v-loading="loading" class="flex flex-col lg:flex-row gap-6 max-h-[75vh]">
      <!-- 左侧：文章完整渲染视图 (可滚动) -->
      <div class="flex-1 overflow-y-auto pr-3 space-y-4" id="audit-preview-scroll-wrapper">
        <!-- 头部元信息 -->
        <div class="bg-gray-50/80 dark:bg-dark-800/90 p-4 rounded-lg border border-gray-100 dark:border-gray-700/60 space-y-2">
          <div class="flex items-center gap-2">
            <el-tag v-if="article?.isTop === 1" size="small" type="danger">置顶</el-tag>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ article?.title }}</h1>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>作者：<strong class="text-gray-700 dark:text-gray-200">{{ article?.authorName }}</strong></span>
            <span>分类：<strong class="text-gray-700 dark:text-gray-200">{{ article?.categoryName }}</strong></span>
            <span>提交时间：{{ article?.updatedAt || article?.createdAt }}</span>
            <span v-if="article?.tags">标签：<el-tag size="small" type="info">{{ article?.tags }}</el-tag></span>
          </div>
          <div v-if="article?.summary" class="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-900 p-2.5 rounded border border-gray-100 dark:border-gray-700/60">
            <span class="font-medium text-gray-700 dark:text-gray-200">摘要：</span>{{ article?.summary }}
          </div>
        </div>

        <!-- 封面图预览 -->
        <div v-if="article?.coverImage" class="w-full">
          <img :src="article?.coverImage" class="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
        </div>

        <!-- Markdown 渲染正文 -->
        <div class="article-content-box bg-white dark:bg-dark-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700/60">
          <MarkdownEditor
            editor-id="audit-markdown-view"
            :model-value="article?.content || ''"
            preview-only
            height="auto"
          />
        </div>
      </div>

      <!-- 右侧：目录大纲、审核操作与流转历史 (固定宽) -->
      <div class="w-full lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 lg:pl-4 pt-4 lg:pt-0">
        <!-- 目录与历史 Tab -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <el-tabs v-model="rightTab" class="mb-2">
            <el-tab-pane label="章节大纲" name="toc">
              <ArticleToc editor-id="audit-markdown-view" max-height="300px" />
            </el-tab-pane>
            <el-tab-pane label="审核历史" name="logs">
              <el-scrollbar max-height="300px" class="pr-2">
                <div v-if="auditLogs.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                  暂无审核记录
                </div>
                <el-timeline v-else class="text-xs pt-2">
                  <el-timeline-item
                    v-for="log in auditLogs"
                    :key="log.id"
                    :timestamp="log.createdAt"
                    :type="log.auditResult === 1 ? 'success' : 'danger'"
                  >
                    <div class="font-medium text-gray-800 dark:text-gray-200">
                      {{ log.auditorName }}：
                      <el-tag size="small" :type="log.auditResult === 1 ? 'success' : 'danger'">
                        {{ log.auditResult === 1 ? '审核通过' : '审核驳回' }}
                      </el-tag>
                    </div>
                    <div v-if="log.auditComment" class="text-gray-500 dark:text-gray-400 mt-1">
                      {{ log.auditComment }}
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </el-scrollbar>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 审核操作区 -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3 bg-white dark:bg-dark-900">
          <span class="text-xs font-bold text-gray-700 dark:text-gray-200 block">审核处理意见</span>
          <el-input
            v-model="auditComment"
            type="textarea"
            :rows="3"
            placeholder="若驳回，请务必填写具体的修改建议或违规说明..."
          />
          <div class="flex items-center justify-end gap-2">
            <el-button
              type="danger"
              :loading="actionLoading"
              v-hasPermi="['article:audit:reject']"
              @click="handleAction(2)"
            >
              驳回
            </el-button>
            <el-button
              type="success"
              :loading="actionLoading"
              v-hasPermi="['article:audit:approve']"
              @click="handleAction(1)"
            >
              通过并发布
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
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
const rightTab = ref('toc');

const article = ref<ArticleEntity | null>(null);
const auditLogs = ref<AuditLogEntity[]>([]);
const auditComment = ref('');

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
    ElMessage.warning('驳回时请填写驳回原因与修改意见');
    return;
  }

  actionLoading.value = true;
  try {
    await executeAuditAction({
      articleId: article.value.id,
      auditResult: result,
      auditComment: auditComment.value,
    });
    ElMessage.success(result === 1 ? '审核通过，文章已正式发布' : '文章已驳回');
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
:deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>

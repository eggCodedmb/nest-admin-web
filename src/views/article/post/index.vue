<template>
  <div class="article-management-container">
    <ProTable
      ref="tableRef"
      table-key="art_article_list"
      :columns="columns"
      :request-api="getArticleList"
      :init-param="queryParams"
    >
      <!-- 搜索插槽 -->
      <template #search="{ search, reset }">
        <el-form :model="queryParams" inline>
          <el-form-item label="文章标题">
            <el-input v-model="queryParams.title" placeholder="模糊搜索标题" clearable />
          </el-form-item>
          <el-form-item label="所属分类">
            <el-tree-select
              v-model="queryParams.categoryId"
              :data="categoryTree"
              :props="{ label: 'name', value: 'id', children: 'children' }"
              placeholder="全部分类"
              clearable
              check-strictly
              class="w-40"
            />
          </el-form-item>
          <el-form-item label="文章状态">
            <el-select v-model="queryParams.status" placeholder="全部状态" clearable class="w-28">
              <el-option
                v-for="dict in art_post_status"
                :key="dict.dictValue"
                :label="dict.dictLabel"
                :value="Number(dict.dictValue)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="是否置顶">
            <el-select v-model="queryParams.isTop" placeholder="置顶" clearable class="w-24">
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(queryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 头部操作按钮 -->
      <template #tableHeader>
        <div class="flex items-center gap-2">
          <el-button type="primary" icon="Plus" v-hasPermi="['article:post:create']" @click="handleWrite">
            写新文章
          </el-button>
          <el-button
            type="warning"
            plain
            icon="TrendCharts"
            v-hasPermi="['article:recommend:list']"
            @click="router.push('/article/recommend')"
          >
            推荐算法控制中心
          </el-button>
        </div>
      </template>

      <!-- 文章标题与封面 -->
      <template #title="{ row }">
        <div class="flex items-center gap-3 py-1">
          <el-image
            v-if="row.coverImage"
            :src="row.coverImage"
            class="w-14 h-10 rounded object-cover flex-shrink-0 border dark:border-gray-700"
            :preview-src-list="[row.coverImage]"
            preview-teleported
          />
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <el-tag v-if="row.isTop === 1" size="small" type="danger" effect="dark">置顶</el-tag>
              <el-tag v-if="row.isRecommend === 1" size="small" type="warning" effect="plain">精选</el-tag>
              <el-tag v-if="row.recommendFactor === 1" size="small" type="success" effect="light">强推</el-tag>
              <el-tag v-else-if="row.recommendFactor === 2" size="small" type="danger" effect="light">禁推</el-tag>
              <el-tag v-else-if="row.recommendFactor === 3" size="small" type="warning" effect="light">冷启动</el-tag>
              <el-tag v-if="row.recommendWeight" size="small" type="primary" effect="plain">
                加权 {{ row.recommendWeight > 0 ? '+' : '' }}{{ row.recommendWeight }}
              </el-tag>
              <span class="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-primary dark:hover:text-primary cursor-pointer" @click="handleEdit(row)">
                {{ row.title }}
              </span>
            </div>
            <span v-if="row.summary" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-md">
              {{ row.summary }}
            </span>
          </div>
        </div>
      </template>

      <!-- 推荐算法干预列 -->
      <template #recommendControl="{ row }">
        <div class="flex items-center justify-center gap-1 cursor-pointer" @click="handleOpenRecommendDialog(row)">
          <el-tag v-if="row.recommendFactor === 2" type="danger" size="small">算法屏蔽</el-tag>
          <el-tag v-else-if="row.recommendFactor === 1" type="success" size="small">
            强推 ({{ row.recommendWeight > 0 ? '+' : '' }}{{ row.recommendWeight || 0 }})
          </el-tag>
          <el-tag v-else-if="row.recommendWeight" type="primary" size="small">
            微调 {{ row.recommendWeight > 0 ? '+' : '' }}{{ row.recommendWeight }}
          </el-tag>
          <el-tag v-else-if="row.isRecommend === 1" type="warning" size="small">精选</el-tag>
          <span v-else class="text-xs text-gray-400 hover:text-primary">自然流</span>
          <el-icon class="text-xs text-gray-400 hover:text-primary ml-0.5"><EditPen /></el-icon>
        </div>
      </template>

      <!-- 置顶快捷开关 -->
      <template #isTop="{ row }">
        <el-switch
          :model-value="row.isTop === 1 ? 1 : 0"
          :active-value="1"
          :inactive-value="0"
          v-hasPermi="['article:post:update']"
          :before-change="() => handleToggleTop(row)"
        />
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <div class="flex items-center justify-center gap-1 whitespace-nowrap">
          <el-button link type="primary" icon="Edit" v-hasPermi="['article:post:update']" @click="handleEdit(row)">
            编辑
          </el-button>

          <!-- 草稿 / 已驳回状态: 提交审核 -->
          <el-button
            v-if="row.status === 0 || row.status === 3"
            link
            type="warning"
            icon="Upload"
            v-hasPermi="['article:post:submit']"
            @click="handleSubmitAudit(row)"
          >
            提审
          </el-button>

          <!-- 已发布状态: 下架 -->
          <el-button
            v-if="row.status === 2"
            link
            type="info"
            icon="Download"
            v-hasPermi="['article:post:update']"
            @click="handleToggleOnline(row, 4)"
          >
            下架
          </el-button>

          <!-- 已下架状态: 重新上架 -->
          <el-button
            v-if="row.status === 4"
            link
            type="success"
            icon="VideoPlay"
            v-hasPermi="['article:post:update']"
            @click="handleToggleOnline(row, 2)"
          >
            上架
          </el-button>

          <el-button link type="danger" icon="Delete" v-hasPermi="['article:post:delete']" @click="handleDelete(row)">
            删除
          </el-button>
        </div>
      </template>
    </ProTable>

    <!-- 文章推荐算法干预快捷弹窗 -->
    <el-dialog
      v-model="recommendDialogVisible"
      title="推荐算法干预设置"
      width="460px"
      destroy-on-close
    >
      <el-form :model="recommendForm" label-position="top" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-dark-800/60 rounded-lg text-xs text-gray-600 dark:text-gray-300">
          <span class="font-bold block text-gray-800 dark:text-gray-100 mb-1">文章标题：</span>
          <span class="line-clamp-1">{{ currentArticle?.title }}</span>
        </div>

        <el-form-item label="干预模式">
          <el-radio-group v-model="recommendForm.recommendFactor" class="w-full">
            <el-radio-button :value="0">自然流</el-radio-button>
            <el-radio-button :value="1">强推</el-radio-button>
            <el-radio-button :value="2">禁推(屏蔽)</el-radio-button>
            <el-radio-button :value="3">冷启动</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="推荐权重微调 (-100 ~ +100)">
          <div class="w-full space-y-1">
            <div class="flex justify-between text-xs text-gray-400">
              <span>负值降权</span>
              <span class="font-mono font-bold text-primary">{{ recommendForm.recommendWeight }} 分</span>
              <span>正值提权</span>
            </div>
            <el-slider
              v-model="recommendForm.recommendWeight"
              :min="-100"
              :max="100"
              :step="5"
              show-stops
            />
          </div>
        </el-form-item>

        <el-form-item label="精选推荐标记 (isRecommend)">
          <el-switch v-model="recommendForm.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="推荐干预截止时间 (留空表示永久有效)">
          <el-date-picker
            v-model="recommendForm.recommendExpireAt"
            type="datetime"
            placeholder="选择截止时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="recommendDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="recommendSaveLoading" @click="handleSaveRecommendControl">
            保存干预
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { TrendCharts, EditPen } from '@element-plus/icons-vue';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import { useDict } from '@/hooks/useDict';
import {
  getArticleList,
  deleteArticle,
  submitArticleAudit,
  updateArticleStatus,
} from '@/api/article/post';
import { updateArticleRecommendControl } from '@/api/article/recommend';
import { getCategoryTree } from '@/api/article/category';
import type { ArticleEntity } from '@/types/article';

const router = useRouter();
const tableRef = ref<InstanceType<typeof ProTable>>();
const categoryTree = ref<any[]>([]);

// 接入系统字典 art_post_status
const { art_post_status } = useDict('art_post_status');

const queryParams = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  status: undefined as number | undefined,
  isTop: undefined as number | undefined,
  recommendFactor: undefined as number | undefined,
});

const columns: ColumnProps[] = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'title', label: '文章标题', minWidth: 260, slot: 'title' },
  { prop: 'categoryName', label: '所属分类', minWidth: 120, align: 'center' },
  { prop: 'authorName', label: '作者', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, dictOptions: art_post_status, align: 'center' },
  { prop: 'recommendControl', label: '推荐算法控制', width: 140, slot: 'recommendControl', align: 'center' },
  { prop: 'isTop', label: '置顶', width: 80, slot: 'isTop', align: 'center' },
  { prop: 'viewCount', label: '阅读量', width: 80, align: 'center' },
  { prop: 'publishedAt', label: '发布时间', width: 170, align: 'center' },
  { prop: 'action', label: '操作', width: 200, slot: 'action', align: 'center', fixed: 'right' },
];

const recommendDialogVisible = ref(false);
const recommendSaveLoading = ref(false);
const currentArticle = ref<ArticleEntity | null>(null);
const recommendForm = reactive({
  recommendFactor: 0,
  recommendWeight: 0,
  isRecommend: 0,
  recommendExpireAt: '' as string | null,
});

const handleOpenRecommendDialog = (row: ArticleEntity) => {
  currentArticle.value = row;
  recommendForm.recommendFactor = row.recommendFactor ?? 0;
  recommendForm.recommendWeight = row.recommendWeight ?? 0;
  recommendForm.isRecommend = row.isRecommend ?? 0;
  recommendForm.recommendExpireAt = (row.recommendExpireAt as string) || null;
  recommendDialogVisible.value = true;
};

const handleSaveRecommendControl = async () => {
  if (!currentArticle.value) return;
  recommendSaveLoading.value = true;
  try {
    await updateArticleRecommendControl(currentArticle.value.id, {
      recommendFactor: recommendForm.recommendFactor,
      recommendWeight: recommendForm.recommendWeight,
      isRecommend: recommendForm.isRecommend,
      recommendExpireAt: recommendForm.recommendExpireAt || null,
    });
    ElMessage.success('推荐算法干预已保存');
    recommendDialogVisible.value = false;
    tableRef.value?.getTableList();
  } finally {
    recommendSaveLoading.value = false;
  }
};

const loadCategories = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
};

const handleWrite = () => {
  router.push('/article/post/edit');
};

const handleEdit = (row: ArticleEntity) => {
  router.push(`/article/post/edit?id=${row.id}`);
};

const handleSubmitAudit = (row: ArticleEntity) => {
  ElMessageBox.confirm(`确定将文章 "${row.title}" 提交至审核队列吗？`, '提审确认', {
    type: 'info',
  }).then(async () => {
    await submitArticleAudit(row.id);
    ElMessage.success('提交审核成功，请等待管理员审批');
    tableRef.value?.getTableList();
  });
};

const handleToggleTop = (row: ArticleEntity): Promise<boolean> => {
  return new Promise((resolve) => {
    const targetTop = row.isTop === 1 ? 0 : 1;
    const text = targetTop === 1 ? '置顶' : '取消置顶';
    ElMessageBox.confirm(`确定要${text}文章 "${row.title}" 吗？`, '置顶确认', {
      type: 'warning',
    })
      .then(async () => {
        try {
          await updateArticleStatus(row.id, { isTop: targetTop });
          row.isTop = targetTop;
          ElMessage.success(`文章已${text}`);
          resolve(true);
        } catch {
          resolve(false);
        }
      })
      .catch(() => resolve(false));
  });
};

const handleToggleOnline = (row: ArticleEntity, targetStatus: number) => {
  const text = targetStatus === 2 ? '重新上架' : '下架';
  ElMessageBox.confirm(`确定要${text}文章 "${row.title}" 吗？`, '状态确认', {
    type: 'warning',
  }).then(async () => {
    await updateArticleStatus(row.id, { status: targetStatus });
    ElMessage.success(`文章已${text}`);
    tableRef.value?.getTableList();
  });
};

const handleDelete = (row: ArticleEntity) => {
  ElMessageBox.confirm(`确定要删除文章 "${row.title}" 吗？删除后不可恢复！`, '删除警告', {
    type: 'warning',
  }).then(async () => {
    await deleteArticle(row.id);
    ElMessage.success('删除文章成功');
    tableRef.value?.getTableList();
  });
};

onMounted(() => {
  loadCategories();
});
</script>

<template>
  <div class="article-management-container p-4">
    <!-- 状态筛选 Tabs -->
    <el-tabs v-model="activeTab" type="card" class="bg-white px-4 pt-3 rounded-t-lg border-b-0" @tab-change="handleTabChange">
      <el-tab-pane label="全部文章" name="all" />
      <el-tab-pane label="草稿箱" name="draft" />
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已发布" name="published" />
      <el-tab-pane label="已驳回" name="rejected" />
      <el-tab-pane label="已下架" name="offline" />
    </el-tabs>

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
        <el-button type="primary" icon="Plus" v-hasPermi="['article:post:create']" @click="handleWrite">
          写新文章
        </el-button>
      </template>

      <!-- 文章标题与封面 -->
      <template #title="{ row }">
        <div class="flex items-center gap-3 py-1">
          <el-image
            v-if="row.coverImage"
            :src="row.coverImage"
            class="w-14 h-10 rounded object-cover flex-shrink-0 border"
            :preview-src-list="[row.coverImage]"
            preview-teleported
          />
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <el-tag v-if="row.isTop === 1" size="small" type="danger" effect="dark">置顶</el-tag>
              <el-tag v-if="row.isRecommend === 1" size="small" type="warning" effect="plain">推荐</el-tag>
              <span class="font-medium text-gray-900 truncate hover:text-primary cursor-pointer" @click="handleEdit(row)">
                {{ row.title }}
              </span>
            </div>
            <span v-if="row.summary" class="text-xs text-gray-400 truncate mt-0.5 max-w-md">
              {{ row.summary }}
            </span>
          </div>
        </div>
      </template>

      <!-- 状态标签 -->
      <template #status="{ row }">
        <el-tag v-if="row.status === 0" type="info">草稿</el-tag>
        <el-tag v-else-if="row.status === 1" type="warning">待审核</el-tag>
        <el-tag v-else-if="row.status === 2" type="success">已发布</el-tag>
        <el-tag v-else-if="row.status === 3" type="danger">已驳回</el-tag>
        <el-tag v-else-if="row.status === 4" type="info" effect="plain">已下架</el-tag>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import {
  getArticleList,
  deleteArticle,
  submitArticleAudit,
  updateArticleStatus,
} from '@/api/article/post';
import { getCategoryTree } from '@/api/article/category';
import type { ArticleEntity } from '@/types/article';

const router = useRouter();
const tableRef = ref<InstanceType<typeof ProTable>>();
const activeTab = ref('all');
const categoryTree = ref<any[]>([]);

const queryParams = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  status: undefined as number | undefined,
  isTop: undefined as number | undefined,
});

const columns: ColumnProps[] = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'title', label: '文章标题', minWidth: 260, slot: 'title' },
  { prop: 'categoryName', label: '所属分类', minWidth: 120, align: 'center' },
  { prop: 'authorName', label: '作者', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 90, slot: 'status', align: 'center' },
  { prop: 'isTop', label: '置顶', width: 80, slot: 'isTop', align: 'center' },
  { prop: 'viewCount', label: '阅读量', width: 80, align: 'center' },
  { prop: 'publishedAt', label: '发布时间', width: 170, align: 'center' },
  { prop: 'action', label: '操作', width: 200, slot: 'action', align: 'center', fixed: 'right' },
];

const loadCategories = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
};

const handleTabChange = (tabName: string | number) => {
  const statusMap: Record<string, number | undefined> = {
    all: undefined,
    draft: 0,
    pending: 1,
    published: 2,
    rejected: 3,
    offline: 4,
  };
  queryParams.status = statusMap[tabName as string];
  tableRef.value?.getTableList();
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
  ElMessageBox.confirm(`确定删除文章 "${row.title}" 吗？`, '删除确认', {
    type: 'warning',
  }).then(async () => {
    await deleteArticle(row.id);
    ElMessage.success('文章删除成功');
    tableRef.value?.getTableList();
  });
};

onMounted(() => {
  loadCategories();
});
</script>

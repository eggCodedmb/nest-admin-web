<template>
  <div class="article-audit-container p-4">
    <!-- 顶部状态快速筛选卡片 -->
    <div class="bg-white dark:bg-dark-900 px-4 pt-3 rounded-t-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <el-tabs v-model="activeStatusTab" class="audit-status-tabs" @tab-change="handleStatusTabChange">
        <el-tab-pane label="待我审核" name="1" />
        <el-tab-pane label="审核通过 (已发布)" name="2" />
        <el-tab-pane label="已驳回记录" name="3" />
        <el-tab-pane label="全部审阅池" name="all" />
      </el-tabs>
    </div>

    <ProTable
      ref="tableRef"
      table-key="art_article_audit_v2"
      :columns="columns"
      :request-api="getAuditList"
      :init-param="queryParams"
    >
      <!-- 搜索栏 -->
      <template #search="{ search, reset }">
        <el-form :model="queryParams" inline>
          <el-form-item label="文章标题">
            <el-input v-model="queryParams.title" placeholder="请输入标题模糊搜索" clearable />
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
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(queryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 文章标题与封面图插槽 -->
      <template #title="{ row }">
        <div class="flex items-center gap-3 py-1.5 cursor-pointer group" @click="handleOpenAudit(row)">
          <el-image
            v-if="row.coverImage"
            :src="row.coverImage"
            class="w-16 h-11 rounded-lg object-cover flex-shrink-0 border dark:border-gray-700 shadow-2xs group-hover:scale-105 transition-transform"
            :preview-src-list="[row.coverImage]"
            preview-teleported
            @click.stop
          />
          <div class="flex flex-col min-w-0 text-left">
            <div class="flex items-center gap-1.5">
              <el-tag v-if="row.isTop === 1" size="small" type="danger" effect="dark">置顶</el-tag>
              <el-tag v-if="row.isRecommend === 1" size="small" type="warning" effect="plain">推荐</el-tag>
              <span class="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">
                {{ row.title }}
              </span>
            </div>
            <span v-if="row.summary" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-md">
              {{ row.summary }}
            </span>
          </div>
        </div>
      </template>

      <!-- 审核状态插槽 -->
      <template #status="{ row }">
        <el-tag v-if="row.status === 1" type="warning" effect="light" class="rounded-full font-medium">
          待审核
        </el-tag>
        <el-tag v-else-if="row.status === 2" type="success" effect="light" class="rounded-full font-medium">
          审核通过
        </el-tag>
        <el-tag v-else-if="row.status === 3" type="danger" effect="light" class="rounded-full font-medium">
          已驳回
        </el-tag>
        <el-tag v-else type="info" class="rounded-full font-medium">其它</el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #action="{ row }">
        <el-button
          :type="row.status === 1 ? 'warning' : 'primary'"
          :plain="row.status !== 1"
          size="small"
          class="rounded-lg shadow-2xs font-medium"
          v-hasPermi="['article:audit:approve', 'article:audit:reject']"
          @click="handleOpenAudit(row)"
        >
          <el-icon class="mr-1"><Checked /></el-icon>
          {{ row.status === 1 ? '审阅处理' : '查看详情' }}
        </el-button>
      </template>
    </ProTable>

    <!-- 审阅与审核弹窗 -->
    <AuditDialog ref="auditDialogRef" @success="handleAuditSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Checked } from '@element-plus/icons-vue';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import AuditDialog from './components/AuditDialog.vue';
import { getAuditList } from '@/api/article/audit';
import { getCategoryTree } from '@/api/article/category';
import type { ArticleEntity } from '@/types/article';

const tableRef = ref<InstanceType<typeof ProTable>>();
const auditDialogRef = ref<InstanceType<typeof AuditDialog>>();
const categoryTree = ref<any[]>([]);
const activeStatusTab = ref('1');

const queryParams = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  status: 1 as number | undefined, // 默认待审核
});

const columns: ColumnProps[] = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'title', label: '文章标题与内容', minWidth: 280, slot: 'title' },
  { prop: 'categoryName', label: '所属分类', minWidth: 120, align: 'center' },
  { prop: 'authorName', label: '作者', width: 110, align: 'center' },
  { prop: 'status', label: '审核状态', width: 110, slot: 'status', align: 'center' },
  { prop: 'updatedAt', label: '提交时间', width: 180, align: 'center' },
  { prop: 'action', label: '操作', width: 130, slot: 'action', align: 'center', fixed: 'right' },
];

const loadCategories = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
};

const handleStatusTabChange = (tabName: string | number) => {
  if (tabName === 'all') {
    queryParams.status = undefined;
  } else {
    queryParams.status = Number(tabName);
  }
  tableRef.value?.getTableList();
};

const handleOpenAudit = (row: ArticleEntity) => {
  auditDialogRef.value?.open(row.id);
};

const handleAuditSuccess = () => {
  tableRef.value?.getTableList();
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
:deep(.audit-status-tabs .el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}
</style>

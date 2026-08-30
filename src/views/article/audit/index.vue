<template>
  <div class="article-audit-container p-4">
    <ProTable
      ref="tableRef"
      table-key="art_article_audit"
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
          <el-form-item label="审核状态">
            <el-select v-model="queryParams.status" placeholder="状态" class="w-32">
              <el-option label="待审核" :value="1" />
              <el-option label="已发布(通过)" :value="2" />
              <el-option label="已驳回" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(queryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 文章标题插槽 -->
      <template #title="{ row }">
        <div class="flex items-center gap-2 py-1">
          <el-tag v-if="row.isTop === 1" size="small" type="danger">置顶</el-tag>
          <span class="font-medium text-gray-900 truncate hover:text-primary cursor-pointer" @click="handleOpenAudit(row)">
            {{ row.title }}
          </span>
        </div>
      </template>

      <!-- 审核状态插槽 -->
      <template #status="{ row }">
        <el-tag v-if="row.status === 1" type="warning" effect="dark">待审核</el-tag>
        <el-tag v-else-if="row.status === 2" type="success">审核通过</el-tag>
        <el-tag v-else-if="row.status === 3" type="danger">已驳回</el-tag>
        <el-tag v-else type="info">其它</el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #action="{ row }">
        <el-button
          type="primary"
          link
          icon="Checked"
          v-hasPermi="['article:audit:approve', 'article:audit:reject']"
          @click="handleOpenAudit(row)"
        >
          {{ row.status === 1 ? '审阅处理' : '查看审阅' }}
        </el-button>
      </template>
    </ProTable>

    <!-- 审阅与审核弹窗 -->
    <AuditDialog ref="auditDialogRef" @success="handleAuditSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import AuditDialog from './components/AuditDialog.vue';
import { getAuditList } from '@/api/article/audit';
import { getCategoryTree } from '@/api/article/category';
import type { ArticleEntity } from '@/types/article';

const tableRef = ref<InstanceType<typeof ProTable>>();
const auditDialogRef = ref<InstanceType<typeof AuditDialog>>();
const categoryTree = ref<any[]>([]);

const queryParams = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  status: 1, // 默认查询待审核 (1)
});

const columns: ColumnProps[] = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'title', label: '文章标题', minWidth: 260, slot: 'title' },
  { prop: 'categoryName', label: '所属分类', minWidth: 120, align: 'center' },
  { prop: 'authorName', label: '作者', width: 110, align: 'center' },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' },
  { prop: 'updatedAt', label: '提交时间', width: 180, align: 'center' },
  { prop: 'action', label: '操作', width: 130, slot: 'action', align: 'center', fixed: 'right' },
];

const loadCategories = async () => {
  const res: any = await getCategoryTree();
  categoryTree.value = res || [];
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

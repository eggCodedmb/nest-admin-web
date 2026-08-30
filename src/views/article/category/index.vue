<template>
  <div class="category-management-container p-4">
    <el-card shadow="never" class="border-gray-100 dark:border-gray-800">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" inline class="mb-2">
        <el-form-item label="分类名称">
          <el-input v-model="queryParams.name" placeholder="请输入分类名称" clearable @keyup.enter="loadCategoryTree" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable class="w-28">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadCategoryTree">搜索</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <el-button type="primary" icon="Plus" v-hasPermi="['article:category:create']" @click="handleAddTop">
            新增顶级分类
          </el-button>
          <el-button icon="Sort" @click="toggleExpandAll">
            {{ isExpandAll ? '折叠全部' : '展开全部' }}
          </el-button>
        </div>
      </div>

      <!-- 树形表格 -->
      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="categoryList"
        row-key="id"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
      >
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="别名 / Slug" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.slug" size="small" type="info">{{ row.slug }}</el-tag>
            <span v-else class="text-gray-300">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1 ? 1 : 0"
              :active-value="1"
              :inactive-value="0"
              v-hasPermi="['article:category:update']"
              :before-change="() => handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="分类描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Plus" v-hasPermi="['article:category:create']" @click="handleAddChild(row)">
              新增子级
            </el-button>
            <el-button link type="primary" icon="Edit" v-hasPermi="['article:category:update']" @click="handleEdit(row)">
              修改
            </el-button>
            <el-button link type="danger" icon="Delete" v-hasPermi="['article:category:delete']" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 修改分类弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="categoryOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            value-key="id"
            placeholder="请选择上级分类 (0为顶级)"
            check-strictly
            clearable
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="例如: 前端开发" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="分类Slug" prop="slug">
          <el-input v-model="form.slug" placeholder="例如: frontend (用于友好URL)" maxlength="60" />
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="启用状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入分类描述..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/api/article/category';
import type { CategoryEntity } from '@/types/article';

const loading = ref(false);
const categoryList = ref<CategoryEntity[]>([]);
const categoryOptions = ref<any[]>([]);
const isExpandAll = ref(true);
const refreshTable = ref(true);

const queryParams = reactive({
  name: '',
  status: undefined as number | undefined,
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  id: undefined as number | undefined,
  parentId: 0,
  name: '',
  slug: '',
  orderNum: 0,
  status: 1,
  description: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

const loadCategoryTree = async () => {
  loading.value = true;
  try {
    const res: any = await getCategoryTree(queryParams);
    categoryList.value = res || [];
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  queryParams.name = '';
  queryParams.status = undefined;
  loadCategoryTree();
};

const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

const refreshOptions = async () => {
  const res: any = await getCategoryTree();
  categoryOptions.value = [{ id: 0, name: '顶级分类', children: res || [] }];
};

const handleAddTop = async () => {
  await refreshOptions();
  Object.assign(form, {
    id: undefined,
    parentId: 0,
    name: '',
    slug: '',
    orderNum: 0,
    status: 1,
    description: '',
  });
  dialogTitle.value = '新增顶级分类';
  dialogVisible.value = true;
};

const handleAddChild = async (row: CategoryEntity) => {
  await refreshOptions();
  Object.assign(form, {
    id: undefined,
    parentId: row.id,
    name: '',
    slug: '',
    orderNum: 0,
    status: 1,
    description: '',
  });
  dialogTitle.value = `新增【${row.name}】的子分类`;
  dialogVisible.value = true;
};

const handleEdit = async (row: CategoryEntity) => {
  await refreshOptions();
  const res: any = await getCategory(row.id);
  Object.assign(form, {
    id: res.id,
    parentId: res.parentId || 0,
    name: res.name,
    slug: res.slug || '',
    orderNum: res.orderNum || 0,
    status: res.status,
    description: res.description || '',
  });
  dialogTitle.value = '修改文章分类';
  dialogVisible.value = true;
};

const handleToggleStatus = (row: CategoryEntity): Promise<boolean> => {
  return new Promise((resolve) => {
    const targetStatus = row.status === 1 ? 0 : 1;
    const text = targetStatus === 1 ? '启用' : '停用';
    ElMessageBox.confirm(`确定要${text}分类 "${row.name}" 吗？`, '状态变更确认', {
      type: 'warning',
    })
      .then(async () => {
        try {
          await updateCategory(row.id, { status: targetStatus });
          row.status = targetStatus;
          ElMessage.success(`分类已${text}`);
          resolve(true);
        } catch {
          resolve(false);
        }
      })
      .catch(() => resolve(false));
  });
};

const handleDelete = (row: CategoryEntity) => {
  ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？`, '删除确认', {
    type: 'warning',
  }).then(async () => {
    await deleteCategory(row.id);
    ElMessage.success('分类删除成功');
    loadCategoryTree();
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.id) {
        await updateCategory(form.id, form);
        ElMessage.success('分类修改成功');
      } else {
        await createCategory(form);
        ElMessage.success('分类新增成功');
      }
      dialogVisible.value = false;
      loadCategoryTree();
    } finally {
      submitLoading.value = false;
    }
  });
};

onMounted(() => {
  loadCategoryTree();
});
</script>

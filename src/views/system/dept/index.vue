<template>
  <div class="dept-management-container">
    <el-card shadow="never">
      <!-- 搜索与操作栏 -->
      <div class="flex justify-between items-center mb-4">
        <el-form :model="queryParams" inline>
          <el-form-item label="部门名称">
            <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable />
          </el-form-item>
          <el-form-item label="部门状态">
            <el-select v-model="queryParams.status" placeholder="状态" clearable class="w-28">
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="fetchList">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="flex gap-2">
          <el-button type="primary" icon="Plus" v-hasPermi="['sys:dept:create']" @click="handleAdd()">
            新增部门
          </el-button>
          <el-button icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
        </div>
      </div>

      <!-- 树形表格 -->
      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="deptList"
        row-key="id"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children' }"
        border
      >
        <el-table-column prop="deptName" label="部门名称" min-width="200" />
        <el-table-column prop="orderNum" label="排序" width="80" align="center" />
        <el-table-column prop="leader" label="负责人" width="120" align="center" />
        <el-table-column prop="phone" label="联系电话" width="140" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="160" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" :formatter="dateFormatter()" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" v-hasPermi="['sys:dept:update']" @click="handleEdit(row)">
              修改
            </el-button>
            <el-button link type="primary" icon="Plus" v-hasPermi="['sys:dept:create']" @click="handleAdd(row)">
              新增
            </el-button>
            <el-button
              link
              type="danger"
              icon="Delete"
              :disabled="row.id === 1"
              v-hasPermi="['sys:dept:delete']"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 部门新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body destroy-on-close>
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="deptOptions"
            :props="{ children: 'children', label: 'deptName', value: 'id' }"
            check-strictly
            placeholder="选择上级部门"
            class="w-full"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" :min="0" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.leader" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入电话" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDeptTree, getDept, createDept, updateDept, deleteDept } from '@/api/system/dept';
import { dateFormatter } from '@/utils/date';
import type { DeptEntity } from '@/types/system';

const queryParams = reactive({
  deptName: '',
  status: undefined as number | undefined,
});

const loading = ref(false);
const deptList = ref<DeptEntity[]>([]);
const isExpandAll = ref(true);
const refreshTable = ref(true);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const deptFormRef = ref<FormInstance>();
const deptOptions = ref<any[]>([]);

const form = reactive<{
  id?: number;
  parentId: number;
  deptName: string;
  orderNum: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
}>({
  parentId: 0,
  deptName: '',
  orderNum: 1,
  leader: '',
  phone: '',
  email: '',
  status: 1,
});

const rules: FormRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
};

const fetchList = async () => {
  loading.value = true;
  try {
    deptList.value = await getDeptTree(queryParams);
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryParams.deptName = '';
  queryParams.status = undefined;
  fetchList();
};

const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

const handleAdd = (row?: DeptEntity) => {
  deptOptions.value = [{ id: 0, deptName: '顶级部门', children: deptList.value }];
  Object.assign(form, {
    id: undefined,
    parentId: row ? row.id : 0,
    deptName: '',
    orderNum: 1,
    leader: '',
    phone: '',
    email: '',
    status: 1,
  });
  dialogTitle.value = '新增部门';
  dialogVisible.value = true;
};

const handleEdit = async (row: DeptEntity) => {
  deptOptions.value = [{ id: 0, deptName: '顶级部门', children: deptList.value }];
  const res = await getDept(row.id);
  Object.assign(form, {
    id: res.id,
    parentId: (res as any).parent?.id ?? res.parentId ?? 0,
    deptName: res.deptName,
    orderNum: res.orderNum,
    leader: res.leader,
    phone: res.phone,
    email: res.email,
    status: res.status,
  });
  dialogTitle.value = '修改部门';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!deptFormRef.value) return;
  await deptFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const submitData = { ...form };
      if (!submitData.phone) delete submitData.phone;
      if (!submitData.email) delete submitData.email;
      if (!submitData.leader) delete submitData.leader;

      if (form.id) {
        await updateDept(form.id, submitData);
        ElMessage.success('部门修改成功');
      } else {
        await createDept(submitData);
        ElMessage.success('部门新增成功');
      }
      dialogVisible.value = false;
      fetchList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row: DeptEntity) => {
  ElMessageBox.confirm(`确定删除部门 "${row.deptName}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteDept(row.id);
    ElMessage.success('删除成功');
    fetchList();
  });
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="menu-management-container">
    <el-card shadow="never">
      <!-- 搜索与操作栏 -->
      <div class="flex justify-between items-center mb-4">
        <el-form :model="queryParams" inline>
          <el-form-item label="菜单名称">
            <el-input v-model="queryParams.menuName" placeholder="请输入菜单名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
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
          <el-button type="primary" icon="Plus" v-hasPermi="['sys:menu:create']" @click="handleAdd()">
            新增菜单
          </el-button>
          <el-button icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
        </div>
      </div>

      <!-- 树形表格 -->
      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="menuList"
        row-key="id"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon && row.icon !== '#'" :size="18">
              <component :is="row.icon" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="70" align="center" />
        <el-table-column prop="perms" label="权限标识" min-width="160" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <el-tag v-if="row.perms" size="small" type="info">{{ row.perms }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column prop="menuType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 'M'" type="warning">目录</el-tag>
            <el-tag v-else-if="row.menuType === 'C'" type="success">菜单</el-tag>
            <el-tag v-else-if="row.menuType === 'F'" type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" v-hasPermi="['sys:menu:update']" @click="handleEdit(row)">
              修改
            </el-button>
            <el-button
              v-if="row.menuType !== 'F'"
              link
              type="primary"
              icon="Plus"
              v-hasPermi="['sys:menu:create']"
              @click="handleAdd(row)"
            >
              新增
            </el-button>
            <el-button link type="danger" icon="Delete" v-hasPermi="['sys:menu:delete']" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 菜单新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" append-to-body destroy-on-close>
      <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ children: 'children', label: 'menuName', value: 'id' }"
            check-strictly
            placeholder="选择上级菜单 (默认顶级目录)"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录 (M)</el-radio>
            <el-radio value="C">菜单 (C)</el-radio>
            <el-radio value="F">按钮 (F)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="24" v-if="form.menuType !== 'F'">
            <el-form-item label="菜单图标" prop="icon">
              <IconSelect v-model="form.icon" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" :min="0" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType !== 'F'">
          <el-col :span="12">
            <el-form-item label="路由地址" prop="path">
              <el-input v-model="form.path" placeholder="例如：user 或 system/user" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType === 'C'">
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="form.component" placeholder="例如：system/user/index" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType !== 'M'">
          <el-col :span="12">
            <el-form-item label="权限字符" prop="perms">
              <el-input v-model="form.perms" placeholder="例如：sys:user:create" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="form.menuType !== 'F'">
          <el-col :span="12">
            <el-form-item label="显示状态">
              <el-radio-group v-model="form.visible">
                <el-radio :value="1">显示</el-radio>
                <el-radio :value="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单状态">
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
import IconSelect from '@/components/IconSelect/index.vue';
import { getMenuTree, getMenu, createMenu, updateMenu, deleteMenu } from '@/api/system/menu';
import type { MenuEntity } from '@/types/system';

const queryParams = reactive({
  menuName: '',
  status: undefined as number | undefined,
});

const loading = ref(false);
const menuList = ref<MenuEntity[]>([]);
const isExpandAll = ref(false);
const refreshTable = ref(true);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const menuFormRef = ref<FormInstance>();
const menuOptions = ref<any[]>([]);

const form = reactive<{
  id?: number;
  parentId: number;
  menuType: 'M' | 'C' | 'F';
  menuName: string;
  orderNum: number;
  icon: string;
  path: string;
  component: string;
  perms: string;
  isFrame: number;
  isCache: number;
  visible: number;
  status: number;
}>({
  parentId: 0,
  menuType: 'M',
  menuName: '',
  orderNum: 1,
  icon: '',
  path: '',
  component: '',
  perms: '',
  isFrame: 0,
  isCache: 1,
  visible: 1,
  status: 1,
});

const rules: FormRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  orderNum: [{ required: true, message: '请输入菜单顺序', trigger: 'blur' }],
  path: [
    {
      validator: (_rule, value, callback) => {
        if (form.menuType !== 'F' && !value) {
          callback(new Error('请输入路由地址'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const fetchList = async () => {
  loading.value = true;
  try {
    menuList.value = await getMenuTree(queryParams);
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryParams.menuName = '';
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

const handleAdd = (row?: MenuEntity) => {
  menuOptions.value = [{ id: 0, menuName: '主类目 (顶级目录)', children: menuList.value }];
  Object.assign(form, {
    id: undefined,
    parentId: row ? row.id : 0,
    menuType: row ? (row.menuType === 'M' ? 'C' : 'F') : 'M',
    menuName: '',
    orderNum: 1,
    icon: '',
    path: '',
    component: '',
    perms: '',
    isFrame: 0,
    isCache: 1,
    visible: 1,
    status: 1,
  });
  dialogTitle.value = '新增菜单';
  dialogVisible.value = true;
};

const handleEdit = async (row: MenuEntity) => {
  menuOptions.value = [{ id: 0, menuName: '主类目 (顶级目录)', children: menuList.value }];
  const res = await getMenu(row.id);
  Object.assign(form, {
    id: res.id,
    parentId: res.parentId,
    menuType: res.menuType,
    menuName: res.menuName,
    orderNum: res.orderNum,
    icon: res.icon || '',
    path: res.path || '',
    component: res.component || '',
    perms: res.perms || '',
    isFrame: res.isFrame,
    isCache: res.isCache,
    visible: res.visible,
    status: res.status,
  });
  dialogTitle.value = '修改菜单';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!menuFormRef.value) return;
  await menuFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.id) {
        await updateMenu(form.id, form);
        ElMessage.success('菜单修改成功');
      } else {
        await createMenu(form);
        ElMessage.success('菜单新增成功');
      }
      dialogVisible.value = false;
      fetchList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row: MenuEntity) => {
  ElMessageBox.confirm(`确定删除菜单 "${row.menuName}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteMenu(row.id);
    ElMessage.success('删除成功');
    fetchList();
  });
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="role-management-container">
    <ProTable
      ref="tableRef"
      :columns="columns"
      :request-api="getRoleList"
      :init-param="queryParams"
    >
      <!-- 顶部搜索 -->
      <template #search="{ search, reset }">
        <el-form :model="queryParams" inline>
          <el-form-item label="角色名称">
            <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable />
          </el-form-item>
          <el-form-item label="权限字符">
            <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="角色状态" clearable class="w-28">
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(queryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- 操作栏按钮 -->
      <template #tableHeader>
        <el-button type="primary" icon="Plus" v-hasPermi="['sys:role:create']" @click="handleAdd">
          新增角色
        </el-button>
      </template>

      <!-- 数据范围 Tag -->
      <template #dataScope="{ row }">
        <el-tag :type="getDataScopeTag(row.dataScope)">
          {{ getDataScopeLabel(row.dataScope) }}
        </el-tag>
      </template>

      <!-- 状态 Switch -->
      <template #status="{ row }">
        <el-switch
          :model-value="Number(row.status)"
          :active-value="1"
          :inactive-value="0"
          :disabled="Number(row.id) === 1"
          :before-change="() => handleBeforeStatusChange(row)"
        />
      </template>

      <!-- 行操作列 -->
      <template #action="{ row }">
        <div class="flex items-center justify-center gap-1 whitespace-nowrap">
          <el-button link type="primary" icon="Edit" v-hasPermi="['sys:role:update']" @click="handleEdit(row)">
            修改
          </el-button>
          <el-button link type="success" icon="Check" v-hasPermi="['sys:role:update']" @click="handleMenuPerm(row)">
            菜单权限
          </el-button>
          <el-button link type="warning" icon="CircleCheck" v-hasPermi="['sys:role:update']" @click="handleDataScope(row)">
            数据权限
          </el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            :disabled="row.id === 1"
            v-hasPermi="['sys:role:delete']"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </div>
      </template>
    </ProTable>

    <!-- 角色新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" append-to-body>
      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="例如：财务管理员" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="例如：finance" :disabled="form.id === 1" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="角色状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 菜单权限分配弹窗 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单权限" width="500px" append-to-body>
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-medium">当前角色：{{ currentRole?.roleName }}</span>
        <div class="flex gap-2">
          <el-checkbox v-model="menuExpandAll" @change="handleMenuExpandAll">展开/折叠</el-checkbox>
          <el-checkbox v-model="menuNodeAll" @change="handleMenuNodeAll">全选/全不选</el-checkbox>
        </div>
      </div>
      <div class="border border-gray-200 rounded p-3 max-h-80 overflow-y-auto">
        <el-tree
          ref="menuTreeRef"
          :data="menuTreeOptions"
          :props="{ children: 'children', label: 'menuName' }"
          show-checkbox
          node-key="id"
          :default-expand-all="menuExpandAll"
        />
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="menuLoading" @click="submitMenuPerm">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 数据权限分配弹窗 -->
    <el-dialog v-model="scopeDialogVisible" title="分配数据权限" width="500px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="角色名称">
          <el-input :model-value="currentRole?.roleName" disabled />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input :model-value="currentRole?.roleKey" disabled />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="scopeForm.dataScope" class="w-full">
            <el-option label="1. 全部数据权限" :value="1" />
            <el-option label="2. 本部门及以下数据权限" :value="2" />
            <el-option label="3. 本部门数据权限" :value="3" />
            <el-option label="4. 仅本人数据权限" :value="4" />
            <el-option label="5. 自定义部门数据权限" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="scopeForm.dataScope === 5" label="数据权限">
          <div class="w-full border border-gray-200 rounded p-3 max-h-60 overflow-y-auto">
            <el-tree
              ref="deptTreeRef"
              :data="deptTreeOptions"
              :props="{ children: 'children', label: 'deptName' }"
              show-checkbox
              default-expand-all
              node-key="id"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scopeDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="scopeLoading" @click="submitDataScope">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance, FormRules, ElTree } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import {
  getRoleList,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  changeRoleStatus,
  updateRoleDataScope,
} from '@/api/system/role';
import { getMenuTree } from '@/api/system/menu';
import { getDeptTree } from '@/api/system/dept';
import type { RoleEntity, MenuEntity, DeptEntity } from '@/types/system';

const queryParams = reactive({
  roleName: '',
  roleKey: '',
  status: undefined as number | undefined,
});

const tableRef = ref<InstanceType<typeof ProTable>>();

const columns: ColumnProps[] = [
  { prop: 'id', label: '角色ID', width: 80 },
  { prop: 'roleName', label: '角色名称', minWidth: 140 },
  { prop: 'roleKey', label: '权限字符', minWidth: 120 },
  { prop: 'orderNum', label: '显示顺序', width: 90 },
  { prop: 'dataScope', label: '数据范围', minWidth: 160, slot: 'dataScope' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 180 },
  { prop: 'action', label: '操作', width: 320, minWidth: 320, slot: 'action', align: 'center', fixed: 'right' },
];

const getDataScopeLabel = (scope: number) => {
  const map: Record<number, string> = {
    1: '全部数据',
    2: '本部门及以下',
    3: '仅本部门',
    4: '仅本人',
    5: '自定义部门',
  };
  return map[scope] || '未知范围';
};

const getDataScopeTag = (scope: number): '' | 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<number, any> = { 1: 'danger', 2: 'primary', 3: 'success', 4: 'info', 5: 'warning' };
  return map[scope] || 'info';
};

// 增删改
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const roleFormRef = ref<FormInstance>();
const form = reactive<{
  id?: number;
  roleName: string;
  roleKey: string;
  orderNum: number;
  status: number;
  remark?: string;
}>({
  roleName: '',
  roleKey: '',
  orderNum: 1,
  status: 1,
  remark: '',
});

const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [{ required: true, message: '请输入权限字符', trigger: 'blur' }],
};

const handleBeforeStatusChange = (row: RoleEntity): Promise<boolean> => {
  return new Promise((resolve) => {
    const currentStatus = Number(row.status);
    const targetStatus = currentStatus === 1 ? 0 : 1;
    const text = targetStatus === 1 ? '启用' : '停用';
    const roleName = row.roleName || (row as any).role_name || '该角色';

    ElMessageBox.confirm(`确定要${text}角色 "${roleName}" 吗？`, '状态变更确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        try {
          await changeRoleStatus(Number(row.id), targetStatus);
          row.status = targetStatus;
          ElMessage.success(`${text}成功`);
          resolve(true);
        } catch {
          resolve(false);
        }
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const handleAdd = () => {
  Object.assign(form, {
    id: undefined,
    roleName: '',
    roleKey: '',
    orderNum: 1,
    status: 1,
    remark: '',
  });
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
};

const handleEdit = (row: RoleEntity) => {
  Object.assign(form, {
    id: row.id,
    roleName: row.roleName,
    roleKey: row.roleKey,
    orderNum: row.orderNum,
    status: row.status,
    remark: row.remark,
  });
  dialogTitle.value = '修改角色';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!roleFormRef.value) return;
  await roleFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.id) {
        await updateRole(form.id, form);
        ElMessage.success('角色修改成功');
      } else {
        await createRole(form);
        ElMessage.success('角色新增成功');
      }
      dialogVisible.value = false;
      tableRef.value?.getTableList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row: RoleEntity) => {
  ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteRole(row.id);
    ElMessage.success('删除成功');
    tableRef.value?.getTableList();
  });
};

// 菜单权限分配
const currentRole = ref<RoleEntity | null>(null);
const menuDialogVisible = ref(false);
const menuLoading = ref(false);
const menuTreeOptions = ref<MenuEntity[]>([]);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();
const menuExpandAll = ref(true);
const menuNodeAll = ref(false);

const handleMenuPerm = async (row: RoleEntity) => {
  currentRole.value = row;
  menuDialogVisible.value = true;
  menuLoading.value = true;
  try {
    const [menus, roleDetail] = await Promise.all([getMenuTree(), getRole(row.id)]);
    menuTreeOptions.value = menus;
    await nextTick();
    const checkedKeys = roleDetail.menus?.map((m) => m.id) || [];
    // 仅选中叶子节点，防止全部联动被动选中
    checkedKeys.forEach((key) => {
      const node = menuTreeRef.value?.getNode(key);
      if (node && node.isLeaf) {
        menuTreeRef.value?.setChecked(node, true, false);
      }
    });
  } finally {
    menuLoading.value = false;
  }
};

const handleMenuExpandAll = (val: boolean | string | number) => {
  const nodes = menuTreeRef.value?.store.nodesMap;
  for (const i in nodes) {
    nodes[i].expanded = !!val;
  }
};

const handleMenuNodeAll = (val: boolean | string | number) => {
  menuTreeRef.value?.setCheckedNodes(val ? (menuTreeOptions.value as any) : []);
};

const submitMenuPerm = async () => {
  if (!currentRole.value || !menuTreeRef.value) return;
  menuLoading.value = true;
  try {
    const checkedKeys = menuTreeRef.value.getCheckedKeys() as number[];
    const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys() as number[];
    const allMenuIds = [...checkedKeys, ...halfCheckedKeys];
    await updateRole(currentRole.value.id, {
      menuIds: allMenuIds,
    });
    ElMessage.success('菜单权限分配成功');
    menuDialogVisible.value = false;
  } finally {
    menuLoading.value = false;
  }
};

// 数据权限分配
const scopeDialogVisible = ref(false);
const scopeLoading = ref(false);
const deptTreeOptions = ref<DeptEntity[]>([]);
const deptTreeRef = ref<InstanceType<typeof ElTree>>();
const scopeForm = reactive({
  dataScope: 1,
  deptIds: [] as number[],
});

const handleDataScope = async (row: RoleEntity) => {
  currentRole.value = row;
  scopeForm.dataScope = row.dataScope;
  scopeDialogVisible.value = true;
  scopeLoading.value = true;
  try {
    const [depts, roleDetail] = await Promise.all([getDeptTree(), getRole(row.id)]);
    deptTreeOptions.value = depts;
    await nextTick();
    const checkedDeptIds = roleDetail.depts?.map((d) => d.id) || [];
    deptTreeRef.value?.setCheckedKeys(checkedDeptIds);
  } finally {
    scopeLoading.value = false;
  }
};

const submitDataScope = async () => {
  if (!currentRole.value) return;
  scopeLoading.value = true;
  try {
    const deptIds = scopeForm.dataScope === 5 ? (deptTreeRef.value?.getCheckedKeys() as number[]) : [];
    await updateRoleDataScope(currentRole.value.id, {
      dataScope: scopeForm.dataScope,
      deptIds,
    });
    ElMessage.success('数据权限配置成功');
    scopeDialogVisible.value = false;
    tableRef.value?.getTableList();
  } finally {
    scopeLoading.value = false;
  }
};
</script>

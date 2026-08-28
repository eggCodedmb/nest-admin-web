<template>
  <div class="user-management-container flex gap-4 h-full">
    <!-- 左侧部门组织树 -->
    <div class="w-64 shrink-0">
      <DeptTree v-model="queryParams.deptId" @node-click="handleDeptSelect" />
    </div>

    <!-- 右侧用户数据表格 -->
    <div class="flex-1 min-w-0">
      <ProTable
        ref="tableRef"
        table-key="sys_user"
        :columns="columns"
        :request-api="getUserList"
        :init-param="queryParams"
      >
        <!-- 搜索表单 -->
        <template #search="{ search, reset }">
          <el-form :model="queryParams" inline class="search-form">
            <el-form-item label="用户账号">
              <el-input v-model="queryParams.username" placeholder="请输入账号" clearable />
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable />
            </el-form-item>
            <el-form-item label="用户状态">
              <el-select v-model="queryParams.status" placeholder="状态" clearable class="w-28">
                <el-option
                  v-for="dict in sys_normal_disable"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="Number(dict.dictValue)"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
              <el-button icon="Refresh" @click="handleReset(reset)">重置</el-button>
            </el-form-item>
          </el-form>
        </template>

        <!-- 表格工具栏操作 -->
        <template #tableHeader="{ selectedListIds }">
          <el-button type="primary" icon="Plus" v-hasPermi="['sys:user:create']" @click="handleAdd">
            新增用户
          </el-button>
          <el-button
            type="danger"
            icon="Delete"
            :disabled="!selectedListIds.length"
            v-hasPermi="['sys:user:delete']"
            @click="handleBatchDelete(selectedListIds)"
          >
            批量删除
          </el-button>
        </template>

        <!-- 状态 Switch 切换 -->
        <template #status="{ row }">
          <el-switch
            :model-value="Number(row?.status) === 1 ? 1 : 0"
            :active-value="1"
            :inactive-value="0"
            :disabled="Number(row?.id) === 1"
            :before-change="() => handleBeforeStatusChange(row)"
          />
        </template>

        <!-- 行操作列 -->
        <template #action="{ row }">
          <div class="flex items-center justify-center gap-1 whitespace-nowrap">
            <el-button link type="primary" icon="Edit" v-hasPermi="['sys:user:update']" @click="handleEdit(row)">
              修改
            </el-button>
            <el-button
              link
              type="danger"
              icon="Delete"
              :disabled="row.id === 1"
              v-hasPermi="['sys:user:delete']"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button link type="warning" icon="Key" v-hasPermi="['sys:user:update']" @click="handleResetPwd(row)">
              重置密码
            </el-button>
          </div>
        </template>
      </ProTable>
    </div>

    <!-- 用户新增 / 修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户账号" prop="username">
              <el-input v-model="form.username" placeholder="请输入账号" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptTreeOptions"
                :props="{ children: 'children', label: 'deptName', value: 'id' }"
                check-strictly
                placeholder="请选择归属部门"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="!form.id">
          <el-col :span="12">
            <el-form-item label="登录密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入初始密码" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户性别" prop="sex">
              <el-select v-model="form.sex" placeholder="请选择性别" class="w-full">
                <el-option
                  v-for="dict in sys_user_sex"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="Number(dict.dictValue)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-else>
          <el-col :span="12">
            <el-form-item label="用户邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户性别" prop="sex">
              <el-select v-model="form.sex" placeholder="请选择性别" class="w-full">
                <el-option
                  v-for="dict in sys_user_sex"
                  :key="dict.dictValue"
                  :label="dict.dictLabel"
                  :value="Number(dict.dictValue)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="关联角色" prop="roleIds">
          <el-select v-model="form.roleIds" multiple placeholder="请选择分配角色" class="w-full">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
              :disabled="role.status === 0"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="用户状态" prop="status">
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
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="重置密码" width="400px" append-to-body>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="pwdForm.password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitResetPwd">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import DeptTree from '@/components/DeptTree/index.vue';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import { useDict } from '@/hooks/useDict';
import {
  getUserList,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  resetUserPassword,
} from '@/api/system/user';
import { getAllRoles } from '@/api/system/role';
import { getDeptTree } from '@/api/system/dept';
import type { UserEntity, RoleEntity, DeptEntity } from '@/types/system';

const { sys_user_sex, sys_normal_disable } = useDict('sys_user_sex', 'sys_normal_disable');

const queryParams = reactive({
  deptId: undefined as number | undefined,
  username: '',
  phone: '',
  status: undefined as number | undefined,
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const roleOptions = ref<RoleEntity[]>([]);
const deptTreeOptions = ref<DeptEntity[]>([]);

const columns: ColumnProps[] = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: '用户ID', width: 80 },
  { prop: 'username', label: '用户账号', minWidth: 120 },
  { prop: 'nickname', label: '用户昵称', minWidth: 120 },
  { prop: 'dept.deptName', label: '部门', minWidth: 120 },
  { prop: 'phone', label: '手机号码', width: 130 },
  { prop: 'sex', label: '性别', width: 80, dictOptions: sys_user_sex },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 180 },
  { prop: 'action', label: '操作', width: 220, minWidth: 220, slot: 'action', align: 'center', fixed: 'right' },
];

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const userFormRef = ref<FormInstance>();

const form = reactive<{
  id?: number;
  deptId?: number;
  username: string;
  nickname: string;
  password?: string;
  phone?: string;
  email?: string;
  sex: number;
  status: number;
  roleIds: number[];
  remark?: string;
}>({
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  sex: 0,
  status: 1,
  roleIds: [],
  remark: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择归属部门', trigger: 'change' }],
};

// 重置密码
const pwdDialogVisible = ref(false);
const pwdLoading = ref(false);
const pwdFormRef = ref<FormInstance>();
const pwdUserId = ref<number>(0);
const pwdForm = reactive({ password: '' });
const pwdRules: FormRules = {
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
};

const handleDeptSelect = (dept: DeptEntity) => {
  queryParams.deptId = dept.id;
  tableRef.value?.search(queryParams);
};

const handleReset = (resetFn: Function) => {
  queryParams.deptId = undefined;
  resetFn(queryParams);
};

const handleBeforeStatusChange = (row: UserEntity): Promise<boolean> => {
  return new Promise((resolve) => {
    const currentStatus = Number(row.status);
    const targetStatus = currentStatus === 1 ? 0 : 1;
    const text = targetStatus === 1 ? '启用' : '停用';
    const username = row.username || (row as any).userName || '该用户';

    ElMessageBox.confirm(`确定要${text}用户 "${username}" 吗？`, '状态变更提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        try {
          await changeUserStatus(Number(row.id), targetStatus);
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
    deptId: queryParams.deptId || undefined,
    username: '',
    nickname: '',
    password: '',
    phone: '',
    email: '',
    sex: 0,
    status: 1,
    roleIds: [],
    remark: '',
  });
  dialogTitle.value = '新增用户';
  dialogVisible.value = true;
};

const handleEdit = async (row: UserEntity) => {
  const res = await getUser(row.id);
  Object.assign(form, {
    id: res.id,
    deptId: res.deptId,
    username: res.username,
    nickname: res.nickname,
    phone: res.phone,
    email: res.email,
    sex: res.sex,
    status: res.status,
    roleIds: res.roles?.map((r) => r.id) || [],
    remark: res.remark,
  });
  dialogTitle.value = '修改用户';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      const submitData = { ...form };
      if (!submitData.email) delete submitData.email;
      if (!submitData.phone) delete submitData.phone;
      if (!submitData.remark) delete submitData.remark;

      if (form.id) {
        delete submitData.password;
        await updateUser(form.id, submitData);
        ElMessage.success('用户修改成功');
      } else {
        await createUser(submitData);
        ElMessage.success('用户新增成功');
      }
      dialogVisible.value = false;
      tableRef.value?.getTableList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row: UserEntity) => {
  ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteUser(row.id);
    ElMessage.success('删除成功');
    tableRef.value?.getTableList();
  });
};

const handleBatchDelete = (ids: number[]) => {
  ElMessageBox.confirm(`确定批量删除选中的 ${ids.length} 个用户吗？`, '批量删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    for (const id of ids) {
      await deleteUser(id);
    }
    ElMessage.success('批量删除成功');
    tableRef.value?.getTableList();
  });
};

const handleResetPwd = (row: UserEntity) => {
  pwdUserId.value = row.id;
  pwdForm.password = '';
  pwdDialogVisible.value = true;
};

const submitResetPwd = async () => {
  if (!pwdFormRef.value) return;
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return;
    pwdLoading.value = true;
    try {
      await resetUserPassword(pwdUserId.value, pwdForm.password);
      ElMessage.success('密码重置成功');
      pwdDialogVisible.value = false;
    } finally {
      pwdLoading.value = false;
    }
  });
};

onMounted(async () => {
  roleOptions.value = await getAllRoles();
  deptTreeOptions.value = await getDeptTree();
});
</script>

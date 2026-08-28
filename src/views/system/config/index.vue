<template>
  <div class="config-management-container">
    <ProTable
      ref="tableRef"
      :columns="columns"
      :request-api="getConfigList"
      :init-param="queryParams"
    >
      <template #search="{ search, reset }">
        <el-form :model="queryParams" inline>
          <el-form-item label="参数名称">
            <el-input v-model="queryParams.configName" placeholder="请输入参数名称" clearable />
          </el-form-item>
          <el-form-item label="参数键名">
            <el-input v-model="queryParams.configKey" placeholder="请输入参数键名" clearable />
          </el-form-item>
          <el-form-item label="系统内置">
            <el-select v-model="queryParams.configType" placeholder="类型" clearable class="w-28">
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

      <template #tableHeader>
        <el-button type="primary" icon="Plus" v-hasPermi="['sys:config:create']" @click="handleAdd">
          新增参数
        </el-button>
        <el-button type="danger" icon="Refresh" @click="handleClearCache">
          刷新参数缓存
        </el-button>
      </template>

      <template #configType="{ row }">
        <el-tag :type="row.configType === 1 ? 'danger' : 'info'">
          {{ row.configType === 1 ? '系统内置' : '普通配置' }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <div class="flex items-center justify-center gap-1 whitespace-nowrap">
          <el-button link type="primary" icon="Edit" v-hasPermi="['sys:config:update']" @click="handleEdit(row)">
            修改
          </el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            :disabled="row.configType === 1"
            v-hasPermi="['sys:config:delete']"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </div>
      </template>
    </ProTable>

    <!-- 新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px" append-to-body>
      <el-form ref="configFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="例如：验证码开关" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="例如：sys.account.captchaEnabled" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import {
  getConfigList,
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  clearConfigCache,
} from '@/api/system/config';
import type { ConfigEntity } from '@/types/system';

const queryParams = reactive({
  configName: '',
  configKey: '',
  configType: undefined as number | undefined,
});

const tableRef = ref<InstanceType<typeof ProTable>>();

const columns: ColumnProps[] = [
  { prop: 'id', label: '参数ID', width: 80 },
  { prop: 'configName', label: '参数名称', minWidth: 160 },
  { prop: 'configKey', label: '参数键名', minWidth: 200 },
  { prop: 'configValue', label: '参数键值', minWidth: 140 },
  { prop: 'configType', label: '系统内置', width: 100, slot: 'configType' },
  { prop: 'remark', label: '备注', minWidth: 140 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
  { prop: 'action', label: '操作', width: 160, slot: 'action', align: 'center', fixed: 'right' },
];

const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const configFormRef = ref<FormInstance>();

const form = reactive<{
  id?: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: number;
  remark?: string;
}>({
  configName: '',
  configKey: '',
  configValue: '',
  configType: 0,
  remark: '',
});

const rules: FormRules = {
  configName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  configKey: [{ required: true, message: '请输入参数键名', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入参数键值', trigger: 'blur' }],
};

const handleAdd = () => {
  Object.assign(form, {
    id: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    configType: 0,
    remark: '',
  });
  dialogTitle.value = '新增参数配置';
  dialogVisible.value = true;
};

const handleEdit = async (row: ConfigEntity) => {
  const res = await getConfig(row.id);
  Object.assign(form, {
    id: res.id,
    configName: res.configName,
    configKey: res.configKey,
    configValue: res.configValue,
    configType: res.configType,
    remark: res.remark,
  });
  dialogTitle.value = '修改参数配置';
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!configFormRef.value) return;
  await configFormRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (form.id) {
        await updateConfig(form.id, form);
        ElMessage.success('参数配置修改成功');
      } else {
        await createConfig(form);
        ElMessage.success('参数配置新增成功');
      }
      dialogVisible.value = false;
      tableRef.value?.getTableList();
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleDelete = (row: ConfigEntity) => {
  ElMessageBox.confirm(`确定删除参数 "${row.configName}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteConfig(row.id);
    ElMessage.success('删除成功');
    tableRef.value?.getTableList();
  });
};

const handleClearCache = async () => {
  await clearConfigCache();
  ElMessage.success('参数缓存清除并刷新成功');
};
</script>

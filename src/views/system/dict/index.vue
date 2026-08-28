<template>
  <div class="dict-management-container">
    <!-- 字典类型主表 -->
    <ProTable
      ref="typeTableRef"
      table-key="sys_dict_type"
      :columns="typeColumns"
      :request-api="getDictTypeList"
      :init-param="typeQueryParams"
    >
      <template #search="{ search, reset }">
        <el-form :model="typeQueryParams" inline>
          <el-form-item label="字典名称">
            <el-input v-model="typeQueryParams.dictName" placeholder="请输入字典名称" clearable />
          </el-form-item>
          <el-form-item label="字典类型">
            <el-input v-model="typeQueryParams.dictType" placeholder="请输入字典类型" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="typeQueryParams.status" placeholder="状态" clearable class="w-28">
              <el-option label="正常" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(typeQueryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(typeQueryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #tableHeader>
        <el-button type="primary" icon="Plus" v-hasPermi="['sys:dict:create']" @click="handleAddType">
          新增字典类型
        </el-button>
        <el-button type="danger" icon="Refresh" @click="handleClearCache">
          清除字典缓存
        </el-button>
      </template>

      <template #dictType="{ row }">
        <el-link type="primary" underline="never" @click="handleOpenDataDrawer(row)">
          {{ row.dictType }}
        </el-link>
      </template>

      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '正常' : '停用' }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <div class="flex items-center justify-center gap-1 whitespace-nowrap">
          <el-button link type="primary" icon="Edit" v-hasPermi="['sys:dict:update']" @click="handleEditType(row)">
            修改
          </el-button>
          <el-button link type="success" icon="DataLine" @click="handleOpenDataDrawer(row)">
            数据列表
          </el-button>
          <el-button link type="danger" icon="Delete" v-hasPermi="['sys:dict:delete']" @click="handleDeleteType(row)">
            删除
          </el-button>
        </div>
      </template>
    </ProTable>

    <!-- 字典类型 新增/修改弹窗 -->
    <el-dialog v-model="typeDialogVisible" :title="typeDialogTitle" width="500px" append-to-body>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="80px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="typeForm.dictName" placeholder="例如：用户性别" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="typeForm.dictType" placeholder="例如：sys_user_sex" :disabled="!!typeForm.id" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="typeSubmitLoading" @click="submitTypeForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 字典数据 抽屉管理 -->
    <el-drawer
      v-model="dataDrawerVisible"
      :title="`字典数据 - [${currentDictType?.dictName} (${currentDictType?.dictType})]`"
      size="65%"
      destroy-on-close
    >
      <div class="dict-data-drawer-content p-2">
        <ProTable
          ref="dataTableRef"
          table-key="sys_dict_data"
          :columns="dataColumns"
          :request-api="getDictDataList"
          :init-param="dataQueryParams"
        >
          <template #search="{ search, reset }">
            <el-form :model="dataQueryParams" inline>
              <el-form-item label="字典标签">
                <el-input v-model="dataQueryParams.dictLabel" placeholder="标签" clearable class="w-32" />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="dataQueryParams.status" placeholder="状态" clearable class="w-24">
                  <el-option label="正常" :value="1" />
                  <el-option label="停用" :value="0" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="search(dataQueryParams)">搜索</el-button>
                <el-button icon="Refresh" @click="reset(dataQueryParams)">重置</el-button>
              </el-form-item>
            </el-form>
          </template>

          <template #tableHeader>
            <el-button type="primary" icon="Plus" @click="handleAddData">新增数据项</el-button>
          </template>

          <template #listClass="{ row }">
            <el-tag :type="row.listClass || 'info'">{{ row.dictLabel }}</el-tag>
          </template>

          <template #status="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>

          <template #action="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleEditData(row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDeleteData(row)">删除</el-button>
          </template>
        </ProTable>
      </div>
    </el-drawer>

    <!-- 字典数据 新增/修改弹窗 -->
    <el-dialog v-model="dataDialogVisible" :title="dataDialogTitle" width="500px" append-to-body>
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="80px">
        <el-form-item label="字典类型">
          <el-input :model-value="currentDictType?.dictType" disabled />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="dataForm.dictLabel" placeholder="例如：男" />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model="dataForm.dictValue" placeholder="例如：1" />
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="dataForm.dictSort" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="dataForm.listClass" placeholder="请选择回显Tag样式" class="w-full">
            <el-option label="默认 (info)" value="info" />
            <el-option label="主要 (primary)" value="primary" />
            <el-option label="成功 (success)" value="success" />
            <el-option label="警告 (warning)" value="warning" />
            <el-option label="危险 (danger)" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dataForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="dataSubmitLoading" @click="submitDataForm">确 定</el-button>
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
  getDictTypeList,
  getDictType,
  createDictType,
  updateDictType,
  deleteDictType,
  clearDictCache,
  getDictDataList,
  getDictData,
  createDictData,
  updateDictData,
  deleteDictData,
} from '@/api/system/dict';
import { cleanDictCache } from '@/hooks/useDict';
import type { DictTypeEntity, DictDataEntity } from '@/types/system';

// 字典类型表
const typeQueryParams = reactive({
  dictName: '',
  dictType: '',
  status: undefined as number | undefined,
});

const typeTableRef = ref<InstanceType<typeof ProTable>>();

const typeColumns: ColumnProps[] = [
  { prop: 'id', label: '字典ID', width: 80 },
  { prop: 'dictName', label: '字典名称', minWidth: 150 },
  { prop: 'dictType', label: '字典类型', minWidth: 160, slot: 'dictType' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'remark', label: '备注', minWidth: 150 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
  { prop: 'action', label: '操作', width: 220, slot: 'action', align: 'center', fixed: 'right' },
];

const typeDialogVisible = ref(false);
const typeDialogTitle = ref('');
const typeSubmitLoading = ref(false);
const typeFormRef = ref<FormInstance>();
const typeForm = reactive<{
  id?: number;
  dictName: string;
  dictType: string;
  status: number;
  remark?: string;
}>({
  dictName: '',
  dictType: '',
  status: 1,
  remark: '',
});

const typeRules: FormRules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典类型唯一标识', trigger: 'blur' }],
};

const handleAddType = () => {
  Object.assign(typeForm, { id: undefined, dictName: '', dictType: '', status: 1, remark: '' });
  typeDialogTitle.value = '新增字典类型';
  typeDialogVisible.value = true;
};

const handleEditType = (row: DictTypeEntity) => {
  Object.assign(typeForm, { id: row.id, dictName: row.dictName, dictType: row.dictType, status: row.status, remark: row.remark });
  typeDialogTitle.value = '修改字典类型';
  typeDialogVisible.value = true;
};

const submitTypeForm = async () => {
  if (!typeFormRef.value) return;
  await typeFormRef.value.validate(async (valid) => {
    if (!valid) return;
    typeSubmitLoading.value = true;
    try {
      if (typeForm.id) {
        await updateDictType(typeForm.id, typeForm);
        cleanDictCache(typeForm.dictType);
        ElMessage.success('字典类型修改成功');
      } else {
        await createDictType(typeForm);
        ElMessage.success('字典类型新增成功');
      }
      typeDialogVisible.value = false;
      typeTableRef.value?.getTableList();
    } finally {
      typeSubmitLoading.value = false;
    }
  });
};

const handleDeleteType = (row: DictTypeEntity) => {
  ElMessageBox.confirm(`确定删除字典类型 "${row.dictName}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteDictType(row.id);
    cleanDictCache(row.dictType);
    ElMessage.success('删除成功');
    typeTableRef.value?.getTableList();
  });
};

const handleClearCache = async () => {
  try {
    await clearDictCache();
    cleanDictCache();
    ElMessage.success('字典缓存已成功清除并刷新');
    typeTableRef.value?.getTableList();
  } catch {
    // 异常已由响应拦截器处理
  }
};

// ============= 字典数据抽屉逻辑 =============
const dataDrawerVisible = ref(false);
const currentDictType = ref<DictTypeEntity | null>(null);
const dataTableRef = ref<InstanceType<typeof ProTable>>();

const dataQueryParams = reactive({
  dictType: '',
  dictLabel: '',
  status: undefined as number | undefined,
});

const dataColumns: ColumnProps[] = [
  { prop: 'dictSort', label: '排序', width: 70, align: 'center' },
  { prop: 'dictLabel', label: '字典标签', minWidth: 120 },
  { prop: 'dictValue', label: '字典键值', minWidth: 100 },
  { prop: 'listClass', label: '样式预览', width: 120, slot: 'listClass', align: 'center' },
  { prop: 'status', label: '状态', width: 80, slot: 'status', align: 'center' },
  { prop: 'action', label: '操作', width: 140, slot: 'action', align: 'center' },
];

const handleOpenDataDrawer = (row: DictTypeEntity) => {
  currentDictType.value = row;
  dataQueryParams.dictType = row.dictType;
  dataDrawerVisible.value = true;
};

const dataDialogVisible = ref(false);
const dataDialogTitle = ref('');
const dataSubmitLoading = ref(false);
const dataFormRef = ref<FormInstance>();
const dataForm = reactive<{
  id?: number;
  dictType: string;
  dictLabel: string;
  dictValue: string;
  dictSort: number;
  listClass: string;
  status: number;
}>({
  dictType: '',
  dictLabel: '',
  dictValue: '',
  dictSort: 1,
  listClass: 'primary',
  status: 1,
});

const dataRules: FormRules = {
  dictLabel: [{ required: true, message: '请输入数据标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入数据键值', trigger: 'blur' }],
};

const handleAddData = () => {
  Object.assign(dataForm, {
    id: undefined,
    dictType: currentDictType.value?.dictType || '',
    dictLabel: '',
    dictValue: '',
    dictSort: 1,
    listClass: 'primary',
    status: 1,
  });
  dataDialogTitle.value = '新增字典数据项';
  dataDialogVisible.value = true;
};

const handleEditData = (row: DictDataEntity) => {
  Object.assign(dataForm, {
    id: row.id,
    dictType: row.dictType,
    dictLabel: row.dictLabel,
    dictValue: row.dictValue,
    dictSort: row.dictSort,
    listClass: row.listClass || 'primary',
    status: row.status,
  });
  dataDialogTitle.value = '修改字典数据项';
  dataDialogVisible.value = true;
};

const submitDataForm = async () => {
  if (!dataFormRef.value) return;
  await dataFormRef.value.validate(async (valid) => {
    if (!valid) return;
    dataSubmitLoading.value = true;
    try {
      if (dataForm.id) {
        await updateDictData(dataForm.id, dataForm);
        cleanDictCache(dataForm.dictType);
        ElMessage.success('字典数据修改成功');
      } else {
        await createDictData(dataForm);
        cleanDictCache(dataForm.dictType);
        ElMessage.success('字典数据新增成功');
      }
      dataDialogVisible.value = false;
      dataTableRef.value?.getTableList();
    } finally {
      dataSubmitLoading.value = false;
    }
  });
};

const handleDeleteData = (row: DictDataEntity) => {
  ElMessageBox.confirm(`确定删除字典数据项 "${row.dictLabel}" 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteDictData(row.id);
    cleanDictCache(row.dictType);
    ElMessage.success('删除成功');
    dataTableRef.value?.getTableList();
  });
};
</script>

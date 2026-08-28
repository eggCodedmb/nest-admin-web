<template>
  <div class="log-management-container">
    <ProTable
      ref="tableRef"
      table-key="sys_log"
      :columns="columns"
      :request-api="getOperLogList"
      :init-param="queryParams"
    >
      <template #search="{ search, reset }">
        <el-form :model="queryParams" inline>
          <el-form-item label="系统模块">
            <el-input v-model="queryParams.title" placeholder="例如：新增用户" clearable />
          </el-form-item>
          <el-form-item label="操作人员">
            <el-input v-model="queryParams.operName" placeholder="操作人账号" clearable />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="queryParams.businessType" placeholder="业务类型" clearable class="w-28">
              <el-option label="新增" :value="1" />
              <el-option label="修改" :value="2" />
              <el-option label="删除" :value="3" />
              <el-option label="导出" :value="4" />
              <el-option label="导入" :value="5" />
              <el-option label="其他" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="状态" clearable class="w-24">
              <el-option label="成功" :value="1" />
              <el-option label="异常" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="search(queryParams)">搜索</el-button>
            <el-button icon="Refresh" @click="reset(queryParams)">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #tableHeader="{ selectedListIds }">
        <el-button
          type="danger"
          icon="Delete"
          :disabled="!selectedListIds.length"
          v-hasPermi="['sys:log:delete']"
          @click="handleBatchDelete(selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button type="warning" icon="DeleteFilled" v-hasPermi="['sys:log:delete']" @click="handleClean">
          清空全部日志
        </el-button>
      </template>

      <!-- 业务类型 Tag -->
      <template #businessType="{ row }">
        <el-tag :type="getBusinessTypeTag(row.businessType)">
          {{ getBusinessTypeLabel(row.businessType) }}
        </el-tag>
      </template>

      <!-- 请求方式 Badge -->
      <template #requestMethod="{ row }">
        <el-tag effect="plain" :type="getMethodTag(row.requestMethod)">
          {{ row.requestMethod }}
        </el-tag>
      </template>

      <!-- 耗时高亮 -->
      <template #costTime="{ row }">
        <span :class="row.costTime > 1000 ? 'text-red-500 font-bold' : row.costTime > 500 ? 'text-yellow-600' : 'text-green-600'">
          {{ row.costTime }} ms
        </span>
      </template>

      <!-- 状态 -->
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">
          {{ row.status === 1 ? '成功' : '异常' }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <div class="flex items-center justify-center whitespace-nowrap">
          <el-button link type="primary" icon="View" @click="handleViewDetail(row)">
            详细快照
          </el-button>
        </div>
      </template>
    </ProTable>

    <!-- 操作日志详细信息抽屉 -->
    <el-drawer v-model="detailVisible" title="操作日志详细快照" size="55%" destroy-on-close>
      <div v-if="currentLog" class="log-detail p-4 space-y-4 text-sm">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模块标题">{{ currentLog.title }}</el-descriptions-item>
          <el-descriptions-item label="业务类型">{{ getBusinessTypeLabel(currentLog.businessType) }}</el-descriptions-item>
          <el-descriptions-item label="操作人员">{{ currentLog.operName }} (ID: {{ currentLog.operUserId || '--' }})</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentLog.deptName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="请求方式">{{ currentLog.requestMethod }}</el-descriptions-item>
          <el-descriptions-item label="消耗时间">{{ currentLog.costTime }} ms</el-descriptions-item>
          <el-descriptions-item label="请求地址" :span="2">{{ currentLog.operUrl }}</el-descriptions-item>
          <el-descriptions-item label="主机地址">{{ currentLog.operIp }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatDate(currentLog.operTime) }}</el-descriptions-item>
          <el-descriptions-item label="操作状态" :span="2">
            <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
              {{ currentLog.status === 1 ? '正常' : '异常' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 请求参数 JSON -->
        <div>
          <div class="font-bold text-gray-700 dark:text-gray-200 mb-2">请求参数 (operParam):</div>
          <pre class="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">{{ formatJson(currentLog.operParam) }}</pre>
        </div>

        <!-- 返回结果 JSON -->
        <div>
          <div class="font-bold text-gray-700 dark:text-gray-200 mb-2">返回结果 (jsonResult):</div>
          <pre class="bg-gray-900 text-blue-300 p-3 rounded-lg overflow-x-auto text-xs font-mono">{{ formatJson(currentLog.jsonResult) }}</pre>
        </div>

        <!-- 异常堆栈信息 -->
        <div v-if="currentLog.errorMsg">
          <div class="font-bold text-red-600 mb-2">异常信息 (errorMsg):</div>
          <pre class="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg overflow-x-auto text-xs font-mono">{{ currentLog.errorMsg }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProTable, { ColumnProps } from '@/components/ProTable/index.vue';
import { getOperLogList, getOperLog, cleanOperLog, deleteOperLogs } from '@/api/system/log';
import { formatDate } from '@/utils/date';
import type { OperLogEntity } from '@/types/system';

const queryParams = reactive({
  title: '',
  operName: '',
  businessType: undefined as number | undefined,
  status: undefined as number | undefined,
});

const tableRef = ref<InstanceType<typeof ProTable>>();

const columns: ColumnProps[] = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: '日志ID', width: 80 },
  { prop: 'title', label: '系统模块', minWidth: 140 },
  { prop: 'businessType', label: '业务类型', width: 100, slot: 'businessType', align: 'center' },
  { prop: 'requestMethod', label: '请求方式', width: 90, slot: 'requestMethod', align: 'center' },
  { prop: 'operName', label: '操作人员', width: 110 },
  { prop: 'operIp', label: '主机地址', width: 130 },
  { prop: 'status', label: '状态', width: 80, slot: 'status', align: 'center' },
  { prop: 'costTime', label: '消耗时间', width: 100, slot: 'costTime', align: 'center' },
  { prop: 'operTime', label: '操作时间', width: 180 },
  { prop: 'action', label: '操作', width: 120, minWidth: 120, slot: 'action', align: 'center', fixed: 'right' },
];

const getBusinessTypeLabel = (type: number) => {
  const map: Record<number, string> = { 1: '新增', 2: '修改', 3: '删除', 4: '导出', 5: '导入', 0: '其他' };
  return map[type] || '其他';
};

const getBusinessTypeTag = (type: number): '' | 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<number, any> = { 1: 'success', 2: 'primary', 3: 'danger', 4: 'warning', 5: 'info', 0: 'info' };
  return map[type] || 'info';
};

const getMethodTag = (method: string): '' | 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, any> = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' };
  return map[method] || 'info';
};

const formatJson = (data: any) => {
  if (!data) return '--';
  try {
    if (typeof data === 'string') {
      return JSON.stringify(JSON.parse(data), null, 2);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

// 详情抽屉
const detailVisible = ref(false);
const currentLog = ref<OperLogEntity | null>(null);

const handleViewDetail = async (row: OperLogEntity) => {
  currentLog.value = await getOperLog(row.id);
  detailVisible.value = true;
};

const handleBatchDelete = (ids: number[]) => {
  ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条操作日志吗？`, '删除提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteOperLogs(ids);
    ElMessage.success('删除成功');
    tableRef.value?.getTableList();
  });
};

const handleClean = () => {
  ElMessageBox.confirm('确定清空所有的操作日志吗？此操作不可逆！', '清空警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await cleanOperLog();
    ElMessage.success('已成功清空操作日志');
    tableRef.value?.getTableList();
  });
};
</script>

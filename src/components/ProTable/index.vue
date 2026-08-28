<template>
  <div class="pro-table-container">
    <!-- 1. 顶部查询表单插槽 -->
    <div v-if="$slots.search && showSearch" class="pro-table-search mb-4">
      <el-card shadow="never" class="search-card">
        <slot name="search" :search="search" :reset="reset" />
      </el-card>
    </div>

    <!-- 2. 表格主体与操作区 -->
    <el-card shadow="never" class="table-card">
      <div class="table-header-toolbar flex justify-between items-center mb-3">
        <!-- 左侧业务按钮插槽 (新增、批量删除、导出等) -->
        <div class="toolbar-left flex gap-2">
          <slot name="tableHeader" :selected-list="selectedList" :selected-list-ids="selectedListIds" />
        </div>

        <!-- 右侧通用工具栏 (显隐搜索、刷新、列显隐) -->
        <RightToolbar
          v-model:showSearch="showSearch"
          :columns="localColumns"
          @queryTable="getTableList"
        />
      </div>

      <!-- 表格实体 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        :row-key="rowKey"
        :border="border"
        :stripe="stripe"
        @selection-change="handleSelectionChange"
        v-bind="$attrs"
      >
        <template v-for="col in activeColumns" :key="col.prop || col.type || col.label">
          <!-- 多选列 -->
          <el-table-column
            v-if="col.type === 'selection'"
            type="selection"
            :width="col.width || 50"
            :align="col.align || 'center'"
            :selectable="col.selectable"
            :fixed="col.fixed"
          />

          <!-- 序号列 -->
          <el-table-column
            v-else-if="col.type === 'index'"
            type="index"
            :label="col.label || '序号'"
            :width="col.width || 60"
            :align="col.align || 'center'"
            :fixed="col.fixed"
          />

          <!-- 常规业务数据列 -->
          <el-table-column
            v-else
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'center'"
            :show-overflow-tooltip="col.showOverflowTooltip ?? (col.slot ? false : true)"
            :sortable="col.sortable"
            :fixed="col.fixed"
          >
            <!-- 单元格内容渲染 -->
            <template #default="scope">
              <!-- 自定义插槽优先 -->
              <slot v-if="col.slot" :name="col.slot" v-bind="scope" />

              <!-- 字典自动回显 -->
              <DictTag
                v-else-if="col.dictOptions"
                :options="col.dictOptions"
                :value="getNestedValue(scope.row, col.prop!)"
              />

              <!-- 自定义格式化委托 / 时间格式化 / 默认回显 -->
              <span v-else>{{ renderCellValue(scope.row, col, scope.$index) }}</span>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <!-- 3. 底部分页组件 -->
      <div v-if="pagination" class="table-pagination mt-4 flex justify-end">
        <Pagination
          v-model:page="pageParam.pageNum"
          v-model:limit="pageParam.pageSize"
          :total="pageParam.total"
          @pagination="getTableList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElTable } from 'element-plus';
import RightToolbar from '../RightToolbar/index.vue';
import Pagination from '../Pagination/index.vue';
import DictTag from '../DictTag/index.vue';
import { formatDate, DatePattern } from '@/utils/date';

export interface ColumnProps {
  type?: 'selection' | 'index';
  prop?: string;
  label?: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  slot?: string;
  headerSlot?: string;
  dictOptions?: any;
  showOverflowTooltip?: boolean;
  sortable?: boolean | string;
  isShow?: boolean;
  fixed?: string | boolean;
  selectable?: (row: any, index: number) => boolean;
  dateFormat?: boolean | string;
  formatter?: (row: any, column: ColumnProps, cellValue: any, index: number) => any;
}

const props = withDefaults(
  defineProps<{
    columns: ColumnProps[];
    requestApi: (params: any) => Promise<{ rows: any[]; total: number } | any>;
    initParam?: Record<string, any>;
    rowKey?: string;
    border?: boolean;
    stripe?: boolean;
    pagination?: boolean;
    autoRequest?: boolean;
  }>(),
  {
    initParam: () => ({}),
    rowKey: 'id',
    border: true,
    stripe: true,
    pagination: true,
    autoRequest: true,
  },
);

const tableRef = ref<any>();
const tableData = ref<any[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const selectedList = ref<any[]>([]);

const pageParam = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

// 创建 columns 的响应式副本，使显隐列切换具备响应式能力
const localColumns = ref<ColumnProps[]>([]);

watch(
  () => props.columns,
  (newCols) => {
    localColumns.value = newCols.map((col) => ({ ...col }));
  },
  { immediate: true },
);

const activeColumns = computed(() => {
  return localColumns.value.filter((c) => c.isShow !== false);
});

const selectedListIds = computed(() => {
  return selectedList.value.map((item) => item[props.rowKey]);
});

const handleSelectionChange = (selection: any[]) => {
  selectedList.value = selection;
};

function getNestedValue(obj: any, path: string) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function renderCellValue(row: any, col: ColumnProps, index: number) {
  const rawValue = getNestedValue(row, col.prop!);

  // 1. 自定义 formatter 委托函数优先
  if (typeof col.formatter === 'function') {
    return col.formatter(row, col, rawValue, index);
  }

  // 2. 显式配置了 dateFormat 属性
  if (col.dateFormat) {
    const format = typeof col.dateFormat === 'string' ? col.dateFormat : DatePattern.DATETIME;
    return formatDate(rawValue, format);
  }

  // 3. 智能识别时间字段并自动格式化
  if (col.prop && isTimeField(col.prop) && isFormatCandidate(rawValue)) {
    return formatDate(rawValue, DatePattern.DATETIME);
  }

  return rawValue ?? '--';
}

function isTimeField(prop: string): boolean {
  const lower = prop.toLowerCase();
  return (
    lower.endsWith('time') ||
    lower.endsWith('date') ||
    lower.endsWith('at') ||
    lower === 'created_at' ||
    lower === 'updated_at' ||
    lower === 'deleted_at'
  );
}

function isFormatCandidate(val: any): boolean {
  if (!val) return false;
  if (typeof val === 'number') return val > 1000000000;
  if (typeof val === 'string') {
    return /^\d{4}-\d{2}-\d{2}/.test(val);
  }
  if (val instanceof Date) return true;
  return false;
}

const getTableList = async (extraParam: Record<string, any> = {}) => {
  loading.value = true;
  try {
    const params = {
      ...(props.pagination ? { pageNum: pageParam.value.pageNum, pageSize: pageParam.value.pageSize } : {}),
      ...props.initParam,
      ...extraParam,
    };
    const res = await props.requestApi(params);
    if (Array.isArray(res)) {
      tableData.value = res;
      pageParam.value.total = res.length;
    } else if (res && typeof res === 'object') {
      tableData.value = res.rows || [];
      pageParam.value.total = res.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const search = (param: Record<string, any> = {}) => {
  pageParam.value.pageNum = 1;
  getTableList(param);
};

const reset = (param: Record<string, any> = {}) => {
  pageParam.value.pageNum = 1;
  getTableList(param);
};

onMounted(() => {
  if (props.autoRequest) {
    getTableList();
  }
});

defineExpose({
  element: tableRef,
  tableData,
  pageParam,
  getTableList,
  search,
  reset,
  clearSelection: () => tableRef.value?.clearSelection(),
});
</script>

<style scoped>
.pro-table-container {
  width: 100%;
}
.search-card :deep(.el-card__body) {
  padding-bottom: 2px;
}
</style>

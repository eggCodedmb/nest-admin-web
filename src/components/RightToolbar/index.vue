<template>
  <div class="right-toolbar-container flex items-center gap-2">
    <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
      <el-button circle icon="Search" @click="toggleSearch" />
    </el-tooltip>
    <el-tooltip content="刷新表格" placement="top">
      <el-button circle icon="Refresh" @click="refresh" />
    </el-tooltip>
    <el-popover placement="bottom-end" :width="220" trigger="click" popper-class="column-setting-popover">
      <template #reference>
        <el-tooltip content="显隐列设置" placement="top">
          <el-button circle icon="Menu" />
        </el-tooltip>
      </template>
      <div class="column-setting-content">
        <div class="column-setting-header flex justify-between items-center pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <el-checkbox
            :model-value="isAllChecked"
            :indeterminate="isIndeterminate"
            @change="handleCheckAllChange"
          >
            列显隐 ({{ checkedCount }}/{{ filterColumns.length }})
          </el-checkbox>
          <el-button link type="primary" size="small" @click="handleReset">
            重置
          </el-button>
        </div>
        <div class="column-checkbox-list flex flex-col gap-1 max-h-60 overflow-y-auto">
          <el-checkbox
            v-for="col in filterColumns"
            :key="col.prop || col.slot || col.label"
            v-model="col.isShow"
            @change="handleColumnChange"
          >
            {{ col.label || col.prop }}
          </el-checkbox>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  showSearch: boolean;
  columns: any[];
}>();

const emit = defineEmits<{
  (e: 'update:showSearch', val: boolean): void;
  (e: 'queryTable'): void;
  (e: 'columnChange'): void;
  (e: 'resetColumns'): void;
}>();

const filterColumns = computed(() => {
  return (props.columns || []).filter((c) => (c.label || c.prop) && c.type !== 'selection' && c.type !== 'index');
});

const checkedCount = computed(() => {
  return filterColumns.value.filter((c) => c.isShow !== false).length;
});

const isAllChecked = computed(() => {
  return filterColumns.value.length > 0 && checkedCount.value === filterColumns.value.length;
});

const isIndeterminate = computed(() => {
  return checkedCount.value > 0 && checkedCount.value < filterColumns.value.length;
});

const handleCheckAllChange = (val: any) => {
  const isChecked = Boolean(val);
  filterColumns.value.forEach((col) => {
    col.isShow = isChecked;
  });
  emit('columnChange');
};

const handleColumnChange = () => {
  emit('columnChange');
};

const handleReset = () => {
  emit('resetColumns');
};

const toggleSearch = () => {
  emit('update:showSearch', !props.showSearch);
};

const refresh = () => {
  emit('queryTable');
};
</script>

<style scoped>
.column-setting-content {
  padding: 2px 0;
}
.column-checkbox-list :deep(.el-checkbox) {
  margin-right: 0;
  height: 28px;
}
</style>

<template>
  <div class="right-toolbar-container flex items-center gap-2">
    <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
      <el-button circle icon="Search" @click="toggleSearch" />
    </el-tooltip>
    <el-tooltip content="刷新表格" placement="top">
      <el-button circle icon="Refresh" @click="refresh" />
    </el-tooltip>
    <el-popover placement="bottom-end" title="显隐列设置" :width="200" trigger="click">
      <template #reference>
        <el-button circle icon="Menu" />
      </template>
      <div class="column-checkbox-list flex flex-col gap-1 max-h-60 overflow-y-auto">
        <el-checkbox
          v-for="col in filterColumns"
          :key="col.prop || col.label"
          v-model="col.isShow"
          :label="col.label"
        />
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
}>();

const filterColumns = computed(() => {
  return props.columns.filter((c) => c.label && c.type !== 'selection' && c.type !== 'index');
});

const toggleSearch = () => {
  emit('update:showSearch', !props.showSearch);
};

const refresh = () => {
  emit('queryTable');
};
</script>

<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    total: number;
    page: number;
    limit: number;
    pageSizes?: number[];
  }>(),
  {
    total: 0,
    page: 1,
    limit: 10,
    pageSizes: () => [10, 20, 30, 50],
  },
);

const emit = defineEmits<{
  (e: 'update:page', val: number): void;
  (e: 'update:limit', val: number): void;
  (e: 'pagination', val: { page: number; limit: number }): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val),
});

const pageSize = computed({
  get: () => props.limit,
  set: (val) => emit('update:limit', val),
});

const handleSizeChange = (val: number) => {
  emit('pagination', { page: currentPage.value, limit: val });
};

const handleCurrentChange = (val: number) => {
  emit('pagination', { page: val, limit: pageSize.value });
};
</script>

<style scoped>
.pagination-container {
  padding: 12px 0;
}
</style>

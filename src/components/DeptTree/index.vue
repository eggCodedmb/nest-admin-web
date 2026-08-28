<template>
  <div class="dept-tree-container">
    <!-- 顶部检索与操作栏 -->
    <div v-if="showSearch" class="dept-search-header flex items-center gap-2 mb-3">
      <el-input
        v-model="deptName"
        :placeholder="placeholder"
        clearable
        prefix-icon="Search"
        size="default"
        class="flex-1"
      />
      <div class="action-icons flex items-center">
        <el-tooltip :content="isExpandAll ? '折叠全部' : '展开全部'" placement="top">
          <el-button link :icon="isExpandAll ? 'Fold' : 'Expand'" @click="toggleExpandAll" />
        </el-tooltip>
        <el-tooltip content="刷新部门" placement="top">
          <el-button link icon="Refresh" @click="fetchDeptTree" />
        </el-tooltip>
      </div>
    </div>

    <!-- 树形结构展示 -->
    <div class="tree-wrapper flex-1 overflow-y-auto" v-loading="loading">
      <el-tree
        ref="treeRef"
        :data="deptOptions"
        :props="defaultProps"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :default-expand-all="isExpandAll"
        :highlight-current="true"
        node-key="id"
        :current-node-key="modelValue"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node flex items-center text-sm w-full">
            <el-icon class="mr-1.5 text-blue-500">
              <component :is="data.children?.length ? 'OfficeBuilding' : 'Folder'" />
            </el-icon>
            <span class="node-label flex-1 truncate" :title="node.label">{{ node.label }}</span>
            <el-tag v-if="data.status === 0" type="danger" size="small" effect="plain" class="ml-1">
              停用
            </el-tag>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { ElTree } from 'element-plus';
import { getDeptTree } from '@/api/system/dept';
import type { DeptEntity } from '@/types/system';

const props = withDefaults(
  defineProps<{
    modelValue?: number | string;
    showSearch?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    showSearch: true,
    placeholder: '输入部门名称搜索',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void;
  (e: 'node-click', nodeData: DeptEntity): void;
}>();

const deptName = ref('');
const deptOptions = ref<DeptEntity[]>([]);
const loading = ref(false);
const isExpandAll = ref(true);
const treeRef = ref<InstanceType<typeof ElTree>>();

const defaultProps = {
  children: 'children',
  label: 'deptName',
};

watch(deptName, (val) => {
  treeRef.value?.filter(val);
});

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return (data.deptName || '').toLowerCase().includes(value.toLowerCase());
};

const handleNodeClick = (data: DeptEntity) => {
  emit('update:modelValue', data.id);
  emit('node-click', data);
};

const toggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
  const nodes = treeRef.value?.store.nodesMap;
  if (nodes) {
    for (const i in nodes) {
      nodes[i].expanded = isExpandAll.value;
    }
  }
};

const fetchDeptTree = async () => {
  loading.value = true;
  try {
    const res = await getDeptTree();
    deptOptions.value = res;
    await nextTick();
    if (props.modelValue && treeRef.value) {
      treeRef.value.setCurrentKey(props.modelValue);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDeptTree();
});

defineExpose({
  fetchDeptTree,
  treeRef,
});
</script>

<style scoped>
.dept-tree-container {
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.custom-tree-node {
  display: flex;
  align-items: center;
  overflow: hidden;
}
</style>

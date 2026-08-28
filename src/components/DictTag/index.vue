<template>
  <div class="dict-tag-inline inline-flex items-center">
    <template v-for="(item, index) in computedOptions" :key="item.id || index">
      <el-tag
        v-if="String(item.dictValue) === String(value)"
        :type="getTagType(item.listClass)"
        :class="item.cssClass"
        size="default"
        disable-transitions
      >
        {{ item.dictLabel }}
      </el-tag>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, isRef } from 'vue';

const props = defineProps<{
  options?: any;
  value?: string | number | boolean;
}>();

const computedOptions = computed((): any[] => {
  if (!props.options) return [];
  if (isRef(props.options)) return (props.options.value as any[]) || [];
  if (Array.isArray(props.options)) return props.options;
  return [];
});

const getTagType = (listClass?: string): '' | 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  if (!listClass || listClass === 'default') return 'info';
  if (listClass === 'primary') return 'primary';
  if (listClass === 'success') return 'success';
  if (listClass === 'warning') return 'warning';
  if (listClass === 'danger') return 'danger';
  return 'info';
};
</script>

<template>
  <div class="icon-select-container">
    <el-popover placement="bottom-start" :width="380" trigger="click" v-model:visible="visible">
      <template #reference>
        <el-input :model-value="modelValue" placeholder="点击选择图标" readonly clearable @clear="handleClear">
          <template #prefix>
            <el-icon v-if="modelValue && modelValue !== '#'">
              <component :is="modelValue" />
            </el-icon>
            <el-icon v-else><Search /></el-icon>
          </template>
        </el-input>
      </template>

      <div class="icon-select-popover">
        <el-input v-model="name" placeholder="搜索图标..." clearable class="mb-3" />
        <div class="icon-list grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
          <div
            v-for="item in iconList"
            :key="item"
            class="icon-item flex flex-col items-center justify-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            :class="{ 'text-primary font-bold bg-blue-50': modelValue === item }"
            @click="selectIcon(item)"
          >
            <el-icon :size="20">
              <component :is="item" />
            </el-icon>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

const visible = ref(false);
const name = ref('');

const allIcons = Object.keys(ElementPlusIconsVue).filter((icon) => icon !== 'default');

const iconList = computed(() => {
  if (!name.value) return allIcons;
  return allIcons.filter((item) => item.toLowerCase().includes(name.value.toLowerCase()));
});

const selectIcon = (iconName: string) => {
  emit('update:modelValue', iconName);
  visible.value = false;
};

const handleClear = () => {
  emit('update:modelValue', '');
};
</script>

<style scoped>
.icon-item {
  transition: all 0.2s ease;
}
</style>

<template>
  <div class="theme-switch-wrapper flex items-center justify-center cursor-pointer px-2 h-full" @click="handleToggleTheme">
    <el-tooltip
      :content="isDark ? $t('navbar.lightMode') : $t('navbar.darkMode')"
      placement="bottom"
      effect="dark"
    >
      <div class="icon-box flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary">
        <el-icon :size="19" class="theme-icon" :class="{ 'is-dark': isDark }">
          <Moon v-if="!isDark" />
          <Sunny v-else />
        </el-icon>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

const isDark = computed(() => appStore.theme === 'dark');

const handleToggleTheme = () => {
  appStore.toggleTheme();
};
</script>

<style scoped lang="scss">
.theme-switch-wrapper {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .theme-icon {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    &.is-dark {
      transform: rotate(360deg);
      color: #e6a23c;
    }
  }
}

html.dark {
  .theme-switch-wrapper:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
}
</style>

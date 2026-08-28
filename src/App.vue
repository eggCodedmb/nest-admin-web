<template>
  <el-config-provider :locale="currentLocale" :size="appStore.size as any">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import ja from 'element-plus/es/locale/lang/ja';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

const currentLocale = computed(() => {
  switch (appStore.language) {
    case 'en-US':
      return en;
    case 'ja-JP':
      return ja;
    case 'zh-CN':
    default:
      return zhCn;
  }
});
</script>

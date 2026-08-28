<template>
  <div class="not-found-container flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <h1 class="text-8xl font-extrabold text-primary mb-4">404</h1>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">抱歉，页面未找到</h2>
      <p class="text-gray-500 mb-6">您访问的页面不存在或没有权限查看</p>
      <el-button type="primary" size="large" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="not-found-container flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <h1 class="text-8xl font-extrabold text-primary mb-4">{{ $t('error.pageNotFound') }}</h1>
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">{{ $t('error.pageNotFoundTitle') }}</h2>
      <p class="text-gray-500 mb-6">{{ $t('error.pageNotFoundDesc') }}</p>
      <el-button type="primary" size="large" @click="goHome">{{ $t('error.backHome') }}</el-button>
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

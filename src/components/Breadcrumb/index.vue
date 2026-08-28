<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span v-if="index === levelList.length - 1" class="no-redirect">
          {{ tRouteTitle(item.meta.title as string) }}
        </span>
        <a v-else @click.prevent="handleLink(item)">{{ tRouteTitle(item.meta.title as string) }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter, RouteLocationMatched } from 'vue-router';
import { tRouteTitle } from '@/utils/i18n';

const route = useRoute();
const router = useRouter();
const levelList = ref<RouteLocationMatched[]>([]);

function getBreadcrumb() {
  let matched = route.matched.filter((item) => item.meta && item.meta.title);
  const first = matched[0];

  if (!isDashboard(first)) {
    matched = [{ path: '/dashboard', meta: { title: '首页概览' } } as any].concat(matched);
  }

  levelList.value = matched.filter((item) => item.meta && item.meta.title && item.meta.breadcrumb !== false);
}

function isDashboard(routeItem?: RouteLocationMatched) {
  const name = routeItem && routeItem.name;
  if (!name) return false;
  return String(name).trim().toLocaleLowerCase() === 'Dashboard'.toLocaleLowerCase();
}

function handleLink(item: RouteLocationMatched) {
  const { redirect, path } = item;
  if (redirect) {
    router.push(String(redirect));
    return;
  }
  router.push(path);
}

watch(
  () => route.path,
  () => getBreadcrumb(),
  { immediate: true },
);
</script>

<style scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;
}
.no-redirect {
  color: var(--el-text-color-regular);
  cursor: text;
}
</style>

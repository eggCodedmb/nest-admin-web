<template>
  <div :class="classObj" class="app-wrapper">
    <!-- 侧边栏 -->
    <Sidebar class="sidebar-container" />

    <!-- 右侧内容区域 -->
    <div class="main-container">
      <div class="fixed-header">
        <Navbar />
        <TagsView />
      </div>
      <AppMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Sidebar from './components/Sidebar/index.vue';
import Navbar from './components/Navbar.vue';
import TagsView from './components/TagsView/index.vue';
import AppMain from './components/AppMain.vue';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();

const classObj = computed(() => ({
  hideSidebar: !appStore.sidebar.opened,
  openSidebar: appStore.sidebar.opened,
  withoutAnimation: appStore.sidebar.withoutAnimation,
}));
</script>

<style scoped lang="scss">
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;

  .fixed-header {
    position: sticky;
    top: 0;
    z-index: 9;
    width: 100%;
  }
}
</style>

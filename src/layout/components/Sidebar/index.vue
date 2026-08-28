<template>
  <div class="sidebar-wrapper">
    <Logo :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="isDark ? '#18181c' : '#304156'"
        :text-color="isDark ? '#c0c4cc' : '#bfcbd9'"
        active-text-color="#409EFF"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
      >
        <SidebarItem
          v-for="route in sidebarRouters"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';
import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';

const route = useRoute();
const appStore = useAppStore();
const permissionStore = usePermissionStore();

const sidebarRouters = computed(() => permissionStore.sidebarRouters);
const isCollapse = computed(() => !appStore.sidebar.opened);
const isDark = computed(() => appStore.theme === 'dark');

const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta?.activeMenu) {
    return String(meta.activeMenu);
  }
  return path;
});
</script>

<style scoped lang="scss">
.sidebar-wrapper {
  height: 100%;
}
</style>

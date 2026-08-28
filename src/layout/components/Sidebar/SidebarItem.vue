<template>
  <div v-if="!item.meta?.hidden">
    <template
      v-if="
        hasOneShowingChild(item.children, item) &&
        (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
        !item.alwaysShow
      "
    >
      <router-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <el-icon v-if="getMenuIcon(onlyOneChild.meta?.icon || item.meta?.icon)">
            <component :is="getMenuIcon(onlyOneChild.meta?.icon || item.meta?.icon)" />
          </el-icon>
          <template #title>
            <span>{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </router-link>
    </template>

    <el-sub-menu v-else :index="resolvePath(item.path)" teleported>
      <template #title>
        <el-icon v-if="getMenuIcon(item.meta?.icon)">
          <component :is="getMenuIcon(item.meta?.icon)" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>

      <SidebarItem
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

const props = defineProps<{
  item: RouteRecordRaw & { alwaysShow?: boolean };
  isNest?: boolean;
  basePath: string;
}>();

const onlyOneChild = ref<any>({});

function hasOneShowingChild(children: RouteRecordRaw[] = [], parent: RouteRecordRaw) {
  const showingChildren = children.filter((item) => {
    if (item.meta?.hidden) {
      return false;
    } else {
      onlyOneChild.value = item;
      return true;
    }
  });

  if (showingChildren.length === 1) {
    return true;
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true };
    return true;
  }

  return false;
}

function resolvePath(routePath: string) {
  if (isExternal(routePath)) {
    return routePath;
  }
  if (isExternal(props.basePath)) {
    return props.basePath;
  }
  if (routePath.startsWith('/')) {
    return routePath;
  }
  if (props.basePath.endsWith('/')) {
    return props.basePath + routePath;
  }
  return `${props.basePath}/${routePath}`;
}

function isExternal(path: string) {
  return /^(https?:|mailto:|tel:)/.test(path);
}

function getMenuIcon(icon?: any): string {
  if (!icon || typeof icon !== 'string' || icon === '#') return '';
  return icon;
}
</script>

<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :to="{ path: tag.path!, query: tag.query }"
        class="tags-view-item"
        :class="{ active: isActive(tag) }"
      >
        <span class="tag-title">{{ tag.title }}</span>
        <el-icon v-if="!isAffix(tag)" class="close-icon" @click.prevent.stop="closeSelectedTag(tag)">
          <Close />
        </el-icon>
      </router-link>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTagsViewStore, TagView } from '@/store/modules/tagsView';
import { usePermissionStore } from '@/store/modules/permission';

const route = useRoute();
const router = useRouter();
const tagsViewStore = useTagsViewStore();
const permissionStore = usePermissionStore();

const visitedViews = computed(() => tagsViewStore.visitedViews);

function isActive(tag: TagView) {
  return tag.path === route.path;
}

function isAffix(tag: TagView) {
  return tag.meta && tag.meta.affix;
}

function addTags() {
  const { name } = route;
  if (name) {
    tagsViewStore.addView(route);
  }
}

function closeSelectedTag(view: TagView) {
  tagsViewStore.delView(view).then((res: any) => {
    if (isActive(view)) {
      toLastView(res.visitedViews, view);
    }
  });
}

function toLastView(visitedViews: TagView[], view: TagView) {
  const latestView = visitedViews.slice(-1)[0];
  if (latestView && latestView.fullPath) {
    router.push(latestView.fullPath);
  } else {
    if (view.name === 'Dashboard') {
      router.replace({ path: '/redirect' + view.fullPath });
    } else {
      router.push('/');
    }
  }
}

function initTags() {
  const affixTags = filterAffixTags(permissionStore.routes);
  for (const tag of affixTags) {
    if (tag.name) {
      tagsViewStore.addVisitedView(tag);
    }
  }
}

function filterAffixTags(routes: any[], basePath = '/') {
  let tags: TagView[] = [];
  routes.forEach((route) => {
    if (route.meta && route.meta.affix) {
      const tagPath = route.path.startsWith('/') ? route.path : `${basePath}/${route.path}`;
      tags.push({
        fullPath: tagPath,
        path: tagPath,
        name: route.name,
        meta: { ...route.meta },
      });
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path);
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags];
      }
    }
  });
  return tags;
}

onMounted(() => {
  initTags();
  addTags();
});

watch(route, () => {
  addTags();
});
</script>

<style scoped lang="scss">
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);

  .tags-view-item {
    display: inline-flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    border: 1px solid #d8dce5;
    color: #495060;
    background: #fff;
    padding: 0 8px;
    font-size: 12px;
    margin-left: 5px;
    margin-top: 4px;
    border-radius: 3px;
    text-decoration: none;

    &.active {
      background-color: #409eff;
      color: #fff;
      border-color: #409eff;

      &::before {
        content: '';
        background: #fff;
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        position: relative;
        margin-right: 5px;
      }
    }

    .close-icon {
      margin-left: 4px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      &:hover {
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>

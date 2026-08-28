<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTagsViewStore } from '@/store/modules/tagsView';

const tagsViewStore = useTagsViewStore();
const cachedViews = computed(() => tagsViewStore.cachedViews);
</script>

<style scoped>
.app-main {
  min-height: calc(100vh - 84px);
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 16px;
  background-color: #f0f2f5;
}
</style>

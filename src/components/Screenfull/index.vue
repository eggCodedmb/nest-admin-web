<template>
  <div class="screenfull-wrapper" @click="toggleScreenfull">
    <el-tooltip :content="isFullscreen ? $t('navbar.exitFullScreen') : $t('navbar.fullScreen')" placement="bottom">
      <el-icon :size="18">
        <FullScreen />
      </el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isFullscreen = ref(false);

const toggleScreenfull = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullscreen.value = false;
    }
  }
};

const change = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', change);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', change);
});
</script>

<style scoped>
.screenfull-wrapper {
  padding: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
}
</style>

<template>
  <div class="hamburger-wrapper" @click="toggleClick">
    <el-icon :size="20">
      <Fold v-if="isActive" />
      <Expand v-else />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleClick'): void;
}>();

const toggleClick = () => {
  emit('toggleClick');
};
</script>

<style scoped>
.hamburger-wrapper {
  padding: 0 15px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s;
}
.hamburger-wrapper:hover {
  background: rgba(0, 0, 0, 0.025);
}
</style>

<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <el-icon :size="24" class="sidebar-logo text-primary"><Management /></el-icon>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <el-icon :size="24" class="sidebar-logo text-primary mr-2"><Management /></el-icon>
        <h1 class="sidebar-title">Nest Admin</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapse: boolean;
}>();
</script>

<style scoped lang="scss">
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}
.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    & .sidebar-logo {
      vertical-align: middle;
      color: #409eff;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 16px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>

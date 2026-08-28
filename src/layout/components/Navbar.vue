<template>
  <div class="navbar flex justify-between items-center px-4 h-12 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center">
      <Hamburger :is-active="appStore.sidebar.opened" @toggle-click="toggleSideBar" />
      <Breadcrumb />
    </div>

    <div class="right-menu flex items-center gap-3">
      <Screenfull />

      <!-- 用户下拉菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="avatar-wrapper flex items-center gap-2 cursor-pointer">
          <el-avatar :size="32" :src="avatar" icon="UserFilled" />
          <span class="user-nickname font-medium text-sm text-gray-700 dark:text-gray-200">
            {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员' }}
          </span>
          <el-icon><CaretBottom /></el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import Hamburger from '@/components/Hamburger/index.vue';
import Breadcrumb from '@/components/Breadcrumb/index.vue';
import Screenfull from '@/components/Screenfull/index.vue';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const avatar = computed(() => userStore.userInfo?.avatar || '');

const toggleSideBar = () => {
  appStore.toggleSideBar();
};

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      await userStore.logout();
      router.push(`/login?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`);
    });
  } else if (command === 'profile') {
    // Navigate to profile or show notification
  }
};
</script>

<style scoped lang="scss">
.navbar {
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
</style>

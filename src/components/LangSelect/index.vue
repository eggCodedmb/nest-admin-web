<template>
  <el-dropdown trigger="click" class="lang-select" @command="handleSetLanguage">
    <div class="lang-select-trigger flex items-center justify-center cursor-pointer px-2 h-full text-gray-600 dark:text-gray-300 hover:text-primary">
      <el-tooltip :content="$t('navbar.language')" placement="bottom" effect="dark">
        <div class="icon-wrapper flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lang-svg-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
      </el-tooltip>
    </div>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :command="item.value"
          :disabled="currentLang === item.value"
          class="flex items-center justify-between gap-3 min-w-32"
        >
          <span>{{ item.label }}</span>
          <el-icon v-if="currentLang === item.value" class="text-primary"><Check /></el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { useAppStore } from '@/store/modules/app';
import type { LanguageType } from '@/locales';

const { t } = useI18n();
const appStore = useAppStore();

const currentLang = computed(() => appStore.language);

const langOptions = computed(() => [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: '日本語', value: 'ja-JP' },
]);

const handleSetLanguage = (lang: LanguageType) => {
  if (lang === currentLang.value) return;
  appStore.setLanguage(lang);
  const target = langOptions.value.find((item) => item.value === lang);
  ElMessage.success(`${t('navbar.switchLangSuccess')}${target?.label || lang}`);
};
</script>

<style scoped lang="scss">
.lang-select-trigger {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}

html.dark {
  .lang-select-trigger:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
}
</style>

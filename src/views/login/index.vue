<template>
  <div class="login-container flex items-center justify-center min-h-screen">
    <!-- 右上角快捷工具栏（语言切换与主题切换） -->
    <div class="login-tools absolute top-5 right-5 flex items-center gap-3 z-10 p-2 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10">
      <LangSelect />
      <ThemeSwitch />
    </div>

    <div class="login-card w-100 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
      <!-- 标题与 Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-primary mb-3">
          <el-icon :size="36"><Management /></el-icon>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">{{ $t('login.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ $t('login.subTitle') }}</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="$t('login.usernamePlaceholder')"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="$t('login.passwordPlaceholder')"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="code" v-if="captchaEnabled">
          <div class="flex gap-3 w-full">
            <el-input
              v-model="loginForm.code"
              :placeholder="$t('login.captchaPlaceholder')"
              prefix-icon="Key"
              class="flex-1"
              maxlength="4"
            />
            <div
              class="captcha-img shrink-0 cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              :title="$t('login.captchaTips')"
              @click="fetchCaptcha"
              v-html="captchaSvg"
            />
          </div>
        </el-form-item>

        <div class="flex justify-between items-center mb-6">
          <el-checkbox v-model="rememberMe">{{ $t('login.rememberMe') }}</el-checkbox>
          <el-link type="primary" underline="never">{{ $t('login.forgotPassword') }}</el-link>
        </div>

        <el-button
          type="primary"
          class="w-full font-medium"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? $t('login.loggingIn') : $t('login.loginBtn') }}
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { getCaptcha } from '@/api/auth';
import { useUserStore } from '@/store/modules/user';
import LangSelect from '@/components/LangSelect/index.vue';
import ThemeSwitch from '@/components/ThemeSwitch/index.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(true);
const captchaEnabled = ref(true);
const captchaSvg = ref('');

const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  uuid: '',
});

const loginRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('login.usernameRequired'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordRequired'), trigger: 'blur' }],
  code: [{ required: true, message: t('login.captchaRequired'), trigger: 'blur' }],
}));

const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha();
    loginForm.uuid = res.uuid;
    captchaSvg.value = res.img;
  } catch (error) {
    console.error('获取验证码失败:', error);
  }
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      await userStore.login(loginForm);
      ElMessage.success(t('login.loginSuccess'));
      const redirect = route.query.redirect ? String(route.query.redirect) : '/';
      router.push(redirect);
    } catch (error) {
      // 登录失败重新刷新验证码
      fetchCaptcha();
      loginForm.code = '';
    } finally {
      loading.value = false;
    }
  });
};

onMounted(() => {
  fetchCaptcha();
});
</script>

<style scoped lang="scss">
.login-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #030712 100%);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%);
    pointer-events: none;
  }

  .login-card {
    position: relative;
    z-index: 1;
    backdrop-filter: blur(16px);
  }

  .captcha-img {
    width: 110px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f5f7;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>

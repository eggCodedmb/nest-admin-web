<template>
  <div class="login-container flex items-center justify-center min-h-screen">
    <div class="login-card w-100 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
      <!-- 标题与 Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-primary mb-3">
          <el-icon :size="36"><Management /></el-icon>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Nest Admin</h2>
        <p class="text-sm text-gray-500 mt-1">企业级中后台权限管理系统</p>
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
            placeholder="账号 (admin)"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码 (admin123)"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="code" v-if="captchaEnabled">
          <div class="flex gap-3 w-full">
            <el-input
              v-model="loginForm.code"
              placeholder="图形验证码"
              prefix-icon="Key"
              class="flex-1"
              maxlength="4"
            />
            <div
              class="captcha-img shrink-0 cursor-pointer rounded-lg overflow-hidden border border-gray-200"
              title="点击刷新验证码"
              @click="fetchCaptcha"
              v-html="captchaSvg"
            />
          </div>
        </el-form-item>

        <div class="flex justify-between items-center mb-6">
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>

        <el-button
          type="primary"
          class="w-full font-medium"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { getCaptcha } from '@/api/auth';
import { useUserStore } from '@/store/modules/user';

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

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
};

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
      ElMessage.success('登录成功，欢迎回来！');
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

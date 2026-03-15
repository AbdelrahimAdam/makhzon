<template>
  <div class="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <!-- Signature in bottom left corner -->
    <div class="absolute bottom-4 left-4">
      <p class="text-gray-500 text-xs font-curly">
        برمجة : عبدالرحيم 01154088147
      </p>
    </div>

    <!-- App Version in bottom right -->
    <div class="absolute bottom-4 right-4 text-xs text-gray-400">
      v{{ appVersion }}
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-sm bg-white rounded-xl shadow-lg">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-gray-100">
        <div class="flex justify-center mb-4">
          <div class="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>
        <h2 class="text-xl font-bold text-gray-900 text-center">
          نظام إدارة المخزون
        </h2>
        <p class="text-xs text-gray-500 text-center mt-1">
          تسجيل الدخول
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center">
          <svg class="w-4 h-4 text-red-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-xs text-red-600 text-right flex-1">{{ error }}</p>
        </div>
      </div>

      <!-- Login Form -->
      <form class="px-6 py-4" @submit.prevent="handleLogin" novalidate>
        <div class="space-y-4">
          <!-- Email Input -->
          <div>
            <label for="email-address" class="block text-xs font-medium text-gray-700 mb-2 text-right">
              البريد الإلكتروني
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="form.email"
                :class="{
                  'border-red-300 focus:ring-red-500 focus:border-red-500': errors.email,
                  'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500': !errors.email
                }"
                class="block w-full pr-10 pl-3 py-2.5 text-sm border text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition-all"
                placeholder="your@email.com"
                @blur="validateEmail"
              >
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-600 text-right">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password Input -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-xs font-medium text-gray-700 text-right">
                كلمة المرور
              </label>
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="text-xs text-indigo-600 hover:text-indigo-500"
              >
                {{ showPassword ? 'إخفاء' : 'إظهار' }}
              </button>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                v-model="form.password"
                :class="{
                  'border-red-300 focus:ring-red-500 focus:border-red-500': errors.password,
                  'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500': !errors.password
                }"
                class="block w-full pr-10 pl-10 py-2.5 text-sm border text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition-all"
                placeholder="••••••••"
                @blur="validatePassword"
              >
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                <svg v-if="showPassword" class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
                <svg v-else class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-600 text-right">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between mt-4 mb-6">
          <div class="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              v-model="rememberMe"
              class="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            >
            <label for="remember-me" class="mr-2 block text-xs text-gray-900">
              تذكرني
            </label>
          </div>

          <button type="button" @click="showForgotPassword = true" class="text-xs text-indigo-600 hover:text-indigo-500">
            نسيت كلمة المرور؟
          </button>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            :class="{
              'opacity-50 cursor-not-allowed': loading,
              'hover:shadow-md': !loading
            }"
            class="w-full py-2.5 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all shadow-sm"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري التحقق...
            </span>
            <span v-else class="flex items-center justify-center">
              <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              تسجيل الدخول
            </span>
          </button>
        </div>

        <!-- 🔹 NEW: Sign up link -->
        <div class="mt-4 text-center">
          <p class="text-xs text-gray-600">
            ليس لديك حساب؟
            <router-link to="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">
              أنشئ حساباً جديداً
            </router-link>
          </p>
        </div>
      </form>

      <!-- Support Footer -->
      <div class="px-6 py-3 border-t border-gray-100">
        <div class="text-center">
          <p class="text-xs text-gray-600">
            للحصول على مساعدة، يرجى التواصل مع
            <a href="mailto:support@monofia.com" class="font-medium text-indigo-600 hover:text-indigo-500">
              الدعم الفني
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPassword" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-xs w-full p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-900">استعادة كلمة المرور</h3>
          <button @click="showForgotPassword = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-600 mb-3">
          يرجى إدخال بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور.
        </p>
        <div class="space-y-2">
          <input
            type="email"
            v-model="forgotPasswordEmail"
            placeholder="your@email.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            @click="handleForgotPassword"
            class="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            إرسال رابط الاستعادة
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Login',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const loading = ref(false);
    const error = ref('');
    const showPassword = ref(false);
    const rememberMe = ref(false);
    const showForgotPassword = ref(false);
    const forgotPasswordEmail = ref('');
    
    const form = ref({
      email: '',
      password: ''
    });
    
    const errors = ref({
      email: '',
      password: ''
    });
    
    const appVersion = ref('1.0.0');
    
    const validateEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.value.email.trim()) {
        errors.value.email = 'البريد الإلكتروني مطلوب';
      } else if (!emailRegex.test(form.value.email)) {
        errors.value.email = 'البريد الإلكتروني غير صالح';
      } else {
        errors.value.email = '';
      }
    };
    
    const validatePassword = () => {
      if (!form.value.password.trim()) {
        errors.value.password = 'كلمة المرور مطلوبة';
      } else if (form.value.password.length < 6) {
        errors.value.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      } else {
        errors.value.password = '';
      }
    };
    
    const handleLogin = async () => {
      validateEmail();
      validatePassword();
      
      if (errors.value.email || errors.value.password) {
        error.value = 'يرجى تصحيح الأخطاء في النموذج';
        return;
      }
      
      loading.value = true;
      error.value = '';
      
      try {
        // Add delay to simulate server connection
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Call login action
        const response = await store.dispatch('login', {
          ...form.value,
          rememberMe: rememberMe.value
        });
        
        // Save login time
        localStorage.setItem('lastLogin', new Date().toISOString());
        
        // Save remember me if selected
        if (rememberMe.value) {
          localStorage.setItem('rememberedEmail', form.value.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        console.log('Login successful, redirecting to dashboard...');
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 100);
        
      } catch (err) {
        console.error('Login error details:', err);
        
        if (err.response?.status === 401) {
          error.value = 'بيانات الدخول غير صحيحة. يرجى المحاولة مرة أخرى.';
        } else if (err.response?.status === 429) {
          error.value = 'عدد محاولات الدخول كثيرة. يرجى الانتظار قليلاً.';
        } else if (err.message && err.message.includes('Network')) {
          error.value = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
        } else {
          error.value = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.';
        }
        
        // Reset password for safety
        form.value.password = '';
        
      } finally {
        loading.value = false;
      }
    };
    
    const handleForgotPassword = async () => {
      if (!forgotPasswordEmail.value.trim()) {
        alert('يرجى إدخال البريد الإلكتروني');
        return;
      }
      
      // Simulate password reset email
      alert(`تم إرسال رابط استعادة كلمة المرور إلى: ${forgotPasswordEmail.value}`);
      showForgotPassword.value = false;
      forgotPasswordEmail.value = '';
    };
    
    onMounted(() => {
      // Check for saved email
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        form.value.email = savedEmail;
        rememberMe.value = true;
      }
      
      // Auto focus email field
      setTimeout(() => {
        document.getElementById('email-address')?.focus();
      }, 100);
    });
    
    return {
      loading,
      error,
      form,
      errors,
      showPassword,
      rememberMe,
      showForgotPassword,
      forgotPasswordEmail,
      appVersion,
      validateEmail,
      validatePassword,
      handleLogin,
      handleForgotPassword
    };
  }
};
</script>

<style scoped>
/* Prevent vertical scrolling */
.fixed {
  position: fixed;
  overflow: hidden;
}

/* Font styles */
.font-curly {
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-style: italic;
}

/* Interaction effects */
button:active {
  transform: translateY(0);
}

/* Accessibility improvements */
input:focus {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

/* Arabic font improvements */
* {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  letter-spacing: -0.01em;
}
</style>
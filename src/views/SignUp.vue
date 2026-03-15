<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        إنشاء حساب جديد
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        أو
        <router-link
          to="/login"
          class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          تسجيل الدخول إلى حسابك الحالي
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Company Name -->
          <div>
            <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              اسم الشركة *
            </label>
            <div class="mt-1">
              <input
                id="companyName"
                v-model="form.companyName"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                :class="{ 'border-red-500': errors.companyName }"
              />
              <p v-if="errors.companyName" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.companyName }}
              </p>
            </div>
          </div>

          <!-- Your Name (optional) -->
          <div>
            <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              اسمك (اختياري)
            </label>
            <div class="mt-1">
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              البريد الإلكتروني *
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                :class="{ 'border-red-500': errors.email }"
              />
              <p v-if="errors.email" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.email }}
              </p>
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              كلمة المرور *
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                :class="{ 'border-red-500': errors.password }"
              />
              <p v-if="errors.password" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.password }}
              </p>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              تأكيد كلمة المرور *
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                :class="{ 'border-red-500': errors.confirmPassword }"
              />
              <p v-if="errors.confirmPassword" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.confirmPassword }}
              </p>
            </div>
          </div>

          <!-- Terms & Conditions -->
          <div class="flex items-center">
            <input
              id="terms"
              v-model="form.terms"
              type="checkbox"
              required
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="terms" class="mr-2 block text-sm text-gray-900 dark:text-gray-300">
              أوافق على
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                الشروط والأحكام
              </a>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.195 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div class="mr-3">
                <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from 'vuex';

export default {
  name: 'SignUp',
  setup() {
    const router = useRouter();
    const store = useStore();
    const loading = ref(false);
    const errorMessage = ref('');

    const form = reactive({
      companyName: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    });

    const errors = reactive({
      companyName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    const validateForm = () => {
      let isValid = true;
      
      // Reset errors
      Object.keys(errors).forEach(key => errors[key] = '');

      if (!form.companyName.trim()) {
        errors.companyName = 'اسم الشركة مطلوب';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = 'البريد الإلكتروني غير صالح';
        isValid = false;
      }

      if (form.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        isValid = false;
      }

      if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
        isValid = false;
      }

      if (!form.terms) {
        errorMessage.value = 'يجب الموافقة على الشروط والأحكام';
        isValid = false;
      } else {
        errorMessage.value = ''; // clear if previously set
      }

      return isValid;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;

      loading.value = true;
      errorMessage.value = '';

      const auth = getAuth();
      const db = getFirestore();

      try {
        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        );
        const user = userCredential.user;

        console.log('✅ Auth user created:', user.uid);

        // 2. Create company document (ID = user.uid)
        try {
          const companyRef = doc(db, 'companies', user.uid);
          await setDoc(companyRef, {
            name: form.companyName.trim(),
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('✅ Company document created');
        } catch (companyError) {
          console.error('❌ Failed to create company:', companyError);
          // If company creation fails, delete the Auth user to keep state clean
          await user.delete();
          throw new Error('فشل في إنشاء بيانات الشركة: ' + (companyError.message || 'خطأ غير معروف'));
        }

        // 3. Create user profile document
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            name: form.displayName.trim() || form.email.split('@')[0],
            email: form.email.trim().toLowerCase(),
            role: 'superadmin', // 🔹 Company superadmin (full control within company)
            companyId: user.uid,
            allowed_warehouses: [],
            is_active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('✅ User profile document created');
        } catch (userError) {
          console.error('❌ Failed to create user profile:', userError);
          // Clean up company and auth user
          await setDoc(doc(db, 'companies', user.uid), {}).catch(() => {}); // attempt delete
          await user.delete();
          throw new Error('فشل في إنشاء ملف المستخدم: ' + (userError.message || 'خطأ غير معروف'));
        }

        // Show success notification
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم إنشاء الحساب بنجاح! جاري تحميل البيانات...'
        });

        // Redirect to dashboard
        router.push('/');

      } catch (error) {
        console.error('Sign-up error:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
          errorMessage.value = 'البريد الإلكتروني مستخدم بالفعل';
        } else if (error.code === 'auth/weak-password') {
          errorMessage.value = 'كلمة المرور ضعيفة جداً';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage.value = 'البريد الإلكتروني غير صالح';
        } else {
          errorMessage.value = error.message || 'حدث خطأ أثناء إنشاء الحساب';
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      errors,
      loading,
      errorMessage,
      handleSubmit
    };
  }
};
</script>
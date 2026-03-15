<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <span class="mr-3 text-xl font-bold text-gray-900 dark:text-white">نظام المخزون</span>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center space-x-8 space-x-reverse">
            <a href="#features" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">المميزات</a>
            <a href="#about" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">عن النظام</a>
            <a href="#contact" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">اتصل بنا</a>
          </nav>

          <!-- Buttons -->
          <div class="flex items-center gap-3">
            <router-link
              to="/login"
              class="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              تسجيل الدخول
            </router-link>
            <router-link
              to="/signup"
              class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg"
            >
              إنشاء حساب جديد
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pt-16">
      <!-- Hero Section -->
      <section class="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-20 lg:py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            نظام إدارة المخزون المتكامل
          </h1>
          <p class="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
            حل سحابي مبسط لإدارة المخازن والمبيعات والمشتريات. انضم إلى آلاف الشركات التي تثق بنا.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/signup"
              class="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              ابدأ تجربتك المجانية
            </router-link>
            <a
              href="#features"
              class="px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              تعرف على المزيد
            </a>
          </div>
        </div>

        <!-- Decorative Elements -->
        <div class="absolute top-0 left-0 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div class="absolute top-0 right-0 w-72 h-72 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-20 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">لماذا تختار نظامنا؟</h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              مجموعة متكاملة من الأدوات لإدارة المخزون والمبيعات بكل سهولة.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">إدارة المخزون</h3>
              <p class="text-gray-600 dark:text-gray-400">تتبع الأصناف، الكميات، الكراتين، والقزاز الفردي بسهولة.</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">الحركات والمبيعات</h3>
              <p class="text-gray-600 dark:text-gray-400">تسجيل عمليات الإضافة، النقل، الصرف، وإنشاء الفواتير.</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تقارير متقدمة</h3>
              <p class="text-gray-600 dark:text-gray-400">إحصائيات تفصيلية عن أداء المخازن والمبيعات.</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">إدارة المستخدمين</h3>
              <p class="text-gray-600 dark:text-gray-400">صلاحيات متعددة الأدوار: مشرف عام، مدير شركة، مدير مخزن، مشاهد.</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">أمان عالي</h3>
              <p class="text-gray-600 dark:text-gray-400">بياناتك محمية بأحدث معايير الأمان، مع عزل تام بين الشركات.</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div class="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2 2 2 4-4 2 2 4-4 2 2 2-2v6H3v-6z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">دعم فني متواصل</h3>
              <p class="text-gray-600 dark:text-gray-400">فريق دعم جاهز لمساعدتك على مدار الساعة.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">ابدأ الآن مجاناً</h2>
          <p class="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            لا تحتاج لبطاقة ائتمان. جرب النظام لمدة 30 يوماً بدون أي التزام.
          </p>
          <router-link
            to="/signup"
            class="inline-block px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-xl hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            أنشئ حسابك الآن
          </router-link>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center mb-4">
              <div class="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <span class="mr-2 text-lg font-bold text-gray-900 dark:text-white">نظام المخزون</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">حل متكامل لإدارة المخزون والمبيعات للشركات الناشئة والمتوسطة.</p>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">روابط سريعة</h3>
            <ul class="space-y-2">
              <li><router-link to="/login" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">تسجيل الدخول</router-link></li>
              <li><router-link to="/signup" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">إنشاء حساب</router-link></li>
              <li><a href="#features" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">المميزات</a></li>
            </ul>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">الدعم</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">مركز المساعدة</a></li>
              <li><a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">اتصل بنا</a></li>
              <li><a href="#" class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">شروط الاستخدام</a></li>
            </ul>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">تابعنا</h3>
            <div class="flex space-x-4 space-x-reverse">
              <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span class="sr-only">فيسبوك</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span class="sr-only">تويتر</span>
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">© 2024 نظام المخزون. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
/* Custom animations */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
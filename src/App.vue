<template>
  <div id="app" dir="rtl" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Global Notifications -->
    <div v-if="notifications.length > 0" class="fixed top-4 left-4 right-4 z-50 space-y-2 max-w-md mx-auto">
      <transition-group name="notification">
        <div 
          v-for="notification in notifications.slice(0, 3)" 
          :key="notification.id"
          :class="[
            'p-4 rounded-lg shadow-lg border transform transition-all duration-300',
            notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' :
            notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' :
            notification.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200' :
            'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 v-if="notification.title" class="font-semibold mb-1 text-sm">{{ notification.title }}</h3>
              <p class="text-sm">{{ notification.message }}</p>
            </div>
            <button 
              @click="removeNotification(notification.id)"
              class="mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
              :aria-label="'إغلاق الإشعار'"
            >
              <CloseIcon size="sm" color="gray" />
            </button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Minimal Initial Loading -->
    <div v-if="initializing && !isPublicRoute && !isMobileRoute" class="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div class="flex flex-col items-center justify-center h-full">
        <!-- Logo or App Name -->
        <div class="mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mb-4"></div>

        <!-- Loading Text -->
        <p class="text-gray-700 dark:text-gray-300 font-medium">جاري تحميل النظام...</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">يرجى الانتظار لحظات</p>

        <!-- Preloaded Inventory Status -->
        <div v-if="preloadedItems > 0" class="mt-8">
          <div class="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${preloadedProgress}%` }"
              role="progressbar"
              :aria-valuenow="preloadedProgress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`تم تحميل ${preloadedProgress}% من البيانات`"
            ></div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            تم تحميل {{ preloadedItems }} صنف
          </p>
        </div>
      </div>
    </div>

    <!-- Main app content -->
    <div v-else class="h-screen flex flex-col">
      <!-- Check if current route is public (login, signup, unauthorized, notfound) -->
      <template v-if="isPublicRoute || isMobileRoute">
        <!-- Public pages - show only router view -->
        <div class="flex-1 overflow-y-auto">
          <router-view />
        </div>
      </template>

      <!-- Authenticated layout -->
      <template v-else>
        <!-- 🔹 Loading profile state while waiting for userProfile -->
        <div v-if="isAuthenticated && !profileLoaded" class="h-full flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4 mx-auto"></div>
            <p class="text-gray-700 dark:text-gray-300">جاري تحميل بيانات المستخدم...</p>
          </div>
        </div>

        <!-- 🔹 Dashboard access granted -->
        <template v-else-if="isAuthenticated && hasDashboardAccess">
          <!-- Mobile Layout -->
          <div v-if="isMobile" class="lg:hidden h-full flex flex-col">
            <!-- Mobile Header -->
            <MobileHeader @toggle-menu="toggleMobileMenu" />

            <!-- Mobile Sidebar Overlay -->
            <transition name="fade">
              <div 
                v-if="mobileMenuOpen"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                @click="mobileMenuOpen = false"
                role="presentation"
                aria-hidden="true"
              ></div>
            </transition>

            <!-- Mobile Sidebar -->
            <transition name="slide">
              <MobileSidebar v-if="mobileMenuOpen" @close="mobileMenuOpen = false" />
            </transition>

            <!-- Mobile Main Content -->
            <main class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <div class="max-w-full mx-auto">
                <router-view />
              </div>
            </main>

            <!-- Mobile Bottom Navigation -->
            <MobileBottomNav />
          </div>

          <!-- Desktop Layout -->
          <div v-else class="hidden lg:flex h-full">
            <!-- Desktop Sidebar -->
            <DesktopSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
              <!-- Desktop Header -->
              <DesktopHeader @toggle-sidebar="toggleSidebar" />

              <!-- Main Content -->
              <main class="flex-1 overflow-y-auto p-4">
                <div class="max-w-full mx-auto">
                  <!-- Preload Indicator (Only show briefly) -->
                  <div v-if="showPreloadIndicator && !initialDataLoaded" class="mb-4">
                    <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div class="flex items-center gap-3">
                        <div class="animate-pulse w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-800 dark:text-gray-200">جاري تحميل المخزون...</p>
                          <p class="text-xs text-gray-600 dark:text-gray-400">تحميل {{ preloadedItems }} من {{ preloadedTarget }} صنف</p>
                        </div>
                      </div>
                      <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                          :style="{ width: `${preloadedProgress}%` }"
                          role="progressbar"
                          :aria-valuenow="preloadedProgress"
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Router View -->
                  <router-view />
                </div>
              </main>
            </div>
          </div>
        </template>

        <!-- 🔹 No Dashboard Access Message (only after profile is loaded) -->
        <template v-else-if="isAuthenticated && profileLoaded && !hasDashboardAccess">
          <div class="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div class="text-center p-8">
              <div class="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-yellow-700 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">غير مصرح بالوصول</h2>
              <p class="text-gray-700 dark:text-gray-300 mb-6 max-w-md">
                عذراً، ليس لديك صلاحية للوصول إلى لوحة التحكم. يرجى التواصل مع المشرف.
              </p>
              <div class="space-x-4">
                <button 
                  @click="logout"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  :aria-label="'تسجيل الخروج'"
                >
                  <LogoutIcon size="sm" color="white" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- 🔹 Fallback for any unmatched state (prevents white screen) -->
        <div v-else class="h-full flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4 mx-auto"></div>
            <p class="text-gray-700 dark:text-gray-300">جاري تحميل التطبيق...</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">الرجاء الانتظار</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import MobileHeader from '@/components/layout/MobileHeader.vue';
import MobileSidebar from '@/components/layout/MobileSidebar.vue';
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue';
import DesktopSidebar from '@/components/layout/DesktopSidebar.vue';
import DesktopHeader from '@/components/layout/DesktopHeader.vue';
import CloseIcon from '@/components/icons/CloseIcon.vue';
import LogoutIcon from '@/components/icons/LogoutIcon.vue';

export default {
  name: 'App',
  components: {
    MobileHeader,
    MobileSidebar,
    MobileBottomNav,
    DesktopSidebar,
    DesktopHeader,
    CloseIcon,
    LogoutIcon
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    // Refs
    const initializing = ref(true);
    const mobileMenuOpen = ref(false);
    const sidebarCollapsed = ref(false);
    const isMobile = ref(false);
    const preloadedItems = ref(0);
    const preloadedTarget = ref(20);
    const initialDataLoaded = ref(false);
    const showPreloadIndicator = ref(false);
    
    // Store getters
    const notifications = computed(() => store.state.notifications || []);
    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const userProfile = computed(() => store.state.userProfile);
    const userRole = computed(() => store.getters.userRole);
    const allowedWarehouses = computed(() => store.getters.allowedWarehouses);
    
    const profileLoaded = computed(() => userProfile.value !== null);

    // 🔹 Added 'Home' to public routes
    const isPublicRoute = computed(() => {
      const publicRoutes = ['Login', 'SignUp', 'Home', 'Unauthorized', 'NotFound', 'ForgotPassword', 'ResetPassword'];
      return publicRoutes.includes(route.name);
    });

    const isMobileRoute = computed(() => {
      return route.name === 'MobileLogin' || route.name === 'MobileUnauthorized';
    });

    const preloadedProgress = computed(() => {
      return Math.min(100, Math.round((preloadedItems.value / preloadedTarget.value) * 100));
    });

    const hasDashboardAccess = computed(() => {
      if (!isAuthenticated.value || !profileLoaded.value) return false;
      
      const role = userRole.value;
      const allowed = allowedWarehouses.value;
      
      if (role === 'superadmin' || role === 'company_manager') return true;
      if (role === 'warehouse_manager') {
        return allowed && allowed.length > 0;
      }
      return ['superadmin', 'company_manager', 'warehouse_manager'].includes(role);
    });

    const removeNotification = (notificationId) => {
      store.dispatch('removeNotification', notificationId);
    };

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString());
    };

    const toggleMobileMenu = () => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    };

    const logout = async () => {
      try {
        await store.dispatch('logout');
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const preloadEssentialData = async () => {
      try {
        const { db } = await import('@/firebase/config');
        const { collection, query, orderBy, limit, getDocs, where } = await import('firebase/firestore');
        
        await store.dispatch('loadWarehouses');
        
        if (isAuthenticated.value && profileLoaded.value) {
          let accessibleWarehouses = store.getters.accessibleWarehouses;
          
          if (accessibleWarehouses.length === 0) {
            console.log('⚠️ User has no accessible warehouses');
            initialDataLoaded.value = true;
            return;
          }
          
          const warehouseIds = accessibleWarehouses.map(w => w.id);
          
          let itemsQuery;
          
          if (warehouseIds.length > 0) {
            itemsQuery = query(
              collection(db, 'items'),
              where('warehouse_id', 'in', warehouseIds.slice(0, 10)),
              orderBy('updated_at', 'desc'),
              limit(15)
            );
          } else {
            itemsQuery = query(
              collection(db, 'items'),
              orderBy('updated_at', 'desc'),
              limit(15)
            );
          }
          
          const itemsSnapshot = await getDocs(itemsQuery);
          const items = itemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          store.commit('SET_INVENTORY', items);
          preloadedItems.value = items.length;
          
          items.forEach((item, index) => {
            setTimeout(() => {
              preloadedItems.value = index + 1;
            }, index * 50);
          });
          
          initialDataLoaded.value = true;
          showPreloadIndicator.value = true;
          setTimeout(() => {
            showPreloadIndicator.value = false;
          }, 2000);
          
          setTimeout(() => {
            loadRemainingDataInBackground();
          }, 1000);
        } else {
          initialDataLoaded.value = true;
        }
        
      } catch (error) {
        console.warn('Preload warning (non-critical):', error.message);
        initialDataLoaded.value = true;
      }
    };

    const loadRemainingDataInBackground = async () => {
      try {
        store.dispatch('loadAllInventory', { forceRefresh: false });
        store.dispatch('fetchTransactions');
        
        if (store.getters.canManageInvoices) {
          store.dispatch('loadAllInvoices');
        }
        
        if (userRole.value === 'superadmin') {
          store.dispatch('loadUsers');
        }
        
        store.dispatch('refreshDashboardCounts', 'all');
      } catch (error) {
        console.error('Background load error:', error);
      }
    };

    const initializeApp = async () => {
      try {
        await store.dispatch('initializeAuth');
        
        if (!isAuthenticated.value) {
          initializing.value = false;
          return;
        }
        
        const preloadPromise = preloadEssentialData();
        
        await Promise.race([
          preloadPromise,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        
        if (profileLoaded.value && !hasDashboardAccess.value) {
          console.warn('⚠️ User does not have dashboard access');
          store.dispatch('showNotification', {
            type: 'warning',
            message: 'ليس لديك صلاحية للوصول إلى لوحة التحكم. يرجى التواصل مع المشرف.',
            duration: 5000
          });
        } else if (profileLoaded.value) {
          if (!localStorage.getItem('welcomeShown')) {
            setTimeout(() => {
              store.dispatch('showNotification', {
                type: 'success',
                message: `مرحباً ${userProfile.value?.name || userProfile.value?.email || ''}!`,
                duration: 3000
              });
              localStorage.setItem('welcomeShown', 'true');
            }, 500);
          }
        }
        
        initializeTheme();
        
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
          sidebarCollapsed.value = savedState === 'true';
        }

      } catch (error) {
        console.error('App initialization error:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'حدث خطأ في تحميل بعض البيانات. يمكنك الاستمرار في العمل.',
          duration: 5000
        });
      } finally {
        setTimeout(() => {
          initializing.value = false;
        }, 300);
      }
    };

    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      });
    };

    onMounted(async () => {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      initializeApp();
      
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const perf = window.performance;
          const timing = perf?.timing;
          if (timing) {
            console.log(`🚀 App loaded in ${timing.loadEventEnd - timing.navigationStart}ms, DOM ready in ${timing.domContentLoadedEventEnd - timing.navigationStart}ms`);
          }
        }, 1000);
      }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
    });

    watch(() => route.path, () => {
      mobileMenuOpen.value = false;
    });

    watch(isAuthenticated, (authenticated) => {
      if (authenticated && !initialDataLoaded.value) {
        preloadEssentialData();
      }
    });

    watch(userProfile, (profile) => {
      if (profile && isAuthenticated.value && !initialDataLoaded.value) {
        preloadEssentialData();
      }
    });

    const checkMobile = () => {
      isMobile.value = window.innerWidth < 1024;
    };

    return {
      initializing,
      mobileMenuOpen,
      sidebarCollapsed,
      isMobile,
      preloadedItems,
      preloadedTarget,
      initialDataLoaded,
      showPreloadIndicator,
      isAuthenticated,
      isPublicRoute,
      isMobileRoute,
      notifications,
      preloadedProgress,
      hasDashboardAccess,
      profileLoaded,
      removeNotification,
      toggleSidebar,
      toggleMobileMenu,
      logout
    };
  }
};
</script>

<style scoped>
/* Mobile sidebar animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Notification animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Performance optimizations */
#app {
  font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Optimize scroll performance */
main {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Reduce motion where supported */
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .notification-enter-active,
  .notification-leave-active {
    transition: none !important;
  }
  
  .notification-enter-from,
  .notification-leave-to {
    transform: none !important;
  }
  
  .animate-spin {
    animation: none !important;
  }
  
  .animate-pulse {
    animation: none !important;
  }
}

/* Print styles */
@media print {
  #app {
    background: white !important;
  }
  
  .no-print {
    display: none !important;
  }
}

/* Optimize for mobile */
@media (max-width: 640px) {
  #app {
    font-size: 14px;
  }
}

/* Dark mode optimizations */
.dark .bg-gradient-to-b {
  background-image: linear-gradient(to bottom, var(--tw-gradient-stops));
}

/* Ensure proper stacking context */
.fixed {
  isolation: isolate;
}

/* Accessibility: Ensure proper focus styles */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-gray-50 {
    background-color: #ffffff !important;
  }
  
  .dark .bg-gray-900 {
    background-color: #000000 !important;
  }
  
  .border-gray-200 {
    border-color: #000000 !important;
  }
  
  .text-gray-600 {
    color: #000000 !important;
  }
  
  .dark .text-gray-400 {
    color: #ffffff !important;
  }
}

/* Forced colors mode (Windows High Contrast) */
@media (forced-colors: active) {
  button,
  [role="button"] {
    border: 2px solid ButtonText;
  }
  
  .border {
    border-color: CanvasText;
  }
  
  svg {
    forced-color-adjust: none;
    stroke: ButtonText;
  }
}

/* Touch target optimization for mobile */
@media (max-width: 768px) {
  button,
  [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
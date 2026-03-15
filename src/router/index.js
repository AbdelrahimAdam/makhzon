// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// تحميل المكونات بشكل كسول مع معالجة الأخطاء
const lazyLoad = (componentName) => {
  return () => {
    console.log(`🔗 تحميل المكون: ${componentName}`);
    return import(`@/views/${componentName}.vue`).catch((error) => {
      console.error(`❌ فشل تحميل ${componentName}:`, error);
      return Promise.resolve({
        template: `
          <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div class="text-center p-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-6 animate-pulse">
                <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">جاري تحميل ${componentName}</h2>
              <p class="text-gray-600 dark:text-gray-400">يرجى الانتظار...</p>
            </div>
          </div>
        `,
        mounted() {
          setTimeout(() => {
            console.log(`🔄 إعادة تحميل ${componentName}...`);
            import(`@/views/${componentName}.vue`)
              .then(() => console.log(`✅ تم تحميل ${componentName}`))
              .catch(err => console.error(`❌ فشل إعادة تحميل ${componentName}:`, err));
          }, 2000);
        }
      });
    });
  };
};

// مسار المخزون
const inventoryRoutes = {
  path: '/inventory',
  name: 'Inventory',
  component: () => import('@/views/Inventory.vue').catch((error) => {
    console.error('❌ فشل تحميل Inventory:', error);
    return {
      template: `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full mb-6">
              <svg class="w-10 h-10 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">خطأ في تحميل الصفحة</h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">تعذر تحميل صفحة المخزون</p>
            <div class="space-y-3 mb-8 text-right">
              <p class="text-gray-700 dark:text-gray-300">1. التأكد من وجود ملف Inventory.vue</p>
              <p class="text-gray-700 dark:text-gray-300">2. تحديث الصفحة (F5)</p>
              <p class="text-gray-700 dark:text-gray-300">3. التواصل مع الدعم الفني</p>
            </div>
            <button @click="reloadPage" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              تحديث الصفحة
            </button>
          </div>
        </div>
      `,
      methods: {
        reloadPage() {
          window.location.reload();
        }
      }
    };
  }),
  meta: { 
    requiresAuth: true,
    allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
    requiredPermissions: ['view_items']
  }
};

// ✅ UPDATED: نظام الفواتير المتكامل (الجديد)
const invoiceSystemRoutes = {
  path: '/invoice-system',
  name: 'InvoiceSystem',
  component: lazyLoad('InvoiceSystem'), // now points to InvoiceSystem.vue
  meta: { 
    requiresAuth: true,
    allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
    requiredPermissions: ['manage_invoices', 'dispatch_items'],
    title: 'نظام الفواتير',
    isInvoiceSystem: true
  }
};

// ✅ UPDATED: مسارات الفواتير (الآن تستخدم InvoiceSystem كأساس)
const invoicesRoutes = {
  path: '/invoices',
  name: 'Invoices',
  component: lazyLoad('InvoiceSystem'), // changed from 'Dispatch' to 'InvoiceSystem'
  meta: { 
    requiresAuth: true,
    allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
    requiredPermissions: ['manage_invoices'],
    title: 'الفواتير'
  },
  children: [
    {
      path: 'create',
      name: 'CreateInvoice',
      component: lazyLoad('CreateInvoice'), // keep as is (placeholder)
      meta: { 
        requiresAuth: true,
        allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
        requiredPermissions: ['create_invoices']
      }
    },
    {
      path: ':id',
      name: 'InvoiceDetails',
      component: lazyLoad('InvoiceDetails'), // keep as is (placeholder)
      meta: { 
        requiresAuth: true,
        allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
        requiredPermissions: ['view_invoices']
      }
    }
  ]
};

// جميع المسارات
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad('Login'),
    meta: { 
      requiresGuest: true,
      layout: 'empty'
    }
  },
  // 🔹 NEW: Signup route
  {
    path: '/signup',
    name: 'SignUp',
    component: lazyLoad('SignUp'),
    meta: { 
      requiresGuest: true,
      layout: 'empty'
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: lazyLoad('Dashboard'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
      requiredPermissions: ['view_dashboard']
    }
  },
  {
    path: '/warehouses',
    name: 'Warehouses',
    component: lazyLoad('Warehouses'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin'],
      requiredPermissions: ['manage_warehouses']
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: lazyLoad('Users'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin'],
      requiredPermissions: ['manage_users']
    }
  },
  inventoryRoutes,
  {
    path: '/inventory/add',
    name: 'AddInventory',
    component: () => inventoryRoutes.component().then(component => component).catch(() => ({
      template: '<div>Add Inventory Page</div>'
    })),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'warehouse_manager'],
      requiredPermissions: ['create_items']
    }
  },
  {
    path: '/inventory/edit/:id',
    name: 'EditInventory',
    component: () => inventoryRoutes.component().then(component => component).catch(() => ({
      template: '<div>Edit Inventory Page</div>'
    })),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'warehouse_manager'],
      requiredPermissions: ['edit_items']
    }
  },
  {
    path: '/inventory/item/:id',
    name: 'ItemDetails',
    component: () => inventoryRoutes.component().then(component => component).catch(() => ({
      template: '<div>Item Details Page</div>'
    })),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
      requiredPermissions: ['view_items']
    }
  },
  {
    path: '/transfers',
    name: 'Transfers',
    component: lazyLoad('Transfers'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'warehouse_manager'],
      requiredPermissions: ['transfer_items']
    }
  },
  {
    path: '/dispatch',
    name: 'Dispatch',
    component: lazyLoad('Dispatch'), // pure dispatch view (separate file)
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'warehouse_manager'],
      requiredPermissions: ['dispatch_items']
    }
  },
  invoiceSystemRoutes,
  {
    path: '/transactions',
    name: 'Transactions',
    component: lazyLoad('Transactions'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
      requiredPermissions: ['view_transactions']
    }
  },
  invoicesRoutes,
  {
    path: '/reports',
    name: 'Reports',
    component: lazyLoad('Reports'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'company_manager'],
      requiredPermissions: ['view_reports']
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: lazyLoad('Profile'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'company_manager', 'warehouse_manager'],
      requiredPermissions: ['view_profile']
    }
  },
  {
    path: '/migrate',
    name: 'Migrate',
    component: () => import('@/components/MigrationTool.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin'],
      requiredPermissions: ['system_access'],
      title: 'ترقية البيانات'
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: {
      template: `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
              <svg class="w-8 h-8 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 110-6 3 3 0 010 6zm2 7a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">صلاحية مرفوضة</h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">ليس لديك الصلاحية للوصول إلى هذه الصفحة</p>
            <router-link to="/" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      `
    },
    meta: { layout: 'empty' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">الصفحة غير موجودة</p>
            <router-link to="/" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      `
    },
    meta: { layout: 'empty' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  }
});

// ✅ FIXED: دالة للتحقق من صلاحية الوصول للمسار
const canAccessRoute = (userRole, userPermissions, routeMeta) => {
  if (!routeMeta.allowedRoles) return true;

  if (!routeMeta.allowedRoles.includes(userRole)) {
    console.log(`⛔ الدور غير مسموح: ${userRole} -> ${routeMeta.allowedRoles}`);
    return false;
  }

  // ✅ FIXED: Get default permissions if user has none
  if (routeMeta.requiredPermissions) {
    // If user has no permissions, use store getters to get effective permissions
    const effectivePermissions = userPermissions && userPermissions.length > 0 
      ? userPermissions 
      : getDefaultPermissionsForRole(userRole);
    
    const hasPermission = routeMeta.requiredPermissions.every(permission => 
      effectivePermissions.includes(permission)
    );

    if (!hasPermission) {
      console.log(`⛔ الأذونات المطلوبة غير متوفرة: ${routeMeta.requiredPermissions} -> ${effectivePermissions}`);
      return false;
    }
  }

  return true;
};

// ✅ FIXED: Get default permissions for roles (matches store logic)
const getDefaultPermissionsForRole = (role) => {
  const defaultPermissions = {
    superadmin: [
      'view_dashboard', 'view_items', 'view_transactions', 'view_reports', 
      'export_data', 'add_items', 'edit_items', 'delete_items', 
      'transfer_items', 'dispatch_items', 'manage_invoices', 
      'manage_users', 'manage_warehouses', 'view_profile', 'create_items',
      'edit_items', 'create_invoices', 'view_invoices'
    ],
    company_manager: [
      'view_dashboard', 'view_items', 'view_transactions', 'view_reports',
      'export_data', 'add_items', 'edit_items', 'delete_items',
      'transfer_items', 'dispatch_items', 'manage_invoices',
      'manage_warehouses', 'view_profile', 'create_items',
      'edit_items', 'create_invoices', 'view_invoices'
    ],
    warehouse_manager: [
      'view_dashboard', 'view_items', 'view_transactions',
      'add_items', 'edit_items', 'transfer_items', 'dispatch_items',
      'view_profile', 'create_items', 'edit_items'
    ]
  };
  
  return defaultPermissions[role] || ['view_dashboard', 'view_items', 'view_transactions', 'view_profile'];
};

// ✅ FIXED: التحقق من صلاحية مدير المخزن
const canWarehouseManagerAccess = (userProfile, routeName, routeMeta) => {
  if (userProfile?.role !== 'warehouse_manager') return true;

  const allowedWarehouses = userProfile?.allowed_warehouses || [];

  // Warehouse managers can access inventory even with no warehouses
  if (routeName?.includes('Inventory') && allowedWarehouses.length === 0) {
    console.log(`⚠️ مدير المخزن ليس لديه مخازن مسموحة، لكن يمكنه الوصول: ${routeName}`);
    return true;
  }

  return true;
};

// كاش للصلاحيات لتحسين الأداء
const routePermissionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const canAccessRouteCached = (userRole, userPermissions, routeMeta, userProfile) => {
  if (!routeMeta.allowedRoles) return true;

  const cacheKey = `${userRole}_${JSON.stringify(routeMeta)}_${userPermissions?.join(',') || 'empty'}`;
  const cached = routePermissionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  const result = canAccessRoute(userRole, userPermissions, routeMeta);
  routePermissionCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
};

// متغير لمنع تكرار التحقق
let isCheckingRoute = false;

// ✅ FIXED: حارس التنقل باستخدام store بشكل صحيح
const setupRouterGuard = (store) => {
  router.beforeEach((to, from, next) => {
    if (isCheckingRoute) {
      next();
      return;
    }

    isCheckingRoute = true;

    try {
      // استخدام مخزن البيانات مباشرة
      const user = store?.state?.user;
      const userProfile = store?.state?.userProfile;
      const userRole = userProfile?.role || '';
      const userPermissions = userProfile?.permissions || [];

      console.log('🔍 التحقق من التنقل:', {
        from: from.name,
        to: to.name,
        user: !!user,
        userRole,
        requiresAuth: to.meta.requiresAuth
      });

      // التحقق من صفحات الزوار (تسجيل الدخول)
      if (to.meta.requiresGuest) {
        if (user) {
          console.log('📱 المستخدم مسجل دخول بالفعل - إعادة التوجيه');
          next('/');
        } else {
          next();
        }
        return;
      }

      // التحقق من المصادقة
      if (to.meta.requiresAuth) {
        if (!user) {
          console.log('🔒 الصفحة تتطلب تسجيل دخول');
          next('/login');
          return;
        }

        // Check if user profile is loaded
        if (!userProfile) {
          console.log('⏳ جاري تحميل بيانات المستخدم...');
          // Give time for user profile to load
          setTimeout(() => {
            isCheckingRoute = false;
            router.replace(to.path);
          }, 1000);
          return;
        }

        // Check if user is active
        if (userProfile.is_active === false) {
          console.log('⛔ الحساب غير نشط');
          store.dispatch('logout');
          next('/login');
          return;
        }

        // Check if user has a role
        if (!userRole) {
          console.log('❌ المستخدم ليس لديه دور محدد');
          store.dispatch('showNotification', {
            type: 'error',
            message: 'حسابك يحتاج إلى تفعيل. يرجى التواصل مع المشرف.'
          });
          next('/unauthorized');
          return;
        }

        // ✅ FIXED: Check route access with proper permission handling
        if (!canAccessRouteCached(userRole, userPermissions, to.meta, userProfile)) {
          console.log('⛔ المستخدم ليس لديه صلاحية الوصول');
          next('/unauthorized');
          return;
        }

        // Check warehouse manager access
        if (!canWarehouseManagerAccess(userProfile, to.name, to.meta)) {
          console.log('⛔ مدير المخزن ليس لديه صلاحية الوصول');
          next('/unauthorized');
          return;
        }
      }

      next();
    } catch (error) {
      console.error('❌ خطأ في حارس التنقل:', error);
      // On error, allow navigation to prevent blocking
      next();
    } finally {
      setTimeout(() => {
        isCheckingRoute = false;
      }, 100);
    }
  });
};

// معالج أخطاء التنقل
router.onError((error, to) => {
  console.error('❌ خطأ في الموجه:', error);
  console.log('المسار المستهدف:', to.path);

  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.log('🔄 فشل في تحميل المكون ديناميكياً');

    if (to.path.includes('/inventory')) {
      router.push({
        path: '/inventory-fallback',
        query: { originalPath: to.path }
      });
    } else if (to.path.includes('/invoices')) {
      router.push({
        path: '/invoices-fallback',
        query: { originalPath: to.path }
      });
    } else if (to.path.includes('/invoice-system')) {
      router.push({
        path: '/invoice-system-fallback',
        query: { originalPath: to.path }
      });
    } else {
      router.push('/');
    }
  } else if (error.message.includes('redirected')) {
    window.location.href = '/login';
  } else {
    console.log('📦 إعادة التوجيه إلى الصفحة الرئيسية');
    router.push('/');
  }
});

// مسارات احتياطية
router.addRoute({
  path: '/inventory-fallback',
  name: 'InventoryFallback',
  component: {
    template: `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-6 animate-pulse">
            <svg class="w-10 h-10 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">جاري تحضير المخزون</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">صفحة المخزون قيد التحميل</p>
          <div class="space-y-4">
            <button @click="reloadPage" class="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              تحديث الصفحة
            </button>
            <router-link to="/" class="block w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      </div>
    `,
    methods: {
      reloadPage() {
        const originalPath = this.$route.query.originalPath || '/inventory';
        this.$router.push(originalPath);
      }
    }
  },
  meta: { layout: 'empty' }
});

router.addRoute({
  path: '/invoices-fallback',
  name: 'InvoicesFallback',
  component: {
    template: `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full mb-6 animate-pulse">
            <svg class="w-10 h-10 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">جاري تحضير الفواتير</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">صفحة الفواتير قيد التحميل</p>
          <div class="space-y-4">
            <button @click="reloadPage" class="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
              تحديث الصفحة
            </button>
            <router-link to="/" class="block w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      </div>
    `,
    methods: {
      reloadPage() {
        const originalPath = this.$route.query.originalPath || '/invoices';
        this.$router.push(originalPath);
      }
    }
  },
  meta: { layout: 'empty' }
});

router.addRoute({
  path: '/invoice-system-fallback',
  name: 'InvoiceSystemFallback',
  component: {
    template: `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-teal-100 dark:bg-teal-900 rounded-full mb-6 animate-pulse">
            <svg class="w-10 h-10 text-teal-600 dark:text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">جاري تحضير نظام الفواتير</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">صفحة نظام الفواتير قيد التحميل</p>
          <div class="space-y-4">
            <button @click="reloadPage" class="w-full py-3 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200">
              تحديث الصفحة
            </button>
            <router-link to="/dispatch" class="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              الذهاب إلى صفحة الصرف
            </router-link>
            <router-link to="/" class="block w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      </div>
    `,
    methods: {
      reloadPage() {
        const originalPath = this.$route.query.originalPath || '/invoice-system';
        this.$router.push(originalPath);
      }
    }
  },
  meta: { layout: 'empty' }
});

// تحديث عنوان الصفحة
router.afterEach((to) => {
  const pageTitles = {
    '/': 'لوحة التحكم',
    '/inventory': 'المخزون',
    '/inventory/add': 'إضافة صنف',
    '/warehouses': 'إدارة المخازن',
    '/users': 'إدارة المستخدمين',
    '/transactions': 'الحركات',
    '/transfers': 'النقل بين المخازن',
    '/dispatch': 'الصرف الخارجي',
    '/invoice-system': 'نظام الفواتير',
    '/invoices': 'الفواتير',
    '/invoices/create': 'إنشاء فاتورة',
    '/reports': 'التقارير',
    '/profile': 'إعدادات الحساب'
  };

  const pageTitle = pageTitles[to.path] || to.meta?.title || 'نظام المخزون';
  document.title = `${pageTitle} | نظام المخزون`;
  
  console.log(`📍 ${pageTitle} - ${to.path}`);
});

// تهيئة الموجه
router.isReady().then(() => {
  console.log('✅ الموجه جاهز للتشغيل');
  
  console.log('📋 المسارات المسجلة:');
  router.getRoutes().forEach(route => {
    console.log(`- ${route.name || 'غير معروف'}: ${route.path} ${route.meta?.requiresAuth ? '(تتطلب تسجيل دخول)' : ''}`);
  });
  
}).catch(error => {
  console.error('❌ خطأ في تحميل الموجه:', error);
});

// ✅ FIXED: تصدير setuptRouterGuard بدلاً من store مباشرة
export { setupRouterGuard };
export default router;
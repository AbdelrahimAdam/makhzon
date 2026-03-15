<template>
  <div class="min-h-full">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">إدارة المخازن</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            إدارة وتعديل المخازن في النظام (للمشرف العام فقط)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="refreshAllWarehouses"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg
              class="w-4 h-4 ml-2"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            تحديث
          </button>

          <button
            @click="openAddWarehouseModal"
            :disabled="!canManageWarehouses"
            class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            إضافة مخزن جديد
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:shadow-md">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div class="mr-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">إجمالي المخازن</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalWarehouses }}</dd>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:shadow-md">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg class="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="mr-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مخازن رئيسية</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.primaryWarehouses }}</dd>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:shadow-md">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <svg class="h-6 w-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
            <div class="mr-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مواقع صرف</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.dispatchWarehouses }}</dd>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200 hover:shadow-md">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <svg class="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="mr-4">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">نشطة</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.activeWarehouses }}</dd>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1">
          <div class="relative max-w-md">
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              v-model="searchTerm"
              @input="handleSearch"
              placeholder="ابحث عن مخزن..."
              class="block w-full pr-10 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <select
            v-model="filters.type"
            @change="handleFilterChange"
            class="block w-full md:w-auto pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          >
            <option value="">جميع الأنواع</option>
            <option value="primary">مخازن رئيسية</option>
            <option value="dispatch">مواقع صرف</option>
          </select>

          <select
            v-model="filters.status"
            @change="handleFilterChange"
            class="block w-full md:w-auto pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          <button
            @click="resetFilters"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            إعادة تعيين
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && localWarehouses.length === 0" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل المخازن...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && localWarehouses.length === 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <svg class="h-12 w-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.195 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-red-800 dark:text-red-300">حدث خطأ في تحميل المخازن</h3>
      <p class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      <button
        @click="refreshAllWarehouses"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
      >
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        المحاولة مرة أخرى
      </button>
    </div>

    <!-- Permission Error -->
    <div v-else-if="!canManageWarehouses" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-12 text-center">
      <svg class="h-12 w-12 text-yellow-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 110-6 3 3 0 010 6zm0 0c1.657 0 3 1.343 3 3v4.5M3 21l9-9 9 9"/>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-yellow-800 dark:text-yellow-300">غير مصرح بالوصول</h3>
      <p class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
        ليس لديك صلاحية للوصول إلى إدارة المخازن. يقتصر هذا القسم على المشرف العام فقط.
      </p>
      <router-link
        to="/"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        العودة إلى الرئيسية
      </router-link>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredWarehouses.length === 0 && localWarehouses.length === 0 && canManageWarehouses" class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <svg class="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد مخازن</h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">لم يتم إضافة أي مخازن بعد.</p>
      <button
        @click="openAddWarehouseModal"
        class="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        إضافة مخزن جديد
      </button>
    </div>

    <!-- No Results State -->
    <div v-else-if="!loading && filteredWarehouses.length === 0 && localWarehouses.length > 0 && canManageWarehouses" class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
      <svg class="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد نتائج</h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">لم يتم العثور على مخازن تطابق معايير البحث.</p>
      <button
        @click="resetFilters"
        class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        إعادة تعيين الفلاتر
      </button>
    </div>

    <!-- Warehouses Table -->
    <div v-else-if="canManageWarehouses" class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                المخزن
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                النوع
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                الموقع / الوصف
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                السعة
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                الحالة
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                آخر تحديث
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="warehouse in paginatedWarehouses" 
              :key="warehouse.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center mr-3">
                    <span class="text-lg font-medium text-blue-600 dark:text-blue-300">
                      {{ warehouse.name_ar?.charAt(0) || 'م' }}
                    </span>
                  </div>
                  <div class="text-right">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ warehouse.name_ar }}
                      </span>
                      <span v-if="warehouse.is_main" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        رئيسي
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ warehouse.name_en || '-' }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                      ID: {{ warehouse.id }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  warehouse.type === 'primary' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : warehouse.type === 'dispatch'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                ]">
                  <svg 
                    class="w-3 h-3 ml-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      v-if="warehouse.type === 'primary'"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                    <path 
                      v-else-if="warehouse.type === 'dispatch'"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                    <path 
                      v-else
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {{ warehouse.type === 'primary' ? 'مخزن رئيسي' : warehouse.type === 'dispatch' ? 'موقع صرف' : warehouse.type || 'غير محدد' }}
                </span>
              </td>

              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ warehouse.location || 'غير محدد' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ warehouse.description || '-' }}
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ warehouse.capacity ? formatNumber(warehouse.capacity) + ' وحدة' : 'غير محددة' }}
                </div>
                <div v-if="warehouse.type === 'primary' && warehouse.capacity" class="mt-1">
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="bg-green-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: Math.min((warehouse.current_items / warehouse.capacity) * 100, 100) + '%' }"
                    ></div>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatNumber(warehouse.current_items || 0) }} / {{ formatNumber(warehouse.capacity) }} وحدة
                  </div>
                </div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  warehouse.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                ]">
                  <span class="w-1.5 h-1.5 rounded-full ml-1" :class="warehouse.status === 'active' ? 'bg-green-500' : 'bg-red-500'"></span>
                  {{ warehouse.status === 'active' ? 'نشط' : 'غير نشط' }}
                </span>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div>{{ formatDate(warehouse.updated_at) }}</div>
                <div class="text-xs">{{ formatTime(warehouse.updated_at) }}</div>
              </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditWarehouseModal(warehouse)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
                    title="تعديل"
                  >
                    <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    تعديل
                  </button>

                  <button
                    @click="viewWarehouseDetails(warehouse)"
                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
                    title="تفاصيل"
                  >
                    <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    تفاصيل
                  </button>

                  <button
                    v-if="!warehouse.is_main"
                    @click="confirmDeleteWarehouse(warehouse)"
                    :disabled="deleting === warehouse.id"
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-700 rounded-md text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="حذف"
                  >
                    <svg 
                      v-if="deleting === warehouse.id" 
                      class="animate-spin w-3 h-3 ml-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <svg 
                      v-else 
                      class="w-3 h-3 ml-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.831-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            السابق
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            التالي
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-400">
              عرض
              <span class="font-medium">{{ startItem }}</span>
              إلى
              <span class="font-medium">{{ endItem }}</span>
              من
              <span class="font-medium">{{ filteredWarehouses.length }}</span>
              نتيجة
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span class="sr-only">السابق</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <template v-for="page in visiblePages" :key="page">
                <button
                  v-if="page === '...'"
                  disabled
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  ...
                </button>
                <button
                  v-else
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    currentPage === page
                      ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  ]"
                >
                  {{ page }}
                </button>
              </template>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span class="sr-only">التالي</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Warehouse Modal -->
    <WarehouseModal
      v-if="showWarehouseModal"
      :isOpen="showWarehouseModal"
      :warehouse="selectedWarehouse"
      @close="closeWarehouseModal"
      @save="handleWarehouseSave"
    />

    <!-- Warehouse Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl rtl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
            تفاصيل المخزن
          </h2>
          <button 
            @click="closeDetailsModal"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
          >
            <svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Warehouse Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  معرف المخزن
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md font-mono text-sm text-gray-900 dark:text-white">
                  {{ selectedWarehouseDetails?.id }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم (عربي)
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
                  {{ selectedWarehouseDetails?.name_ar }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم (إنجليزي)
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
                  {{ selectedWarehouseDetails?.name_en || '-' }}
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  النوع
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    selectedWarehouseDetails?.type === 'primary' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : selectedWarehouseDetails?.type === 'dispatch'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  ]">
                    {{ selectedWarehouseDetails?.type === 'primary' ? 'مخزن رئيسي' : selectedWarehouseDetails?.type === 'dispatch' ? 'موقع صرف' : selectedWarehouseDetails?.type || 'غير محدد' }}
                  </span>
                  <span v-if="selectedWarehouseDetails?.is_main" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mr-2">
                    رئيسي
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الحالة
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    selectedWarehouseDetails?.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  ]">
                    <span class="w-1.5 h-1.5 rounded-full ml-1" :class="selectedWarehouseDetails?.status === 'active' ? 'bg-green-500' : 'bg-red-500'"></span>
                    {{ selectedWarehouseDetails?.status === 'active' ? 'نشط' : 'غير نشط' }}
                  </span>
                </div>
              </div>

              <div v-if="selectedWarehouseDetails?.capacity">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  السعة التخزينية
                </label>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
                  {{ formatNumber(selectedWarehouseDetails.capacity) }} وحدة
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="space-y-4">
            <div v-if="selectedWarehouseDetails?.location">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الموقع
              </label>
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white">
                {{ selectedWarehouseDetails.location }}
              </div>
            </div>

            <div v-if="selectedWarehouseDetails?.description">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الوصف
              </label>
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-white whitespace-pre-line">
                {{ selectedWarehouseDetails.description }}
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تاريخ الإنشاء
              </label>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedWarehouseDetails?.created_at ? formatFullDate(selectedWarehouseDetails.created_at) : 'غير متوفر' }}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                آخر تحديث
              </label>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedWarehouseDetails?.updated_at ? formatFullDate(selectedWarehouseDetails.updated_at) : 'غير متوفر' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="closeDetailsModal"
            class="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            إغلاق
          </button>
          <button
            @click="editWarehouseDetails"
            class="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            تعديل
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { debounce } from 'lodash';
import WarehouseModal from '@/components/WarehouseModal.vue';

export default {
  name: 'Warehouses',
  components: {
    WarehouseModal
  },
  setup() {
    const store = useStore();
    
    // State
    const loading = ref(false);
    const error = ref('');
    const searchTerm = ref('');
    const deleting = ref('');
    const showWarehouseModal = ref(false);
    const showDetailsModal = ref(false);
    const selectedWarehouse = ref(null);
    const selectedWarehouseDetails = ref(null);
    
    // Local warehouses state
    const localWarehouses = ref([]);
    
    // Filters
    const filters = ref({
      type: '',
      status: ''
    });
    
    // Pagination
    const itemsPerPage = ref(10);
    const currentPage = ref(1);
    
    // Computed properties
    const userRole = computed(() => store.getters.userRole);
    const canManageWarehouses = computed(() => store.getters.canManageWarehouses || false);
    
    // Local stats based on localWarehouses
    const stats = computed(() => {
      const warehousesList = localWarehouses.value;
      return {
        totalWarehouses: warehousesList.length,
        primaryWarehouses: warehousesList.filter(w => w.type === 'primary' || !w.type || w.type === '').length,
        dispatchWarehouses: warehousesList.filter(w => w.type === 'dispatch').length,
        activeWarehouses: warehousesList.filter(w => w.status === 'active').length
      };
    });
    
    // Filtered warehouses
    const filteredWarehouses = computed(() => {
      let filtered = [...localWarehouses.value];
      
      // Apply search filter
      if (searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase().trim();
        filtered = filtered.filter(warehouse => 
          (warehouse.name_ar || '').toLowerCase().includes(term) ||
          (warehouse.name_en || '').toLowerCase().includes(term) ||
          (warehouse.id || '').toLowerCase().includes(term) ||
          (warehouse.location || '').toLowerCase().includes(term) ||
          (warehouse.description || '').toLowerCase().includes(term)
        );
      }
      
      // Apply type filter
      if (filters.value.type) {
        filtered = filtered.filter(warehouse => warehouse.type === filters.value.type);
      }
      
      // Apply status filter
      if (filters.value.status) {
        filtered = filtered.filter(warehouse => warehouse.status === filters.value.status);
      }
      
      return filtered;
    });
    
    // Pagination
    const totalPages = computed(() => Math.ceil(filteredWarehouses.value.length / itemsPerPage.value));
    
    const paginatedWarehouses = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredWarehouses.value.slice(start, end);
    });
    
    const startItem = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
    const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, filteredWarehouses.value.length));
    
    const visiblePages = computed(() => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages.value <= maxVisible) {
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage.value <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages.value);
        } else if (currentPage.value >= totalPages.value - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          pages.push(currentPage.value - 1);
          pages.push(currentPage.value);
          pages.push(currentPage.value + 1);
          pages.push('...');
          pages.push(totalPages.value);
        }
      }
      
      return pages;
    });
    
    // Methods
    const loadAllWarehouses = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        console.log('🔄 Loading all warehouses (primary + dispatch)...');
        
        // Check if user is authenticated and has companyId
        const userProfile = store.state.userProfile;
        if (!userProfile || !userProfile.companyId) {
          throw new Error('User profile or company ID not available');
        }
        
        // 1. Load primary warehouses (filters out dispatch)
        await store.dispatch('loadWarehousesEnhanced');
        const primaryWarehouses = store.state.warehouses || [];
        console.log(`✅ Loaded ${primaryWarehouses.length} primary warehouses`);
        
        // 2. Load dispatch warehouses separately
        const dispatchWarehouses = await store.dispatch('getDispatchWarehouses') || [];
        console.log(`✅ Loaded ${dispatchWarehouses.length} dispatch warehouses`);
        
        // 3. Merge both lists
        const allWarehouses = [...primaryWarehouses];
        
        // Add dispatch warehouses if they exist
        if (dispatchWarehouses && Array.isArray(dispatchWarehouses)) {
          dispatchWarehouses.forEach(dispatchWarehouse => {
            const exists = allWarehouses.some(w => w.id === dispatchWarehouse.id);
            if (!exists) {
              allWarehouses.push(dispatchWarehouse);
            }
          });
        }
        
        // 4. Update local state
        localWarehouses.value = allWarehouses;
        
        console.log(`📊 Total warehouses loaded: ${allWarehouses.length}`);
        console.log('📋 Warehouse types:', {
          primary: allWarehouses.filter(w => w.type === 'primary' || !w.type).length,
          dispatch: allWarehouses.filter(w => w.type === 'dispatch').length,
          other: allWarehouses.filter(w => w.type && w.type !== 'primary' && w.type !== 'dispatch').length
        });
        
      } catch (err) {
        console.error('❌ Error loading warehouses:', err);
        error.value = err.message || 'حدث خطأ في تحميل المخازن';
        
        // Try to use whatever is in the store as fallback
        localWarehouses.value = store.state.warehouses || [];
      } finally {
        loading.value = false;
      }
    };
    
    const refreshAllWarehouses = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        await loadAllWarehouses();
        
        // Show success notification
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم تحديث قائمة المخازن بنجاح'
        });
      } catch (err) {
        console.error('Error refreshing warehouses:', err);
        error.value = err.message || 'حدث خطأ في تحديث المخازن';
      } finally {
        loading.value = false;
      }
    };
    
    const openAddWarehouseModal = () => {
      if (!canManageWarehouses.value) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية لإضافة مخازن'
        });
        return;
      }
      
      selectedWarehouse.value = null;
      showWarehouseModal.value = true;
    };
    
    const openEditWarehouseModal = (warehouse) => {
      if (!canManageWarehouses.value) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية لتعديل المخازن'
        });
        return;
      }
      
      selectedWarehouse.value = warehouse;
      showWarehouseModal.value = true;
    };
    
    const closeWarehouseModal = () => {
      showWarehouseModal.value = false;
      selectedWarehouse.value = null;
    };
    
    const handleWarehouseSave = async (warehouseData) => {
      try {
        if (!canManageWarehouses.value) {
          store.dispatch('showNotification', {
            type: 'error',
            message: 'ليس لديك صلاحية لحفظ المخازن'
          });
          return;
        }
        
        let result;
        if (warehouseData.id) {
          // Update existing warehouse
          result = await store.dispatch('updateWarehouse', {
            warehouseId: warehouseData.id,
            warehouseData: warehouseData
          });
        } else {
          // Add new warehouse
          result = await store.dispatch('addWarehouse', warehouseData);
        }
        
        if (result) {
          store.dispatch('showNotification', {
            type: 'success',
            message: warehouseData.id ? 'تم تحديث المخزن بنجاح' : 'تم إضافة المخزن بنجاح'
          });
          
          // Reload warehouses to get updated data
          await loadAllWarehouses();
        }
        
      } catch (err) {
        console.error('Error handling warehouse save:', err);
        store.dispatch('showNotification', {
          type: 'error',
          message: err.message || 'حدث خطأ في حفظ المخزن'
        });
      }
    };
    
    const viewWarehouseDetails = (warehouse) => {
      selectedWarehouseDetails.value = warehouse;
      showDetailsModal.value = true;
    };
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false;
      selectedWarehouseDetails.value = null;
    };
    
    const editWarehouseDetails = () => {
      if (selectedWarehouseDetails.value) {
        closeDetailsModal();
        openEditWarehouseModal(selectedWarehouseDetails.value);
      }
    };
    
    const confirmDeleteWarehouse = async (warehouse) => {
      if (!canManageWarehouses.value) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية لحذف المخازن'
        });
        return;
      }
      
      if (warehouse.is_main) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'لا يمكن حذف المخزن الرئيسي'
        });
        return;
      }
      
      if (!confirm(`هل أنت متأكد من حذف المخزن "${warehouse.name_ar}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
      }
      
      deleting.value = warehouse.id;
      
      try {
        const result = await store.dispatch('deleteWarehouse', { 
          warehouseId: warehouse.id,
          warehouseName: warehouse.name_ar 
        });
        
        if (result) {
          store.dispatch('showNotification', {
            type: 'success',
            message: 'تم حذف المخزن بنجاح'
          });
          
          // Reload warehouses
          await loadAllWarehouses();
        }
      } catch (err) {
        console.error('Error deleting warehouse:', err);
        store.dispatch('showNotification', {
          type: 'error',
          message: err.message || 'حدث خطأ في حذف المخزن'
        });
      } finally {
        deleting.value = '';
      }
    };
    
    const handleSearch = debounce(() => {
      currentPage.value = 1;
    }, 300);
    
    const handleFilterChange = () => {
      currentPage.value = 1;
    };
    
    const resetFilters = () => {
      searchTerm.value = '';
      filters.value = {
        type: '',
        status: ''
      };
      currentPage.value = 1;
    };
    
    // Pagination methods
    const goToPage = (page) => {
      if (page !== '...') {
        currentPage.value = page;
      }
    };
    
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };
    
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };
    
    // Formatting methods
    const formatNumber = (num) => {
      if (!num && num !== 0) return '0';
      return new Intl.NumberFormat('ar-EG').format(num);
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'غير محدد';
      try {
        const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return 'غير محدد';
      }
    };
    
    const formatTime = (dateString) => {
      if (!dateString) return '';
      try {
        const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
        return date.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '';
      }
    };
    
    const formatFullDate = (dateString) => {
      if (!dateString) return 'غير محدد';
      try {
        const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
        return date.toLocaleString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'غير محدد';
      }
    };
    
    // Watch for user role changes
    watch(userRole, (newRole) => {
      if (newRole !== 'superadmin') {
        error.value = 'ليس لديك صلاحية للوصول إلى إدارة المخازن';
      }
    }, { immediate: true });
    
    // Lifecycle
    onMounted(async () => {
      // Check permissions
      if (!canManageWarehouses.value) {
        error.value = 'ليس لديك صلاحية للوصول إلى إدارة المخازن';
        return;
      }
      
      // Load all warehouses (primary + dispatch)
      await loadAllWarehouses();
    });
    
    return {
      // State
      loading,
      error,
      searchTerm,
      deleting,
      showWarehouseModal,
      showDetailsModal,
      selectedWarehouse,
      selectedWarehouseDetails,
      filters,
      itemsPerPage,
      currentPage,
      
      // Data
      localWarehouses,
      
      // Computed
      userRole,
      canManageWarehouses,
      stats,
      filteredWarehouses,
      paginatedWarehouses,
      totalPages,
      startItem,
      endItem,
      visiblePages,
      
      // Methods
      loadAllWarehouses,
      refreshAllWarehouses,
      openAddWarehouseModal,
      openEditWarehouseModal,
      closeWarehouseModal,
      handleWarehouseSave,
      viewWarehouseDetails,
      closeDetailsModal,
      editWarehouseDetails,
      confirmDeleteWarehouse,
      handleSearch,
      handleFilterChange,
      resetFilters,
      goToPage,
      prevPage,
      nextPage,
      formatNumber,
      formatDate,
      formatTime,
      formatFullDate
    };
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white">
      <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold mb-2">لوحة تحكم المخازن</h1>
            <p class="text-blue-100 dark:text-blue-200 opacity-90">نظرة شاملة على أداء المخازن والحركات اليومية</p>
          </div>
          
          <!-- Time and Date -->
          <div class="flex items-center gap-4 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-xl px-4 py-3">
            <div class="text-center">
              <div class="text-2xl font-bold">{{ currentTime }}</div>
              <div class="text-sm opacity-90">{{ currentDate }}</div>
            </div>
            <div class="h-10 w-px bg-white/20"></div>
            <div class="text-center">
              <div class="text-sm opacity-90">آخر تحديث</div>
              <div class="font-medium">{{ formatRelativeTime(lastUpdated) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading Overlay -->
      <div v-if="initialLoading" class="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 z-50 flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">جاري تحميل البيانات...</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">يرجى الانتظار</p>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="flex flex-col items-center justify-center py-12">
        <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg class="h-10 w-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.195 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">حدث خطأ في تحميل البيانات</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ loadError }}</p>
        <button 
          @click="refreshDashboard"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>

      <!-- Top Stats Cards (only shown when data is available) -->
      <template v-else>
        <!-- Top Stats Cards (unchanged) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <!-- Out of Stock Items Card -->
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-red-100 mb-1">الأصناف المنتهية</p>
                <div v-if="statsLoading" class="h-8 w-24 bg-red-400/50 rounded animate-pulse"></div>
                <p v-else class="text-3xl font-bold">
                  {{ formatEnglishNumber(dashboardStats.outOfStockItems) }}
                </p>
                <p class="mt-2 text-sm text-red-100 opacity-90">
                  أصناف بدون كمية
                </p>
              </div>
              <div class="h-12 w-12 rounded-xl bg-red-400/20 flex items-center justify-center">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-red-400/30">
              <div class="flex items-center justify-between text-sm">
                <span class="text-red-100">نسبة من المجموع</span>
                <span class="font-medium">
                  {{ outOfStockPercentage }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Low Quantity Items Card -->
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-orange-100 mb-1">الأصناف قليلة الكمية</p>
                <div v-if="statsLoading" class="h-8 w-24 bg-orange-400/50 rounded animate-pulse"></div>
                <p v-else class="text-3xl font-bold">
                  {{ formatEnglishNumber(dashboardStats.lowQuantityItems) }}
                </p>
                <p class="mt-2 text-sm text-orange-100 opacity-90">
                  أصناف كمية أقل من 500
                </p>
              </div>
              <div class="h-12 w-12 rounded-xl bg-orange-400/20 flex items-center justify-center">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                </svg>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-orange-400/30">
              <div class="flex items-center justify-between text-sm">
                <span class="text-orange-100">نسبة من المجموع</span>
                <span class="font-medium">
                  {{ lowQuantityPercentage }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Healthy Items Card -->
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-green-100 mb-1">الأصناف الجيدة</p>
                <div v-if="statsLoading" class="h-8 w-24 bg-green-400/50 rounded animate-pulse"></div>
                <p v-else class="text-3xl font-bold">
                  {{ formatEnglishNumber(dashboardStats.healthyItems) }}
                </p>
                <p class="mt-2 text-sm text-green-100 opacity-90">
                  أصناف كمية أكثر من 500
                </p>
              </div>
              <div class="h-12 w-12 rounded-xl bg-green-400/20 flex items-center justify-center">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-green-400/30">
              <div class="flex items-center justify-between text-sm">
                <span class="text-green-100">نسبة من المجموع</span>
                <span class="font-medium">
                  {{ healthyItemsPercentage }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Warehouse Filter Section -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {{ selectedWarehouse !== 'all' ? `المخزن: ${getWarehouseLabel(selectedWarehouse)}` : 'جميع المخازن' }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">اختر مخزن لعرض إحصائياته وحركاته</p>
              </div>
              
              <div class="flex flex-col md:flex-row gap-3">
                <select 
                  v-model="selectedWarehouse"
                  @change="handleWarehouseChange"
                  class="flex-1 min-w-full md:min-w-[200px] px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                >
                  <option value="all">🏢 جميع المخازن</option>
                  <option 
                    v-for="warehouse in accessibleWarehouses" 
                    :key="warehouse.id" 
                    :value="warehouse.id"
                    class="py-2"
                  >
                    📦 {{ warehouse.name_ar || warehouse.name }}
                  </option>
                </select>
                
                <button
                  @click="refreshDashboard"
                  :disabled="loading || statsLoading"
                  class="px-4 md:px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg v-if="loading || statsLoading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span v-else>🔄 تحديث</span>
                </button>
              </div>
            </div>
            
            <!-- Warehouse Info -->
            <div v-if="selectedWarehouse !== 'all'" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">المخزن المحدد</div>
                  <div class="font-bold text-gray-900 dark:text-white text-sm md:text-base">{{ getWarehouseLabel(selectedWarehouse) }}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">النسبة من الكمية الكلية</div>
                  <div class="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                    {{ warehousePercentage }}%
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">آخر نشاط</div>
                  <div class="font-bold text-gray-900 dark:text-white text-sm md:text-base">{{ lastActivityTime }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <!-- Total Items Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">إجمالي الأصناف</p>
                <div v-if="statsLoading" class="h-8 w-20 md:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatEnglishNumber(dashboardStats.totalItems) }}
                </p>
                <div v-if="selectedWarehouse !== 'all' && allWarehouseStats.totalItems > 0" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="inline-flex items-center gap-1">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    {{ warehousePercentage }}% من المجموع
                  </span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
            <div class="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs md:text-sm">
                <span class="text-gray-500 dark:text-gray-400">متوسط الكمية لكل صنف</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ avgQuantityPerItem }}
                </span>
              </div>
            </div>
          </div>

          <!-- Total Quantity Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">إجمالي الكمية</p>
                <div v-if="statsLoading" class="h-8 w-20 md:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatEnglishNumber(dashboardStats.totalQuantity) }}
                </p>
                <div class="mt-2">
                  <div class="flex flex-col gap-1 text-xs md:text-sm">
                    <span class="flex items-center gap-1">
                      <div class="h-2 w-2 rounded-full bg-green-500"></div>
                      كراتين: {{ formatEnglishNumber(totalCartons) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                      فردي: {{ formatEnglishNumber(totalSingles) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs md:text-sm">
                <span class="text-gray-500 dark:text-gray-400">قيمة تقديرية</span>
                <span class="font-medium text-green-600 dark:text-green-400">
                  {{ formatEnglishNumber(estimatedValue) }} ج
                </span>
              </div>
            </div>
          </div>

          <!-- Today's Activity Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">نشاط اليوم</p>
                <p class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatEnglishNumber(todayTransactionsCount) }}
                </p>
                <div class="mt-2 grid grid-cols-3 gap-1 md:gap-2">
                  <div class="text-center">
                    <div class="h-5 w-5 md:h-6 md:w-6 mx-auto rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-1">
                      <span class="text-xs font-bold text-green-600 dark:text-green-400">+</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ todayAddCount }}</span>
                  </div>
                  <div class="text-center">
                    <div class="h-5 w-5 md:h-6 md:w-6 mx-auto rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-1">
                      <span class="text-xs font-bold text-blue-600 dark:text-blue-400">↔</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ todayTransferCount }}</span>
                  </div>
                  <div class="text-center">
                    <div class="h-5 w-5 md:h-6 md:w-6 mx-auto rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-1">
                      <span class="text-xs font-bold text-purple-600 dark:text-purple-400">→</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ todayDispatchCount }}</span>
                  </div>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs md:text-sm">
                <span class="text-gray-500 dark:text-gray-400">آخر حركة</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ lastTransactionTime }}</span>
              </div>
            </div>
          </div>

          <!-- Warehouse Performance Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">أداء المخزن</p>
                <p class="text-2xl md:text-3xl font-bold" :class="getHealthTextClass(performanceScore)">
                  {{ performanceScore }}%
                </p>
                <div class="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  <span class="inline-flex items-center gap-1">
                    <svg class="h-3 w-3 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    مؤشر الصحة
                  </span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl" :class="getHealthColorClass(performanceScore, true)">
                <svg class="h-5 w-5 md:h-6 md:w-6" :class="getHealthIconClass(performanceScore)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="performanceScore >= 80" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path v-else-if="performanceScore >= 60" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="text-xs md:text-sm">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-gray-500 dark:text-gray-400">مستوى الأداء</span>
                  <span class="font-medium" :class="getHealthTextClass(performanceScore)">
                    {{ getPerformanceLabel(performanceScore) }}
                  </span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getHealthColorClass(performanceScore)"
                    :style="{ width: Math.min(performanceScore, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- QUICK ACTIONS SECTION -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">الإجراءات السريعة</h2>
            <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <router-link 
                :to="selectedWarehouse !== 'all' ? `/inventory?warehouse=${selectedWarehouse}` : '/inventory'"
                class="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group hover-lift"
              >
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white text-sm md:text-base">المخزون</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">عرض جميع الأصناف</div>
                </div>
                <svg class="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </router-link>

              <router-link 
                :to="selectedWarehouse !== 'all' ? `/reports?warehouse=${selectedWarehouse}` : '/reports'"
                class="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group hover-lift"
              >
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white text-sm md:text-base">التقارير</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">تحليل كامل للأداء</div>
                </div>
                <svg class="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </router-link>

              <router-link 
                v-if="canModifyItems"
                :to="selectedWarehouse !== 'all' ? `/inventory/add?warehouse=${selectedWarehouse}` : '/inventory/add'"
                class="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group hover-lift"
              >
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white text-sm md:text-base">إضافة صنف</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">إضافة صنف جديد</div>
                </div>
                <svg class="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </router-link>

              <router-link 
                :to="selectedWarehouse !== 'all' ? `/transactions?warehouse=${selectedWarehouse}` : '/transactions'"
                class="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group hover-lift"
              >
                <div class="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white text-sm md:text-base">الحركات</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">سجل الحركات الكامل</div>
                </div>
                <svg class="h-4 w-4 md:h-5 md:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Warehouse Statistics Table -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-6">إحصائيات المخازن</h2>
            
            <div v-if="warehouseStatsLoading" class="py-8 text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل إحصائيات المخازن...</p>
            </div>
            
            <div v-else>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr class="bg-gray-50 dark:bg-gray-700/50">
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        المخزن
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        إجمالي الأصناف
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        إجمالي الكمية
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        الأصناف قليلة الكمية
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        نسبة قليلة الكمية
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        الأصناف المنتهية
                      </th>
                      <th class="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                        نسبة المنتهية
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="warehouse in accessibleWarehouses" :key="warehouse.id" 
                        :class="[
                          'transition-colors duration-200',
                          warehouse.id === selectedWarehouse ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        ]">
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center">
                          <div :class="[
                            'h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center ml-2 md:ml-3',
                            warehouse.id === selectedWarehouse ? 'bg-blue-600 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900'
                          ]">
                            <svg class="h-4 w-4 md:h-5 md:w-5" :class="warehouse.id === selectedWarehouse ? 'text-white' : 'text-blue-600 dark:text-blue-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                          </div>
                          <div>
                            <div class="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                              {{ warehouse.name_ar || warehouse.name }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                          {{ formatEnglishNumber(warehouseStatsCache[warehouse.id]?.totalItems || 0) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                          {{ formatEnglishNumber(warehouseStatsCache[warehouse.id]?.totalQuantity || 0) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-orange-600 dark:text-orange-400">
                          {{ formatEnglishNumber(warehouseStatsCache[warehouse.id]?.lowQuantityItems || 0) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center gap-1 md:gap-2">
                          <div class="flex-1">
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                :class="getHealthColorClass(warehouseLowQuantityPercentage(warehouse.id))"
                                class="h-full rounded-full"
                                :style="{ width: Math.min(warehouseLowQuantityPercentage(warehouse.id), 100) + '%' }"
                              ></div>
                            </div>
                          </div>
                          <span class="text-xs md:text-sm font-bold text-orange-600 dark:text-orange-400">
                            {{ warehouseLowQuantityPercentage(warehouse.id) }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-red-600 dark:text-red-400">
                          {{ formatEnglishNumber(warehouseStatsCache[warehouse.id]?.outOfStockItems || 0) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center gap-1 md:gap-2">
                          <div class="flex-1">
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                class="h-full rounded-full bg-red-500"
                                :style="{ width: Math.min(warehouseOutOfStockPercentage(warehouse.id), 100) + '%' }"
                              ></div>
                            </div>
                          </div>
                          <span class="text-xs md:text-sm font-bold text-red-600 dark:text-red-400">
                            {{ warehouseOutOfStockPercentage(warehouse.id) }}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-gray-900 dark:text-white">المجموع الكلي</div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                          {{ formatEnglishNumber(allWarehouseStats.totalItems) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                          {{ formatEnglishNumber(allWarehouseStats.totalQuantity) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-orange-600 dark:text-orange-400">
                          {{ formatEnglishNumber(allWarehouseStats.lowQuantityItems) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center gap-1 md:gap-2">
                          <div class="flex-1">
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                class="h-full rounded-full bg-orange-500"
                                :style="{ width: Math.min(lowQuantityPercentage, 100) + '%' }"
                              ></div>
                            </div>
                          </div>
                          <span class="text-xs md:text-sm font-bold text-orange-600 dark:text-orange-400">
                            {{ lowQuantityPercentage }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="text-sm md:text-lg font-bold text-red-600 dark:text-red-400">
                          {{ formatEnglishNumber(allWarehouseStats.outOfStockItems) }}
                        </div>
                      </td>
                      <td class="px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center gap-1 md:gap-2">
                          <div class="flex-1">
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                class="h-full rounded-full bg-red-500"
                                :style="{ width: Math.min(outOfStockPercentage, 100) + '%' }"
                              ></div>
                            </div>
                          </div>
                          <span class="text-xs md:text-sm font-bold text-red-600 dark:text-red-400">
                            {{ outOfStockPercentage }}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Items & Transactions Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Recent Items -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 h-full">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">آخر الأصناف المضافة</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">أحدث 8 أصناف {{ selectedWarehouse !== 'all' ? 'في المخزن المحدد' : 'في النظام' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs px-2 py-1 rounded-full" :class="recentItemsStatusClass">
                    {{ recentItemsCount }} صنف
                  </span>
                </div>
              </div>

              <div v-if="recentItemsLoading" class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل الأصناف...</p>
              </div>

              <div v-else-if="recentItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div 
                  v-for="item in recentItems" 
                  :key="item.id"
                  class="group bg-gray-50 dark:bg-gray-700 rounded-xl p-3 md:p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md cursor-pointer fade-in"
                  @click="openItemModal(item)"
                >
                  <div class="flex items-start gap-2 md:gap-3">
                    <div class="relative">
                      <div class="h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600">
                        <img 
                          v-if="item.photo_url" 
                          :src="item.photo_url" 
                          :alt="item.name"
                          class="h-full w-full object-cover lazy-image"
                          loading="lazy"
                          @error="handleImageError"
                        >
                        <div v-else class="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <svg class="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      </div>
                      <span :class="getQuantityStatusClass(item.remaining_quantity)" 
                            class="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 status-dot"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <h3 class="font-medium text-gray-900 dark:text-white truncate text-sm md:text-base">{{ item.name }}</h3>
                        <span :class="getQuantityClass(item.remaining_quantity)" class="font-bold text-base md:text-lg">
                          {{ formatEnglishNumber(item.remaining_quantity) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {{ item.code }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {{ item.color || 'بدون لون' }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          {{ getWarehouseLabel(item.warehouse_id) }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          {{ formatRelativeTime(item.created_at || item.updated_at) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">لا توجد أصناف</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">لم يتم إضافة أي أصناف بعد.</p>
              </div>
            </div>
          </div>

          <!-- Recent Transactions (Sidebar) -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 dark:border-gray-700 h-full">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">آخر الحركات</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">أحدث 10 حركات {{ selectedWarehouse !== 'all' ? 'في المخزن المحدد' : 'في النظام' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1">
                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">إضافة</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">نقل</span>
                  </div>
                </div>
              </div>

              <div v-if="recentTransactionsLoading" class="text-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل الحركات...</p>
              </div>

              <div v-else-if="recentTransactions.length > 0" class="space-y-3">
                <div 
                  v-for="transaction in recentTransactions.slice(0, 10)" 
                  :key="transaction.id"
                  class="group p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer fade-in"
                  @click="openTransactionModal(transaction)"
                >
                  <div class="flex items-center gap-3">
                    <!-- Transaction Icon -->
                    <div :class="[
                      'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      transaction.type === 'ADD' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                      transaction.type === 'TRANSFER' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                      'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                    ]">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="transaction.type === 'ADD'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        <path v-if="transaction.type === 'TRANSFER'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        <path v-if="transaction.type === 'DISPATCH'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </div>

                    <!-- Transaction Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ transaction.item_name }}</h4>
                          <div class="flex items-center gap-1 mt-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">{{ getTransactionTypeLabel(transaction.type) }}</span>
                            <span class="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                              {{ formatEnglishNumber(transaction.total_delta || 0) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400 truncate" style="max-width: 100px;">
                          <template v-if="transaction.type === 'TRANSFER'">
                            {{ getWarehouseLabel(transaction.from_warehouse) }} → {{ getWarehouseLabel(transaction.to_warehouse) }}
                          </template>
                          <template v-else>
                            {{ getWarehouseLabel(transaction.to_warehouse) }}
                          </template>
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          {{ formatRelativeTime(transaction.timestamp) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">لا توجد حركات</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">لم تتم أي حركات في هذا المخزن.</p>
              </div>
              
              <!-- View All Transactions Button -->
              <div v-if="recentTransactions.length > 0" class="mt-4">
                <router-link 
                  :to="selectedWarehouse !== 'all' ? `/transactions?warehouse=${selectedWarehouse}` : '/transactions'"
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>عرض جميع الحركات</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Loading states
    const loading = ref(false);
    const initialLoading = ref(true);
    const statsLoading = ref(false);
    const warehouseStatsLoading = ref(false);
    const recentItemsLoading = ref(false);
    const recentTransactionsLoading = ref(false);
    const loadError = ref('');
    
    // UI state
    const selectedWarehouse = ref('all');
    const currentTime = ref('');
    const currentDate = ref('');
    const lastUpdated = ref(new Date());
    
    // Local cache for warehouse stats
    const warehouseStatsCache = ref({});
    const allWarehouseStatsCache = ref({
      totalItems: 0,
      totalQuantity: 0,
      lowQuantityItems: 0,
      outOfStockItems: 0,
      healthyItems: 0,
      lastUpdated: null
    });

    // ========== COMPUTED PROPERTIES ==========
    
    const userRole = computed(() => store.getters.userRole || '');
    const userName = computed(() => store.getters.userName || '');
    const userProfile = computed(() => store.getters.userProfile || {});
    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    
    const accessibleWarehouses = computed(() => {
      try {
        return store.getters.accessibleWarehouses || [];
      } catch {
        return [];
      }
    });

    const inventoryItems = computed(() => {
      return store.getters.inventoryItems || [];
    });

    const recentInventoryItems = computed(() => {
      const inventory = inventoryItems.value;
      return [...inventory]
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB - dateA;
        })
        .slice(0, 20);
    });

    const recentTransactions = computed(() => {
      try {
        const items = store.getters.recentTransactions || [];
        // Filter by warehouse if selected
        if (selectedWarehouse.value !== 'all') {
          return items.filter(transaction => 
            transaction.from_warehouse === selectedWarehouse.value || 
            transaction.to_warehouse === selectedWarehouse.value
          );
        }
        return items;
      } catch {
        return [];
      }
    });

    const canModifyItems = computed(() => {
      try {
        const role = userRole.value;
        const profile = userProfile.value;
        
        if (role === 'superadmin') return true;
        
        if (role === 'warehouse_manager') {
          const allowedWarehouses = profile?.allowed_warehouses || [];
          const hasWarehouses = allowedWarehouses.length > 0;
          const hasPermission = profile?.permissions?.includes('full_access') || 
                                profile?.permissions?.includes('manage_inventory') ||
                                profile?.permissions?.includes('add_items');
          return hasWarehouses && hasPermission;
        }
        
        return false;
      } catch {
        return false;
      }
    });

    // Dashboard stats calculation with low quantity (≤ 500)
    const dashboardStats = computed(() => {
      const inventory = inventoryItems.value;
      
      // Filter by warehouse if selected
      const filteredItems = selectedWarehouse.value === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === selectedWarehouse.value);
      
      // Calculate stats
      const totalItems = filteredItems.length;
      const totalQuantity = filteredItems.reduce((sum, item) => 
        sum + (item.remaining_quantity || 0), 0);
      
      // Low quantity items (500 or less, but greater than 0)
      const lowQuantityItems = filteredItems.filter(item => {
        const quantity = item.remaining_quantity || 0;
        return quantity > 0 && quantity <= 500;
      }).length;
      
      // Out of stock items
      const outOfStockItems = filteredItems.filter(item => 
        (item.remaining_quantity || 0) === 0).length;
      
      // Healthy items (more than 500)
      const healthyItems = filteredItems.filter(item => 
        (item.remaining_quantity || 0) > 500).length;
      
      return {
        totalItems,
        totalQuantity,
        lowQuantityItems,
        outOfStockItems,
        healthyItems,
        estimatedValue: totalQuantity * 25
      };
    });

    const allWarehouseStats = computed(() => {
      // Cache all warehouse stats to avoid recalculating
      if (allWarehouseStatsCache.value.lastUpdated && 
          Date.now() - allWarehouseStatsCache.value.lastUpdated < 30000) { // 30 second cache
        return allWarehouseStatsCache.value;
      }

      const inventory = inventoryItems.value;
      
      const totalItems = inventory.length;
      const totalQuantity = inventory.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
      
      // Low quantity items (500 or less, but greater than 0)
      const lowQuantityItems = inventory.filter(item => {
        const quantity = item.remaining_quantity || 0;
        return quantity > 0 && quantity <= 500;
      }).length;
      
      // Out of stock items
      const outOfStockItems = inventory.filter(item => (item.remaining_quantity || 0) === 0).length;
      
      // Healthy items (more than 500)
      const healthyItems = inventory.filter(item => (item.remaining_quantity || 0) > 500).length;

      const stats = {
        totalItems,
        totalQuantity,
        lowQuantityItems,
        outOfStockItems,
        healthyItems,
        lastUpdated: new Date()
      };

      allWarehouseStatsCache.value = stats;
      return stats;
    });

    // Warehouse percentage for selected warehouse
    const warehousePercentage = computed(() => {
      if (selectedWarehouse.value === 'all' || dashboardStats.value.totalQuantity === 0) return '0';
      
      const selectedStats = dashboardStats.value;
      const allStats = allWarehouseStats.value;
      
      if (allStats.totalQuantity === 0) return '0';
      
      return ((selectedStats.totalQuantity / allStats.totalQuantity) * 100).toFixed(1);
    });

    // Low quantity percentage
    const lowQuantityPercentage = computed(() => {
      if (dashboardStats.value.totalItems === 0) return 0;
      return Math.round((dashboardStats.value.lowQuantityItems / dashboardStats.value.totalItems) * 100);
    });

    // Out of stock percentage
    const outOfStockPercentage = computed(() => {
      if (dashboardStats.value.totalItems === 0) return 0;
      return Math.round((dashboardStats.value.outOfStockItems / dashboardStats.value.totalItems) * 100);
    });

    // Healthy items percentage
    const healthyItemsPercentage = computed(() => {
      if (dashboardStats.value.totalItems === 0) return 0;
      return Math.round((dashboardStats.value.healthyItems / dashboardStats.value.totalItems) * 100);
    });

    // Performance score based on warehouse health
    const performanceScore = computed(() => {
      if (dashboardStats.value.totalItems === 0) return 100; // Empty warehouse is considered perfect
      
      const lowStockPenalty = lowQuantityPercentage.value * 0.3; // 30% weight for low stock
      const outOfStockPenalty = outOfStockPercentage.value * 0.7; // 70% weight for out of stock
      
      const score = 100 - (lowStockPenalty + outOfStockPenalty);
      return Math.max(0, Math.min(100, Math.round(score)));
    });

    // Recent items filtered by warehouse
    const recentItems = computed(() => {
      const items = recentInventoryItems.value;
      
      if (selectedWarehouse.value === 'all') {
        return items.slice(0, 8); // Limit to 8 items for performance
      }
      
      return items
        .filter(item => item.warehouse_id === selectedWarehouse.value)
        .slice(0, 8);
    });

    const recentItemsCount = computed(() => recentItems.value.length);
    
    const recentItemsStatusClass = computed(() => {
      const count = recentItemsCount.value;
      if (count === 0) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      if (count < 4) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
    });

    // Today's transactions
    const todayTransactionsCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return recentTransactions.value.filter(transaction => {
        if (!transaction.timestamp) return false;
        
        try {
          const transDate = getTransactionDate(transaction);
          return transDate >= today;
        } catch {
          return false;
        }
      }).length;
    });

    const todayAddCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return recentTransactions.value.filter(transaction => {
        if (!transaction.timestamp || transaction.type !== 'ADD') return false;
        
        try {
          const transDate = getTransactionDate(transaction);
          return transDate >= today;
        } catch {
          return false;
        }
      }).length;
    });

    const todayTransferCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return recentTransactions.value.filter(transaction => {
        if (!transaction.timestamp || transaction.type !== 'TRANSFER') return false;
        
        try {
          const transDate = getTransactionDate(transaction);
          return transDate >= today;
        } catch {
          return false;
        }
      }).length;
    });

    const todayDispatchCount = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return recentTransactions.value.filter(transaction => {
        if (!transaction.timestamp || transaction.type !== 'DISPATCH') return false;
        
        try {
          const transDate = getTransactionDate(transaction);
          return transDate >= today;
        } catch {
          return false;
        }
      }).length;
    });

    const lastTransactionTime = computed(() => {
      if (recentTransactions.value.length === 0) return 'لا توجد حركات';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = recentTransactions.value.filter(transaction => {
        if (!transaction.timestamp) return false;
        
        try {
          const transDate = getTransactionDate(transaction);
          return transDate >= today;
        } catch {
          return false;
        }
      });
      
      if (todayTransactions.length === 0) return 'لا توجد حركات اليوم';
      
      const last = todayTransactions[0];
      return formatRelativeTime(last.timestamp);
    });

    const lastActivityTime = computed(() => {
      if (recentTransactions.value.length === 0) return 'لا يوجد نشاط';
      const last = recentTransactions.value[0];
      return formatRelativeTime(last?.timestamp);
    });

    // Calculate cartons and singles
    const totalCartons = computed(() => {
      const items = recentItems.value;
      return items.reduce((sum, item) => {
        const cartons = item.cartons_count || 0;
        const perCarton = item.per_carton_count || 12;
        return sum + (cartons * perCarton);
      }, 0);
    });

    const totalSingles = computed(() => {
      const items = recentItems.value;
      return items.reduce((sum, item) => sum + (item.single_bottles_count || 0), 0);
    });

    const estimatedValue = computed(() => {
      return dashboardStats.value.totalQuantity * 25; // Simple estimation
    });

    const avgQuantityPerItem = computed(() => {
      const totalItems = dashboardStats.value.totalItems;
      const totalQuantity = dashboardStats.value.totalQuantity;
      
      if (totalItems === 0) return 0;
      return Math.round(totalQuantity / totalItems);
    });

    // ========== HELPER FUNCTIONS ==========
    
    const formatEnglishNumber = (num) => {
      if (isNaN(num) || num === null || num === undefined) return '0';
      return new Intl.NumberFormat('en-US').format(num);
    };

    const getTransactionDate = (transaction) => {
      if (!transaction.timestamp) return new Date(0);
      
      try {
        // Handle Firestore Timestamp
        if (transaction.timestamp.toDate && typeof transaction.timestamp.toDate === 'function') {
          return transaction.timestamp.toDate();
        }
        
        // Handle timestamp with seconds and nanoseconds
        if (transaction.timestamp.seconds) {
          return new Date(transaction.timestamp.seconds * 1000);
        }
        
        // Handle ISO string or milliseconds
        return new Date(transaction.timestamp);
      } catch {
        return new Date(0);
      }
    };

    const formatDetailedTime = (timestamp) => {
      if (!timestamp) return '';
      try {
        const date = getTransactionDate({ timestamp });
        return date.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        return '';
      }
    };

    const formatRelativeTime = (timestamp) => {
      if (!timestamp) return 'غير محدد';
      
      try {
        const date = getTransactionDate({ timestamp });
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'تاريخ غير صالح';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
        if (diffHours < 24) return `قبل ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `قبل ${diffDays} أيام`;
        
        return date.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
      } catch {
        return 'تاريخ غير صالح';
      }
    };

    const getWarehouseLabel = (warehouseId) => {
      if (!warehouseId) return '';
      try {
        return store.getters.getWarehouseLabel(warehouseId) || warehouseId;
      } catch {
        return warehouseId;
      }
    };

    const getTransactionTypeLabel = (type) => {
      const labels = {
        'ADD': 'إضافة',
        'TRANSFER': 'نقل',
        'DISPATCH': 'صرف',
        'UPDATE': 'تحديث',
        'DELETE': 'حذف'
      };
      return labels[type] || type;
    };

    const getQuantityClass = (quantity) => {
      if (!quantity || quantity === 0) return 'text-red-600 dark:text-red-400';
      if (quantity <= 500) return 'text-orange-600 dark:text-orange-400';
      return 'text-green-600 dark:text-green-400';
    };

    const getQuantityStatusClass = (quantity) => {
      if (!quantity || quantity === 0) return 'bg-red-500';
      if (quantity <= 500) return 'bg-orange-500';
      return 'bg-green-500';
    };

    const getHealthColorClass = (percentage, isBackground = false) => {
      if (percentage >= 80) return isBackground ? 'bg-green-100 dark:bg-green-900' : 'bg-green-500';
      if (percentage >= 60) return isBackground ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-yellow-500';
      return isBackground ? 'bg-red-100 dark:bg-red-900' : 'bg-red-500';
    };

    const getHealthIconClass = (percentage) => {
      if (percentage >= 80) return 'text-green-600 dark:text-green-400';
      if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getHealthTextClass = (percentage) => {
      if (percentage >= 80) return 'text-green-600 dark:text-green-400';
      if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getPerformanceLabel = (percentage) => {
      if (percentage >= 80) return 'ممتاز';
      if (percentage >= 60) return 'جيد';
      if (percentage >= 40) return 'متوسط';
      return 'ضعيف';
    };

    const calculateTotalQuantity = (item) => {
      const cartons = item.cartons_count || 0;
      const perCarton = item.per_carton_count || 12;
      const singles = item.single_bottles_count || 0;
      return (cartons * perCarton) + singles;
    };

    const handleImageError = (event) => {
      event.target.style.display = 'none';
      event.target.parentElement.classList.add('bg-gray-200', 'dark:bg-gray-700');
    };

    // Warehouse stats calculation
    const calculateWarehouseStats = async (warehouseId) => {
      if (warehouseStatsCache.value[warehouseId] && 
          Date.now() - warehouseStatsCache.value[warehouseId].lastUpdated < 30000) {
        return warehouseStatsCache.value[warehouseId];
      }

      try {
        const inventory = inventoryItems.value;
        const filteredItems = warehouseId === 'all' 
          ? inventory 
          : inventory.filter(item => item.warehouse_id === warehouseId);
        
        const totalItems = filteredItems.length;
        const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
        
        // Low quantity items (500 or less, but greater than 0)
        const lowQuantityItems = filteredItems.filter(item => {
          const quantity = item.remaining_quantity || 0;
          return quantity > 0 && quantity <= 500;
        }).length;
        
        // Out of stock items
        const outOfStockItems = filteredItems.filter(item => (item.remaining_quantity || 0) === 0).length;
        
        const stats = {
          totalItems,
          totalQuantity,
          lowQuantityItems,
          outOfStockItems,
          lastUpdated: new Date()
        };
        
        warehouseStatsCache.value[warehouseId] = stats;
        
        return stats;
      } catch (error) {
        console.error('Error calculating warehouse stats:', error);
        return {
          totalItems: 0,
          totalQuantity: 0,
          lowQuantityItems: 0,
          outOfStockItems: 0,
          lastUpdated: new Date()
        };
      }
    };

    const warehouseLowQuantityPercentage = (warehouseId) => {
      const stats = warehouseStatsCache.value[warehouseId];
      if (!stats || stats.totalItems === 0) return 0;
      return Math.round((stats.lowQuantityItems / stats.totalItems) * 100);
    };

    const warehouseOutOfStockPercentage = (warehouseId) => {
      const stats = warehouseStatsCache.value[warehouseId];
      if (!stats || stats.totalItems === 0) return 0;
      return Math.round((stats.outOfStockItems / stats.totalItems) * 100);
    };

    // ========== MODAL FUNCTIONS ==========
    
    const openItemModal = async (item) => {
      // You can implement this if needed
      console.log('Item clicked:', item);
    };

    const openTransactionModal = (transaction) => {
      // You can implement this if needed
      console.log('Transaction clicked:', transaction);
    };

    // ========== TIME UPDATES ==========
    
    const updateTime = () => {
      const now = new Date();
      currentTime.value = now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      currentDate.value = now.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // ========== OPTIMIZED DASHBOARD LOADING ==========
    
    const loadDashboardData = async () => {
      initialLoading.value = true;
      loadError.value = '';
      console.log('🚀 Loading dashboard data from Vuex store...');
      
      try {
        // Check if user is authenticated
        if (!isAuthenticated.value) {
          console.log('⚠️ User not authenticated, redirecting to login...');
          await router.push('/login');
          return;
        }
        
        // Wait for user profile to load if not already
        let attempts = 0;
        while (!userProfile.value && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
        
        if (!userProfile.value) {
          throw new Error('تعذر تحميل بيانات المستخدم');
        }
        
        console.log('📊 Loading warehouses from store...');
        if (!accessibleWarehouses.value || accessibleWarehouses.value.length === 0) {
          await store.dispatch('loadWarehousesEnhanced');
        }
        
        console.log('📦 Loading inventory from store...');
        if (inventoryItems.value.length === 0) {
          await store.dispatch('loadAllInventory');
        }
        
        console.log('📋 Loading recent transactions from store...');
        if (recentTransactions.value.length === 0) {
          await store.dispatch('getRecentTransactions');
        }
        
        console.log('📈 Calculating dashboard stats...');
        await loadDashboardStats(selectedWarehouse.value);
        
        console.log('✅ Dashboard data loaded successfully!');
        
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        loadError.value = error.message || 'حدث خطأ في تحميل البيانات';
      } finally {
        initialLoading.value = false;
      }
    };

    const loadDashboardStats = async (warehouseId = 'all') => {
      statsLoading.value = true;
      try {
        console.log(`📊 Calculating dashboard stats for: ${warehouseId} from Vuex store`);
        
        // Calculate stats from Vuex store data
        await calculateWarehouseStats(warehouseId);
        
        // Update last updated time
        lastUpdated.value = new Date();
        
        console.log('✅ Dashboard stats calculated from Vuex store');
        
      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
      } finally {
        statsLoading.value = false;
      }
    };

    const loadWarehouseStats = async () => {
      if (accessibleWarehouses.value.length > 0) {
        warehouseStatsLoading.value = true;
        try {
          console.log('📊 Loading all warehouse stats from Vuex store...');
          
          // Calculate stats for each warehouse
          for (const warehouse of accessibleWarehouses.value) {
            await calculateWarehouseStats(warehouse.id);
          }
          
          console.log('✅ All warehouse stats calculated from Vuex store');
        } catch (error) {
          console.error('Error loading warehouse stats:', error);
        } finally {
          warehouseStatsLoading.value = false;
        }
      }
    };

    // ========== ACTIONS ==========
    
    const refreshDashboard = async () => {
      loading.value = true;
      try {
        console.log('🔄 Refreshing dashboard from Vuex store...');
        
        // Clear cache
        warehouseStatsCache.value = {};
        allWarehouseStatsCache.value = {
          totalItems: 0,
          totalQuantity: 0,
          lowQuantityItems: 0,
          outOfStockItems: 0,
          healthyItems: 0,
          lastUpdated: null
        };
        
        // Refresh Vuex store data
        await store.dispatch('loadAllInventory', { forceRefresh: true });
        await store.dispatch('getRecentTransactions');
        
        // Recalculate stats
        await loadDashboardStats(selectedWarehouse.value);
        
        console.log('✅ Dashboard refreshed successfully from Vuex store');
        
      } catch (error) {
        console.error('Error refreshing dashboard:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleWarehouseChange = async () => {
      loading.value = true;
      try {
        console.log(`🏢 Warehouse changed to: ${selectedWarehouse.value}`);
        
        // Calculate dashboard stats for selected warehouse
        await loadDashboardStats(selectedWarehouse.value);
        
        // If viewing all warehouses, load stats for each
        if (selectedWarehouse.value === 'all') {
          await loadWarehouseStats();
        }
        
      } catch (error) {
        console.error('Error changing warehouse:', error);
      } finally {
        loading.value = false;
      }
    };

    // ========== LIFECYCLE HOOKS ==========
    
    onMounted(async () => {
      console.log('🚀 Dashboard mounted');
      
      // Start time update
      updateTime();
      const timeInterval = setInterval(updateTime, 60000);
      
      try {
        await loadDashboardData();
        await loadWarehouseStats();
      } catch (error) {
        console.error('❌ Error in dashboard mounted:', error);
        loadError.value = error.message || 'حدث خطأ في تحميل البيانات';
        initialLoading.value = false;
      }
      
      onUnmounted(() => {
        clearInterval(timeInterval);
      });
    });

    // ========== WATCHERS ==========
    
    watch(selectedWarehouse, async (newValue) => {
      if (!loading.value && !initialLoading.value) {
        console.log('🏢 Warehouse filter changed to:', newValue);
        await loadDashboardStats(newValue);
        
        if (newValue === 'all') {
          await loadWarehouseStats();
        }
      }
    });

    // ========== RETURN ==========
    
    return {
      // State
      loading,
      initialLoading,
      statsLoading,
      warehouseStatsLoading,
      recentItemsLoading,
      recentTransactionsLoading,
      loadError,
      selectedWarehouse,
      currentTime,
      currentDate,
      lastUpdated,
      
      // Stats
      dashboardStats,
      allWarehouseStats,
      warehouseStatsCache,
      
      // Computed
      userRole,
      userName,
      userProfile,
      accessibleWarehouses,
      canModifyItems,
      recentItems,
      recentItemsCount,
      recentItemsStatusClass,
      recentTransactions,
      todayTransactionsCount,
      todayAddCount,
      todayTransferCount,
      todayDispatchCount,
      lastTransactionTime,
      lastActivityTime,
      totalCartons,
      totalSingles,
      estimatedValue,
      avgQuantityPerItem,
      warehousePercentage,
      lowQuantityPercentage,
      outOfStockPercentage,
      healthyItemsPercentage,
      performanceScore,
      
      // Helper methods
      formatEnglishNumber,
      formatDetailedTime,
      formatRelativeTime,
      getWarehouseLabel,
      getTransactionTypeLabel,
      getQuantityClass,
      getQuantityStatusClass,
      getHealthColorClass,
      getHealthIconClass,
      getHealthTextClass,
      getPerformanceLabel,
      calculateTotalQuantity,
      handleImageError,
      warehouseLowQuantityPercentage,
      warehouseOutOfStockPercentage,
      
      // Modal functions
      openItemModal,
      openTransactionModal,
      
      // Actions
      refreshDashboard,
      handleWarehouseChange
    };
  }
};
</script>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Card hover effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.dark .hover-lift:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #374151;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Status indicators */
.status-dot {
  position: relative;
}

.status-dot::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
}

.dark .status-dot::after {
  border-color: #1f2937;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease;
}

/* Enhanced cursor pointer */
.cursor-pointer {
  cursor: pointer;
}

/* Disabled state */
.disabled\:opacity-50:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Lazy image loading */
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.loaded {
  opacity: 1;
}

/* Optimized loading states */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Full width layout */
.w-full {
  width: 100%;
}

/* Edge rounded blue cards */
.bg-gradient-to-br.from-blue-500.to-blue-600 {
  border-radius: 16px;
}

/* Full desktop view */
.min-h-screen {
  min-height: 100vh;
}

/* Remove max-width constraints for full width */
.max-w-7xl {
  max-width: none;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .text-3xl {
    font-size: 1.75rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .p-6 {
    padding: 1rem;
  }
  
  .gap-6 {
    gap: 1rem;
  }
  
  .mb-8 {
    margin-bottom: 1.5rem;
  }
}

/* Responsive table adjustments */
@media (max-width: 640px) {
  table {
    font-size: 0.75rem;
  }
  
  th, td {
    padding: 0.5rem 0.25rem;
  }
}
</style>

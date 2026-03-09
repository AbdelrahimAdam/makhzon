<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Mobile Header with Collapsible Controls -->
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo and Title -->
          <div class="flex items-center space-x-2 space-x-reverse">
            <router-link to="/" class="flex items-center space-x-2 space-x-reverse hover:opacity-80 transition-opacity">
              <div class="h-10 w-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span class="text-white font-bold text-lg">م</span>
              </div>
              <div class="hidden sm:block">
                <h1 class="text-lg font-bold text-gray-900 dark:text-white">لوحة التقارير والإحصائيات</h1>
                <p class="text-xs text-gray-500 dark:text-gray-400">نظام إدارة المخزون الذكي</p>
              </div>
            </router-link>
          </div>

          <!-- Desktop Actions -->
          <div class="hidden sm:flex items-center gap-3 space-x-reverse">
            <div class="relative">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <select 
                v-model="reportPeriod"
                @change="changePeriod"
                class="w-full sm:w-48 pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month" selected>هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذه السنة</option>
                <option value="custom">فترة مخصصة</option>
              </select>
            </div>

            <button 
              @click="exportToExcel"
              class="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5"
            >
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              تصدير إلى Excel
            </button>

            <button 
              @click="resetFilters"
              class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              إعادة الضبط
            </button>
          </div>

          <!-- Mobile Actions -->
          <div class="flex sm:hidden items-center gap-2">
            <!-- Mobile Toggle Button for Filters -->
            <button 
              @click="showMobileFilters = !showMobileFilters"
              class="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="showMobileFilters" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Export Button (Mobile) -->
            <button 
              @click="exportToExcel"
              class="inline-flex items-center justify-center p-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
              title="تصدير Excel"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Filters Panel -->
        <div v-if="showMobileFilters" class="sm:hidden pb-4 border-t border-gray-200 dark:border-gray-700">
          <div class="space-y-3 pt-4">
            <!-- Quick Actions -->
            <div class="grid grid-cols-2 gap-2">
              <select 
                v-model="reportPeriod"
                @change="changePeriod"
                class="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month" selected>هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذه السنة</option>
                <option value="custom">فترة مخصصة</option>
              </select>

              <button 
                @click="toggleFullscreen"
                class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
              >
                <span class="flex items-center justify-center">
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                  </svg>
                  ملء الشاشة
                </span>
              </button>

              <button 
                @click="resetFilters"
                class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
              >
                <span class="flex items-center justify-center">
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  إعادة ضبط
                </span>
              </button>
            </div>

            <!-- Mobile Search -->
            <div class="relative">
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="بحث سريع..."
                class="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <svg class="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <!-- Live Search Indicator -->
              <div v-if="isLiveSearching" class="absolute inset-y-0 left-0 pl-3 flex items-center">
                <div class="w-4 h-4 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <!-- Desktop Filters -->
      <div class="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">فلاتر التقرير</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">قم بتخصيص التقرير حسب المخزن أو الصنف أو التاريخ</p>
          </div>

          <!-- Active Filters Badges -->
          <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
            <span v-if="selectedWarehouse && selectedWarehouse !== ''" class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {{ getWarehouseLabel(selectedWarehouse) }}
              <button @click="selectedWarehouse = ''" class="mr-1 hover:text-blue-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>

            <span v-if="selectedItem && selectedItem !== ''" class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
              {{ selectedItemText }}
              <button @click="selectedItem = ''" class="mr-1 hover:text-purple-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>

            <span v-if="selectedItemType && selectedItemType !== ''" class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
              {{ getItemTypeLabel(selectedItemType) }}
              <button @click="selectedItemType = ''" class="mr-1 hover:text-yellow-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Warehouse Filter -->
          <div class="relative">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span class="inline-flex items-center">
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                المخزن
              </span>
            </label>
            <select 
              v-model="selectedWarehouse"
              @change="applyFilters"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all duration-200"
            >
              <option value="">جميع المخازن</option>
              <option v-for="warehouse in accessibleWarehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name_ar }}
              </option>
            </select>
          </div>

          <!-- Item Filter -->
          <div class="relative">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span class="inline-flex items-center">
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                الصنف
              </span>
            </label>
            <div class="relative">
              <select 
                v-model="selectedItem"
                @change="applyFilters"
                class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all duration-200"
              >
                <option value="">جميع الأصناف</option>
                <optgroup v-if="selectedWarehouse && selectedWarehouse !== ''" label="أصناف المخزن المحدد">
                  <option v-for="item in filteredItemsByWarehouse" :key="item.id" :value="item.id">
                    {{ item.name }} ({{ item.code }})
                  </option>
                </optgroup>
                <optgroup label="جميع الأصناف">
                  <option v-for="item in allUniqueItems" :key="item.id" :value="item.id">
                    {{ item.name }} ({{ item.code }})
                  </option>
                </optgroup>
              </select>
              <div class="absolute left-3 top-3">
                <svg v-if="selectedItem && selectedItem !== ''" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Item Type Filter -->
          <div class="relative">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span class="inline-flex items-center">
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                نوع الصنف
              </span>
            </label>
            <select 
              v-model="selectedItemType"
              @change="applyFilters"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all duration-200"
            >
              <option value="">جميع الأنواع</option>
              <option value="low_stock">قليلة المخزون (&lt; 10)</option>
              <option value="out_of_stock">منتهية المخزون</option>
              <option value="high_value">عالية القيمة</option>
              <option value="recently_added">مضافة مؤخراً</option>
              <option value="fast_moving">سريعة الحركة</option>
              <option value="slow_moving">بطيئة الحركة</option>
            </select>
          </div>

          <!-- Search -->
          <div class="relative">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span class="inline-flex items-center">
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                بحث متقدم
              </span>
            </label>
            <div class="relative">
              <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                placeholder="ابحث عن صنف، كود، لون، مورد..."
                class="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm transition-all duration-200"
              />
              <svg class="absolute right-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <!-- Live Search Indicator -->
              <div v-if="isLiveSearching" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div class="w-4 h-4 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Date Range -->
        <div v-if="reportPeriod === 'custom'" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">تحديد الفترة المخصصة</h3>
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">من:</label>
                <input 
                  type="date" 
                  v-model="customDateFrom"
                  class="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">إلى:</label>
                <input 
                  type="date" 
                  v-model="customDateTo"
                  class="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
              </div>
              <button 
                @click="applyCustomDate"
                class="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                تطبيق الفترة
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards - Mobile Optimized -->
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <!-- Total Items -->
        <div 
          @click="activeMobileTab = 'inventory'"
          class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-3 sm:p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center ml-2 sm:ml-4 shadow-lg">
              <svg class="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">إجمالي الأصناف</p>
              <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(dashboardStats.totalItems) }}</p>
              <p class="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-2">{{ summary.uniqueItems }} صنف فريد</p>
            </div>
          </div>
          <div class="sm:mt-4 sm:pt-4 sm:border-t sm:border-gray-100 sm:dark:border-gray-700">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500 dark:text-gray-400">في المخزن المحدد</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ filteredInventory.length }}</span>
            </div>
          </div>
        </div>

        <!-- Total Transactions -->
        <div 
          @click="activeMobileTab = 'transactions'"
          class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-3 sm:p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center ml-2 sm:ml-4 shadow-lg">
              <svg class="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">إجمالي الحركات</p>
              <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(dashboardStats.recentTransactions) }}</p>
              <div class="hidden sm:flex items-center gap-2 mt-2">
                <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg">
                  +{{ dashboardStats.addTransactions }}
                </span>
                <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg">
                  ↔{{ dashboardStats.transferTransactions }}
                </span>
                <span class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
                  →{{ dashboardStats.dispatchTransactions }}
                </span>
              </div>
            </div>
          </div>
          <div class="sm:mt-4 sm:pt-4 sm:border-t sm:border-gray-100 sm:dark:border-gray-700">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              في الفترة: {{ getPeriodLabel() }}
            </div>
          </div>
        </div>

        <!-- Total Value -->
        <div class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-3 sm:p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <div class="flex items-center">
            <div class="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center ml-2 sm:ml-4 shadow-lg">
              <svg class="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">القيمة الإجمالية</p>
              <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(dashboardStats.estimatedValue).split(' ')[0] }}</p>
              <p class="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-2">{{ formatNumber(dashboardStats.totalQuantity) }} وحدة</p>
            </div>
          </div>
          <div class="sm:mt-4 sm:pt-4 sm:border-t sm:border-gray-100 sm:dark:border-gray-700">
            <div class="text-xs">
              <span class="text-gray-500 dark:text-gray-400">متوسط السعر:</span>
              <span class="font-semibold text-purple-600 dark:text-purple-400 mr-1">
                {{ formatCurrency(summary.averagePrice).split(' ')[0] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Low Stock Items -->
        <div 
          @click="selectedItemType = 'low_stock'; activeMobileTab = 'inventory'"
          class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-3 sm:p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center">
            <div class="h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center ml-2 sm:ml-4 shadow-lg">
              <svg class="h-5 w-5 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">أصناف قليلة</p>
              <p class="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{{ formatNumber(dashboardStats.lowStockItems) }}</p>
              <p class="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-2">{{ dashboardStats.outOfStockItems }} منتهية</p>
            </div>
          </div>
          <div class="sm:mt-4 sm:pt-4 sm:border-t sm:border-gray-100 sm:dark:border-gray-700">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500 dark:text-gray-400">نسبة المخزون المنخفض</span>
              <span class="font-semibold text-red-600 dark:text-red-400">
                {{ summary.lowStockPercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Tabs -->
      <div class="sm:hidden flex space-x-2 space-x-reverse mb-4 overflow-x-auto pb-2">
        <button
          v-for="tab in mobileTabs"
          :key="tab.id"
          @click="activeMobileTab = tab.id"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            activeMobileTab === tab.id
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Mobile Tab Content -->
      <div class="sm:hidden">
        <!-- Charts Tab -->
        <div v-if="activeMobileTab === 'charts'" class="space-y-4">
          <!-- Warehouse Distribution Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">توزيع المخزون</h3>
              <select 
                v-model="distributionType"
                @change="updateCharts"
                class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="quantity">الكمية</option>
                <option value="value">القيمة</option>
              </select>
            </div>
            <div class="h-64">
              <canvas ref="mobileWarehouseChart"></canvas>
            </div>
          </div>

          <!-- Transactions Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">الحركات حسب النوع</h3>
            <div class="h-48">
              <canvas ref="mobileTransactionsChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Inventory Tab -->
        <div v-if="activeMobileTab === 'inventory'" class="space-y-4">
          <!-- Summary Card -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-900 dark:text-blue-300">المخزون المفلتر</p>
                <p class="text-xs text-blue-700 dark:text-blue-400">{{ filteredInventory.length }} صنف</p>
              </div>
              <button 
                @click="showInventoryFilters = !showInventoryFilters"
                class="text-blue-600 dark:text-blue-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Inventory Filters (Collapsible) -->
          <div v-if="showInventoryFilters" class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <!-- Warehouse Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">المخزن</label>
              <select 
                v-model="selectedWarehouse"
                @change="applyFilters"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">جميع المخازن</option>
                <option v-for="warehouse in accessibleWarehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name_ar }}
                </option>
              </select>
            </div>

            <!-- Item Type Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الصنف</label>
              <select 
                v-model="selectedItemType"
                @change="applyFilters"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">جميع الأنواع</option>
                <option value="low_stock">قليلة المخزون</option>
                <option value="out_of_stock">منتهية</option>
                <option value="recently_added">مضافة حديثاً</option>
              </select>
            </div>
          </div>

          <!-- Inventory Items List -->
          <div class="space-y-3">
            <div 
              v-for="item in mobileInventoryItems"
              :key="item.id"
              class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ item.name }}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.code }} - {{ item.color }}</p>
                </div>
                <span :class="[
                  'px-2 py-1 rounded-lg text-xs font-medium',
                  getQuantityClass(item.remaining_quantity)
                ]">
                  {{ formatNumber(item.remaining_quantity) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{{ getWarehouseLabel(item.warehouse_id) }}</span>
                <span class="font-semibold">{{ formatCurrency(item.remaining_quantity * 50) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Tab -->
        <div v-if="activeMobileTab === 'transactions'" class="space-y-3">
          <div 
            v-for="transaction in mobileTransactions"
            :key="transaction.id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex items-start">
              <div :class="[
                'h-10 w-10 rounded-lg flex items-center justify-center mr-3',
                transaction.type === 'ADD' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' :
                transaction.type === 'TRANSFER' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' :
                'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
              ]">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="transaction.type === 'ADD'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  <path v-if="transaction.type === 'TRANSFER'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  <path v-if="transaction.type === 'DISPATCH'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ transaction.item_name }}</h4>
                  <span class="text-sm font-medium" 
                        :class="transaction.type === 'ADD' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'">
                    {{ transaction.type === 'ADD' ? '+' : '' }}{{ formatNumber(transaction.total_delta) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    <span>{{ formatTime(transaction.timestamp) }}</span>
                    <span>•</span>
                    <span>{{ getWarehouseLabel(transaction.from_warehouse) || getWarehouseLabel(transaction.to_warehouse) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Content (Hidden on Mobile) -->
      <div class="hidden sm:block">
        <!-- Dashboard Header with Active Filter Info -->
        <div v-if="hasActiveFilters" class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-bold text-blue-900 dark:text-blue-300">
                <span v-if="selectedWarehouse && selectedWarehouse !== '' && selectedItem && selectedItem !== ''">
                  تقرير المخزن: {{ getWarehouseLabel(selectedWarehouse) }} - الصنف: {{ selectedItemText }}
                </span>
                <span v-else-if="selectedWarehouse && selectedWarehouse !== ''">
                  تقرير المخزن: {{ getWarehouseLabel(selectedWarehouse) }}
                </span>
                <span v-else-if="selectedItem && selectedItem !== ''">
                  تقرير الصنف: {{ selectedItemText }}
                </span>
              </h3>
              <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
                عرض البيانات المفلترة حسب التحديدات الحالية
                <span v-if="filteredInventory.length > 0" class="font-bold">
                  • {{ filteredInventory.length }} صنف
                </span>
              </p>
            </div>
            <div class="mt-3 md:mt-0">
              <button @click="resetFilters" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                إلغاء التصفية
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Charts Section -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <!-- Warehouse Distribution Chart -->
          <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">توزيع المخزون حسب المخازن</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">توزيع الكمية والقيمة عبر المخازن المختلفة</p>
              </div>
              <select 
                v-model="distributionType"
                @change="updateWarehouseChart"
                class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="quantity">حسب الكمية</option>
                <option value="value">حسب القيمة</option>
                <option value="items">حسب عدد الأصناف</option>
              </select>
            </div>

            <div class="h-72">
              <canvas ref="warehouseChart"></canvas>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="warehouse in warehouseDistribution.slice(0, 4)" :key="warehouse.id" 
                   class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ warehouse.name }}</span>
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {{ formatNumber(warehouse.value) }}
                    <span v-if="distributionType === 'value'">ج.م</span>
                    <span v-else-if="distributionType === 'quantity'">وحدة</span>
                  </span>
                </div>
                <div class="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    :style="{ width: warehouse.percentage + '%' }"
                    class="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  ></div>
                </div>
                <div class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ warehouse.itemsCount }} صنف</span>
                  <span>{{ warehouse.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Transactions by Type Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">الحركات حسب النوع</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">توزيع الحركات حسب نوع العملية</p>
              </div>
              <select 
                v-model="transactionsPeriod"
                @change="updateTransactionsChart"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month" selected>هذا الشهر</option>
              </select>
            </div>

            <div class="h-72">
              <canvas ref="transactionsChart"></canvas>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(dashboardStats.addTransactions) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">إضافة</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ formatNumber(dashboardStats.transferTransactions) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">نقل</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatNumber(dashboardStats.dispatchTransactions) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">صرف</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Data Tables -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <!-- Top Items Table -->
          <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">أعلى الأصناف قيمة</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">الأصناف الأعلى قيمة في المخزون</p>
              </div>
              <select 
                v-model="topItemsFilter"
                @change="updateTopItems"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="value">حسب القيمة</option>
                <option value="quantity">حسب الكمية</option>
                <option value="turnover">حسب معدل الدوران</option>
              </select>
            </div>

            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div class="overflow-x-auto" style="max-height: 500px;">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الترتيب</th>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الصنف</th>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">المخزن</th>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الكمية</th>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">القيمة</th>
                      <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="(item, index) in topItemsByValue.slice(0, 8)" :key="item.id" 
                        class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                          {{ index + 1 }}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.code }} - {{ item.color }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ getWarehouseLabel(item.warehouse_id) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              :class="getQuantityClass(item.remaining_quantity)">
                          {{ formatNumber(item.remaining_quantity) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-600 dark:text-yellow-400">
                        {{ formatCurrency(item.value) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                              :class="getStatusClass(item.remaining_quantity)">
                          {{ getStatusText(item.remaining_quantity) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">آخر الحركات</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">أحدث 10 حركات في النظام</p>
              </div>
              <span class="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                {{ formatNumber(recentFilteredTransactions.length) }} حركة
              </span>
            </div>

            <div class="space-y-4 overflow-y-auto" style="max-height: 500px;">
              <div v-for="transaction in recentFilteredTransactions.slice(0, 10)" :key="transaction.id" 
                   class="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-sm">
                <div :class="[
                  'h-12 w-12 rounded-xl flex items-center justify-center shadow-sm',
                  transaction.type === 'ADD' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' :
                  transaction.type === 'TRANSFER' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' :
                  'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                ]">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="transaction.type === 'ADD'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    <path v-if="transaction.type === 'TRANSFER'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    <path v-if="transaction.type === 'DISPATCH'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </div>
                <div class="mr-4 flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">{{ transaction.item_name }}</h4>
                    <span class="text-sm font-bold" 
                          :class="transaction.type === 'ADD' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'">
                      {{ transaction.type === 'ADD' ? '+' : '' }}{{ formatNumber(transaction.total_delta) }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                    <span v-if="transaction.from_warehouse" class="inline-flex items-center">
                      <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                      {{ getWarehouseLabel(transaction.from_warehouse) }}
                    </span>
                    <span v-if="transaction.to_warehouse" class="inline-flex items-center">
                      <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                      {{ getWarehouseLabel(transaction.to_warehouse) }}
                    </span>
                    <span class="inline-flex items-center">
                      <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ formatTime(transaction.timestamp) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Trends Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">الاتجاهات الشهرية</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">تحليل أداء المخزون خلال آخر 6 أشهر</p>
            </div>
            <div class="flex items-center gap-3">
              <select 
                v-model="trendType"
                @change="updateMonthlyTrendsChart"
                class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="transactions">الحركات</option>
                <option value="quantity">الكميات</option>
                <option value="value">القيمة</option>
              </select>
            </div>
          </div>

          <div class="h-80">
            <canvas ref="trendsChart"></canvas>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">متوسط الشهر الحالي</div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ formatNumber(monthlyStats.currentAverage) }}</div>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">نسبة التغيير</div>
              <div class="text-2xl font-bold" 
                   :class="monthlyStats.changePercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ monthlyStats.changePercentage >= 0 ? '+' : '' }}{{ monthlyStats.changePercentage }}%
              </div>
            </div>
            <div class="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الفترة</div>
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ formatNumber(monthlyStats.total) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Flow Analysis Section -->
      <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">تحليل التدفق النقدي</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">تحليل إيرادات ومصروفات المخزون</p>
          </div>
          <span class="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
            {{ getPeriodLabel() }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">الإيرادات</h4>
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(cashFlowAnalysis.cashIn) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">من حركات الصرف</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">المصروفات</h4>
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formatCurrency(cashFlowAnalysis.cashOut) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">من حركات الإضافة</p>
          </div>

          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4 shadow border border-blue-200 dark:border-blue-800">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">صافي التدفق النقدي</h4>
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <p :class="[
              'text-2xl font-bold',
              cashFlowAnalysis.netCashFlow >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            ]">
              {{ formatCurrency(cashFlowAnalysis.netCashFlow) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              معدل الدوران: {{ (cashFlowAnalysis.turnoverRate * 100).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>

      <!-- View Mode Toggle for Mobile -->
      <div class="fixed bottom-6 left-6 right-6 sm:hidden z-40">
        <div class="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center justify-center">
          <button
            @click="toggleViewMode"
            class="flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium"
          >
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="viewMode === 'detailed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            {{ viewMode === 'detailed' ? 'عرض مبسط' : 'عرض مفصل' }}
          </button>
        </div>
      </div>
    </main>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl mx-4">
        <div class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-yellow-600 mb-4"></div>
        <p class="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">جاري تحميل البيانات...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { useStore } from 'vuex';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';

// Register Chart.js components
Chart.register(...registerables);

export default {
  name: 'Reports',
  setup() {
    const store = useStore();
    
    // Mobile state management
    const showMobileFilters = ref(false);
    const activeMobileTab = ref('charts');
    const showInventoryFilters = ref(false);
    const viewMode = ref('detailed');
    const isFullscreen = ref(false);
    
    // Mobile tabs configuration
    const mobileTabs = ref([
      { id: 'charts', label: 'الرسوم' },
      { id: 'inventory', label: 'المخزون' },
      { id: 'transactions', label: 'الحركات' }
    ]);
    
    // Original refs
    const loading = ref(false);
    const reportPeriod = ref('month');
    const distributionType = ref('quantity');
    const transactionsPeriod = ref('month');
    const trendType = ref('transactions');
    const selectedWarehouse = ref('');
    const selectedItem = ref('');
    const selectedItemType = ref('');
    const searchQuery = ref('');
    const customDateFrom = ref('');
    const customDateTo = ref('');
    const topItemsFilter = ref('value');
    
    // Chart refs
    const warehouseChart = ref(null);
    const transactionsChart = ref(null);
    const trendsChart = ref(null);
    const mobileWarehouseChart = ref(null);
    const mobileTransactionsChart = ref(null);
    
    // Chart instances
    let warehouseChartInstance = null;
    let transactionsChartInstance = null;
    let trendsChartInstance = null;
    let mobileWarehouseChartInstance = null;
    let mobileTransactionsChartInstance = null;
    
    // Live search state
    const isLiveSearching = ref(false);
    const liveSearchResults = reactive([]);
    const liveSearchTimeout = ref(null);
    
    // Computed properties from store
    const accessibleWarehouses = computed(() => store.getters.accessibleWarehouses || []);
    const allInventory = computed(() => store.state.inventory || []);
    const allTransactions = computed(() => store.state.transactions || []);
    const recentTransactions = computed(() => store.state.recentTransactions || []);
    const dashboardStats = computed(() => {
      const stats = store.getters.dashboardStats || {
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        estimatedValue: 0,
        recentTransactions: 0,
        addTransactions: 0,
        transferTransactions: 0,
        dispatchTransactions: 0
      };
      
      // Format numbers with k, m notation
      return {
        totalItems: stats.totalItems >= 1000 ? (stats.totalItems/1000).toFixed(1) + 'k' : stats.totalItems,
        totalQuantity: stats.totalQuantity >= 1000 ? (stats.totalQuantity/1000).toFixed(1) + 'k' : stats.totalQuantity,
        lowStockItems: stats.lowStockItems >= 1000 ? (stats.lowStockItems/1000).toFixed(1) + 'k' : stats.lowStockItems,
        outOfStockItems: stats.outOfStockItems >= 1000 ? (stats.outOfStockItems/1000).toFixed(1) + 'k' : stats.outOfStockItems,
        estimatedValue: stats.estimatedValue,
        recentTransactions: stats.recentTransactions >= 1000 ? (stats.recentTransactions/1000).toFixed(1) + 'k' : stats.recentTransactions,
        addTransactions: stats.addTransactions >= 1000 ? (stats.addTransactions/1000).toFixed(1) + 'k' : stats.addTransactions,
        transferTransactions: stats.transferTransactions >= 1000 ? (stats.transferTransactions/1000).toFixed(1) + 'k' : stats.transferTransactions,
        dispatchTransactions: stats.dispatchTransactions >= 1000 ? (stats.dispatchTransactions/1000).toFixed(1) + 'k' : stats.dispatchTransactions
      };
    });
    
    // Combined inventory (local + live search results)
    const combinedInventory = computed(() => {
      const combined = [...allInventory.value];
      
      // Add live search results that aren't already in local inventory
      liveSearchResults.forEach(liveItem => {
        if (!combined.some(item => item.id === liveItem.id)) {
          // Mark as live search result for styling
          combined.push({
            ...liveItem,
            isLiveSearchResult: true
          });
        }
      });
      
      return combined;
    });
    
    // Mobile computed properties
    const mobileInventoryItems = computed(() => {
      return filteredInventory.value.slice(0, 10).map(item => ({
        ...item,
        value: (item.remaining_quantity || 0) * 50
      }));
    });
    
    const mobileTransactions = computed(() => {
      return recentFilteredTransactions.value.slice(0, 10);
    });
    
    // All unique items for dropdown
    const allUniqueItems = computed(() => {
      const itemsMap = new Map();
      (combinedInventory.value || []).forEach(item => {
        if (item && item.id && !itemsMap.has(item.id)) {
          itemsMap.set(item.id, {
            id: item.id,
            name: item.name || '',
            code: item.code || '',
            warehouse_id: item.warehouse_id || ''
          });
        }
      });
      return Array.from(itemsMap.values());
    });
    
    // Items filtered by selected warehouse
    const filteredItemsByWarehouse = computed(() => {
      if (!selectedWarehouse.value) return [];
      return (allUniqueItems.value || []).filter(item => item.warehouse_id === selectedWarehouse.value);
    });
    
    // Selected item text for display
    const selectedItemText = computed(() => {
      if (!selectedItem.value) return '';
      const item = (allUniqueItems.value || []).find(i => i.id === selectedItem.value);
      return item ? `${item.name} (${item.code})` : '';
    });
    
    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return selectedWarehouse.value || selectedItem.value || selectedItemType.value || searchQuery.value;
    });
    
    // Filtered inventory based on selected filters
    const filteredInventory = computed(() => {
      let inventory = combinedInventory.value || [];
      
      // Filter by warehouse
      if (selectedWarehouse.value) {
        inventory = inventory.filter(item => item.warehouse_id === selectedWarehouse.value);
      }
      
      // Filter by specific item
      if (selectedItem.value) {
        inventory = inventory.filter(item => item.id === selectedItem.value);
      }
      
      // Filter by item type
      if (selectedItemType.value) {
        switch (selectedItemType.value) {
          case 'low_stock':
            inventory = inventory.filter(item => (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0);
            break;
          case 'out_of_stock':
            inventory = inventory.filter(item => (item.remaining_quantity || 0) === 0);
            break;
          case 'high_value':
            inventory = inventory.filter(item => ((item.remaining_quantity || 0) * 50) > 1000);
            break;
          case 'recently_added':
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            inventory = inventory.filter(item => {
              const itemDate = new Date(item.created_at || item.updated_at || Date.now());
              return itemDate > oneWeekAgo;
            });
            break;
          case 'fast_moving':
            inventory = inventory.filter(item => (item.remaining_quantity || 0) < 20);
            break;
          case 'slow_moving':
            inventory = inventory.filter(item => (item.remaining_quantity || 0) > 100);
            break;
        }
      }
      
      // Filter by search query
      if (searchQuery.value) {
        const searchLower = searchQuery.value.toLowerCase();
        inventory = inventory.filter(item =>
          (item.name?.toLowerCase() || '').includes(searchLower) ||
          (item.code?.toLowerCase() || '').includes(searchLower) ||
          (item.color?.toLowerCase() || '').includes(searchLower) ||
          (item.supplier?.toLowerCase() || '').includes(searchLower)
        );
      }
      
      return inventory;
    });
    
    // Filtered transactions with item filtering
    const filteredTransactions = computed(() => {
      let transactions = allTransactions.value || [];
      
      // Filter by warehouse if selected
      if (selectedWarehouse.value) {
        transactions = transactions.filter(t => 
          t.from_warehouse === selectedWarehouse.value || 
          t.to_warehouse === selectedWarehouse.value ||
          t.warehouse_id === selectedWarehouse.value
        );
      }
      
      // Filter by specific item if selected
      if (selectedItem.value) {
        const item = (combinedInventory.value || []).find(i => i.id === selectedItem.value);
        if (item) {
          transactions = transactions.filter(t => 
            t.item_name === item.name || 
            t.item_code === item.code
          );
        }
      }
      
      // Filter by date period
      const now = new Date();
      let startDate;
      
      switch (reportPeriod.value) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (customDateFrom.value && customDateTo.value) {
            startDate = new Date(customDateFrom.value);
            const endDate = new Date(customDateTo.value);
            return transactions.filter(t => {
              if (!t.timestamp) return false;
              try {
                const transDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
                return transDate >= startDate && transDate <= endDate;
              } catch (error) {
                return false;
              }
            });
          }
          break;
      }
      
      if (startDate) {
        return transactions.filter(t => {
          if (!t.timestamp) return false;
          try {
            const transDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
            return transDate >= startDate;
          } catch (error) {
            return false;
          }
        });
      }
      
      return transactions;
    });
    
    // Recent filtered transactions
    const recentFilteredTransactions = computed(() => {
      return (filteredTransactions.value || [])
        .sort((a, b) => {
          try {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || Date.now());
            return dateB - dateA;
          } catch (error) {
            return 0;
          }
        })
        .slice(0, 20);
    });
    
    // Summary statistics
    const summary = computed(() => {
      const inventory = filteredInventory.value || [];
      const transactions = filteredTransactions.value || [];
      
      // Calculate unique items
      const uniqueItemsMap = new Map();
      inventory.forEach(item => {
        if (item) {
          const key = `${item.name || ''}_${item.code || ''}_${item.color || ''}_${item.warehouse_id || ''}`;
          if (!uniqueItemsMap.has(key)) {
            uniqueItemsMap.set(key, item);
          }
        }
      });
      
      // Calculate total value and quantity
      const totalQuantity = inventory.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
      const totalValue = inventory.reduce((sum, item) => {
        const quantity = item.remaining_quantity || 0;
        const price = 50; // Default price
        return sum + (quantity * price);
      }, 0);
      
      // Calculate transactions by type
      const addTransactions = transactions.filter(t => t.type === 'ADD').length;
      const transferTransactions = transactions.filter(t => t.type === 'TRANSFER').length;
      const dispatchTransactions = transactions.filter(t => t.type === 'DISPATCH').length;
      
      // Calculate low stock items
      const lowStockItems = inventory.filter(item => (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0).length;
      const outOfStockItems = inventory.filter(item => (item.remaining_quantity || 0) === 0).length;
      const lowStockPercentage = inventory.length > 0 ? Math.round((lowStockItems / inventory.length) * 100) : 0;
      const averagePrice = totalQuantity > 0 ? Math.round(totalValue / totalQuantity) : 0;
      
      return {
        totalItems: inventory.length,
        uniqueItems: uniqueItemsMap.size,
        totalTransactions: transactions.length,
        addTransactions,
        transferTransactions,
        dispatchTransactions,
        totalValue,
        totalQuantity,
        lowStockItems,
        outOfStockItems,
        lowStockPercentage,
        averagePrice
      };
    });
    
    // Cash flow analysis
    const cashFlowAnalysis = computed(() => {
      const transactions = filteredTransactions.value || [];
      
      const cashIn = transactions
        .filter(t => t.type === 'DISPATCH')
        .reduce((sum, t) => sum + (Math.abs(t.total_delta || 0) * 50), 0);
      
      const cashOut = transactions
        .filter(t => t.type === 'ADD')
        .reduce((sum, t) => sum + (Math.abs(t.total_delta || 0) * 50), 0);
      
      const netCashFlow = cashIn - cashOut;
      const turnoverRate = dashboardStats.value.estimatedValue > 0 
        ? cashIn / dashboardStats.value.estimatedValue 
        : 0;
      
      return {
        cashIn,
        cashOut,
        netCashFlow,
        turnoverRate
      };
    });
    
    // Top items by value with filtering
    const topItemsByValue = computed(() => {
      let items = filteredInventory.value || [];
      
      // Apply sorting based on filter
      if (topItemsFilter.value === 'quantity') {
        items = items.sort((a, b) => (b.remaining_quantity || 0) - (a.remaining_quantity || 0));
      } else if (topItemsFilter.value === 'turnover') {
        items = items.map(item => ({
          ...item,
          turnoverRate: (item.remaining_quantity || 0) / ((item.total_added || 0) + 1)
        })).sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0));
      } else {
        // Default: sort by value
        items = items.sort((a, b) => {
          const valueA = (a.remaining_quantity || 0) * 50;
          const valueB = (b.remaining_quantity || 0) * 50;
          return valueB - valueA;
        });
      }
      
      return items.slice(0, 10).map(item => ({
        ...item,
        value: (item.remaining_quantity || 0) * 50
      }));
    });
    
    // Warehouse distribution
    const warehouseDistribution = computed(() => {
      const inventory = filteredInventory.value || [];
      const warehouses = (accessibleWarehouses.value || []).filter(w => w && w.type === 'primary');
      
      const distribution = warehouses.map(warehouse => {
        const items = inventory.filter(item => item && item.warehouse_id === warehouse.id);
        let value = 0;
        
        if (distributionType.value === 'quantity') {
          value = items.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
        } else if (distributionType.value === 'value') {
          value = items.reduce((sum, item) => {
            return sum + ((item.remaining_quantity || 0) * 50);
          }, 0);
        } else {
          value = items.length;
        }
        
        return {
          id: warehouse.id,
          name: warehouse.name_ar || warehouse.name_en || 'غير معروف',
          value: value,
          itemsCount: items.length
        };
      }).filter(item => item.value > 0);
      
      // Calculate percentages
      const total = distribution.reduce((sum, item) => sum + item.value, 0);
      distribution.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      });
      
      return distribution.sort((a, b) => b.value - a.value);
    });
    
    // Monthly trends data
    const monthlyStats = computed(() => {
      const transactions = filteredTransactions.value || [];
      const inventory = filteredInventory.value || [];
      
      // Generate last 6 months data
      const months = [];
      const data = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('ar-EG', { month: 'long' });
        months.push(monthName);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthTransactions = transactions.filter(t => {
          if (!t.timestamp) return false;
          try {
            const transDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
            return transDate >= startOfMonth && transDate <= endOfMonth;
          } catch (error) {
            return false;
          }
        });
        
        let value = 0;
        if (trendType.value === 'transactions') {
          value = monthTransactions.length;
        } else if (trendType.value === 'quantity') {
          value = monthTransactions.reduce((sum, t) => sum + Math.abs(t.total_delta || 0), 0);
        } else {
          value = monthTransactions.reduce((sum, t) => sum + (Math.abs(t.total_delta || 0) * 50), 0);
        }
        
        data.push(value);
      }
      
      const currentValue = data[data.length - 1] || 0;
      const previousValue = data[data.length - 2] || 0;
      const changePercentage = previousValue > 0 
        ? Math.round(((currentValue - previousValue) / previousValue) * 100)
        : currentValue > 0 ? 100 : 0;
      
      const average = data.length > 0
        ? Math.round(data.reduce((sum, val) => sum + val, 0) / data.length)
        : 0;
      
      const total = data.reduce((sum, val) => sum + val, 0);
      
      return {
        changePercentage,
        currentAverage: currentValue,
        average,
        total,
        monthlyData: data,
        months
      };
    });
    
    // Methods
    const formatNumber = (num) => {
      if (num === undefined || num === null) return '0';
      
      if (typeof num === 'string' && (num.includes('k') || num.includes('m'))) {
        return num;
      }
      
      const n = Number(num);
      if (isNaN(n)) return '0';
      
      if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
      } else if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'k';
      }
      
      return new Intl.NumberFormat('en-US').format(n);
    };
    
    const formatCurrency = (amount) => {
      if (amount === undefined || amount === null) return '0 ج.م';
      
      const n = Number(amount);
      if (isNaN(n)) return '0 ج.م';
      
      if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M ج.م';
      } else if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'k ج.م';
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(n).replace('EGP', 'ج.م');
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) {
          return `منذ ${diffMins} دقيقة`;
        } else if (diffHours < 24) {
          return `منذ ${diffHours} ساعة`;
        } else if (diffDays < 7) {
          return `منذ ${diffDays} يوم`;
        } else {
          return date.toLocaleDateString('ar-EG');
        }
      } catch (error) {
        return '';
      }
    };
    
    const getWarehouseLabel = (warehouseId) => {
      if (!warehouseId) return '';
      return store.getters.getWarehouseLabel(warehouseId) || warehouseId;
    };
    
    const getItemTypeLabel = (type) => {
      const labels = {
        'low_stock': 'قليلة المخزون',
        'out_of_stock': 'منتهية المخزون',
        'high_value': 'عالية القيمة',
        'recently_added': 'مضافة مؤخراً',
        'fast_moving': 'سريعة الحركة',
        'slow_moving': 'بطيئة الحركة'
      };
      return labels[type] || type;
    };
    
    const getPeriodLabel = () => {
      const labels = {
        'today': 'اليوم',
        'week': 'هذا الأسبوع',
        'month': 'هذا الشهر',
        'quarter': 'هذا الربع',
        'year': 'هذه السنة',
        'custom': 'فترة مخصصة'
      };
      return labels[reportPeriod.value] || reportPeriod.value;
    };
    
    const getQuantityClass = (quantity) => {
      if (!quantity || quantity === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      if (quantity < 10) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      if (quantity < 50) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    };
    
    const getStatusClass = (quantity) => {
      if (!quantity || quantity === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      if (quantity < 5) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    };
    
    const getStatusText = (quantity) => {
      if (!quantity || quantity === 0) return 'منتهي';
      if (quantity < 5) return 'حرج';
      return 'جيد';
    };
    
    // Mobile methods
    const toggleViewMode = () => {
      viewMode.value = viewMode.value === 'detailed' ? 'simple' : 'detailed';
    };
    
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        isFullscreen.value = true;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          isFullscreen.value = false;
        }
      }
    };
    
    const resetFilters = () => {
      selectedWarehouse.value = '';
      selectedItem.value = '';
      selectedItemType.value = '';
      searchQuery.value = '';
      reportPeriod.value = 'month';
      liveSearchResults.length = 0; // Clear live search results
      updateCharts();
    };
    
    const changePeriod = () => {
      if (reportPeriod.value === 'custom') {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        
        customDateFrom.value = lastMonth.toISOString().split('T')[0];
        customDateTo.value = today.toISOString().split('T')[0];
      } else {
        updateCharts();
      }
    };
    
    const applyCustomDate = () => {
      if (customDateFrom.value && customDateTo.value) {
        updateCharts();
      }
    };
    
    const applyFilters = () => {
      updateCharts();
    };
    
    // Live search function using SPARK search
    const performLiveSearch = async (searchTermValue) => {
      if (!searchTermValue || searchTermValue.trim().length < 2) {
        liveSearchResults.length = 0;
        isLiveSearching.value = false;
        return;
      }
      
      isLiveSearching.value = true;
      
      try {
        console.log('🔍 Performing live search in reports for:', searchTermValue);
        
        // Use the store action to search Firestore directly (SPARK search)
        const searchResults = await store.dispatch('searchItems', {
          searchTerm: searchTermValue,
          limitResults: 50
        });
        
        console.log('✅ Live search results in reports:', searchResults.length, 'items');
        
        // Update live search results
        liveSearchResults.length = 0;
        searchResults.forEach(item => {
          liveSearchResults.push(item);
        });
        
      } catch (error) {
        console.error('❌ Error in live search:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في البحث عن الأصناف'
        });
      } finally {
        isLiveSearching.value = false;
      }
    };
    
    // Debounced live search
    const debouncedLiveSearch = debounce((term) => {
      performLiveSearch(term);
    }, 500);
    
    // Handle search input with live search
    const handleSearch = () => {
      if (liveSearchTimeout.value) {
        clearTimeout(liveSearchTimeout.value);
      }
      
      liveSearchTimeout.value = setTimeout(() => {
        if (searchQuery.value && searchQuery.value.trim().length >= 2) {
          debouncedLiveSearch(searchQuery.value.trim());
        } else {
          liveSearchResults.length = 0;
          isLiveSearching.value = false;
        }
        applyFilters();
      }, 300);
    };
    
    const updateWarehouseChart = () => {
      createWarehouseChart();
    };
    
    const updateTopItems = () => {
      // Data updates automatically
    };
    
    const updateMonthlyTrendsChart = () => {
      createTrendsChart();
    };
    
    const updateTransactionsChart = () => {
      createTransactionsChart();
    };
    
    // Mobile chart functions
    const createMobileWarehouseChart = () => {
      if (mobileWarehouseChartInstance) {
        mobileWarehouseChartInstance.destroy();
      }
      
      const ctx = mobileWarehouseChart.value?.getContext('2d');
      if (!ctx) return;
      
      const distribution = warehouseDistribution.value;
      if (distribution.length === 0) return;
      
      mobileWarehouseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: distribution.slice(0, 5).map(w => w.name),
          datasets: [{
            data: distribution.slice(0, 5).map(w => w.value),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              rtl: true,
              labels: {
                font: {
                  size: 10,
                  family: 'Cairo'
                },
                padding: 15
              }
            }
          },
          cutout: '60%'
        }
      });
    };
    
    const createMobileTransactionsChart = () => {
      if (mobileTransactionsChartInstance) {
        mobileTransactionsChartInstance.destroy();
      }
      
      const ctx = mobileTransactionsChart.value?.getContext('2d');
      if (!ctx) return;
      
      const transactions = filteredTransactions.value || [];
      const addCount = transactions.filter(t => t.type === 'ADD').length;
      const transferCount = transactions.filter(t => t.type === 'TRANSFER').length;
      const dispatchCount = transactions.filter(t => t.type === 'DISPATCH').length;
      
      mobileTransactionsChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['إضافة', 'نقل', 'صرف'],
          datasets: [{
            data: [addCount, transferCount, dispatchCount],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              rtl: true
            }
          }
        }
      });
    };
    
    // Original chart functions
    const createWarehouseChart = () => {
      if (warehouseChartInstance) {
        warehouseChartInstance.destroy();
      }
      
      const ctx = warehouseChart.value?.getContext('2d');
      if (!ctx) return;
      
      const labels = warehouseDistribution.value.map(w => w.name);
      const data = warehouseDistribution.value.map(w => w.value);
      
      if (labels.length === 0 || data.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('لا توجد بيانات لعرضها', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
      }
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
      
      warehouseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: distributionType.value === 'quantity' ? 'الكمية' : 
                   distributionType.value === 'value' ? 'القيمة (ج.م)' : 'عدد الأصناف',
            data,
            backgroundColor: gradient,
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              rtl: true,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#1f2937',
              bodyColor: '#4b5563',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += formatNumber(context.parsed.y);
                  if (distributionType.value === 'value') {
                    label += ' ج.م';
                  } else if (distributionType.value === 'quantity') {
                    label += ' وحدة';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Cairo, sans-serif'
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return formatNumber(value);
                }
              }
            }
          }
        }
      });
    };
    
    const createTransactionsChart = () => {
      if (transactionsChartInstance) {
        transactionsChartInstance.destroy();
      }
      
      const ctx = transactionsChart.value?.getContext('2d');
      if (!ctx) return;
      
      const transactions = filteredTransactions.value || [];
      const addCount = transactions.filter(t => t.type === 'ADD').length;
      const transferCount = transactions.filter(t => t.type === 'TRANSFER').length;
      const dispatchCount = transactions.filter(t => t.type === 'DISPATCH').length;
      
      if (addCount === 0 && transferCount === 0 && dispatchCount === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('لا توجد حركات لعرضها', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
      }
      
      transactionsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['إضافة', 'نقل', 'صرف'],
          datasets: [{
            data: [addCount, transferCount, dispatchCount],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              rtl: true,
              labels: {
                font: {
                  family: 'Cairo, sans-serif'
                },
                padding: 20
              }
            },
            tooltip: {
              rtl: true,
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${formatNumber(value)} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    };
    
    const createTrendsChart = () => {
      if (trendsChartInstance) {
        trendsChartInstance.destroy();
      }
      
      const ctx = trendsChart.value?.getContext('2d');
      if (!ctx) return;
      
      const months = monthlyStats.value.months || [];
      const data = monthlyStats.value.monthlyData || [];
      
      if (months.length === 0 || data.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('لا توجد بيانات لعرضها', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
      }
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
      
      trendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: trendType.value === 'transactions' ? 'عدد الحركات' :
                   trendType.value === 'quantity' ? 'الكميات' : 'القيمة (ج.م)',
            data,
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(245, 158, 11)',
            pointBorderColor: 'white',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              rtl: true,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              titleColor: '#1f2937',
              bodyColor: '#4b5563',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += formatNumber(context.parsed.y);
                  if (trendType.value === 'value') {
                    label += ' ج.م';
                  } else if (trendType.value === 'quantity') {
                    label += ' وحدة';
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                font: {
                  family: 'Cairo, sans-serif'
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return formatNumber(value);
                }
              }
            }
          }
        }
      });
    };
    
    const updateCharts = () => {
      nextTick(() => {
        if (window.innerWidth < 640) {
          createMobileWarehouseChart();
          createMobileTransactionsChart();
        } else {
          createWarehouseChart();
          createTransactionsChart();
          createTrendsChart();
        }
      });
    };
    
    // Excel Export Function
    const exportToExcel = () => {
      try {
        loading.value = true;
        
        const wb = XLSX.utils.book_new();
        
        // Summary Sheet
        const summaryData = [
          ['تقرير المخزون', '', '', '', ''],
          ['تاريخ التصدير', new Date().toLocaleDateString('ar-EG'), '', '', ''],
          ['', '', '', '', ''],
          ['ملخص الأداء', '', '', '', ''],
          ['المؤشر', 'القيمة', 'النسبة', 'التغير', 'الحالة'],
          ['إجمالي الأصناف', summary.value.totalItems, '', '', ''],
          ['الأصناف الفريدة', summary.value.uniqueItems, '', '', ''],
          ['إجمالي الحركات', summary.value.totalTransactions, '', '', ''],
          ['حركات الإضافة', summary.value.addTransactions, '', '', ''],
          ['حركات النقل', summary.value.transferTransactions, '', '', ''],
          ['حركات الصرف', summary.value.dispatchTransactions, '', '', ''],
          ['القيمة الإجمالية', summary.value.totalValue, 'ج.م', '', ''],
          ['الكمية الإجمالية', summary.value.totalQuantity, 'وحدة', '', ''],
          ['الأصناف قليلة المخزون', summary.value.lowStockItems, summary.value.lowStockPercentage + '%', '', ''],
          ['الأصناف المنتهية', summary.value.outOfStockItems, '', '', ''],
          ['', '', '', '', ''],
          ['المخزن المحدد', selectedWarehouse.value ? getWarehouseLabel(selectedWarehouse.value) : 'جميع المخازن', '', '', ''],
          ['الصنف المحدد', selectedItemText.value || 'جميع الأصناف', '', '', ''],
          ['الفترة', getPeriodLabel(), '', '', ''],
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'ملخص الأداء');
        
        // Inventory Sheet
        const inventoryHeaders = [
          'الترتيب',
          'اسم الصنف',
          'الكود',
          'اللون',
          'المخزن',
          'الكمية المتبقية',
          'الكمية المضافة',
          'المورد',
          'مكان الصنف',
          'ملاحظات',
          'تاريخ الإضافة',
          'تاريخ التحديث',
          'القيمة (ج.م)',
          'الحالة'
        ];
        
        const inventoryData = filteredInventory.value.map((item, index) => [
          index + 1,
          item.name || '',
          item.code || '',
          item.color || '',
          getWarehouseLabel(item.warehouse_id),
          item.remaining_quantity || 0,
          item.total_added || 0,
          item.supplier || '',
          item.item_location || '',
          item.notes || '',
          item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '',
          item.updated_at ? new Date(item.updated_at).toLocaleDateString('ar-EG') : '',
          (item.remaining_quantity || 0) * 50,
          getStatusText(item.remaining_quantity)
        ]);
        
        const inventoryWs = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryData]);
        XLSX.utils.book_append_sheet(wb, inventoryWs, 'تفاصيل المخزون');
        
        // Transactions Sheet
        const transactionsHeaders = [
          'نوع الحركة',
          'اسم الصنف',
          'الكود',
          'من المخزن',
          'إلى المخزن',
          'الكمية',
          'التاريخ',
          'الوقت',
          'الملاحظات'
        ];
        
        const transactionsData = filteredTransactions.value.map(transaction => [
          transaction.type === 'ADD' ? 'إضافة' : 
          transaction.type === 'TRANSFER' ? 'نقل' : 
          transaction.type === 'DISPATCH' ? 'صرف' : 'غير معروف',
          transaction.item_name || '',
          transaction.item_code || '',
          getWarehouseLabel(transaction.from_warehouse) || '',
          getWarehouseLabel(transaction.to_warehouse) || '',
          transaction.total_delta || 0,
          transaction.timestamp ? 
            (transaction.timestamp.toDate ? 
              transaction.timestamp.toDate().toLocaleDateString('ar-EG') : 
              new Date(transaction.timestamp).toLocaleDateString('ar-EG')) : '',
          transaction.timestamp ? 
            (transaction.timestamp.toDate ? 
              transaction.timestamp.toDate().toLocaleTimeString('ar-EG') : 
              new Date(transaction.timestamp).toLocaleTimeString('ar-EG')) : '',
          transaction.notes || ''
        ]);
        
        const transactionsWs = XLSX.utils.aoa_to_sheet([transactionsHeaders, ...transactionsData]);
        XLSX.utils.book_append_sheet(wb, transactionsWs, 'الحركات');
        
        // Cash Flow Sheet
        const cashFlowHeaders = [
          'عنصر التدفق النقدي',
          'القيمة (ج.م)',
          'النسبة',
          'التفاصيل'
        ];
        
        const cashFlowData = [
          ['الإيرادات من الصرف', cashFlowAnalysis.value.cashIn, '', 'إجمالي قيمة حركات الصرف'],
          ['المصروفات على المشتريات', cashFlowAnalysis.value.cashOut, '', 'إجمالي قيمة حركات الإضافة'],
          ['صافي التدفق النقدي', cashFlowAnalysis.value.netCashFlow, '', cashFlowAnalysis.value.netCashFlow >= 0 ? 'فائض' : 'عجز'],
          ['معدل دوران المخزون', (cashFlowAnalysis.value.turnoverRate * 100).toFixed(2) + '%', '', 'نسبة الإيرادات إلى قيمة المخزون'],
          ['قيمة المخزون الحالية', dashboardStats.value.estimatedValue, '', 'القيمة الإجمالية للمخزون']
        ];
        
        const cashFlowWs = XLSX.utils.aoa_to_sheet([cashFlowHeaders, ...cashFlowData]);
        XLSX.utils.book_append_sheet(wb, cashFlowWs, 'التدفق النقدي');
        
        // Generate filename
        let filename = 'تقرير_المخزون';
        if (selectedWarehouse.value) {
          filename += `_${getWarehouseLabel(selectedWarehouse.value).replace(/\s+/g, '_')}`;
        }
        if (selectedItem.value) {
          filename += `_${selectedItemText.value.replace(/\s+/g, '_')}`;
        }
        filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
        
        store.dispatch('showNotification', {
          type: 'success',
          message: `تم تصدير التقرير إلى Excel بنجاح: ${filename}`
        });
        
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'حدث خطأ في تصدير التقرير إلى Excel'
        });
      } finally {
        loading.value = false;
      }
    };
    
    // One-time data load optimization - updated with correct action names
    const loadInitialData = async () => {
      loading.value = true;
      try {
        // Load warehouses
        await store.dispatch('loadWarehouses');
        
        // Load recent transactions and dashboard stats
        await Promise.all([
          store.dispatch('getRecentTransactions', { limit: 50 }),
          store.dispatch('getDashboardStats')
        ]);
        
        // Load inventory and all transactions in background
        setTimeout(() => {
          store.dispatch('loadAllInventory');
          store.dispatch('fetchTransactions');
        }, 1000);
        
        // Cache data
        localStorage.setItem('dashboardCache', JSON.stringify({
          data: dashboardStats.value,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      loadInitialData();
      
      // Initialize charts after a short delay
      setTimeout(() => {
        updateCharts();
      }, 500);
    });
    
    onUnmounted(() => {
      // Clean up chart instances
      if (warehouseChartInstance) warehouseChartInstance.destroy();
      if (transactionsChartInstance) transactionsChartInstance.destroy();
      if (trendsChartInstance) trendsChartInstance.destroy();
      if (mobileWarehouseChartInstance) mobileWarehouseChartInstance.destroy();
      if (mobileTransactionsChartInstance) mobileTransactionsChartInstance.destroy();
      
      // Clean up live search timeout
      if (liveSearchTimeout.value) {
        clearTimeout(liveSearchTimeout.value);
      }
    });
    
    // Watch for data changes
    watch(() => [allInventory.value, allTransactions.value], () => {
      updateCharts();
    }, { deep: true });
    
    // Watch for filter changes
    watch(() => [
      selectedWarehouse.value, 
      selectedItem.value, 
      selectedItemType.value, 
      searchQuery.value,
      reportPeriod.value,
      distributionType.value,
      trendType.value,
      transactionsPeriod.value
    ], () => {
      updateCharts();
    });
    
    return {
      // Mobile state
      showMobileFilters,
      activeMobileTab,
      showInventoryFilters,
      viewMode,
      isFullscreen,
      mobileTabs,
      
      // Original refs
      loading,
      reportPeriod,
      distributionType,
      transactionsPeriod,
      trendType,
      selectedWarehouse,
      selectedItem,
      selectedItemType,
      searchQuery,
      customDateFrom,
      customDateTo,
      topItemsFilter,
      warehouseChart,
      transactionsChart,
      trendsChart,
      
      // Mobile chart refs
      mobileWarehouseChart,
      mobileTransactionsChart,
      
      // Live search refs
      isLiveSearching,
      liveSearchResults,
      
      // Computed properties
      accessibleWarehouses,
      allUniqueItems,
      filteredItemsByWarehouse,
      selectedItemText,
      hasActiveFilters,
      summary,
      topItemsByValue,
      warehouseDistribution,
      monthlyStats,
      recentFilteredTransactions,
      filteredInventory,
      dashboardStats,
      mobileInventoryItems,
      mobileTransactions,
      cashFlowAnalysis,
      
      // Methods
      formatNumber,
      formatCurrency,
      formatTime,
      getWarehouseLabel,
      getItemTypeLabel,
      getPeriodLabel,
      getQuantityClass,
      getStatusClass,
      getStatusText,
      resetFilters,
      changePeriod,
      applyCustomDate,
      applyFilters,
      handleSearch,
      updateWarehouseChart,
      updateTopItems,
      updateMonthlyTrendsChart,
      updateTransactionsChart,
      updateCharts,
      exportToExcel,
      toggleViewMode,
      toggleFullscreen
    };
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');

body {
  font-family: 'Cairo', sans-serif;
}

.space-x-reverse > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 1;
}

/* Mobile-optimized styles */
@media (max-width: 640px) {
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    overflow-x: auto;
  }
  
  .mobile-stack {
    display: flex;
    flex-direction: column;
  }
  
  .mobile-horizontal-scroll {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }
  
  .mobile-horizontal-scroll > * {
    flex: 0 0 auto;
  }
  
  /* Improve touch targets */
  button, select, input {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Optimize typography for mobile */
  h1, h2, h3 {
    line-height: 1.2;
  }
  
  /* Simplify shadows and borders for performance */
  .mobile-card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  /* Smooth transitions */
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Better table scrolling for mobile */
  .table-scroll-mobile {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Fullscreen optimizations */
:fullscreen {
  background-color: #f9fafb;
}

:-webkit-full-screen {
  background-color: #f9fafb;
}

:-moz-full-screen {
  background-color: #f9fafb;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
  border: 2px solid #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.dark ::-webkit-scrollbar-track {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-color: #374151;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Loading animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Card hover effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  body {
    background: white !important;
    color: black !important;
  }
}

/* Dark mode adjustments for mobile */
@media (max-width: 640px) {
  .dark .mobile-card {
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* Live search indicator animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced table scrolling */
.table-container {
  position: relative;
}

.table-scroll {
  overflow-y: auto;
  max-height: 500px;
}

.table-scroll thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: inherit;
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
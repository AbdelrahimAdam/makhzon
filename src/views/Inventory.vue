<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Search Status Indicator -->
    <div v-if="searchTerm && searchTerm.length >= 2" class="fixed top-4 right-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div v-if="isLiveSearching" class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span class="text-sm">جاري البحث...</span>
          </div>
          <div v-else-if="searchResults?.length > 0" class="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm">تم العثور على {{ searchResults?.length || 0 }} نتيجة</span>
          </div>
          <div v-else class="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm">لم يتم العثور على نتائج</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
      <!-- Page Header - Mobile Optimized -->
      <div class="mb-4 sm:mb-6">
        <div class="flex flex-col gap-3 sm:gap-4">
          <!-- Top row: Title and User Info -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
                المخزون
              </h1>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">
                إدارة وتتبع جميع الأصناف في النظام
              </p>
            </div>
            <!-- User and Warehouse Info - Mobile Optimized -->
            <div class="flex flex-col items-end gap-1">
              <!-- Current User -->
              <div class="flex items-center gap-1">
                <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px] sm:max-w-none">
                  {{ currentUserInfo }}
                </span>
              </div>
              <!-- Warehouse Info -->
              <div v-if="selectedWarehouse" class="flex items-center gap-1">
                <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span class="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px] sm:max-w-none">
                  {{ getWarehouseLabel(selectedWarehouse) }}
                </span>
              </div>
            </div>
          </div>
          <!-- Performance Indicator -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                <span v-if="isDataFresh" class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  مباشر
                </span>
                <span v-else class="flex items-center gap-1">
                  <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  مخزن
                </span>
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 hidden xs:inline">
                {{ (displayedItems || []).length }} عنصر • {{ formatTime(lastUpdate) }}
              </span>
              <!-- Search Debug Info -->
              <span v-if="searchTerm && searchTerm.length >= 2" class="flex items-center gap-1 text-xs">
                <span :class="{
                  'text-green-600 dark:text-green-400': searchResults?.length > 0,
                  'text-yellow-600 dark:text-yellow-400': (searchResults?.length || 0) === 0
                }">
                  {{ searchResults?.length || 0 }} نتيجة بحث
                </span>
              </span>
            </div>
            <!-- Mobile Description -->
            <p class="text-xs text-gray-600 dark:text-gray-400 block sm:hidden">
              إدارة المخزون
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons - Mobile Optimized -->
      <div class="mb-4 sm:mb-6">
        <div class="flex flex-wrap gap-2 sm:gap-3">
          <!-- Export to Excel Button -->
          <button
            v-if="(displayedItems || []).length > 0"
            @click="exportToExcel"
            :disabled="exporting"
            class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none min-w-0"
          >
            <svg v-if="!exporting" class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <svg v-else class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span class="truncate text-xs sm:text-sm">{{ exporting ? 'جاري التصدير...' : 'تصدير' }}</span>
          </button>

          <!-- Refresh Button -->
          <button
            @click="refreshData"
            :disabled="refreshing"
            class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none min-w-0"
          >
            <svg v-if="refreshing" class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <svg v-else class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span class="truncate text-xs sm:text-sm">{{ refreshing ? 'جاري التحديث...' : 'تحديث' }}</span>
          </button>

          <!-- Load More Button -->
          <button
            v-if="hasMore && !loading && !isSearchMode && (displayedItems || []).length > 0"
            @click="loadMoreItems"
            :disabled="loadingMore"
            class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none min-w-0"
          >
            <svg v-if="loadingMore" class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <svg v-else class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="truncate text-xs sm:text-sm">{{ loadingMore ? 'جاري التحميل...' : 'تحميل المزيد' }}</span>
          </button>

          <!-- Add Item Button -->
          <button
            v-if="canAddItem && showActions && !readonly"
            @click="showAddModal = true"
            class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base flex-1 sm:flex-none min-w-0"
          >
            <svg class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="truncate text-xs sm:text-sm">إضافة صنف</span>
          </button>

          <!-- Debug Search Button -->
          <button
            v-if="showDebug"
            @click="forceRefreshSearch"
            :disabled="isLiveSearching"
            class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base"
          >
            <svg class="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
            <span class="text-xs sm:text-sm">تجديد البحث</span>
          </button>
        </div>
      </div>

      <!-- NEW: Finished Items Section -->
      <div v-if="finishedItems?.length > 0" class="mb-4 sm:mb-6">
        <div class="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg p-4 border border-red-300 dark:border-red-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"/>
              </svg>
              <h2 class="text-lg font-bold text-white">الأصناف المنتهية</h2>
              <span class="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {{ finishedItems?.length || 0 }} صنف
              </span>
            </div>
            <button 
              @click="exportFinishedItemsToExcel"
              :disabled="exporting"
              class="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>تصدير</span>
            </button>
          </div>
          
          <!-- Desktop Finished Items Table -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-white/10 text-white">
                  <th class="px-4 py-2 text-right">الصنف</th>
                  <th class="px-4 py-2 text-right">المخزن</th>
                  <th class="px-4 py-2 text-right">آخر تحديث</th>
                  <th class="px-4 py-2 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in finishedItems.slice(0, 5)" :key="item.id" class="border-b border-white/10 hover:bg-white/5">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded overflow-hidden border border-white/20">
                        <img 
                          :src="item.photo_url || getPlaceholderImage()" 
                          :alt="item.name"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                        >
                      </div>
                      <div class="text-right">
                        <div class="font-semibold text-white">{{ item.name }}</div>
                        <div class="text-xs text-white/80">{{ item.code }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-white">
                    {{ getWarehouseLabel(item.warehouse_id) }}
                  </td>
                  <td class="px-4 py-3 text-white/80 text-xs">
                    {{ formatRelativeTime(item.updated_at) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-1">
                      <button
                        @click="showItemDetails(item)"
                        class="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                        title="عرض التفاصيل"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      <button
                        v-if="canEditItem(item)"
                        @click="handleEdit(item)"
                        class="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                        title="تعديل"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Finished Items Cards -->
          <div class="lg:hidden">
            <div class="space-y-2">
              <div v-for="item in finishedItems.slice(0, 3)" :key="item.id" 
                   class="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded overflow-hidden border border-white/30">
                      <img 
                        :src="item.photo_url || getPlaceholderImage()" 
                        :alt="item.name"
                        class="w-full h-full object-cover"
                        @error="handleImageError"
                      >
                    </div>
                    <div class="text-right">
                      <div class="font-semibold text-white">{{ item.name }}</div>
                      <div class="text-xs text-white/80">{{ item.code }}</div>
                    </div>
                  </div>
                  <span class="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    منتهي
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs text-white/80">
                  <span>{{ getWarehouseLabel(item.warehouse_id) }}</span>
                  <span>{{ formatRelativeTime(item.updated_at) }}</span>
                </div>
                <div class="flex justify-end gap-1 mt-2">
                  <button
                    @click="showItemDetails(item)"
                    class="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded transition-colors text-xs"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Show More Button if there are more than 5 finished items -->
          <div v-if="finishedItems?.length > 5" class="mt-3 pt-3 border-t border-white/20">
            <button
              @click="showAllFinishedItems = !showAllFinishedItems"
              class="w-full flex items-center justify-center gap-1 text-white hover:text-white/80 text-sm"
            >
              <span>{{ showAllFinishedItems ? 'عرض أقل' : `عرض ${(finishedItems?.length || 0) - 5} عنصر إضافي` }}</span>
              <svg class="w-4 h-4 transition-transform" :class="{'rotate-180': showAllFinishedItems}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards - Mobile Optimized -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-default">
          <div class="flex items-center">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center ml-2 sm:ml-3 flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="flex-1 text-right mr-1 sm:mr-2">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">الأصناف</p>
              <p class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{{ formatNumber((displayedItems || []).length) }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-default">
          <div class="flex items-center">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center ml-2 sm:ml-3 flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1 text-right mr-1 sm:mr-2">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">الإجمالي</p>
              <p class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{{ formatNumber(totalQuantity) }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-default">
          <div class="flex items-center">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center ml-2 sm:ml-3 flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1 text-right mr-1 sm:mr-2">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">قليلة</p>
              <p class="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">{{ formatNumber(lowStockCount) }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-default">
          <div class="flex items-center">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center ml-2 sm:ml-3 flex-shrink-0">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div class="flex-1 text-right mr-1 sm:mr-2">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">المخازن</p>
              <p class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{{ formatNumber(warehouseCount) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTERS AND SEARCH SECTION - COLLAPSIBLE ON MOBILE -->
      <div class="mb-4 sm:mb-6">
        <!-- Collapsible Header for Mobile -->
        <div class="lg:hidden mb-3">
          <button
            @click="showFilters = !showFilters"
            class="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <span class="font-medium text-gray-700 dark:text-gray-300">
                الفلاتر والبحث
              </span>
              <span v-if="hasActiveFilters" class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-yellow-500 text-white rounded-full">
                {{ activeFilterCount }}
              </span>
            </div>
            <svg class="w-5 h-5 text-gray-500 transition-transform duration-200" :class="{'rotate-180': showFilters}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        <!-- Filters and Search Content - Collapsible on Mobile, Always visible on Desktop -->
        <div :class="{'hidden lg:block': !showFilters, 'block': showFilters}" class="space-y-4">
          <!-- Main Filters Card -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
              <!-- Warehouse Filter -->
              <div v-if="(accessibleWarehouses || []).length > 0" class="order-1">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المخزن</label>
                <select
                  v-model="selectedWarehouse"
                  @change="handleWarehouseChange"
                  class="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400 transition-colors duration-200"
                >
                  <option value="">جميع المخازن</option>
                  <option v-for="warehouse in accessibleWarehouses" :key="warehouse.id" :value="warehouse.id">
                    {{ warehouse.name_ar }}
                  </option>
                </select>
              </div>

              <!-- Status Filter -->
              <div class="order-2">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
                <select
                  v-model="statusFilter"
                  @change="handleFilterChange"
                  class="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400 transition-colors duration-200"
                >
                  <option value="">الكل</option>
                  <option value="in_stock">متوفر</option>
                  <option value="low_stock">كمية قليلة</option>
                  <option value="out_of_stock">منتهي</option>
                </select>
              </div>

              <!-- Search Input -->
              <div class="md:col-span-2 order-3 md:order-3">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بحث سريع</label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="searchTerm"
                    @input="handleLiveSearch"
                    placeholder="ابحث بكود، اسم، لون، مورد، ملاحظات، مكان..."
                    class="w-full px-3 py-2 pr-8 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-yellow-400 transition-colors duration-200"
                  />
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <!-- Clear Search Button -->
                  <button
                    v-if="searchTerm"
                    @click="clearSearch"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                  <!-- Search Info -->
                  <div v-if="isLiveSearching" class="absolute left-0 right-0 -bottom-6 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    جاري البحث في جميع الأصناف...
                  </div>
                  <div v-else-if="searchTerm.length > 0 && searchTerm.length < 2" class="absolute left-0 right-0 -bottom-6 text-xs text-yellow-600 dark:text-yellow-400">
                    ⓘ اكتب حرفين على الأقل للبحث
                  </div>
                  <div v-else-if="searchTerm.length >= 2 && searchResults?.length > 0" class="absolute left-0 right-0 -bottom-6 text-xs text-green-600 dark:text-green-400">
                    ✓ تم العثور على {{ searchResults?.length || 0 }} نتيجة
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Tips -->
            <div v-if="searchTerm && searchTerm.length >= 2" class="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div class="text-xs text-blue-700 dark:text-blue-300">
                <span class="font-semibold">نصائح البحث:</span>
                <ul class="mt-1 space-y-1">
                  <li class="flex items-center gap-1">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    البحث يشمل: الكود، الاسم، اللون، المورد، الملاحظات، المكان
                  </li>
                  <li class="flex items-center gap-1">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    البحث في جميع المخازن
                  </li>
                </ul>
              </div>
            </div>

            <!-- Active Filters -->
            <div v-if="hasActiveFilters" class="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
              <span v-if="selectedWarehouse"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                <span class="hidden xs:inline">المخزن:</span>
                <span class="font-medium truncate max-w-[80px]">{{ getWarehouseLabel(selectedWarehouse) }}</span>
                <button @click="clearWarehouseFilter" class="text-blue-600 hover:text-blue-800">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </span>
              <span v-if="statusFilter"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                <span class="hidden xs:inline">الحالة:</span>
                <span class="font-medium">{{ getStatusLabel(statusFilter) }}</span>
                <button @click="statusFilter = ''" class="text-green-600 hover:text-green-800">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </span>
              <span v-if="searchTerm"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                <span class="hidden xs:inline">البحث:</span>
                <span class="font-medium truncate max-w-[60px]">{{ searchTerm }}</span>
                <button @click="clearSearch" class="text-yellow-600 hover:text-yellow-800">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </span>
              <button
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
              >
                مسح الكل
              </button>
            </div>
          </div>

          <!-- Search Mode Indicator -->
          <div v-if="searchTerm && searchTerm.length >= 2 && searchResults?.length > 0" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span class="text-sm">نتائج البحث: {{ searchResults?.length || 0 }} عنصر</span>
              </div>
              <button
                @click="clearSearch"
                class="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200"
              >
                عودة للعرض العادي
              </button>
            </div>
          </div>

          <!-- Export Progress -->
          <div v-if="exporting" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span class="text-sm">جاري تجهير Excel...</span>
              </div>
              <span class="text-xs">{{ exportProgress }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !displayedItems?.length" class="text-center py-8 sm:py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-yellow-600 mb-3 sm:mb-4"></div>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">جاري تحميل المخزون...</p>
        <p v-if="totalLoaded > 0" class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">تم تحميل {{ totalLoaded }} عنصر</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div>
          <button @click="error = ''" class="text-red-600 hover:text-red-800">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Inventory Table Container -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Desktop Table with Virtual Scrolling -->
        <div class="hidden lg:block">
          <div
            class="overflow-x-auto relative"
            :style="{ maxHeight: 'calc(100vh - 400px)' }"
            @scroll="onScroll"
            ref="scrollContainer"
          >
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                <tr>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    الصورة
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    <div class="flex flex-col items-center justify-center">
                      <span>الاسم والكود</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-normal">(انقر للتفاصيل)</span>
                    </div>
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    اللون
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    المخزن
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    المورد
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    <div class="flex flex-col items-center justify-center">
                      <span>الكميات</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-normal">كراتين/في الكرتونة/فردي</span>
                    </div>
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    <div class="flex flex-col items-center justify-center">
                      <span>المتبقي</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-normal">من المجموع</span>
                    </div>
                  </th>
                  <th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    الحالة
                  </th>
                  <th v-if="showActions && !readonly && userRole !== 'viewer'"
                      class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    الإجراءات
                  </th>
                  <th v-else
                      class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-yellow-500 whitespace-nowrap">
                    آخر تحديث
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Virtual Scrolling - Only render visible rows -->
                <tr v-for="item in visibleItems"
                    :key="item.id"
                    class="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                    :style="{ transform: 'translateY(0)' }"
                >
                  <!-- Photo -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="flex justify-center">
                      <div class="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:scale-105 transition-transform duration-200"
                        @click="showItemDetails(item)">
                        <img
                          :src="item.photo_url || getPlaceholderImage()"
                          :alt="item.name"
                          class="w-full h-full object-cover"
                          @error="handleImageError"
                          loading="lazy"
                        >
                        <div v-if="item.photo_url" class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                      </div>
                    </div>
                  </td>

                  <!-- Name and Code -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="min-w-0 max-w-xs">
                      <div class="text-sm font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                        @click="showItemDetails(item)">
                        {{ item.name }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {{ item.code }}
                        </span>
                      </div>
                      <div v-if="item.item_location" class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span class="truncate">{{ item.item_location }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Color -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="flex items-center justify-center">
                      <div class="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        <div v-if="item.color" class="w-3 h-3 rounded-full border border-gray-300"
                          :style="{ backgroundColor: getColorHex(item.color) }"></div>
                        <span class="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {{ item.color || '-' }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Warehouse -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="text-center">
                      <span class="text-xs sm:text-sm text-gray-900 dark:text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        {{ getWarehouseLabel(item.warehouse_id) }}
                      </span>
                    </div>
                  </td>

                  <!-- Supplier -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="max-w-[120px] sm:max-w-[150px] mx-auto">
                      <span class="text-xs sm:text-sm text-gray-900 dark:text-white truncate block px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        {{ item.supplier || '-' }}
                      </span>
                    </div>
                  </td>

                  <!-- Quantities -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="text-xs sm:text-sm space-y-1 max-w-[120px] sm:max-w-[150px] mx-auto">
                      <div class="flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        <span class="text-gray-500 dark:text-gray-400 text-xs">كراتين:</span>
                        <span class="text-gray-900 dark:text-white font-medium">{{ item.cartons_count || 0 }}</span>
                      </div>
                      <div class="flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        <span class="text-gray-500 dark:text-gray-400 text-xs">في الكرتونة:</span>
                        <span class="text-gray-900 dark:text-white font-medium">{{ item.per_carton_count || 0 }}</span>
                      </div>
                      <div class="flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        <span class="text-gray-500 dark:text-gray-400 text-xs">فردي:</span>
                        <span class="text-gray-900 dark:text-white font-medium">{{ item.single_bottles_count || 0 }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Remaining Quantity -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="text-center">
                      <div :class="getQuantityClass(item.remaining_quantity)"
                           class="text-base sm:text-lg font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full inline-flex flex-col items-center gap-1">
                        <span>{{ item.remaining_quantity }}</span>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          من {{ item.total_added }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div class="flex justify-center">
                      <span :class="getStockStatusClass(item.remaining_quantity)"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                        {{ getStockStatus(item.remaining_quantity) }}
                      </span>
                    </div>
                  </td>

                  <!-- Actions or Updated Date -->
                  <td class="px-4 sm:px-6 py-3 sm:py-4">
                    <div v-if="showActions && !readonly && userRole !== 'viewer'" class="flex items-center justify-center gap-1 sm:gap-2">
                      <!-- View Details Button -->
                      <button
                        @click="showItemDetails(item)"
                        class="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/20 hover:scale-110 transition-all duration-200"
                        title="عرض التفاصيل"
                      >
                        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>

                      <!-- More Actions Dropdown -->
                      <div class="relative">
                        <button
                          @click="toggleActionMenu(item.id)"
                          class="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                          title="المزيد من الإجراءات"
                        >
                          <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                          </svg>
                        </button>

                        <!-- Action Dropdown Menu -->
                        <div v-if="showActionMenu === item.id"
                          class="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-30"
                          v-click-outside="() => showActionMenu = null">
                          <!-- Edit Option -->
                          <button
                            v-if="canEditItem(item)"
                            @click="handleEdit(item)"
                            class="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150"
                          >
                            <svg class="w-4 h-4 ml-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            تعديل الصنف
                          </button>

                          <!-- Transfer Option -->
                          <button
                            v-if="canTransferItem(item)"
                            @click="handleTransfer(item)"
                            class="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-150"
                          >
                            <svg class="w-4 h-4 ml-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                            نقل بين المخازن
                          </button>

                          <!-- Dispatch Option -->
                          <button
                            v-if="canDispatchItem(item)"
                            @click="handleDispatch(item)"
                            class="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150"
                          >
                            <svg class="w-4 h-4 ml-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            صرف إلى خارجي
                          </button>

                          <!-- Divider -->
                          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                          <!-- Delete Option -->
                          <button
                            v-if="canDeleteItem(item)"
                            @click="handleDelete(item)"
                            class="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                          >
                            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            حذف الصنف
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center">
                      <span class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 dark:bg-gray-700">
                        {{ formatDate(item.updated_at) }}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="visibleItems?.length === 0 && !loading">
                  <td :colspan="showActions && !readonly && userRole !== 'viewer' ? 9 : 8" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex flex-col items-center">
                      <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
                      </svg>
                      <h3 class="text-lg font-medium mb-2">لا توجد أصناف</h3>
                      <p class="text-sm">{{ searchTerm ? 'لم يتم العثور على أصناف مطابقة للبحث' : 'لم يتم إضافة أي أصناف بعد.' }}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Loading More Indicator -->
          <div v-if="loadingMore" class="p-4 text-center text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-700">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p class="text-sm">جاري تحميل المزيد من العناصر...</p>
          </div>

          <!-- End of List Indicator -->
          <div v-if="!hasMore && (displayedItems || []).length > 0 && !isSearchMode" class="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm">تم عرض جميع العناصر ({{ (displayedItems || []).length }} عنصر)</p>
          </div>
        </div>

        <!-- Mobile Cards with Virtual Scrolling - UPDATED SECTION -->
        <div class="lg:hidden">
          <div
            class="overflow-y-auto"
            :style="{ maxHeight: 'calc(100vh - 320px)' }"
            @scroll="onMobileScroll"
            ref="mobileScrollContainer"
          >
            <div v-if="mobileVisibleItems?.length === 0 && !loading" class="p-6 text-center text-gray-500 dark:text-gray-400">
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"/>
              </svg>
              <h3 class="text-lg font-medium mb-2">لا توجد أصناف</h3>
              <p class="text-sm">{{ searchTerm ? 'لم يتم العثور على أصناف مطابقة للبحث' : 'لم يتم إضافة أي أصناف بعد.' }}</p>
            </div>
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Virtual Scrolling for Mobile - Only render visible items -->
              <div
                v-for="item in mobileVisibleItems"
                :key="item.id"
                data-mobile-card
                class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 active:bg-gray-100 dark:active:bg-gray-700"
              >
                <!-- Main Row -->
                <div class="flex gap-3" @click="showItemDetails(item)">
                  <!-- Photo -->
                  <div class="flex-shrink-0">
                    <div class="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <img
                        :src="item.photo_url || getPlaceholderImage()"
                        :alt="item.name"
                        class="w-full h-full object-cover"
                        @error="handleImageError"
                        loading="lazy"
                      >
                    </div>
                  </div>

                  <!-- Item Details -->
                  <div class="flex-1 min-w-0">
                    <!-- First Row: Name and Status -->
                    <div class="flex justify-between items-start mb-1">
                      <div class="min-w-0">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">
                          {{ item.name }}
                        </h3>
                        <div class="flex items-center gap-1 mb-1">
                          <span class="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                            {{ item.code }}
                          </span>
                          <span :class="getStockStatusClass(item.remaining_quantity)"
                                class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                            {{ getStockStatus(item.remaining_quantity) }}
                          </span>
                        </div>
                      </div>
                      <!-- Remaining Quantity -->
                      <div :class="getQuantityClass(item.remaining_quantity)"
                           class="text-lg font-bold px-3 py-1.5 rounded-lg flex flex-col items-center">
                        <span>{{ item.remaining_quantity }}</span>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          من {{ item.total_added || item.remaining_quantity }}
                        </div>
                      </div>
                    </div>

                    <!-- Quantities Breakdown -->
                    <div class="grid grid-cols-3 gap-2 mb-2">
                      <div class="text-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-xs text-gray-500 dark:text-gray-400">كراتين</div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.cartons_count || 0 }}</div>
                      </div>
                      <div class="text-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-xs text-gray-500 dark:text-gray-400">في الكرتونة</div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.per_carton_count || 0 }}</div>
                      </div>
                      <div class="text-center px-2 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-xs text-gray-500 dark:text-gray-400">فردي</div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.single_bottles_count || 0 }}</div>
                      </div>
                    </div>

                    <!-- Second Row: Warehouse and Color -->
                    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <div class="flex items-center gap-1">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span class="truncate max-w-[100px]">
                          {{ getWarehouseLabel(item.warehouse_id) }}
                        </span>
                      </div>
                      <div v-if="item.color" class="flex items-center gap-1">
                        <div class="w-3 h-3 rounded-full border border-gray-300"
                          :style="{ backgroundColor: getColorHex(item.color) }"></div>
                        <span>{{ item.color }}</span>
                      </div>
                    </div>

                    <!-- Third Row: Supplier and Location -->
                    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div v-if="item.supplier" class="flex items-center gap-1 truncate max-w-[120px]">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <span class="truncate">{{ item.supplier }}</span>
                      </div>
                      <div v-if="item.item_location" class="flex items-center gap-1 text-gray-500">
                        <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span class="truncate max-w-[80px]">{{ item.item_location }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Actions Bar -->
                <div v-if="showActions && !readonly && userRole !== 'viewer'"
                     class="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                  <!-- Last Updated -->
                  <div class="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{{ formatRelativeTime(item.updated_at) }}</span>
                  </div>

                  <!-- Quick Action Buttons -->
                  <div class="flex items-center gap-1">
                    <button
                      v-if="canEditItem(item)"
                      @click.stop="handleEdit(item)"
                      class="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/20 transition-colors"
                      title="تعديل"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button
                      v-if="canTransferItem(item)"
                      @click.stop="handleTransfer(item)"
                      class="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/20 transition-colors"
                      title="نقل"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                      </svg>
                    </button>
                    <button
                      v-if="canDispatchItem(item)"
                      @click.stop="handleDispatch(item)"
                      class="p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/20 transition-colors"
                      title="صرف خارجي"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </button>
                    <button
                      v-if="canDeleteItem(item)"
                      @click.stop="handleDelete(item)"
                      class="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"
                      title="حذف"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Load More Button for Mobile -->
            <div v-if="hasMore && !loadingMore && !isSearchMode && mobileVisibleItems?.length > 0" class="p-4 text-center">
              <button
                @click="loadMoreItems"
                :disabled="loading || loadingMore"
                class="w-full px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تحميل المزيد من العناصر
              </button>
            </div>

            <!-- Loading More Indicator for Mobile -->
            <div v-if="loadingMore" class="p-4 text-center text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-700">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p class="text-sm">جاري تحميل المزيد...</p>
            </div>

            <!-- End of List for Mobile -->
            <div v-if="!hasMore && (displayedItems || []).length > 0 && !isSearchMode && mobileVisibleItems?.length > 0" class="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              <p class="text-sm">تم عرض جميع العناصر</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Button for Mobile -->
    <button
      v-if="canAddItem && showActions && !readonly"
      @click="showAddModal = true"
      class="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-purple-600 hover:scale-110 active:scale-95 transition-all duration-200 lg:hidden"
      title="إضافة صنف"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
    </button>

    <!-- Modals -->
    <AddItemModal
      v-if="showAddModal"
      :isOpen="showAddModal"
      @close="showAddModal = false"
      @success="handleItemSaved"
    />
    <DispatchModal
      v-if="showDispatchModal"
      :isOpen="showDispatchModal"
      :item="selectedItemForDispatch"
      @close="showDispatchModal = false"
      @success="handleDispatchSuccess"
    />
    <EditItemModal
      v-if="showEditModal"
      :isOpen="showEditModal"
      :item="selectedItemForEdit"
      @close="showEditModal = false"
      @success="handleItemUpdated"
    />
    <TransferModal
      v-if="showTransferModal"
      :isOpen="showTransferModal"
      :item="selectedItemForTransfer"
      @close="showTransferModal = false"
      @success="handleTransferSuccess"
    />
    <!-- Item Details Modal -->
    <ItemDetailsModal
      v-if="showDetailsModal"
      :isOpen="showDetailsModal"
      :item="selectedItem"
      @close="closeDetailsModal"
      @edit="handleEdit"
      @transfer="handleTransfer"
      @dispatch="handleDispatch"
      @delete="handleDelete"
      :canEditItem="canEditItem"
      :canTransferItem="canTransferItem"
      :canDispatchItem="canDispatchItem"
      :canDeleteItem="canDeleteItem"
    />
    <!-- Delete Confirmation Modal -->
    <ConfirmDeleteModal
      v-if="showDeleteConfirm"
      :isOpen="showDeleteConfirm"
      :item="itemToDelete"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @close="showDeleteConfirm = false"
      :warehouseLabel="getWarehouseLabel"
      :getLastActionUser="getLastActionUser"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';

// Import your modals
import AddItemModal from '@/components/inventory/AddItemModal.vue';
import DispatchModal from '@/components/inventory/DispatchModal.vue';
import EditItemModal from '@/components/inventory/EditItemModal.vue';
import TransferModal from '@/components/inventory/TransferModal.vue';
import ItemDetailsModal from '@/components/inventory/ItemDetailsModal.vue';
import ConfirmDeleteModal from '@/components/inventory/ConfirmDeleteModal.vue';

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  }
};

// Arabic text normalization (MUST MATCH STORE FUNCTION)
function normalizeArabicText(text) {
  if (!text || typeof text !== 'string') return '';
  text = String(text).trim();
  text = text.normalize('NFC');
  const diacriticsRegex = /[\u064B-\u065F\u0670\u0640\u0652\u0651\u064E\u064F\u064D\u0650\u0657\u0656\u0653\u0654\u0655]/g;
  text = text.replace(diacriticsRegex, '');
  
  const arabicNormalizationMap = {
    'إ': 'ا', 'أ': 'ا', 'آ': 'ا',
    'ى': 'ي', 'ئ': 'ي',
    'ة': 'ه',
    'ؤ': 'و',
    'گ': 'ك', 'چ': 'ج', 'پ': 'ب', 'ژ': 'ز',
    'ـ': '',
  };

  Object.keys(arabicNormalizationMap).forEach(key => {
    const regex = new RegExp(key, 'g');
    text = text.replace(regex, arabicNormalizationMap[key]);
  });

  text = text.replace(/[^\u0621-\u064A\u0660-\u0669\u0671-\u06D3\s0-9]/g, '');
  text = text.replace(/\s+/g, ' ').trim().toLowerCase();
  return text;
}

// Fuzzy search function (MUST MATCH STORE LOGIC)
function fuzzyLocalSearch(items, searchTerm, warehouseId, limit) {
  if (!searchTerm || searchTerm.length < 2) return [];

  const normalizedTerm = normalizeArabicText(searchTerm);
  const matches = [];

  for (const item of items) {
    if (warehouseId && warehouseId !== 'all' && item.warehouse_id !== warehouseId) {
      continue;
    }

    const searchFields = ['name', 'code', 'color', 'supplier', 'item_location', 'notes', 'barcode', 'sku', 'category'];
    let matched = false;

    for (const field of searchFields) {
      const fieldValue = item[field];
      if (!fieldValue) continue;

      const normalizedFieldValue = normalizeArabicText(fieldValue.toString());
      
      if (normalizedFieldValue.includes(normalizedTerm)) {
        matched = true;
        break;
      }
      
      const searchWords = normalizedTerm.split(/\s+/);
      const fieldWords = normalizedFieldValue.split(/\s+/);
      
      for (const searchWord of searchWords) {
        for (const fieldWord of fieldWords) {
          if (fieldWord.includes(searchWord)) {
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (matched) break;
    }

    if (matched) {
      matches.push(item);
      if (matches.length >= limit * 2) break;
    }
  }

  const sortedMatches = matches.sort((a, b) => {
    const aCodeMatch = normalizeArabicText(a.code).includes(normalizedTerm);
    const bCodeMatch = normalizeArabicText(b.code).includes(normalizedTerm);
    
    if (aCodeMatch && !bCodeMatch) return -1;
    if (!aCodeMatch && bCodeMatch) return 1;
    
    const aNameMatch = normalizeArabicText(a.name).includes(normalizedTerm);
    const bNameMatch = normalizeArabicText(b.name).includes(normalizedTerm);
    
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    
    return 0;
  });

  return sortedMatches.slice(0, limit);
}

export default {
  name: 'InventoryProduction',
  components: {
    AddItemModal,
    DispatchModal,
    EditItemModal,
    TransferModal,
    ItemDetailsModal,
    ConfirmDeleteModal
  },
  directives: {
    'click-outside': vClickOutside
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const loading = ref(false);
    const loadingMore = ref(false);
    const refreshing = ref(false);
    const exporting = ref(false);
    const deleteLoading = ref(false);
    const showAllFinishedItems = ref(false);
    
    // Modal States
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showTransferModal = ref(false);
    const showDispatchModal = ref(false);
    const showDetailsModal = ref(false);
    const showDeleteConfirm = ref(false);
    
    // Item States
    const selectedItemForEdit = ref(null);
    const selectedItemForTransfer = ref(null);
    const selectedItemForDispatch = ref(null);
    const selectedItem = ref(null);
    const itemToDelete = ref(null);
    
    // UI States
    const showFilters = ref(false);
    const showActionMenu = ref(null);
    const error = ref('');
    const exportProgress = ref('');
    
    // Filter States
    const searchTerm = ref('');
    const statusFilter = ref('');
    const selectedWarehouse = ref('');
    
    // Virtual Scrolling
    const scrollContainer = ref(null);
    const mobileScrollContainer = ref(null);
    const visibleStartIndex = ref(0);
    const mobileVisibleStartIndex = ref(0);
    const visibleItemCount = 50;
    const mobileVisibleItemCount = 20;
    const scrollBuffer = 20;
    const scrollThrottle = ref(null);
    const lastScrollTime = ref(0);
    const SCROLL_THROTTLE_DELAY = 16;
    
    // UI Performance
    const lastUpdate = ref(Date.now());
    const isDataFresh = ref(false);

    // ============================================
    // CRITICAL: Optimize store refresh tracking
    // ============================================
    const lastStoreRefresh = ref(null);
    const MIN_REFRESH_INTERVAL = 30000; // 30 seconds minimum between full refreshes
    
    // ============================================
    // STORE COMPUTED PROPERTIES
    // ============================================
    const user = computed(() => store.state.user);
    const userProfile = computed(() => store.state.userProfile);
    const userRole = computed(() => userProfile.value?.role || '');
    
    const searchResults = computed(() => store.state.search?.results || []);
    const isLiveSearching = computed(() => store.state.search?.loading || false);
    const searchQuery = computed(() => store.state.search?.query || '');
    
    const allInventory = computed(() => store.state.inventory || []);
    const inventoryLoading = computed(() => store.state.inventoryLoading);
    const inventoryLoaded = computed(() => store.state.inventoryLoaded);
    
    const filteredInventory = computed(() => {
      let items = allInventory.value;
      if (selectedWarehouse.value) {
        items = items.filter(item => item.warehouse_id === selectedWarehouse.value);
      }
      if (statusFilter.value) {
        items = items.filter(item => {
          const quantity = item.remaining_quantity || 0;
          if (statusFilter.value === 'in_stock') return quantity >= 500;
          if (statusFilter.value === 'low_stock') return quantity > 0 && quantity < 500;
          if (statusFilter.value === 'out_of_stock') return quantity === 0;
          return true;
        });
      }
      return items;
    });
    
    // ============================================
    // NEW: Finished Items Computation (500 or less is low stock)
    // ============================================
    const finishedItems = computed(() => {
      return (filteredInventory.value || []).filter(item => {
        const quantity = item.remaining_quantity || 0;
        return quantity === 0;
      });
    });
    
    const isSearchMode = computed(() => {
      return searchTerm.value && searchTerm.value.length >= 2 && (searchResults.value?.length || 0) > 0;
    });
    
    // ========== SIMPLIFIED displayedItems COMPUTED ==========
    const displayedItems = computed(() => {
      // If search mode is active, use search results
      if (isSearchMode.value) {
        return searchResults.value || [];
      }

      // Otherwise use filtered inventory (already filtered by warehouse via `selectedWarehouse`)
      let items = filteredInventory.value || [];

      // Apply local search if term is present (this will search within the filtered warehouse items)
      if (searchTerm.value && searchTerm.value.length >= 2) {
        items = fuzzyLocalSearch(items, searchTerm.value, selectedWarehouse.value, 50) || [];
      }

      return items;
    });
    
    const accessibleWarehouses = computed(() => store.getters.accessibleWarehouses || []);
    const allWarehouses = computed(() => store.getters.warehouses || []);
    const allUsers = computed(() => store.state.allUsers || []);
    
    const hasMore = computed(() => store.getters.hasMore);
    const isFetchingMore = computed(() => store.state.pagination?.isFetching || false);
    const totalLoaded = computed(() => store.state.pagination?.totalLoaded || 0);

    // ============================================
    // CRITICAL: Optimized refresh function
    // ============================================
    const shouldRefreshFromStore = () => {
      if (!lastStoreRefresh.value) return true;
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastStoreRefresh.value;
      
      // Only refresh if it's been more than 30 seconds
      return timeSinceLastRefresh > MIN_REFRESH_INTERVAL;
    };

    // ============================================
    // CRITICAL: Update single item in local state without store refresh
    // ============================================
    const updateSingleItemInLocalState = (updatedItem) => {
      if (!updatedItem?.id) return;
      
      console.log('🔄 Updating single item in local state:', {
        id: updatedItem.id,
        name: updatedItem.name,
        remaining_quantity: updatedItem.remaining_quantity
      });
      
      // Update the Vuex state directly
      store.commit('UPDATE_INVENTORY_ITEM', updatedItem);
      
      // Update last refresh time
      lastUpdate.value = Date.now();
      isDataFresh.value = true;
    };

    // ============================================
    // COMPUTED STATISTICS (UPDATED for 500 threshold)
    // ============================================
    const currentUserInfo = computed(() => {
      if (userProfile.value?.name) return userProfile.value.name;
      if (user.value?.displayName) return user.value.displayName;
      if (userProfile.value?.email) return userProfile.value.email.split('@')[0];
      if (user.value?.email) return user.value.email.split('@')[0];
      return 'مستخدم النظام';
    });
    
    const totalQuantity = computed(() => {
      return displayedItems.value.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
    });
    
    const lowStockCount = computed(() => {
      return displayedItems.value.filter(item => {
        const quantity = item.remaining_quantity || 0;
        return quantity > 0 && quantity <= 500;
      }).length;
    });
    
    const warehouseCount = computed(() => {
      const warehouses = new Set(displayedItems.value.map(item => item.warehouse_id));
      return warehouses.size;
    });
    
    const hasActiveFilters = computed(() => {
      return selectedWarehouse.value || statusFilter.value || searchTerm.value;
    });
    
    const activeFilterCount = computed(() => {
      let count = 0;
      if (selectedWarehouse.value) count++;
      if (statusFilter.value) count++;
      if (searchTerm.value) count++;
      return count;
    });
    
    const canAddItem = computed(() => {
      return userRole.value === 'superadmin' ||
             (userRole.value === 'warehouse_manager' && 
              store.getters.allowedWarehouses?.length > 0);
    });
    
    const showActions = computed(() => userRole.value !== 'viewer');
    const readonly = computed(() => userRole.value === 'viewer');

    // ============================================
    // VIRTUAL SCROLLING COMPUTED PROPERTIES
    // ============================================
    const visibleItems = computed(() => {
      const items = displayedItems.value || [];
      const start = Math.max(0, visibleStartIndex.value - scrollBuffer);
      const end = Math.min(items.length, visibleStartIndex.value + visibleItemCount + scrollBuffer);
      return items.slice(start, end);
    });
    
    const mobileVisibleItems = computed(() => {
      const items = displayedItems.value || [];
      const start = Math.max(0, mobileVisibleStartIndex.value - scrollBuffer);
      const end = Math.min(items.length, mobileVisibleStartIndex.value + mobileVisibleItemCount + scrollBuffer);
      return items.slice(start, end);
    });

    // ============================================
    // ENHANCED STORE SEARCH SYSTEM
    // ============================================
    const handleLiveSearch = debounce(async () => {
      const term = searchTerm.value.trim();
      
      if (term.length === 0) {
        await store.dispatch('clearSearch');
        resetScrollPositions();
        return;
      }
      
      if (term.length < 2) {
        await store.dispatch('clearSearch');
        return;
      }
      
      try {
        console.log(`🚀 Triggering store search for: "${term}"`);
        
        const results = await store.dispatch('searchInventorySpark', {
          searchQuery: term,
          warehouseId: selectedWarehouse.value || 'all',
          limit: 50,
          strategy: 'parallel'
        });
        
        console.log(`✅ Store returned ${results.length} results`);
        
        isDataFresh.value = true;
        lastUpdate.value = Date.now();
        resetScrollPositions();
        
        if (results.length > 0) {
          store.dispatch('showNotification', {
            type: 'success',
            message: `تم العثور على ${results.length} نتيجة للبحث: "${term}"`
          });
        } else {
          store.dispatch('showNotification', {
            type: 'info',
            message: 'لم يتم العثور على نتائج للبحث في جميع المخازن'
          });
        }
        
      } catch (error) {
        console.error('❌ Error in store search:', error);
        
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في البحث. جاري استخدام البحث المحلي.'
        });
        
        await store.dispatch('clearSearch');
      }
    }, 500);

    // ============================================
    // FILTER HANDLERS (SIMPLIFIED)
    // ============================================
    const handleWarehouseChange = () => {
      resetScrollPositions();
      // If a search term is active, re‑run the search (optional)
      if (searchTerm.value.trim() && searchTerm.value.trim().length >= 2) {
        handleLiveSearch();
      }
    };
    
    const handleFilterChange = () => {
      resetScrollPositions();
    };
    
    const clearSearch = async () => {
      searchTerm.value = '';
      await store.dispatch('clearSearch');
      resetScrollPositions();
    };
    
    const clearWarehouseFilter = async () => {
      selectedWarehouse.value = '';
      resetScrollPositions();
      
      if (searchTerm.value.trim() && searchTerm.value.trim().length >= 2) {
        await handleLiveSearch();
      }
    };
    
    const clearAllFilters = async () => {
      searchTerm.value = '';
      statusFilter.value = '';
      selectedWarehouse.value = '';
      showFilters.value = false;
      
      await store.dispatch('clearSearch');
      resetScrollPositions();
    };
    
    const resetScrollPositions = () => {
      visibleStartIndex.value = 0;
      mobileVisibleStartIndex.value = 0;
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0;
      }
      if (mobileScrollContainer.value) {
        mobileScrollContainer.value.scrollTop = 0;
      }
    };

    // ============================================
    // NEW: Export Finished Items to Excel
    // ============================================
    const exportFinishedItemsToExcel = async () => {
      if (!finishedItems.value?.length) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'لا توجد أصناف منتهية للتصدير'
        });
        return;
      }
      
      exporting.value = true;
      exportProgress.value = 'جاري تجهير الأصناف المنتهية...';
      
      try {
        const itemsData = finishedItems.value.map((item, index) => {
          exportProgress.value = `جاري تجهير العنصر ${index + 1} من ${finishedItems.value.length}`;
          
          const createdByName = item.created_by_name || getUserName(item.created_by) || 'غير معروف';
          const updatedByName = item.updated_by_name || getUserName(item.updated_by) || createdByName || 'غير معروف';
          
          return {
            'الكود': item.code || '',
            'اسم الصنف': item.name || '',
            'اللون': item.color || '',
            'المخزن': getWarehouseLabel(item.warehouse_id),
            'مكان التخزين': item.item_location || '',
            'المورد': item.supplier || '',
            'عدد الكراتين': item.cartons_count || 0,
            'عدد في الكرتونة': item.per_carton_count || 0,
            'عدد القطع الفردية': item.single_bottles_count || 0,
            'الكمية الإجمالية المضافة': item.total_added || 0,
            'الكمية المتبقية': item.remaining_quantity || 0,
            'الحالة': 'منتهي',
            'أنشئ بواسطة': createdByName,
            'تم التحديث بواسطة': updatedByName,
            'تاريخ الإنشاء': formatDate(item.created_at),
            'آخر تحديث': formatDate(item.updated_at)
          };
        });
        
        exportProgress.value = 'جاري إنشاء ملف Excel...';
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(itemsData);
        
        const colWidths = [
          { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
          { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
          { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
          { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'الأصناف المنتهية');
        
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `الأصناف-المنتهية-${timestamp}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        store.dispatch('showNotification', {
          type: 'success',
          message: `تم تصدير ${finishedItems.value.length} صنف منتهي إلى Excel بنجاح`
        });
        
      } catch (error) {
        console.error('❌ Error exporting finished items to Excel:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في تصدير الأصناف المنتهية'
        });
      } finally {
        exporting.value = false;
        exportProgress.value = '';
      }
    };

    // ============================================
    // DATA LOADING METHODS
    // ============================================
    const loadInitialData = async () => {
      try {
        loading.value = true;
        
        const loadPromises = [
          store.dispatch('loadWarehouses'),
          store.dispatch('loadUsers')
        ];
        
        await Promise.all(loadPromises);
        
        const routeWarehouseId = route.params.warehouseId || route.query.warehouse;
        if (routeWarehouseId) {
          const warehouseExists = accessibleWarehouses.value.some(w => w.id === routeWarehouseId);
          if (warehouseExists) {
            selectedWarehouse.value = routeWarehouseId;
          }
        }
        
        console.log('🔄 Loading inventory via store...');
        await store.dispatch('loadAllInventory', { 
          forceRefresh: true
        });
        
        isDataFresh.value = true;
        lastUpdate.value = Date.now();
        lastStoreRefresh.value = Date.now(); // Track last full refresh
        
        await nextTick();
        resetScrollPositions();
        
        setTimeout(() => {
          if (scrollContainer.value) {
            calculateVisibleItems();
          }
          if (mobileScrollContainer.value) {
            calculateMobileVisibleItems();
          }
        }, 100);
        
      } catch (error) {
        console.error('❌ Error in loadInitialData:', error);
        
        error.value = 'فشل تحميل البيانات. الرجاء التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
        
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في تحميل البيانات. جاري إعادة المحاولة...'
        });
        
        setTimeout(() => {
          if (!inventoryLoaded.value) {
            loadInitialData();
          }
        }, 5000);
        
      } finally {
        loading.value = false;
      }
    };
    
    const loadMoreItems = async () => {
      if (isSearchMode.value) {
        return;
      }
      
      if (hasMore.value && !isFetchingMore.value && !loadingMore.value) {
        try {
          loadingMore.value = true;
          console.log('📥 Loading more items via store...');
          
          await store.dispatch('loadMoreInventory');
          
          console.log('✅ Loaded more items successfully');
          
          await nextTick();
          
        } catch (error) {
          console.error('❌ Error loading more items:', error);
          store.dispatch('showNotification', {
            type: 'error',
            message: 'خطأ في تحميل المزيد من العناصر'
          });
        } finally {
          loadingMore.value = false;
        }
      }
    };
    
    const refreshData = async () => {
      try {
        refreshing.value = true;
        
        await store.dispatch('loadAllInventory', { forceRefresh: true });
        
        lastUpdate.value = Date.now();
        isDataFresh.value = true;
        lastStoreRefresh.value = Date.now();
        
        if (searchTerm.value.trim() && searchTerm.value.trim().length >= 2) {
          await handleLiveSearch();
        }
        
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم تحديث البيانات بنجاح'
        });
        
      } catch (error) {
        console.error('❌ Error refreshing data:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في تحديث البيانات'
        });
      } finally {
        refreshing.value = false;
      }
    };

    // ============================================
    // UPDATED: Stock Status Functions for 500 threshold
    // ============================================
    const getStockStatus = (quantity) => {
      if (quantity === 0) return 'منتهي';
      if (quantity <= 500) return 'كمية قليلة';
      return 'متوفر';
    };
    
    const getStockStatusClass = (quantity) => {
      if (quantity === 0) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 shadow-sm';
      if (quantity <= 500) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800 shadow-sm';
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 shadow-sm';
    };
    
    const getQuantityClass = (quantity) => {
      if (quantity === 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10';
      if (quantity <= 500) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10';
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10';
    };
    
    const getStatusLabel = (status) => {
      const labels = {
        'in_stock': 'متوفر',
        'low_stock': 'كمية قليلة',
        'out_of_stock': 'منتهي'
      };
      return labels[status] || status;
    };

    // ============================================
    // ITEM ACTION HANDLERS WITH STORE INTEGRATION
    // ============================================
    const canEditItem = (item) => {
      if (userRole.value === 'superadmin') return true;
      if (userRole.value !== 'warehouse_manager') return false;
      
      const allowedWarehouses = store.getters.allowedWarehouses || [];
      return allowedWarehouses.includes(item.warehouse_id) || allowedWarehouses.includes('all');
    };
    
    const canTransferItem = (item) => canEditItem(item);
    const canDispatchItem = (item) => canEditItem(item);
    
    const canDeleteItem = (item) => {
      return canEditItem(item) && userRole.value === 'superadmin';
    };
    
    const showItemDetails = (item) => {
      selectedItem.value = {
        ...item,
        warehouse_name: getWarehouseLabel(item.warehouse_id),
        created_by_name: item.created_by_name || getUserName(item.created_by),
        updated_by_name: item.updated_by_name || getUserName(item.updated_by) || getUserName(item.created_by)
      };
      showDetailsModal.value = true;
      showActionMenu.value = null;
    };
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false;
      selectedItem.value = null;
    };
    
    const toggleActionMenu = (itemId) => {
      showActionMenu.value = showActionMenu.value === itemId ? null : itemId;
    };
    
    const handleTransfer = (item) => {
      if (!canTransferItem(item)) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية النقل من هذا المخزن'
        });
        return;
      }
      selectedItemForTransfer.value = item;
      showTransferModal.value = true;
      showDetailsModal.value = false;
      showActionMenu.value = null;
    };
    
    const handleDispatch = (item) => {
      if (!canDispatchItem(item)) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية الصرف من هذا المخزن'
        });
        return;
      }
      selectedItemForDispatch.value = item;
      showDispatchModal.value = true;
      showDetailsModal.value = false;
      showActionMenu.value = null;
    };
    
    const handleEdit = (item) => {
      if (!canEditItem(item)) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية التعديل على هذا المخزن'
        });
        return;
      }
      selectedItemForEdit.value = {
        ...item,
        warehouse_name: getWarehouseLabel(item.warehouse_id)
      };
      showEditModal.value = true;
      showDetailsModal.value = false;
      showActionMenu.value = null;
    };
    
    const handleDelete = (item) => {
      if (!canDeleteItem(item)) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'ليس لديك صلاحية حذف هذا الصنف'
        });
        return;
      }
      itemToDelete.value = {
        ...item,
        warehouse_name: getWarehouseLabel(item.warehouse_id),
        created_by_name: item.created_by_name || getUserName(item.created_by),
        updated_by_name: item.updated_by_name || getUserName(item.updated_by) || getUserName(item.created_by)
      };
      showDeleteConfirm.value = true;
      showActionMenu.value = null;
    };
    
    const confirmDelete = async () => {
      try {
        deleteLoading.value = true;
        await store.dispatch('deleteItem', itemToDelete.value.id);
        
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم حذف الصنف بنجاح!'
        });
        
        if (showDetailsModal.value && selectedItem.value?.id === itemToDelete.value.id) {
          closeDetailsModal();
        }
        
        if (searchTerm.value.trim()) {
          await handleLiveSearch();
        }
        
        showDeleteConfirm.value = false;
        itemToDelete.value = null;
        
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في حذف الصنف'
        });
      } finally {
        deleteLoading.value = false;
      }
    };

    // ============================================
    // CRITICAL: CORRECTED MODAL SUCCESS HANDLERS
    // ============================================
    const handleItemSaved = async (result) => {
      showAddModal.value = false;
      
      console.log('📦 Inventory: handleItemSaved called with result:', {
        type: result?.type,
        success: result?.success,
        itemId: result?.itemId || result?.id,
        itemName: result?.itemName,
        message: result?.message,
        hasItemData: !!result?.item,
        fullResult: result
      });
      
      if (!result) {
        console.error('❌ No result provided to handleItemSaved');
        store.dispatch('showNotification', {
          type: 'error',
          message: 'حدث خطأ: لم يتم استلام نتيجة من عملية الإضافة'
        });
        return;
      }
      
      // Show notification
      if (result.message) {
        store.dispatch('showNotification', {
          type: 'success',
          message: result.message
        });
      } else if (result.type === 'updated') {
        store.dispatch('showNotification', {
          type: 'success',
          message: `✅ تم تحديث الصنف "${result.itemName || 'غير معروف'}" بنجاح`
        });
      } else if (result.type === 'created') {
        store.dispatch('showNotification', {
          type: 'success',
          message: `✅ تم إضافة الصنف الجديد "${result.itemName || 'غير معروف'}" بنجاح`
        });
      }
      
      // Handle different result types
      if (result.type === 'updated') {
        // For updates: EditItemModal already updated Vuex state
        console.log('🔄 Item update processed by store, updating UI only');
        
        // If we have the item data, update local state
        if (result.item && result.item.id) {
          console.log('✅ Updating local state with item data');
          updateSingleItemInLocalState(result.item);
        }
        
      } else if (result.type === 'created') {
        // For new items: AddItemModal called store.dispatch('addInventoryItem')
        console.log('🆕 New item created, handling...');
        
        // OPTION 1: If the result contains the full item, add it directly
        if (result.item && result.item.id) {
          console.log('✅ Adding new item directly to local state:', {
            id: result.item.id,
            name: result.item.name,
            warehouse_id: result.item.warehouse_id
          });
          
          // Try to add to local Vuex state
          try {
            store.commit('ADD_INVENTORY_ITEM', result.item);
            console.log('✅ Added to Vuex state via ADD_INVENTORY_ITEM mutation');
          } catch (error) {
            console.warn('⚠️ Could not add to Vuex state:', error);
            // Fallback: Refresh from store
            if (shouldRefreshFromStore()) {
              console.log('🔄 Falling back to store refresh');
              await store.dispatch('refreshInventorySilently');
              lastStoreRefresh.value = Date.now();
            }
          }
        } 
        // OPTION 2: No item data, refresh from store with limits
        else if (shouldRefreshFromStore()) {
          console.log('🔄 Refreshing from store (new item, interval passed)');
          await store.dispatch('refreshInventorySilently');
          lastStoreRefresh.value = Date.now();
        } else {
          console.log('⏸️ Using cache for now, will refresh on next interval');
          // Item will appear on next refresh
        }
      }
      
      // Refresh search if active
      if (searchTerm.value.trim()) {
        console.log('🔍 Refreshing search after item operation...');
        await handleLiveSearch();
      }
      
      // Update UI timestamps
      lastUpdate.value = Date.now();
      isDataFresh.value = true;
      
      console.log('✅ handleItemSaved completed successfully');
    };
    
    const handleItemUpdated = async (result) => {
      try {
        showEditModal.value = false;
        selectedItemForEdit.value = null;
        
        console.log('✅ Inventory: handleItemUpdated called with result:', {
          type: result?.type,
          message: result?.message,
          itemName: result?.itemName,
          hasChangedFields: result?.changedFields?.length > 0
        });
        
        // Show notification
        if (result?.message) {
          store.dispatch('showNotification', {
            type: 'success',
            message: result.message
          });
        } else {
          store.dispatch('showNotification', {
            type: 'success',
            message: `✅ تم تحديث الصنف "${result?.itemName || 'غير معروف'}" بنجاح`
          });
        }
        
        // 🔴 CRITICAL: NO store calls needed here!
        // The EditItemModal already called store.dispatch('updateItem')
        // The store action already updated Vuex state via UPDATE_INVENTORY_ITEM
        
        // If we have item data, update local state
        if (result?.item && result.item.id) {
          console.log('✅ Updating local state with edited item');
          updateSingleItemInLocalState(result.item);
        }
        
        // Just update the UI timestamp
        lastUpdate.value = Date.now();
        isDataFresh.value = true;
        
        // Refresh search if active (this doesn't load all items)
        if (searchTerm.value.trim()) {
          await handleLiveSearch();
        }
        
      } catch (error) {
        console.error('❌ Error in handleItemUpdated:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في معالجة تحديث الصنف'
        });
      }
    };
    
    const handleTransferSuccess = async (result) => {
      showTransferModal.value = false;
      selectedItemForTransfer.value = null;
      
      console.log('✅ handleTransferSuccess called with result:', result);
      
      if (result?.message) {
        store.dispatch('showNotification', {
          type: 'success',
          message: result.message
        });
      } else {
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم النقل بين المخازن بنجاح!'
        });
      }
      
      // 🔴 CRITICAL: Only refresh if needed
      if (shouldRefreshFromStore()) {
        await store.dispatch('refreshInventorySilently');
        lastStoreRefresh.value = Date.now();
      }
      
      if (searchTerm.value.trim()) {
        await handleLiveSearch();
      }
      
      // Update UI
      lastUpdate.value = Date.now();
      isDataFresh.value = true;
    };
    
    const handleDispatchSuccess = async (result) => {
      // showDispatchModal.value = false;        // ✅ REMOVED – modal stays open
      selectedItemForDispatch.value = null;      // Clear the selected item for next dispatch
      
      console.log('✅ handleDispatchSuccess called with result:', result);
      
      if (result?.message) {
        store.dispatch('showNotification', {
          type: 'success',
          message: result.message
        });
      } else {
        store.dispatch('showNotification', {
          type: 'success',
          message: 'تم الصرف الخارجي بنجاح!'
        });
      }
      
      // 🔴 CRITICAL: Only refresh if needed
      if (shouldRefreshFromStore()) {
        await store.dispatch('refreshInventorySilently');
        lastStoreRefresh.value = Date.now();
      }
      
      if (searchTerm.value.trim()) {
        await handleLiveSearch();
      }
      
      // Update UI
      lastUpdate.value = Date.now();
      isDataFresh.value = true;
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);
    
    const getWarehouseLabel = (warehouseId) => {
      if (!warehouseId) return 'غير معروف';
      return store.getters.getWarehouseLabel ? store.getters.getWarehouseLabel(warehouseId) : warehouseId;
    };
    
    const getUserName = (userId) => {
      if (!userId) return 'نظام';
      if (userId === user.value?.uid) return currentUserInfo.value;
      
      const userObj = allUsers.value.find(u => u.id === userId);
      if (userObj) return userObj.name || userObj.email || userId;
      
      return userId;
    };
    
    const getLastActionUser = (item) => getUserName(item.updated_by || item.created_by);
    
    const colorMap = {
      'أحمر': '#ef4444', 'أزرق': '#3b82f6', 'أخضر': '#10b981',
      'أصفر': '#f59e0b', 'أسود': '#000000', 'أبيض': '#ffffff',
      'رمادي': '#6b7280', 'بني': '#92400e', 'وردي': '#ec4899',
      'برتقالي': '#f97316', 'بنفسجي': '#8b5cf6', 'ذهبي': '#d97706',
      'فضي': '#9ca3af'
    };
    
    const getColorHex = (colorName) => colorMap[colorName] || '#6b7280';
    
    const formatDate = (timestamp) => {
      if (!timestamp) return '-';
      try {
        let dateObj;
        if (timestamp.toDate) dateObj = timestamp.toDate();
        else if (timestamp instanceof Date) dateObj = timestamp;
        else dateObj = new Date(timestamp);
        
        if (isNaN(dateObj.getTime())) return '-';
        
        return dateObj.toLocaleDateString('ar-EG', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { return '-'; }
    };
    
    const formatRelativeTime = (timestamp) => {
      if (!timestamp) return '-';
      try {
        let dateObj;
        if (timestamp.toDate) dateObj = timestamp.toDate();
        else if (timestamp instanceof Date) dateObj = timestamp;
        else dateObj = new Date(timestamp);
        
        if (isNaN(dateObj.getTime())) return '-';
        
        const now = new Date();
        const diffMs = now - dateObj;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
        if (diffHours < 24) return `قبل ${diffHours} ساعة`;
        if (diffDays === 1) return 'أمس';
        if (diffDays < 7) return `قبل ${diffDays} أيام`;
        return formatDate(timestamp);
      } catch (e) { return '-'; }
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return 'قيد التحميل...';
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
      if (diffHours < 24) return `قبل ${diffHours} ساعة`;
      
      return new Date(timestamp).toLocaleTimeString('ar-EG', {
        hour: '2-digit', minute: '2-digit'
      });
    };
    
    const getPlaceholderImage = () => {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwM00vc3ZnIj4KPHBhdGggZD0iTTQgMTZMNC42ODYgMTUuMzE0QzQuODgyIDExLjUwNyA4LjA5MyA5IDEyIDlDMTUuOTA3IDkgMTkuMTE4IDExLjUwNyAxOS4zMTQgMTUuMzE0TDIwIDE2TTggMjFIMTZNNSAxNEgxOU0xMiAxN0MxMiAxNy41NTIyOCAxMS41NTIzIDE4IDExIDE4QzEwLjQ0NzcgMTggMTAgMTcuNTUyMyAxMCAxN0MxMCAxNi40NDc3IDEwLjQ0NzcgMTYgMTEgMTZDMTEuNTUyMyAxNiAxMiAxNi40NDc3IDEyIDE3WiIgc3Ryb2tlPSI2QjcyOEQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
    };
    
    const handleImageError = (event) => {
      event.target.src = getPlaceholderImage();
      event.target.onerror = null;
    };

    // ============================================
    // EXCEL EXPORT
    // ============================================
    const exportToExcel = async () => {
      if (!displayedItems.value?.length) {
        store.dispatch('showNotification', {
          type: 'error',
          message: 'لا توجد بيانات للتصدير'
        });
        return;
      }
      
      exporting.value = true;
      exportProgress.value = 'جاري تجهير البيانات...';
      
      try {
        const itemsByWarehouse = {};
        
        displayedItems.value.forEach((item, index) => {
          exportProgress.value = `جاري تجهير العنصر ${index + 1} من ${displayedItems.value.length}`;
          
          const warehouseId = item.warehouse_id;
          if (!itemsByWarehouse[warehouseId]) {
            itemsByWarehouse[warehouseId] = [];
          }
          
          const createdByName = item.created_by_name || getUserName(item.created_by) || 'غير معروف';
          const updatedByName = item.updated_by_name || getUserName(item.updated_by) || createdByName || 'غير معروف';
          
          itemsByWarehouse[warehouseId].push({
            'الكود': item.code || '',
            'اسم الصنف': item.name || '',
            'اللون': item.color || '',
            'المخزن': getWarehouseLabel(item.warehouse_id),
            'مكان التخزين': item.item_location || '',
            'المورد': item.supplier || '',
            'عدد الكراتين': item.cartons_count || 0,
            'عدد في الكرتونة': item.per_carton_count || 0,
            'عدد القطع الفردية': item.single_bottles_count || 0,
            'الكمية الإجمالية المضافة': item.total_added || 0,
            'الكمية المتبقية': item.remaining_quantity || 0,
            'الحالة': getStockStatus(item.remaining_quantity || 0),
            'أنشئ بواسطة': createdByName,
            'تم التحديث بواسطة': updatedByName,
            'تاريخ الإنشاء': formatDate(item.created_at),
            'آخر تحديث': formatDate(item.updated_at)
          });
        });
        
        exportProgress.value = 'جاري إنشاء ملف Excel...';
        
        const wb = XLSX.utils.book_new();
        
        const summaryData = [{
          'إجمالي الأصناف': displayedItems.value.length,
          'إجمالي الكمية': totalQuantity.value,
          'الأصناف قليلة المخزون': lowStockCount.value,
          'عدد المخازن': warehouseCount.value,
          'تاريخ التصدير': new Date().toLocaleDateString('ar-EG'),
          'تم التصدير بواسطة': currentUserInfo.value,
          'مصدر البيانات': isSearchMode.value ? 'بحث شامل' : 'بيانات مخزنة'
        }];
        
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'الملخص');
        
        Object.keys(itemsByWarehouse).forEach((warehouseId, index) => {
          const warehouseItems = itemsByWarehouse[warehouseId];
          const warehouseName = getWarehouseLabel(warehouseId).replace(/[^\w\u0600-\u06FF\s]/g, '').trim();
          const sheetName = warehouseName || `المخزن ${index + 1}`;
          
          if (warehouseItems.length > 0) {
            const ws = XLSX.utils.json_to_sheet(warehouseItems);
            
            const colWidths = [
              { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
              { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
              { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
              { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
            ];
            ws['!cols'] = colWidths;
            
            const safeSheetName = sheetName.slice(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
          }
        });
        
        exportProgress.value = 'جاري حفظ الملف...';
        
        const timestamp = new Date().toISOString().split('T')[0];
        const warehouseName = selectedWarehouse.value
          ? getWarehouseLabel(selectedWarehouse.value).replace(/\s+/g, '-')
          : 'جميع-المخازن';
        const searchInfo = searchTerm.value ? `-بحث-${searchTerm.value.substring(0, 10)}` : '';
        const fileName = `مخزون-${warehouseName}${searchInfo}-${timestamp}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        store.dispatch('showNotification', {
          type: 'success',
          message: `تم تصدير ${displayedItems.value.length} صنف إلى ${Object.keys(itemsByWarehouse).length} صفحة في ملف Excel بنجاح`
        });
        
      } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        store.dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في تصدير البيانات إلى Excel'
        });
      } finally {
        exporting.value = false;
        exportProgress.value = '';
      }
    };

    // ============================================
    // VIRTUAL SCROLLING METHODS
    // ============================================
    const calculateVisibleItems = () => {
      if (!scrollContainer.value) return;
      
      const container = scrollContainer.value;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      const rows = container.querySelectorAll('tbody tr');
      let rowHeight = 80;
      
      if (rows.length > 0) {
        const sampleRows = Math.min(5, rows.length);
        let totalHeight = 0;
        for (let i = 0; i < sampleRows; i++) {
          const rect = rows[i].getBoundingClientRect();
          totalHeight += rect.height;
        }
        rowHeight = Math.floor(totalHeight / sampleRows);
      }
      
      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - scrollBuffer);
      const endIndex = Math.min(
        displayedItems.value.length,
        startIndex + Math.ceil(clientHeight / rowHeight) + (scrollBuffer * 2)
      );
      
      const newIndex = Math.max(0, startIndex);
      if (Math.abs(newIndex - visibleStartIndex.value) > scrollBuffer / 2) {
        visibleStartIndex.value = newIndex;
      }
      
      return { startIndex, endIndex, rowHeight };
    };
    
    const onScroll = () => {
      if (!scrollContainer.value) return;
      
      const now = Date.now();
      
      if (now - lastScrollTime.value < SCROLL_THROTTLE_DELAY) {
        return;
      }
      lastScrollTime.value = now;
      
      if (scrollThrottle.value) {
        cancelAnimationFrame(scrollThrottle.value);
      }
      
      scrollThrottle.value = requestAnimationFrame(() => {
        const container = scrollContainer.value;
        if (!container) return;
        
        calculateVisibleItems();
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollTop + clientHeight;
        
        const loadMoreThreshold = scrollHeight - (clientHeight * 3);
        
        if (scrollBottom > loadMoreThreshold && 
            hasMore.value && 
            !isSearchMode.value && 
            !loadingMore.value && 
            !isFetchingMore.value) {
          loadMoreItems();
        }
        
        scrollThrottle.value = null;
      });
    };
    
    const calculateMobileVisibleItems = () => {
      if (!mobileScrollContainer.value) return;
      
      const container = mobileScrollContainer.value;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      const cards = container.querySelectorAll('div[data-mobile-card]');
      let cardHeight = 120;
      
      if (cards.length > 0) {
        const sampleCards = Math.min(3, cards.length);
        let totalHeight = 0;
        for (let i = 0; i < sampleCards; i++) {
          const rect = cards[i].getBoundingClientRect();
          totalHeight += rect.height;
        }
        cardHeight = Math.floor(totalHeight / sampleCards);
      }
      
      const startIndex = Math.max(0, Math.floor(scrollTop / cardHeight) - scrollBuffer);
      const endIndex = Math.min(
        displayedItems.value.length,
        startIndex + Math.ceil(clientHeight / cardHeight) + (scrollBuffer * 2)
      );
      
      const newIndex = Math.max(0, startIndex);
      if (Math.abs(newIndex - mobileVisibleStartIndex.value) > scrollBuffer / 2) {
        mobileVisibleStartIndex.value = newIndex;
      }
      
      return { startIndex, endIndex, cardHeight };
    };
    
    const onMobileScroll = () => {
      if (!mobileScrollContainer.value) return;
      
      const now = Date.now();
      
      if (now - lastScrollTime.value < SCROLL_THROTTLE_DELAY) {
        return;
      }
      lastScrollTime.value = now;
      
      if (scrollThrottle.value) {
        cancelAnimationFrame(scrollThrottle.value);
      }
      
      scrollThrottle.value = requestAnimationFrame(() => {
        const container = mobileScrollContainer.value;
        if (!container) return;
        
        calculateMobileVisibleItems();
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollTop + clientHeight;
        
        const loadMoreThreshold = scrollHeight - (clientHeight * 2);
        
        if (scrollBottom > loadMoreThreshold && 
            hasMore.value && 
            !isSearchMode.value && 
            !loadingMore.value && 
            !isFetchingMore.value) {
          loadMoreItems();
        }
        
        scrollThrottle.value = null;
      });
    };

    // ============================================
    // WATCHERS
    // ============================================
    watch(inventoryLoading, (newVal) => {
      if (!newVal && inventoryLoaded.value) {
        loading.value = false;
        isDataFresh.value = true;
        lastUpdate.value = Date.now();
        
        nextTick(() => {
          if (scrollContainer.value) {
            calculateVisibleItems();
          }
        });
      }
    });
    
    watch(searchResults, (newResults) => {
      if (newResults && newResults.length > 0) {
        console.log(`🔍 Store search results updated: ${newResults.length} items`);
        
        isDataFresh.value = true;
        lastUpdate.value = Date.now();
        resetScrollPositions();
        
        nextTick(() => {
          if (scrollContainer.value) calculateVisibleItems();
          if (mobileScrollContainer.value) calculateMobileVisibleItems();
        });
      }
    });
    
    watch(searchTerm, (newTerm) => {
      if (newTerm && newTerm.length >= 2) {
        handleLiveSearch();
      } else if (!newTerm || newTerm.length === 0) {
        store.dispatch('clearSearch');
      }
    });
    
    watch(() => route.params.warehouseId, (newWarehouseId) => {
      if (newWarehouseId && accessibleWarehouses.value.some(w => w.id === newWarehouseId)) {
        if (searchTerm.value) {
          clearSearch();
        }
        
        selectedWarehouse.value = newWarehouseId;
      }
    });

    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    onMounted(async () => {
      console.log('📱 Inventory Production mounted with OPTIMIZED STORE COMPLIANCE');
      
      const resizeObserver = new ResizeObserver(() => {
        if (scrollContainer.value) calculateVisibleItems();
        if (mobileScrollContainer.value) calculateMobileVisibleItems();
      });
      
      if (scrollContainer.value) {
        resizeObserver.observe(scrollContainer.value);
      }
      if (mobileScrollContainer.value) {
        resizeObserver.observe(mobileScrollContainer.value);
      }
      
      window.__inventoryResizeObserver = resizeObserver;
      
      await loadInitialData();
    });
    
    onUnmounted(() => {
      console.log('🧹 Cleaning up Inventory Production');
      
      if (window.__inventoryResizeObserver) {
        window.__inventoryResizeObserver.disconnect();
        delete window.__inventoryResizeObserver;
      }
      
      if (scrollThrottle.value) {
        cancelAnimationFrame(scrollThrottle.value);
      }
      
      handleLiveSearch.cancel();
      store.dispatch('clearSearch');
    });

    // ============================================
    // RETURN ALL REACTIVE VALUES AND METHODS
    // ============================================
    return {
      // State
      loading,
      loadingMore,
      showAddModal,
      showEditModal,
      showTransferModal,
      showDispatchModal,
      showDetailsModal,
      showDeleteConfirm,
      selectedItemForEdit,
      selectedItemForTransfer,
      selectedItemForDispatch,
      selectedItem,
      itemToDelete,
      exporting,
      deleteLoading,
      refreshing,
      exportProgress,
      error,
      showAllFinishedItems,
      
      // Local filters
      searchTerm,
      statusFilter,
      selectedWarehouse,
      
      // Mobile UI
      showFilters,
      showActionMenu,
      
      // Virtual scrolling refs
      scrollContainer,
      mobileScrollContainer,
      
      // Computed
      userRole,
      userProfile,
      displayedItems,
      accessibleWarehouses,
      allWarehouses,
      allUsers,
      inventoryLoading,
      inventoryLoaded,
      hasMore,
      isFetchingMore,
      totalLoaded,
      currentUserInfo,
      canAddItem,
      showActions,
      readonly,
      searchResults,
      isLiveSearching,
      isSearchMode,
      totalQuantity,
      lowStockCount,
      warehouseCount,
      hasActiveFilters,
      activeFilterCount,
      visibleItems,
      mobileVisibleItems,
      finishedItems,
      
      // Methods
      formatNumber,
      getWarehouseLabel,
      getUserName,
      getLastActionUser,
      getStatusLabel,
      getStockStatus,
      getStockStatusClass,
      getQuantityClass,
      getColorHex,
      formatDate,
      formatRelativeTime,
      formatTime,
      getPlaceholderImage,
      handleImageError,
      
      // Filter handlers (updated)
      handleLiveSearch,
      handleWarehouseChange,
      handleFilterChange,
      clearSearch,
      clearWarehouseFilter,
      clearAllFilters,
      resetScrollPositions,
      
      // Data loading
      loadMoreItems,
      refreshData,
      
      // Excel export
      exportToExcel,
      exportFinishedItemsToExcel,
      
      // UI actions
      toggleActionMenu,
      showItemDetails,
      closeDetailsModal,
      canEditItem,
      canTransferItem,
      canDispatchItem,
      canDeleteItem,
      handleTransfer,
      handleDispatch,
      handleEdit,
      handleDelete,
      confirmDelete,
      handleItemSaved,
      handleItemUpdated,
      handleTransferSuccess,
      handleDispatchSuccess,
      
      // Helper functions
      formatNumber,
      getWarehouseLabel,
      
      // Virtual scrolling
      onScroll,
      onMobileScroll,
      
      // Timestamps
      lastUpdate,
      isDataFresh
    };
  }
};
</script>
                      
<style scoped>
/* Enhanced Custom Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 6px;
  margin: 4px;
}

::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
}

::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

::-webkit-scrollbar-thumb:active {
  background: #475569;
}

.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark ::-webkit-scrollbar-thumb {
  background: #475569;
  border-color: #1e293b;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.dark ::-webkit-scrollbar-thumb:active {
  background: #94a3b8;
}

/* Smooth Table Transitions */
.table-transition-enter-active,
.table-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-transition-enter-from,
.table-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Card Hover Effects */
.hover-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .hover-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3),
              0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Loading Animations */
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.shimmer-effect {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.dark .shimmer-effect {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0) 100%
  );
}

/* Status Indicators with Animation */
.status-pulse {
  position: relative;
}

.status-pulse::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -12px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-50%) scale(1.2);
  }
}

.status-in-stock::after {
  background-color: #10b981;
  box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulse 2s infinite,
             glow-green 2s infinite alternate;
}

.status-low-stock::after {
  background-color: #f59e0b;
  box-shadow: 0 0 0 rgba(245, 158, 11, 0.4);
  animation: pulse 2s infinite,
             glow-orange 2s infinite alternate;
}

.status-out-of-stock::after {
  background-color: #ef4444;
  box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
  animation: pulse 2s infinite,
             glow-red 2s infinite alternate;
}

@keyframes glow-green {
  from { box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); }
  to { box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }
}

@keyframes glow-orange {
  from { box-shadow: 0 0 0 rgba(245, 158, 11, 0.4); }
  to { box-shadow: 0 0 10px rgba(245, 158, 11, 0.6); }
}

@keyframes glow-red {
  from { box-shadow: 0 0 0 rgba(239, 68, 68, 0.4); }
  to { box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); }
}

/* Responsive Typography */
@media (max-width: 640px) {
  .responsive-text {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  .responsive-heading {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }
}

/* Touch-friendly Elements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem;
}

.touch-target-sm {
  min-height: 36px;
  min-width: 36px;
  padding: 0.5rem;
}

/* Focus States */
.focus-ring:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.5);
  transition: box-shadow 0.2s ease;
}

.dark .focus-ring:focus {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.7);
}

/* Print Optimizations */
@media print {
  .print-hidden {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  .print-break-inside-avoid {
    break-inside: avoid;
  }
  
  .print-page-break-before {
    page-break-before: always;
  }
  
  .print-page-break-after {
    page-break-after: always;
  }
  
  .print-table {
    border-collapse: collapse;
    width: 100%;
  }
  
  .print-table th,
  .print-table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: right;
  }
  
  .print-table th {
    background-color: #f3f4f6;
    font-weight: bold;
  }
}

/* Loading Skeleton */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.375rem;
}

.dark .skeleton {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
}

/* Gradient Borders */
.gradient-border {
  position: relative;
  border-radius: 0.75rem;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(to right, #3b82f6, #8b5cf6) border-box;
  border: 2px solid transparent;
}

.dark .gradient-border {
  background: linear-gradient(#1f2937, #1f2937) padding-box,
              linear-gradient(to right, #3b82f6, #8b5cf6) border-box;
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .mobile-scroll-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  .mobile-no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .mobile-no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .mobile-tap-highlight {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }
  
  .mobile-tap-highlight:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .dark .mobile-tap-highlight:active {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* Smooth Transitions */
.smooth-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.smooth-transition-fast {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.smooth-transition-slow {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
</style>
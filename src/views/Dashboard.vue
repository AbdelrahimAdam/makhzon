<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white">
      <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold mb-2">تقرير المخزون</h1>
            <p class="text-blue-100 dark:text-blue-200 opacity-90">عرض وتحليل جميع أصناف المخزون</p>
          </div>
          
          <!-- Time and Date + Export Button -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
            
            <div class="flex gap-2">
              <button @click="exportToExcel" class="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m-6 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-4" />
                </svg>
                <span class="hidden sm:inline">تصدير Excel</span>
              </button>
              <button @click="refreshReport" class="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 backdrop-blur-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="hidden sm:inline">تحديث</span>
              </button>
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
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">جاري تحميل التقرير...</p>
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
        <button @click="refreshReport" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          إعادة المحاولة
        </button>
      </div>

      <!-- Report Content -->
      <template v-else>
        <!-- Summary Cards - Modern Dashboard Style -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <!-- Total Items Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">إجمالي الأصناف</p>
                <div v-if="statsLoading" class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(summary.totalItems) }}
                </p>
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span class="inline-flex items-center gap-1">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    100% من المخزون
                  </span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">متوسط الكمية</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ avgQuantityPerItem }}</span>
              </div>
            </div>
          </div>

          <!-- Total Quantity Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">إجمالي الوحدات</p>
                <div v-if="statsLoading" class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(summary.totalQuantity) }}
                </p>
                <div class="mt-2 flex flex-col gap-0.5 text-xs">
                  <span class="text-gray-500 dark:text-gray-400">كراتين: {{ formatNumber(totalCartonsFromItems) }}</span>
                  <span class="text-gray-500 dark:text-gray-400">فردي: {{ formatNumber(totalSinglesFromItems) }}</span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">قيمة تقديرية</span>
                <span class="font-medium text-green-600 dark:text-green-400">{{ formatNumber(estimatedTotalValue) }} ج</span>
              </div>
            </div>
          </div>

          <!-- Low Stock Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">مخزون منخفض</p>
                <div v-if="statsLoading" class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {{ formatNumber(summary.lowStock) }}
                </p>
                <div class="mt-2 text-xs">
                  <span class="text-gray-500 dark:text-gray-400">نسبة من المجموع</span>
                  <span class="font-medium text-orange-600 dark:text-orange-400 mr-1">{{ lowStockPercentage }}%</span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">أقل من 50 وحدة</span>
                <span class="font-medium text-orange-600 dark:text-orange-400">تحتاج مراجعة</span>
              </div>
            </div>
          </div>

          <!-- Out of Stock Card -->
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">نفد المخزون</p>
                <div v-if="statsLoading" class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <p v-else class="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                  {{ formatNumber(summary.outOfStock) }}
                </p>
                <div class="mt-2 text-xs">
                  <span class="text-gray-500 dark:text-gray-400">نسبة من المجموع</span>
                  <span class="font-medium text-red-600 dark:text-red-400 mr-1">{{ outOfStockPercentage }}%</span>
                </div>
              </div>
              <div class="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <svg class="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">صفر وحدة</span>
                <span class="font-medium text-red-600 dark:text-red-400">طلبية عاجلة</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section - Glass Card Style -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">من تاريخ</label>
              <input type="date" v-model="filters.dateFrom" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">إلى تاريخ</label>
              <input type="date" v-model="filters.dateTo" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المخزن</label>
              <select v-model="filters.warehouseId" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none">
                <option value="">جميع المخازن</option>
                <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name_ar || warehouse.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة</label>
              <select v-model="filters.status" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none">
                <option value="">جميع الأصناف</option>
                <option value="in_stock">متوفر (أكثر من 500)</option>
                <option value="critical_stock">مخزون حرج (51-500)</option>
                <option value="low_stock">مخزون منخفض (1-50)</option>
                <option value="out_of_stock">نفد المخزون (0)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="px-4 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">الصنف</th>
                  <th class="px-4 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">الكود</th>
                  <th class="px-4 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">المخزن</th>
                  <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">الكراتين</th>
                  <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">فردي</th>
                  <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">إجمالي الكمية</th>
                  <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="item in paginatedItems" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td class="px-4 py-4">
                    <div class="font-medium text-gray-900 dark:text-white">{{ item.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">المورد: {{ item.supplier || '—' }}</div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono">{{ item.code }}</span>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{{ getWarehouseName(item.warehouseId) }}</td>
                  <td class="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{{ formatNumber(item.cartonsCount) }} × {{ formatNumber(item.perCartonCount) }}</td>
                  <td class="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{{ formatNumber(item.singleBottlesCount) }}</td>
                  <td class="px-4 py-4 text-center font-bold text-gray-900 dark:text-white">{{ formatNumber(item.remainingQuantity) }}</td>
                  <td class="px-4 py-4 text-center">
                    <span :class="getStatusClass(item.remainingQuantity)" class="px-2 py-1 text-xs rounded-full font-medium">
                      {{ getStatusText(item.remainingQuantity) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="paginatedItems.length === 0">
                  <td colspan="7" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                    </svg>
                    <p class="font-medium">لا توجد أصناف</p>
                    <p class="text-sm mt-1">حاول تعديل البحث أو الفلاتر</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredItems.length > itemsPerPage" class="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div class="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              عرض {{ ((currentPage - 1) * itemsPerPage) + 1 }} إلى {{ Math.min(currentPage * itemsPerPage, filteredItems.length) }} من {{ formatNumber(filteredItems.length) }} صنف
            </div>
            <div class="flex gap-2 order-1 sm:order-2">
              <button @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium">
                السابق
              </button>
              <span class="px-4 py-2 text-gray-700 dark:text-gray-300 text-sm">صفحة {{ currentPage }} من {{ totalPages }}</span>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium">
                التالي
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useLanguageStore } from '@/stores/language'
import * as XLSX from 'xlsx'

const inventoryStore = useInventoryStore()
const warehouseStore = useWarehouseStore()
const languageStore = useLanguageStore()

// UI State
const initialLoading = ref(true)
const statsLoading = ref(false)
const loadError = ref('')
const currentTime = ref('')
const currentDate = ref('')
const lastUpdated = ref(new Date())

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(15)

// Filters
const filters = ref({
  dateFrom: '',
  dateTo: '',
  warehouseId: '',
  status: '',
})

const warehouses = computed(() => warehouseStore.warehouses)

// Format numbers
const formatNumber = (num: number) => {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString()
}

// Filtered items with correct stock thresholds
const filteredItems = computed(() => {
  let items = inventoryStore.items
  
  if (filters.value.warehouseId) {
    items = items.filter(item => item.warehouseId === filters.value.warehouseId)
  }
  
  // Stock status filtering
  if (filters.value.status === 'in_stock') {
    items = items.filter(item => item.remainingQuantity > 500)
  } else if (filters.value.status === 'critical_stock') {
    items = items.filter(item => item.remainingQuantity > 50 && item.remainingQuantity <= 500)
  } else if (filters.value.status === 'low_stock') {
    items = items.filter(item => item.remainingQuantity > 0 && item.remainingQuantity <= 50)
  } else if (filters.value.status === 'out_of_stock') {
    items = items.filter(item => item.remainingQuantity === 0)
  }
  
  // Date filtering would require created_at field on items
  // if (filters.value.dateFrom && filters.value.dateTo) { ... }
  
  return items
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value))
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredItems.value.slice(start, end)
})

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Summary stats
const summary = computed(() => ({
  totalItems: filteredItems.value.length,
  totalQuantity: filteredItems.value.reduce((sum, item) => sum + item.remainingQuantity, 0),
  lowStock: filteredItems.value.filter(item => item.remainingQuantity > 0 && item.remainingQuantity <= 50).length,
  outOfStock: filteredItems.value.filter(item => item.remainingQuantity === 0).length,
}))

// Percentages
const lowStockPercentage = computed(() => {
  if (summary.value.totalItems === 0) return 0
  return Math.round((summary.value.lowStock / summary.value.totalItems) * 100)
})

const outOfStockPercentage = computed(() => {
  if (summary.value.totalItems === 0) return 0
  return Math.round((summary.value.outOfStock / summary.value.totalItems) * 100)
})

// Additional calculated values
const avgQuantityPerItem = computed(() => {
  if (summary.value.totalItems === 0) return 0
  return Math.round(summary.value.totalQuantity / summary.value.totalItems)
})

const estimatedTotalValue = computed(() => {
  return summary.value.totalQuantity * 25 // Assuming average price 25 EGP
})

const totalCartonsFromItems = computed(() => {
  return filteredItems.value.reduce((sum, item) => {
    return sum + (item.cartonsCount * item.perCartonCount)
  }, 0)
})

const totalSinglesFromItems = computed(() => {
  return filteredItems.value.reduce((sum, item) => sum + item.singleBottlesCount, 0)
})

// Helper functions
const getWarehouseName = (warehouseId: string) => {
  const warehouse = warehouses.value.find(w => w.id === warehouseId)
  return warehouse?.name_ar || warehouse?.name || 'غير معروف'
}

const getStatusClass = (quantity: number) => {
  if (quantity === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  if (quantity <= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
  if (quantity <= 500) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
}

const getStatusText = (quantity: number) => {
  if (quantity === 0) return 'نفد المخزون'
  if (quantity <= 50) return 'مخزون منخفض'
  if (quantity <= 500) return 'مخزون حرج'
  return 'متوفر'
}

// Format relative time
const formatRelativeTime = (timestamp: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays === 1) return 'أمس'
  if (diffDays < 7) return `منذ ${diffDays} أيام`
  
  return timestamp.toLocaleDateString('ar-EG')
}

// Time update
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  currentDate.value = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Export to Excel
const exportToExcel = () => {
  const exportData = filteredItems.value.map(item => ({
    'الصنف': item.name,
    'الكود': item.code,
    'المخزن': getWarehouseName(item.warehouseId),
    'الكراتين': `${item.cartonsCount} × ${item.perCartonCount}`,
    'القطع الفردية': item.singleBottlesCount,
    'إجمالي الكمية': item.remainingQuantity,
    'المورد': item.supplier || '—',
    'الحالة': getStatusText(item.remainingQuantity)
  }))
  
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير المخزون')
  
  const fileName = `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Refresh report
const refreshReport = async () => {
  statsLoading.value = true
  try {
    await warehouseStore.fetchWarehouses()
    await inventoryStore.fetchItems()
    lastUpdated.value = new Date()
    currentPage.value = 1
  } catch (error: any) {
    loadError.value = error.message || 'حدث خطأ في تحديث التقرير'
  } finally {
    statsLoading.value = false
  }
}

// Load initial data
const loadData = async () => {
  initialLoading.value = true
  loadError.value = ''
  try {
    await warehouseStore.fetchWarehouses()
    await inventoryStore.fetchItems()
    lastUpdated.value = new Date()
  } catch (error: any) {
    loadError.value = error.message || 'حدث خطأ في تحميل البيانات'
  } finally {
    initialLoading.value = false
  }
}

// Watch filters to reset pagination
import { watch } from 'vue'
watch([() => filters.value.warehouseId, () => filters.value.status], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  updateTime()
  const timeInterval = setInterval(updateTime, 60000)
  loadData()
  
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})
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

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dark ::-webkit-scrollbar-track {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Table hover effect */
tbody tr {
  transition: background-color 0.2s ease;
}

/* Disabled button state */
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>

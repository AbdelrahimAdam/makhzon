// Performance configuration
export const PERFORMANCE_CONFIG = {
  INITIAL_LOAD: 50,
  SCROLL_LOAD: 20,
  SEARCH_LIMIT: 25,
  INVOICE_LOAD_LIMIT: 100,
  SEARCH_DEBOUNCE: 300,
  MIN_SEARCH_CHARS: 2,
  MAX_REALTIME_LISTENERS: 30,
  BATCH_SIZE: 10
};

// Search configuration
export const SEARCH_CONFIG = {
  FIELDS: ['name', 'code', 'color', 'supplier', 'item_location', 'warehouse_id'],
  MAX_RESULTS: 25
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 3000,
  ERROR_DURATION: 5000,
  SUCCESS_DURATION: 2000,
  MAX_NOTIFICATIONS: 10
};

// Field name mapping
export const FIELD_MAPPINGS = {
  arabicToEnglish: {
    'الاسم': 'name',
    'الكود': 'code',
    'اللون': 'color',
    'المخزن_id': 'warehouse_id',
    'المخزن': 'warehouse_id',
    'عدد_الكراتين': 'cartons_count',
    'عدد_في_الكرتونه': 'per_carton_count',
    'عدد_القزاز_الفردي': 'single_bottles_count',
    'الكميه_المضافه': 'total_added',
    'الكميه_المتبقيه': 'remaining_quantity',
    'المورد': 'supplier',
    'مكان_الصنف': 'item_location'
  },
  englishToArabic: {
    name: 'الاسم',
    code: 'الكود',
    color: 'اللون',
    warehouse_id: 'المخزن',
    cartons_count: 'عدد الكراتين',
    per_carton_count: 'عدد في الكرتونة',
    single_bottles_count: 'عدد القزاز الفردي',
    total_added: 'الكمية المضافة',
    remaining_quantity: 'الكمية المتبقية',
    supplier: 'المورد',
    item_location: 'مكان الصنف',
    notes: 'ملاحظات',
    barcode: 'الباركود',
    sku: 'رمز SKU',
    category: 'الفئة'
  }
};

// Spark Plan Enhanced Configuration
export const SPARK_CONFIG = {
  MAX_RESULTS: 25,
  LOCAL_SEARCH_LIMIT: 200,
  INITIAL_DISPLAY_LIMIT: 15,
  CACHE_TTL: 300000, // 5 minutes
  MAX_CACHE_ENTRIES: 100,
  CACHE_CLEANUP_INTERVAL: 30000, // 30 seconds
  SEARCH_DEBOUNCE: 400,
  ARTIFICIAL_DELAY: 50,
  PARALLEL_TIMEOUT: 5000,
  FIELD_LIMITS: ['name', 'code', 'color', 'supplier'],
  RELEVANCE_WEIGHTS: {
    CODE_EXACT: 1000,
    CODE_STARTS: 500,
    NAME_EXACT: 400,
    NAME_STARTS: 300,
    NAME_CONTAINS: 200,
    OTHER_FIELDS: 100,
    QUANTITY_BONUS: 50,
    RECENCY_BONUS: 50
  }
};

// Transaction types (copied from InventoryService for convenience)
export const TRANSACTION_TYPES = {
  ADD: 'ADD',
  TRANSFER: 'TRANSFER',
  DISPATCH: 'DISPATCH',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

// Field labels (alias for englishToArabic)
export const FIELD_LABELS = FIELD_MAPPINGS.englishToArabic;
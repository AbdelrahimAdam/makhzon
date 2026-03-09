import { FIELD_MAPPINGS } from './utils/constants';

export default () => ({
  user: null,
  userProfile: null,
  loading: false,
  authError: null,
  warehouses: [],
  warehousesLoaded: false,
  inventory: [],
  inventoryLoaded: false,
  inventoryLoading: false,
  inventoryError: null,
  pagination: {
    lastDoc: null,
    hasMore: true,
    currentPage: 0,
    totalLoaded: 0,
    isFetching: false
  },
  filters: {
    warehouse: '',
    search: '',
    searchField: 'name'
  },
  transactions: [],
  recentTransactions: [],
  transactionsLoading: false,
  itemHistory: [],
  notifications: [],
  notificationTimeouts: {},
  realtimeMode: true,
  realtimeListeners: [],
  operationLoading: false,
  operationError: null,
  requiresCompositeIndex: false,
  allUsers: [],
  usersLoading: false,
  fieldMappings: FIELD_MAPPINGS,
  inventoryLastFetched: null,
  isFetchingInventory: false,
  isRefreshingSilently: false,
  recentTransactionsLoading: false,
  activeItemListeners: new Set(),

  // Search State
  search: {
    query: '',
    results: [],
    loading: false,
    error: null,
    source: 'none',
    timestamp: null,
    suggestions: []
  },
  warehouseFilter: '',

  // Invoice System State
  invoices: [],
  invoicesLoaded: false,
  invoicesLoading: false,
  invoicesError: null,
  invoiceFilters: {
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  },
  invoicePagination: {
    lastDoc: null,
    hasMore: true,
    currentPage: 0,
    totalLoaded: 0,
    isFetching: false
  },
  invoiceStats: {
    totalInvoices: 0,
    totalSales: 0,
    totalTax: 0,
    uniqueCustomers: 0,
    lastUpdated: null
  },

  // SPARK Performance Monitoring
  searchPerformance: {
    searches: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    successRate: 1,
    lastSearchDuration: 0
  }
});
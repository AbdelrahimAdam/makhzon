export default {
  RESET_STATE(state) {
    Object.values(state.notificationTimeouts).forEach(timeoutId => {
      clearTimeout(timeoutId);
    });

    state.inventory = [];
    state.inventoryLoaded = false;
    state.transactions = [];
    state.recentTransactions = [];
    state.itemHistory = [];
    state.warehouses = [];
    state.warehousesLoaded = false;
    state.notifications = [];
    state.notificationTimeouts = {};
    state.allUsers = [];
    state.filters = {
      warehouse: '',
      search: '',
      searchField: 'name'
    };
    state.search = {
      query: '',
      results: [],
      loading: false,
      error: null,
      source: 'none',
      timestamp: null,
      suggestions: []
    };
    state.warehouseFilter = '';
    state.invoices = [];
    state.invoicesLoaded = false;
    state.invoiceFilters = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    };
    state.invoiceStats = {
      totalInvoices: 0,
      totalSales: 0,
      totalTax: 0,
      uniqueCustomers: 0,
      lastUpdated: null
    };
    state.searchPerformance = {
      searches: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      successRate: 1,
      lastSearchDuration: 0
    };

    state.realtimeListeners.forEach(unsubscribe => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('Error unsubscribing listener:', error);
      }
    });
    state.realtimeListeners = [];
    state.activeItemListeners.clear();
  },
};
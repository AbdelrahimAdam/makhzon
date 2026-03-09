import { TRANSACTION_TYPES } from '../utils/constants';

export default {
  dashboardStats: (state, getters) => {
    const inventory = getters.filteredInventory;
    const recentTransactions = getters.recentTransactions;
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
    const lowStockItems = inventory.filter(item => (item.remaining_quantity || 0) < 10).length;
    const outOfStockItems = inventory.filter(item => (item.remaining_quantity || 0) === 0).length;
    const averageValuePerItem = 50;
    const estimatedValue = totalQuantity * averageValuePerItem;
    const recentTransactionsCount = recentTransactions.length;
    const addTransactions = recentTransactions.filter(t => t.type === TRANSACTION_TYPES.ADD).length;
    const transferTransactions = recentTransactions.filter(t => t.type === TRANSACTION_TYPES.TRANSFER).length;
    const dispatchTransactions = recentTransactions.filter(t => t.type === TRANSACTION_TYPES.DISPATCH).length;

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      outOfStockItems,
      estimatedValue,
      recentTransactions: recentTransactionsCount,
      addTransactions,
      transferTransactions,
      dispatchTransactions,
      transactionsByType: {
        add: addTransactions,
        transfer: transferTransactions,
        dispatch: dispatchTransactions
      }
    };
  },
  dashboardRealStats: (state) => (warehouseId = 'all') => {
    const inventory = state.inventory;
    const filteredInventory = warehouseId === 'all' 
      ? inventory 
      : inventory.filter(item => item.warehouse_id === warehouseId);

    return {
      totalItems: filteredInventory.length,
      totalQuantity: filteredInventory.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0),
      lowStockItems: filteredInventory.filter(item => (item.remaining_quantity || 0) < 10).length,
      lastUpdated: new Date()
    };
  },
  warehouseStats: (state) => (warehouseId) => {
    const inventory = warehouseId === 'all' 
      ? state.inventory 
      : state.inventory.filter(item => item.warehouse_id === warehouseId);

    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + (item.remaining_quantity || 0), 0);
    const lowStockItems = inventory.filter(item => (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0).length;
    const outOfStockItems = inventory.filter(item => (item.remaining_quantity || 0) === 0).length;

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      outOfStockItems,
      lastUpdated: new Date()
    };
  },
  getDestinationLabel: () => (destinationId) => {
    // This was originally imported from InventoryService; we'll replicate the mapping
    const DESTINATION_LABELS = {
      'dubi_factory': 'مصنع دبي',
      'external_wharehouse': 'صرف خارجي',
      'factory': 'مصنع البران',
      'dispat_item': 'موقع صرف',
      'zahra': 'صرف الي مخزن الزهراء',
      'ghabashi': 'مخزن الغباشي',
      'al_ghabashi': 'مخزن الغباشي',
    };
    return DESTINATION_LABELS[destinationId] || destinationId;
  },
  getManualLoadStatus: (state) => {
    return {
      hasMore: state.pagination.hasMore,
      isFetchingMore: state.pagination.isFetching,
      totalLoaded: state.pagination.totalLoaded,
      nextBatchSize: 20, // SCROLL_LOAD
      canLoadMore: state.pagination.hasMore && !state.pagination.isFetching
    };
  },
};
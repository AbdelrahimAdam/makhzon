export default {
  inventoryError: state => state.inventoryError,
  allInventory: state => state.inventory,
  inventoryItems: state => Array.isArray(state.inventory) ? state.inventory : [],
  inventoryCount: state => state.inventory.length,
  isLoading: state => state.inventoryLoading,
  isLoaded: state => state.inventoryLoaded,
  inventoryLoading: state => state.inventoryLoading,
  hasMore: state => state.pagination.hasMore,
  inventoryHasMore: state => state.pagination.hasMore,
  isFetchingMore: state => state.pagination.isFetching,
  totalLoaded: state => state.pagination.totalLoaded,
  filteredInventory: (state, getters) => {
    let inventory = state.inventory;

    if (state.filters.warehouse) {
      inventory = inventory.filter(item => item.warehouse_id === state.filters.warehouse);
    }

    if (state.filters.search && state.filters.search.length >= 2) {
      const searchLower = state.filters.search.toLowerCase();
      const searchField = state.filters.searchField;

      inventory = inventory.filter(item => {
        if (searchField === 'name') {
          return item.name?.toLowerCase().includes(searchLower);
        } else if (searchField === 'code') {
          return item.code?.toLowerCase().includes(searchLower);
        } else if (searchField === 'color') {
          return item.color?.toLowerCase().includes(searchLower);
        } else if (searchField === 'supplier') {
          return item.supplier?.toLowerCase().includes(searchLower);
        }
        return item.name?.toLowerCase().includes(searchLower) ||
               item.code?.toLowerCase().includes(searchLower) ||
               item.color?.toLowerCase().includes(searchLower) ||
               item.supplier?.toLowerCase().includes(searchLower);
      });
    }

    return inventory;
  },
  getCachedItem: (state) => (itemId) => {
    return state.inventory.find(item => item.id === itemId) || null;
  },
  fieldMappings: state => state.fieldMappings,
  getArabicLabel: (state) => (fieldName) => {
    const mappings = state.fieldMappings;
    return mappings.englishToArabic[fieldName] || fieldName;
  },
};
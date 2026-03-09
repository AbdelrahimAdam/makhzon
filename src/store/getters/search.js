import { PERFORMANCE_CONFIG } from '../utils/constants';

export default {
  searchQuery: state => state.search.query,
  searchResults: state => state.search.results,
  searchLoading: state => state.search.loading,
  searchError: state => state.search.error,
  searchSource: state => state.search.source,
  searchSuggestions: state => state.search.suggestions,
  warehouseFilter: state => state.warehouseFilter,

  filteredInventoryEnhanced: (state, getters) => {
    let inventory = state.inventory;

    if (state.warehouseFilter && state.warehouseFilter !== 'all') {
      inventory = inventory.filter(item => item.warehouse_id === state.warehouseFilter);
    }

    if (state.search.query && state.search.query.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS) {
      if (state.search.results.length > 0 && 
          state.search.source !== 'none' &&
          Date.now() - new Date(state.search.timestamp).getTime() < 10000) {
        return state.search.results;
      }

      const searchTerm = state.search.query.toLowerCase();
      inventory = inventory.filter(item => 
        item.name?.toLowerCase().includes(searchTerm) ||
        item.code?.toLowerCase().includes(searchTerm) ||
        item.color?.toLowerCase().includes(searchTerm) ||
        item.supplier?.toLowerCase().includes(searchTerm)
      );
    }

    return inventory;
  },

  getRealTimeSearchAvailable: (state) => {
    return state.search.query && 
           state.search.query.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS &&
           state.search.results.length > 0 && 
           state.search.source === 'firebase';
  },

  getFilteredSearchSuggestions: (state) => {
    if (!state.search.query || state.search.query.length < PERFORMANCE_CONFIG.MIN_SEARCH_CHARS) {
      return [];
    }

    const query = state.search.query.toLowerCase();
    return state.search.suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query)
    ).slice(0, 10);
  },

  getSearchStats: (state) => {
    const localResults = state.inventory.filter(item => 
      state.search.query && 
      state.search.query.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS &&
      (
        item.name?.toLowerCase().includes(state.search.query.toLowerCase()) ||
        item.code?.toLowerCase().includes(state.search.query.toLowerCase()) ||
        item.color?.toLowerCase().includes(state.search.query.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(state.search.query.toLowerCase())
      )
    ).length;

    return {
      localResults,
      firebaseResults: state.search.results.length,
      queryLength: state.search.query?.length || 0,
      isSearching: state.search.loading,
      lastSearchSource: state.search.source
    };
  },

  getWarehouseSearchResults: (state) => {
    if (!state.search.query || state.search.query.length < PERFORMANCE_CONFIG.MIN_SEARCH_CHARS) {
      return [];
    }

    const query = state.search.query.toLowerCase();
    const recentFirebaseResults = state.search.results.length > 0 && 
                                  state.search.source === 'firebase';

    if (recentFirebaseResults) {
      return state.search.results;
    }

    return state.inventory.filter(item => 
      item.name?.toLowerCase().includes(query) ||
      item.code?.toLowerCase().includes(query) ||
      item.color?.toLowerCase().includes(query) ||
      item.supplier?.toLowerCase().includes(query)
    );
  },

  getSearchReady: (state) => {
    return state.inventoryLoaded || 
           (state.search.query && 
            state.search.query.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS &&
            state.search.results.length > 0);
  },
};
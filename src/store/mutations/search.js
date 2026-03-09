export default {
  SET_SEARCH_QUERY(state, query) {
    state.search.query = query;
  },
  SET_SEARCH_RESULTS(state, { results, source, query }) {
    state.search.results = results;
    state.search.source = source;
    state.search.timestamp = new Date();
    state.search.loading = false;
  },
  SET_SEARCH_LOADING(state, loading) {
    state.search.loading = loading;
  },
  SET_SEARCH_ERROR(state, error) {
    state.search.error = error;
  },
  CLEAR_SEARCH(state) {
    state.search.results = [];
    state.search.query = '';
    state.search.loading = false;
    state.search.error = null;
    state.search.source = 'none';
    state.search.suggestions = [];
  },
  SET_WAREHOUSE_FILTER(state, warehouseId) {
    state.warehouseFilter = warehouseId;
    state.filters.warehouse = warehouseId;
  },
  SET_SEARCH_SUGGESTIONS(state, suggestions) {
    state.search.suggestions = suggestions;
  },
  UPDATE_SEARCH_PERFORMANCE(state, { duration, cacheHit = false }) {
    state.searchPerformance.searches++;
    state.searchPerformance.lastSearchDuration = duration;
    state.searchPerformance.avgResponseTime = 
      (state.searchPerformance.avgResponseTime * (state.searchPerformance.searches - 1) + duration) / 
      state.searchPerformance.searches;

    const totalHits = state.searchPerformance.cacheHitRate * (state.searchPerformance.searches - 1);
    state.searchPerformance.cacheHitRate = (totalHits + (cacheHit ? 1 : 0)) / state.searchPerformance.searches;
  },
};
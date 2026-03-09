export default {
  SET_INVENTORY(state, inventory) {
    state.inventory = inventory;
  },
  APPEND_INVENTORY(state, items) {
    const existingIds = new Set(state.inventory.map(item => item.id));
    const newItems = items.filter(item => !existingIds.has(item.id));
    state.inventory.push(...newItems);
    state.pagination.totalLoaded = state.inventory.length;
  },
  UPDATE_INVENTORY_ITEM(state, updatedItem) {
    const index = state.inventory.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      state.inventory.splice(index, 1, updatedItem);
    } else {
      state.inventory.unshift(updatedItem);
      state.pagination.totalLoaded++;
    }
  },
  REMOVE_INVENTORY_ITEM(state, itemId) {
    state.inventory = state.inventory.filter(item => item.id !== itemId);
    state.pagination.totalLoaded = state.inventory.length;
  },
  SET_INVENTORY_LOADING(state, loading) {
    state.inventoryLoading = loading;
  },
  SET_INVENTORY_LOADED(state, loaded) {
    state.inventoryLoaded = loaded;
  },
  SET_INVENTORY_ERROR(state, error) {
    state.inventoryError = error;
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination };
  },
  RESET_PAGINATION(state) {
    state.pagination = {
      lastDoc: null,
      hasMore: true,
      currentPage: 0,
      totalLoaded: 0,
      isFetching: false
    };
  },
  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters };
  },
  CLEAR_FILTERS(state) {
    state.filters = {
      warehouse: '',
      search: '',
      searchField: 'name'
    };
  },
  SET_INVENTORY_LAST_FETCHED(state, timestamp) {
    state.inventoryLastFetched = timestamp;
  },
  SET_IS_FETCHING_INVENTORY(state, fetching) {
    state.isFetchingInventory = fetching;
  },
  SET_IS_REFRESHING_SILENTLY(state, refreshing) {
    state.isRefreshingSilently = refreshing;
  },
};
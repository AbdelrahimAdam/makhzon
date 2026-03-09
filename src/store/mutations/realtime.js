export default {
  SET_REALTIME_MODE(state, mode) {
    state.realtimeMode = mode;
  },
  ADD_REALTIME_LISTENER(state, listener) {
    if (typeof listener === 'function') {
      state.realtimeListeners.push(listener);
    }
  },
  CLEAR_REALTIME_LISTENERS(state) {
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
  ADD_ITEM_LISTENER(state, itemId) {
    state.activeItemListeners.add(itemId);
  },
  REMOVE_ITEM_LISTENER(state, itemId) {
    state.activeItemListeners.delete(itemId);
  },
  CLEAR_ITEM_LISTENERS(state) {
    state.activeItemListeners.clear();
  },
};
export default {
  SET_TRANSACTIONS(state, transactions) {
    state.transactions = transactions;
  },
  SET_RECENT_TRANSACTIONS(state, transactions) {
    state.recentTransactions = transactions;
  },
  SET_TRANSACTIONS_LOADING(state, loading) {
    state.transactionsLoading = loading;
  },
  ADD_TRANSACTION(state, transaction) {
    if (transaction) {
      state.transactions.unshift(transaction);
      state.recentTransactions.unshift(transaction);
      if (state.recentTransactions.length > 50) {
        state.recentTransactions = state.recentTransactions.slice(0, 50);
      }
    }
  },
  ADD_RECENT_TRANSACTION(state, transaction) {
    if (transaction) {
      state.recentTransactions.unshift(transaction);
      if (state.recentTransactions.length > 50) {
        state.recentTransactions = state.recentTransactions.slice(0, 50);
      }
    }
  },
  SET_ITEM_HISTORY(state, history) {
    state.itemHistory = history;
  },
  SET_RECENT_TRANSACTIONS_LOADING(state, loading) {
    state.recentTransactionsLoading = loading;
  },
};
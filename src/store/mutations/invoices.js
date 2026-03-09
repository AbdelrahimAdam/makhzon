export default {
  SET_INVOICES(state, invoices) {
    state.invoices = invoices;
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.unshift(invoice);
  },
  UPDATE_INVOICE(state, updatedInvoice) {
    const index = state.invoices.findIndex(inv => inv.id === updatedInvoice.id);
    if (index !== -1) {
      state.invoices.splice(index, 1, updatedInvoice);
    } else {
      state.invoices.unshift(updatedInvoice);
    }
  },
  REMOVE_INVOICE(state, invoiceId) {
    state.invoices = state.invoices.filter(inv => inv.id !== invoiceId);
  },
  SET_INVOICES_LOADING(state, loading) {
    state.invoicesLoading = loading;
  },
  SET_INVOICES_LOADED(state, loaded) {
    state.invoicesLoaded = loaded;
  },
  SET_INVOICES_ERROR(state, error) {
    state.invoicesError = error;
  },
  SET_INVOICE_FILTERS(state, filters) {
    state.invoiceFilters = { ...state.invoiceFilters, ...filters };
  },
  CLEAR_INVOICE_FILTERS(state) {
    state.invoiceFilters = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    };
  },
  SET_INVOICE_PAGINATION(state, pagination) {
    state.invoicePagination = { ...state.invoicePagination, ...pagination };
  },
  RESET_INVOICE_PAGINATION(state) {
    state.invoicePagination = {
      lastDoc: null,
      hasMore: true,
      currentPage: 0,
      totalLoaded: 0,
      isFetching: false
    };
  },
  SET_INVOICE_STATS(state, stats) {
    state.invoiceStats = { ...state.invoiceStats, ...stats };
  },
  CALCULATE_INVOICE_STATS(state) {
    const validInvoices = state.invoices.filter(inv => inv.status !== 'cancelled');

    const totalInvoices = validInvoices.length;
    const totalSales = validInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalTax = validInvoices
      .filter(inv => inv.type === 'B2B' || inv.type === 'B2C')
      .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);

    const customers = new Set();
    validInvoices.forEach(inv => {
      if (inv.customer?.phone) {
        customers.add(inv.customer.phone);
      }
    });

    state.invoiceStats = {
      totalInvoices,
      totalSales,
      totalTax,
      uniqueCustomers: customers.size,
      lastUpdated: new Date()
    };
  },
};
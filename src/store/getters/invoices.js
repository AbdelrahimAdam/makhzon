import { getInvoiceTypeLabel, getInvoiceStatusLabel, getPaymentMethodLabel } from '../utils/helpers';

export default {
  invoices: state => state.invoices,
  invoicesItems: state => Array.isArray(state.invoices) ? state.invoices : [],
  invoicesCount: state => state.invoices.length,
  invoicesLoading: state => state.invoicesLoading,
  invoicesLoaded: state => state.invoicesLoaded,
  invoicesError: state => state.invoicesError,
  invoiceStats: state => state.invoiceStats,
  filteredInvoices: (state) => {
    let filtered = [...state.invoices];

    if (state.invoiceFilters.search) {
      const searchLower = state.invoiceFilters.search.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toString().includes(searchLower) ||
        invoice.customer?.name?.toLowerCase().includes(searchLower) ||
        invoice.customer?.phone?.includes(searchLower)
      );
    }

    if (state.invoiceFilters.status) {
      filtered = filtered.filter(invoice => invoice.status === state.invoiceFilters.status);
    }

    if (state.invoiceFilters.type) {
      filtered = filtered.filter(invoice => invoice.type === state.invoiceFilters.type);
    }

    if (state.invoiceFilters.dateFrom) {
      const fromDate = new Date(state.invoiceFilters.dateFrom);
      filtered = filtered.filter(invoice => {
        const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
        return invoiceDate >= fromDate;
      });
    }

    if (state.invoiceFilters.dateTo) {
      const toDate = new Date(state.invoiceFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => {
        const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
        return invoiceDate <= toDate;
      });
    }

    return filtered;
  },
  hasInvoiceFilters: (state) => {
    return !!state.invoiceFilters.search || 
           !!state.invoiceFilters.status || 
           !!state.invoiceFilters.type || 
           !!state.invoiceFilters.dateFrom || 
           !!state.invoiceFilters.dateTo;
  },
  canManageInvoices: (state) => {
    if (!state.userProfile) return false;
    return ['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role);
  },
  canCreateInvoice: (state) => {
    if (!state.userProfile) return false;
    return ['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role);
  },
  canEditInvoice: (state) => {
    if (!state.userProfile) return false;
    return ['superadmin', 'warehouse_manager'].includes(state.userProfile.role);
  },
  canDeleteInvoice: (state) => {
    if (!state.userProfile) return false;
    return ['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role);
  },
  canExportInvoices: (state) => {
    if (!state.userProfile) return false;
    return ['superadmin', 'company_manager'].includes(state.userProfile.role);
  },
  getInvoiceById: (state) => (invoiceId) => {
    return state.invoices.find(inv => inv.id === invoiceId);
  },
  getInvoiceTypeLabel: () => (type) => {
    return getInvoiceTypeLabel(type);
  },
  getInvoiceStatusLabel: () => (status) => {
    return getInvoiceStatusLabel(status);
  },
  getPaymentMethodLabel: () => (method) => {
    return getPaymentMethodLabel(method);
  },
};
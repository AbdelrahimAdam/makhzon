import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { ensureFirebaseReady } from '@/store/utils/firebase-utils';
import { PERFORMANCE_CONFIG } from '@/store/utils/constants';
import { getInvoiceTypeLabel, getInvoiceStatusLabel, getPaymentMethodLabel } from '@/store/utils/helpers';
import * as XLSX from 'xlsx';

export default {
  namespaced: false,

  state: {
    invoices: [],
    invoicesLoading: false,
    invoicesLoaded: false,
    invoicesError: null,
    invoicePagination: {
      lastDoc: null,
      hasMore: false,
      totalLoaded: 0
    },
    invoiceFilters: {
      search: '',
      status: '',
      type: '',
      dateFrom: null,
      dateTo: null
    },
    operationLoading: false,
    operationError: null,
    invoiceStats: {
      totalInvoices: 0,
      totalSales: 0,
      totalTax: 0,
      uniqueCustomers: 0,
      lastUpdated: null
    }
  },

  getters: {
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
      return !!state.invoiceFilters.search || !!state.invoiceFilters.status || !!state.invoiceFilters.type || !!state.invoiceFilters.dateFrom || !!state.invoiceFilters.dateTo;
    },
    canManageInvoices: (state, getters, rootState) => {
      if (!rootState.userProfile) return false;
      return ['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role);
    },
    canCreateInvoice: (state, getters, rootState) => {
      if (!rootState.userProfile) return false;
      return ['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role);
    },
    canEditInvoice: (state, getters, rootState) => {
      if (!rootState.userProfile) return false;
      return ['superadmin', 'warehouse_manager'].includes(rootState.userProfile.role);
    },
    canDeleteInvoice: (state, getters, rootState) => {
      if (!rootState.userProfile) return false;
      return ['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role);
    },
    canExportInvoices: (state, getters, rootState) => {
      if (!rootState.userProfile) return false;
      return ['superadmin', 'company_manager'].includes(rootState.userProfile.role);
    },
    getInvoiceById: (state) => (invoiceId) => {
      return state.invoices.find(inv => inv.id === invoiceId);
    },
    getInvoiceTypeLabel: () => (type) => getInvoiceTypeLabel(type),
    getInvoiceStatusLabel: () => (status) => getInvoiceStatusLabel(status),
    getPaymentMethodLabel: () => (method) => getPaymentMethodLabel(method),
  },

  mutations: {
    SET_INVOICES(state, invoices) {
      console.log('🛠️ SET_INVOICES mutation called with', invoices.length, 'invoices');
      state.invoices = invoices;
    },
    ADD_INVOICE(state, invoice) { state.invoices.unshift(invoice); },
    UPDATE_INVOICE(state, updatedInvoice) {
      const index = state.invoices.findIndex(inv => inv.id === updatedInvoice.id);
      if (index !== -1) state.invoices.splice(index, 1, updatedInvoice);
      else state.invoices.unshift(updatedInvoice);
    },
    REMOVE_INVOICE(state, invoiceId) { state.invoices = state.invoices.filter(inv => inv.id !== invoiceId); },
    SET_INVOICES_LOADING(state, loading) { state.invoicesLoading = loading; },
    SET_INVOICES_LOADED(state, loaded) { state.invoicesLoaded = loaded; },
    SET_INVOICES_ERROR(state, error) { state.invoicesError = error; },
    SET_INVOICE_FILTERS(state, filters) { state.invoiceFilters = { ...state.invoiceFilters, ...filters }; },
    CLEAR_INVOICE_FILTERS(state) {
      state.invoiceFilters = { search: '', status: '', type: '', dateFrom: null, dateTo: null };
    },
    SET_INVOICE_PAGINATION(state, pagination) { state.invoicePagination = { ...state.invoicePagination, ...pagination }; },
    RESET_INVOICE_PAGINATION(state) {
      state.invoicePagination = { lastDoc: null, hasMore: false, totalLoaded: 0 };
    },
    SET_INVOICE_STATS(state, stats) { state.invoiceStats = { ...state.invoiceStats, ...stats }; },
    CALCULATE_INVOICE_STATS(state) {
      const validInvoices = state.invoices.filter(inv => inv.status !== 'cancelled');
      const totalInvoices = validInvoices.length;
      const totalSales = validInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const totalTax = validInvoices
        .filter(inv => inv.type === 'B2B' || inv.type === 'B2C')
        .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
      const customers = new Set();
      validInvoices.forEach(inv => { if (inv.customer?.phone) customers.add(inv.customer.phone); });
      state.invoiceStats = { totalInvoices, totalSales, totalTax, uniqueCustomers: customers.size, lastUpdated: new Date() };
    },
    SET_OPERATION_LOADING(state, loading) { state.operationLoading = loading; },
    CLEAR_OPERATION_ERROR(state) { state.operationError = null; },
    SET_OPERATION_ERROR(state, error) { state.operationError = error; },
    ADD_RECENT_TRANSACTION(state, transaction) { /* optional */ },
    ADD_TRANSACTION(state, transaction) { /* optional */ }
  },

  actions: {
    // ========== LOAD ALL INVOICES ==========
    async loadAllInvoices({ commit, state, rootState, dispatch }, { forceRefresh = false } = {}) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      if (state.invoicesLoading) {
        console.log('Invoice load already in progress');
        return state.invoices;
      }
      if (state.invoicesLoaded && !forceRefresh) {
        console.log('Invoices already loaded');
        return state.invoices;
      }
      commit('SET_INVOICES_LOADING', true);
      commit('SET_INVOICES_ERROR', null);
      commit('RESET_INVOICE_PAGINATION');
      try {
        console.log('🔄 Loading ALL invoices...');
        if (!rootState.userProfile) throw new Error('User not authenticated');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لعرض الفواتير');
        }
        const invoicesRef = collection(db, 'invoices');
        // NEW: add companyId filter
        const q = query(
          invoicesRef,
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc'),
          limit(PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT)
        );
        const snapshot = await getDocs(q);
        console.log(`✅ Initial invoices loaded: ${snapshot.size} invoices`);
        const invoices = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, date: data.date?.toDate?.() || data.date };
        });
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        commit('SET_INVOICE_PAGINATION', { lastDoc, hasMore: snapshot.size === PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT, totalLoaded: invoices.length });
        commit('SET_INVOICES', invoices);
        commit('SET_INVOICES_LOADED', true);
        commit('CALCULATE_INVOICE_STATS');
        console.log(`🎉 Invoices loaded successfully: ${invoices.length} invoices`);
        return invoices;
      } catch (error) {
        console.error('❌ Error loading invoices:', error);
        commit('SET_INVOICES_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: 'خطأ في تحميل الفواتير' }, { root: true });
        return [];
      } finally {
        commit('SET_INVOICES_LOADING', false);
      }
    },

    // ========== SEARCH INVOICES ==========
    async searchInvoices({ commit, rootState, dispatch }, searchParams) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      commit('SET_INVOICES_LOADING', true);
      commit('SET_INVOICES_ERROR', null);
      commit('RESET_INVOICE_PAGINATION');
      try {
        const { search, status, type, dateFrom, dateTo } = searchParams || {};
        commit('SET_INVOICE_FILTERS', { search, status, type, dateFrom, dateTo });
        if (!rootState.userProfile) throw new Error('User not authenticated');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لعرض الفواتير');
        }
        const invoicesRef = collection(db, 'invoices');
        let invoicesQuery;
        if (search && search.length >= 2) {
          // NEW: add companyId filter
          invoicesQuery = query(
            invoicesRef,
            where('companyId', '==', companyId),
            orderBy('invoiceNumber'),
            limit(PERFORMANCE_CONFIG.SEARCH_LIMIT)
          );
        } else {
          invoicesQuery = query(
            invoicesRef,
            where('companyId', '==', companyId),
            orderBy('createdAt', 'desc'),
            limit(PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT)
          );
        }
        const snapshot = await getDocs(invoicesQuery);
        console.log(`🔍 Invoice search found: ${snapshot.size} invoices`);
        let invoices = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, date: data.date?.toDate?.() || data.date };
        });
        if (search && search.length >= 2) {
          const searchLower = search.toLowerCase();
          invoices = invoices.filter(invoice => 
            invoice.invoiceNumber.toString().includes(searchLower) ||
            invoice.customer?.name?.toLowerCase().includes(searchLower) ||
            invoice.customer?.phone?.includes(searchLower)
          );
        }
        if (status) invoices = invoices.filter(invoice => invoice.status === status);
        if (type) invoices = invoices.filter(invoice => invoice.type === type);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          invoices = invoices.filter(invoice => {
            const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
            return invoiceDate >= fromDate;
          });
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          invoices = invoices.filter(invoice => {
            const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
            return invoiceDate <= toDate;
          });
        }
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        commit('SET_INVOICE_PAGINATION', {
          lastDoc,
          hasMore: snapshot.size === (search ? PERFORMANCE_CONFIG.SEARCH_LIMIT : PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT),
          totalLoaded: invoices.length
        });
        commit('SET_INVOICES', invoices);
        commit('SET_INVOICES_LOADED', true);
        commit('CALCULATE_INVOICE_STATS');
        return invoices;
      } catch (error) {
        console.error('❌ Error searching invoices:', error);
        commit('SET_INVOICES_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: 'خطأ في البحث عن الفواتير' }, { root: true });
        return [];
      } finally {
        commit('SET_INVOICES_LOADING', false);
      }
    },

    // ========== CREATE INVOICE ==========
    async createInvoice({ commit, state, rootState, dispatch }, invoiceData) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      commit('SET_OPERATION_LOADING', true);
      commit('CLEAR_OPERATION_ERROR');
      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لإنشاء فواتير');
        }
        if (!invoiceData.customer?.name?.trim() || !invoiceData.customer?.phone?.trim()) {
          throw new Error('جميع الحقول المطلوبة يجب أن تكون مملوءة (اسم العميل، الهاتف)');
        }
        if (!invoiceData.items || invoiceData.items.length === 0) throw new Error('يجب إضافة أصناف على الأقل للفاتورة');
        if (!invoiceData.warehouseId) throw new Error('يجب تحديد المخزن');

        const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
        if (!phoneRegex.test(invoiceData.customer.phone)) {
          throw new Error('يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)');
        }
        if (invoiceData.type === 'B2B' && (!invoiceData.customer.taxId || invoiceData.customer.taxId.length < 9)) {
          throw new Error('يرجى إدخال رقم ضريبي صالح (9 أرقام على الأقل) للفواتير الضريبية');
        }

        const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const discount = invoiceData.items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.discount / 100)), 0);
        const tax = (invoiceData.type === 'B2B' || invoiceData.type === 'B2C') ? (subtotal - discount) * 0.14 : 0;
        const total = subtotal - discount + tax;

        const lastInvoice = state.invoices[0];
        const lastNumber = lastInvoice ? lastInvoice.invoiceNumber : 0;
        const invoiceNumber = lastNumber + 1;

        const cleanInvoiceData = {
          invoiceNumber,
          type: invoiceData.type,
          paymentMethod: invoiceData.paymentMethod,
          customer: {
            name: invoiceData.customer.name.trim(),
            phone: invoiceData.customer.phone.trim(),
            taxId: invoiceData.customer.taxId?.trim() || '',
            address: invoiceData.customer.address?.trim() || ''
          },
          items: invoiceData.items.map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 0,
            discount: Number(item.discount) || 0,
            total: Number(item.total) || 0,
            warehouseId: item.warehouseId
          })),
          warehouseId: invoiceData.warehouseId,
          notes: invoiceData.notes?.trim() || '',
          status: 'draft',
          subtotal,
          discount,
          taxAmount: tax,
          totalAmount: total,
          date: Timestamp.now(),
          createdBy: rootState.userProfile?.name || rootState.user?.email || 'نظام',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          companyId: companyId  // NEW
        };

        const docRef = await addDoc(collection(db, 'invoices'), cleanInvoiceData);
        const batch = writeBatch(db);
        for (const item of invoiceData.items) {
          if (item.id) {
            const itemRef = doc(db, 'items', item.id);
            // Optionally verify item's companyId matches – but security rules will block if not.
            batch.update(itemRef, { remaining_quantity: increment(-(item.quantity || 0)) });
          }
        }
        await batch.commit();

        const transactionData = {
          type: 'INVOICE',
          item_id: invoiceData.items[0]?.id || 'multiple',
          item_name: `فاتورة #${invoiceNumber}`,
          item_code: `INV-${invoiceNumber}`,
          from_warehouse: invoiceData.warehouseId,
          to_warehouse: null,
          cartons_delta: 0,
          per_carton_updated: 0,
          single_delta: 0,
          total_delta: -invoiceData.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
          new_remaining: 0,
          user_id: rootState.user.uid,
          timestamp: Timestamp.now(),
          notes: `فاتورة مبيعات #${invoiceNumber} - ${invoiceData.customer.name}`,
          created_by: rootState.userProfile?.name || rootState.user?.email || 'نظام',
          companyId: companyId  // NEW (if transactions collection has companyId)
        };
        await addDoc(collection(db, 'transactions'), transactionData);

        const newInvoice = { id: docRef.id, ...cleanInvoiceData };
        commit('ADD_INVOICE', newInvoice);
        commit('ADD_RECENT_TRANSACTION', transactionData);
        commit('CALCULATE_INVOICE_STATS');
        dispatch('showNotification', { type: 'success', message: `تم إنشاء الفاتورة #${invoiceNumber} بنجاح` }, { root: true });
        return { success: true, invoiceId: docRef.id, invoiceNumber };
      } catch (error) {
        console.error('❌ Error creating invoice:', error);
        commit('SET_OPERATION_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: error.message || 'حدث خطأ في إنشاء الفاتورة' }, { root: true });
        throw error;
      } finally {
        commit('SET_OPERATION_LOADING', false);
      }
    },

    // ========== UPDATE INVOICE ==========
    async updateInvoice({ commit, rootState, dispatch }, { invoiceId, invoiceData }) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      commit('SET_OPERATION_LOADING', true);
      commit('CLEAR_OPERATION_ERROR');
      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'warehouse_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لتعديل الفواتير');
        }
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        if (!invoiceDoc.exists()) throw new Error('الفاتورة غير موجودة');
        const existingInvoice = invoiceDoc.data();

        // NEW: verify companyId matches
        if (existingInvoice.companyId !== companyId) {
          throw new Error('لا يمكنك تعديل هذه الفاتورة');
        }

        if (existingInvoice.status !== 'draft') throw new Error('لا يمكن تعديل فاتورة غير مسودة');
        if (!invoiceData.customer?.name?.trim() || !invoiceData.customer?.phone?.trim()) {
          throw new Error('جميع الحقول المطلوبة يجب أن تكون مملوءة (اسم العميل، الهاتف)');
        }
        if (!invoiceData.items || invoiceData.items.length === 0) throw new Error('يجب إضافة أصناف على الأقل للفاتورة');
        if (!invoiceData.warehouseId) throw new Error('يجب تحديد المخزن');

        const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const discount = invoiceData.items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity) * (item.discount / 100)), 0);
        const tax = (invoiceData.type === 'B2B' || invoiceData.type === 'B2C') ? (subtotal - discount) * 0.14 : 0;
        const total = subtotal - discount + tax;

        const updateData = {
          type: invoiceData.type,
          paymentMethod: invoiceData.paymentMethod,
          customer: {
            name: invoiceData.customer.name.trim(),
            phone: invoiceData.customer.phone.trim(),
            taxId: invoiceData.customer.taxId?.trim() || '',
            address: invoiceData.customer.address?.trim() || ''
          },
          items: invoiceData.items.map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 0,
            discount: Number(item.discount) || 0,
            total: Number(item.total) || 0,
            warehouseId: item.warehouseId
          })),
          warehouseId: invoiceData.warehouseId,
          notes: invoiceData.notes?.trim() || '',
          subtotal,
          discount,
          taxAmount: tax,
          totalAmount: total,
          updatedAt: Timestamp.now()
        };

        const batch = writeBatch(db);
        // Revert old items
        if (existingInvoice.items && Array.isArray(existingInvoice.items)) {
          for (const oldItem of existingInvoice.items) {
            if (oldItem.id) {
              const itemRef = doc(db, 'items', oldItem.id);
              batch.update(itemRef, { remaining_quantity: increment(oldItem.quantity || 0) });
            }
          }
        }
        // Deduct new items
        for (const newItem of invoiceData.items) {
          if (newItem.id) {
            const itemRef = doc(db, 'items', newItem.id);
            batch.update(itemRef, { remaining_quantity: increment(-(newItem.quantity || 0)) });
          }
        }
        batch.update(invoiceRef, updateData);
        await batch.commit();

        const transactionRef = doc(collection(db, 'transactions'));
        const transactionData = {
          type: 'INVOICE_UPDATE',
          invoice_id: invoiceId,
          invoice_number: existingInvoice.invoiceNumber,
          old_items: existingInvoice.items.map(i => ({ id: i.id, quantity: i.quantity })),
          new_items: invoiceData.items.map(i => ({ id: i.id, quantity: i.quantity })),
          user_id: rootState.user.uid,
          user_name: rootState.userProfile?.name || '',
          timestamp: serverTimestamp(),
          notes: `تحديث الفاتورة #${existingInvoice.invoiceNumber}`,
          created_by: rootState.userProfile?.name || rootState.user?.email || 'نظام',
          companyId: companyId  // NEW (if transactions collection has companyId)
        };
        await setDoc(transactionRef, transactionData);

        const updatedInvoice = { id: invoiceId, ...existingInvoice, ...updateData };
        commit('UPDATE_INVOICE', updatedInvoice);
        commit('CALCULATE_INVOICE_STATS');
        dispatch('showNotification', { type: 'success', message: `تم تحديث الفاتورة #${existingInvoice.invoiceNumber} بنجاح` }, { root: true });
        return { success: true, invoiceId };
      } catch (error) {
        console.error('❌ Error updating invoice:', error);
        commit('SET_OPERATION_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: error.message || 'حدث خطأ في تحديث الفاتورة' }, { root: true });
        throw error;
      } finally {
        commit('SET_OPERATION_LOADING', false);
      }
    },

    // ========== DELETE INVOICE ==========
    async deleteInvoice({ commit, rootState, dispatch }, invoiceId) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      commit('SET_OPERATION_LOADING', true);
      commit('CLEAR_OPERATION_ERROR');
      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لحذف الفواتير');
        }
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        if (!invoiceDoc.exists()) throw new Error('الفاتورة غير موجودة');
        const existingInvoice = invoiceDoc.data();

        // NEW: verify companyId matches
        if (existingInvoice.companyId !== companyId) {
          throw new Error('لا يمكنك حذف هذه الفاتورة');
        }

        if (existingInvoice.status !== 'draft') throw new Error('لا يمكن حذف فاتورة غير مسودة');
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return { success: false, message: 'تم إلغاء العملية' };

        if (existingInvoice.items && Array.isArray(existingInvoice.items)) {
          const batch = writeBatch(db);
          for (const item of existingInvoice.items) {
            if (item.id) {
              const itemRef = doc(db, 'items', item.id);
              batch.update(itemRef, { remaining_quantity: increment(item.quantity || 0) });
            }
          }
          await batch.commit();
        }
        await deleteDoc(invoiceRef);
        commit('REMOVE_INVOICE', invoiceId);
        commit('CALCULATE_INVOICE_STATS');
        dispatch('showNotification', { type: 'success', message: `تم حذف الفاتورة #${existingInvoice.invoiceNumber} بنجاح` }, { root: true });
        return { success: true, message: 'تم حذف الفاتورة بنجاح' };
      } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        commit('SET_OPERATION_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: error.message || 'حدث خطأ في حذف الفاتورة' }, { root: true });
        return { success: false, error: error.message };
      } finally {
        commit('SET_OPERATION_LOADING', false);
      }
    },

    // ========== UPDATE INVOICE STATUS ==========
    async updateInvoiceStatus({ commit, rootState, dispatch }, { invoiceId, status }) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      commit('SET_OPERATION_LOADING', true);
      commit('CLEAR_OPERATION_ERROR');
      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لتغيير حالة الفواتير');
        }
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        if (!invoiceDoc.exists()) throw new Error('الفاتورة غير موجودة');
        const existingInvoice = invoiceDoc.data();

        // NEW: verify companyId matches
        if (existingInvoice.companyId !== companyId) {
          throw new Error('لا يمكنك تغيير حالة هذه الفاتورة');
        }

        await updateDoc(invoiceRef, { status, updatedAt: Timestamp.now() });
        const updatedInvoice = { id: invoiceId, ...existingInvoice, status };
        commit('UPDATE_INVOICE', updatedInvoice);
        commit('CALCULATE_INVOICE_STATS');
        const statusLabels = { draft: 'مسودة', issued: 'صادرة', paid: 'مدفوعة', cancelled: 'ملغية' };
        dispatch('showNotification', { type: 'success', message: `تم تغيير حالة الفاتورة #${existingInvoice.invoiceNumber} إلى ${statusLabels[status] || status}` }, { root: true });
        return { success: true, invoiceId };
      } catch (error) {
        console.error('❌ Error updating invoice status:', error);
        commit('SET_OPERATION_ERROR', error.message);
        dispatch('showNotification', { type: 'error', message: error.message || 'حدث خطأ في تغيير حالة الفاتورة' }, { root: true });
        throw error;
      } finally {
        commit('SET_OPERATION_LOADING', false);
      }
    },

    // ========== GET INVOICE BY ID ==========
    async getInvoiceById({ rootState, dispatch }, invoiceId) {
      // NEW: get companyId
      const companyId = rootState.userProfile?.companyId;
      if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لعرض الفواتير');
        }
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        if (!invoiceDoc.exists()) throw new Error('الفاتورة غير موجودة');
        const invoiceData = invoiceDoc.data();

        // NEW: verify companyId matches
        if (invoiceData.companyId !== companyId) {
          throw new Error('لا يمكنك الوصول إلى هذه الفاتورة');
        }

        return { id: invoiceDoc.id, ...invoiceData, date: invoiceData.date?.toDate?.() || invoiceData.date };
      } catch (error) {
        console.error('❌ Error getting invoice:', error);
        dispatch('showNotification', { type: 'error', message: error.message || 'خطأ في تحميل الفاتورة' }, { root: true });
        throw error;
      }
    },

    // ========== EXPORT INVOICES TO EXCEL ==========
    async exportInvoicesToExcel({ rootState, state, dispatch }, { filters = {} } = {}) {
      try {
        if (!rootState.userProfile) throw new Error('يجب تسجيل الدخول أولاً');
        if (!['superadmin', 'company_manager'].includes(rootState.userProfile.role)) {
          throw new Error('ليس لديك صلاحية لتصدير الفواتير');
        }
        // State invoices are already filtered by company, so no additional company check needed.
        let invoicesToExport = state.invoices;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          invoicesToExport = invoicesToExport.filter(invoice => 
            invoice.invoiceNumber.toString().includes(searchLower) ||
            invoice.customer?.name?.toLowerCase().includes(searchLower) ||
            invoice.customer?.phone?.includes(searchLower)
          );
        }
        if (filters.status) invoicesToExport = invoicesToExport.filter(invoice => invoice.status === filters.status);
        if (filters.type) invoicesToExport = invoicesToExport.filter(invoice => invoice.type === filters.type);
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          invoicesToExport = invoicesToExport.filter(invoice => {
            const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
            return invoiceDate >= fromDate;
          });
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          invoicesToExport = invoicesToExport.filter(invoice => {
            const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
            return invoiceDate <= toDate;
          });
        }
        if (invoicesToExport.length === 0) {
          dispatch('showNotification', { type: 'warning', message: 'لا توجد فواتير للتصدير' }, { root: true });
          return;
        }
        const exportData = invoicesToExport.map(invoice => {
          const invoiceDate = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
          return {
            'رقم الفاتورة': invoice.invoiceNumber,
            'التاريخ': invoiceDate.toLocaleDateString('ar-EG'),
            'نوع الفاتورة': getInvoiceTypeLabel(invoice.type),
            'حالة الفاتورة': getInvoiceStatusLabel(invoice.status),
            'اسم العميل': invoice.customer.name,
            'هاتف العميل': invoice.customer.phone,
            'الرقم الضريبي': invoice.customer.taxId || '',
            'عدد الأصناف': invoice.items?.length || 0,
            'المجموع': invoice.subtotal || 0,
            'الخصم': invoice.discount || 0,
            'الضريبة': invoice.taxAmount || 0,
            'الإجمالي': invoice.totalAmount || 0,
            'طريقة الدفع': getPaymentMethodLabel(invoice.paymentMethod),
            'ملاحظات': invoice.notes || ''
          };
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = [
          { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
          { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
          { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 }
        ];
        ws['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');
        const filename = `الفواتير_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        dispatch('showNotification', { type: 'success', message: `تم تصدير ${exportData.length} فاتورة بنجاح` }, { root: true });
      } catch (error) {
        console.error('❌ Error exporting invoices:', error);
        dispatch('showNotification', { type: 'error', message: error.message || 'حدث خطأ في تصدير الفواتير' }, { root: true });
      }
    },

    // ========== REFRESH INVOICES ==========
    async refreshInvoices({ dispatch }) {
      console.log('🔄 Refreshing invoices...');
      return await dispatch('loadAllInvoices', { forceRefresh: true });
    },

    // ========== CLEAR INVOICE FILTERS ==========
    async clearInvoiceFilters({ commit, dispatch }) {
      commit('CLEAR_INVOICE_FILTERS');
      await dispatch('loadAllInvoices');
    }
  }
};
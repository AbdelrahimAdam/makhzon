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
import { ensureFirebaseReady } from '../utils/firebase-utils';
import { PERFORMANCE_CONFIG } from '../utils/constants';
import { getInvoiceTypeLabel, getInvoiceStatusLabel, getPaymentMethodLabel } from '../utils/helpers';
import * as XLSX from 'xlsx';

export default {
  // ============================================
  // ORIGINAL INVOICE ACTIONS (unchanged)
  // ============================================
  async loadAllInvoices({ commit, state, dispatch }, { forceRefresh = false } = {}) {
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

      if (!state.userProfile) {
        throw new Error('User not authenticated');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لعرض الفواتير');
      }

      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        orderBy('createdAt', 'desc'),
        limit(PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT)
      );

      const snapshot = await getDocs(q);
      console.log(`✅ Initial invoices loaded: ${snapshot.size} invoices`);

      const invoices = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || data.date
        };
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      commit('SET_INVOICE_PAGINATION', {
        lastDoc,
        hasMore: snapshot.size === PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT,
        totalLoaded: invoices.length
      });

      commit('SET_INVOICES', invoices);
      commit('SET_INVOICES_LOADED', true);
      commit('CALCULATE_INVOICE_STATS');

      console.log(`🎉 Invoices loaded successfully: ${invoices.length} invoices`);
      return invoices;

    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      commit('SET_INVOICES_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل الفواتير'
      });

      return [];
    } finally {
      commit('SET_INVOICES_LOADING', false);
    }
  },

  async searchInvoices({ commit, state, dispatch }, searchParams) {
    commit('SET_INVOICES_LOADING', true);
    commit('SET_INVOICES_ERROR', null);
    commit('RESET_INVOICE_PAGINATION');

    try {
      const { search, status, type, dateFrom, dateTo } = searchParams || {};

      commit('SET_INVOICE_FILTERS', { search, status, type, dateFrom, dateTo });

      if (!state.userProfile) {
        throw new Error('User not authenticated');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لعرض الفواتير');
      }

      const invoicesRef = collection(db, 'invoices');
      let invoicesQuery;

      if (search && search.length >= 2) {
        invoicesQuery = query(
          invoicesRef,
          orderBy('invoiceNumber'),
          limit(PERFORMANCE_CONFIG.SEARCH_LIMIT)
        );
      } else {
        invoicesQuery = query(
          invoicesRef,
          orderBy('createdAt', 'desc'),
          limit(PERFORMANCE_CONFIG.INVOICE_LOAD_LIMIT)
        );
      }

      const snapshot = await getDocs(invoicesQuery);
      console.log(`🔍 Invoice search found: ${snapshot.size} invoices`);

      let invoices = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || data.date
        };
      });

      if (search && search.length >= 2) {
        const searchLower = search.toLowerCase();
        invoices = invoices.filter(invoice => 
          invoice.invoiceNumber.toString().includes(searchLower) ||
          invoice.customer?.name?.toLowerCase().includes(searchLower) ||
          invoice.customer?.phone?.includes(searchLower)
        );
      }

      if (status) {
        invoices = invoices.filter(invoice => invoice.status === status);
      }

      if (type) {
        invoices = invoices.filter(invoice => invoice.type === type);
      }

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

      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في البحث عن الفواتير'
      });

      return [];
    } finally {
      commit('SET_INVOICES_LOADING', false);
    }
  },

  async createInvoice({ commit, state, dispatch }, invoiceData) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لإنشاء فواتير');
      }

      if (!invoiceData.customer?.name?.trim() || !invoiceData.customer?.phone?.trim()) {
        throw new Error('جميع الحقول المطلوبة يجب أن تكون مملوءة (اسم العميل، الهاتف)');
      }

      if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error('يجب إضافة أصناف على الأقل للفاتورة');
      }

      if (!invoiceData.warehouseId) {
        throw new Error('يجب تحديد المخزن');
      }

      const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
      if (!phoneRegex.test(invoiceData.customer.phone)) {
        throw new Error('يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)');
      }

      if (invoiceData.type === 'B2B' && (!invoiceData.customer.taxId || invoiceData.customer.taxId.length < 9)) {
        throw new Error('يرجى إدخال رقم ضريبي صالح (9 أرقام على الأقل) للفواتير الضريبية');
      }

      const subtotal = invoiceData.items.reduce((sum, item) => {
        const price = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
      }, 0);

      const discount = invoiceData.items.reduce((sum, item) => {
        const price = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        const discountPercent = item.discount || 0;
        return sum + ((price * quantity) * (discountPercent / 100));
      }, 0);

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
        createdBy: state.userProfile?.name || state.user?.email || 'نظام',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'invoices'), cleanInvoiceData);

      const batch = writeBatch(db);

      for (const item of invoiceData.items) {
        if (item.id) {
          const itemRef = doc(db, 'items', item.id);
          batch.update(itemRef, {
            remaining_quantity: increment(-(item.quantity || 0))
          });
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
        user_id: state.user.uid,
        timestamp: Timestamp.now(),
        notes: `فاتورة مبيعات #${invoiceNumber} - ${invoiceData.customer.name}`,
        created_by: state.userProfile?.name || state.user?.email || 'نظام'
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      const newInvoice = {
        id: docRef.id,
        ...cleanInvoiceData
      };

      commit('ADD_INVOICE', newInvoice);
      commit('ADD_RECENT_TRANSACTION', transactionData);
      commit('CALCULATE_INVOICE_STATS');

      dispatch('showNotification', {
        type: 'success',
        message: `تم إنشاء الفاتورة #${invoiceNumber} بنجاح`
      });

      return { success: true, invoiceId: docRef.id, invoiceNumber };

    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في إنشاء الفاتورة'
      });

      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async updateInvoice({ commit, state, dispatch }, { invoiceId, invoiceData }) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لتعديل الفواتير');
      }

      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);

      if (!invoiceDoc.exists()) {
        throw new Error('الفاتورة غير موجودة');
      }

      const existingInvoice = invoiceDoc.data();

      if (existingInvoice.status !== 'draft') {
        throw new Error('لا يمكن تعديل فاتورة غير مسودة');
      }

      if (!invoiceData.customer?.name?.trim() || !invoiceData.customer?.phone?.trim()) {
        throw new Error('جميع الحقول المطلوبة يجب أن تكون مملوءة (اسم العميل، الهاتف)');
      }

      if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error('يجب إضافة أصناف على الأقل للفاتورة');
      }

      if (!invoiceData.warehouseId) {
        throw new Error('يجب تحديد المخزن');
      }

      const subtotal = invoiceData.items.reduce((sum, item) => {
        const price = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
      }, 0);

      const discount = invoiceData.items.reduce((sum, item) => {
        const price = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        const discountPercent = item.discount || 0;
        return sum + ((price * quantity) * (discountPercent / 100));
      }, 0);

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

      await updateDoc(invoiceRef, updateData);

      const updatedInvoice = {
        id: invoiceId,
        ...existingInvoice,
        ...updateData
      };

      commit('UPDATE_INVOICE', updatedInvoice);
      commit('CALCULATE_INVOICE_STATS');

      dispatch('showNotification', {
        type: 'success',
        message: `تم تحديث الفاتورة #${existingInvoice.invoiceNumber} بنجاح`
      });

      return { success: true, invoiceId };

    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في تحديث الفاتورة'
      });

      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async deleteInvoice({ commit, state, dispatch }, invoiceId) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لحذف الفواتير');
      }

      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);

      if (!invoiceDoc.exists()) {
        throw new Error('الفاتورة غير موجودة');
      }

      const existingInvoice = invoiceDoc.data();

      if (existingInvoice.status !== 'draft') {
        throw new Error('لا يمكن حذف فاتورة غير مسودة');
      }

      const confirmDelete = confirm('هل أنت متأكد من حذف هذه الفاتورة؟');
      if (!confirmDelete) {
        return { success: false, message: 'تم إلغاء العملية' };
      }

      if (existingInvoice.items && Array.isArray(existingInvoice.items)) {
        const batch = writeBatch(db);

        for (const item of existingInvoice.items) {
          if (item.id) {
            const itemRef = doc(db, 'items', item.id);
            batch.update(itemRef, {
              remaining_quantity: increment(item.quantity || 0)
            });
          }
        }

        await batch.commit();
      }

      await deleteDoc(invoiceRef);

      commit('REMOVE_INVOICE', invoiceId);
      commit('CALCULATE_INVOICE_STATS');

      dispatch('showNotification', {
        type: 'success',
        message: `تم حذف الفاتورة #${existingInvoice.invoiceNumber} بنجاح`
      });

      return { success: true, message: 'تم حذف الفاتورة بنجاح' };

    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في حذف الفاتورة'
      });

      return { success: false, error: error.message };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async updateInvoiceStatus({ commit, state, dispatch }, { invoiceId, status }) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لتغيير حالة الفواتير');
      }

      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);

      if (!invoiceDoc.exists()) {
        throw new Error('الفاتورة غير موجودة');
      }

      const existingInvoice = invoiceDoc.data();

      await updateDoc(invoiceRef, {
        status,
        updatedAt: Timestamp.now()
      });

      const updatedInvoice = {
        id: invoiceId,
        ...existingInvoice,
        status
      };

      commit('UPDATE_INVOICE', updatedInvoice);
      commit('CALCULATE_INVOICE_STATS');

      const statusLabels = {
        'draft': 'مسودة',
        'issued': 'صادرة',
        'paid': 'مدفوعة',
        'cancelled': 'ملغية'
      };

      dispatch('showNotification', {
        type: 'success',
        message: `تم تغيير حالة الفاتورة #${existingInvoice.invoiceNumber} إلى ${statusLabels[status] || status}`
      });

      return { success: true, invoiceId };

    } catch (error) {
      console.error('❌ Error updating invoice status:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في تغيير حالة الفاتورة'
      });

      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async getInvoiceById({ state, dispatch }, invoiceId) {
    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لعرض الفواتير');
      }

      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);

      if (!invoiceDoc.exists()) {
        throw new Error('الفاتورة غير موجودة');
      }

      const invoiceData = invoiceDoc.data();

      return {
        id: invoiceDoc.id,
        ...invoiceData,
        date: invoiceData.date?.toDate?.() || invoiceData.date
      };

    } catch (error) {
      console.error('❌ Error getting invoice:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في تحميل الفاتورة'
      });
      throw error;
    }
  },

  async exportInvoicesToExcel({ state, dispatch }, { filters = {} } = {}) {
    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لتصدير الفواتير');
      }

      let invoicesToExport = state.invoices;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        invoicesToExport = invoicesToExport.filter(invoice => 
          invoice.invoiceNumber.toString().includes(searchLower) ||
          invoice.customer?.name?.toLowerCase().includes(searchLower) ||
          invoice.customer?.phone?.includes(searchLower)
        );
      }

      if (filters.status) {
        invoicesToExport = invoicesToExport.filter(invoice => invoice.status === filters.status);
      }

      if (filters.type) {
        invoicesToExport = invoicesToExport.filter(invoice => invoice.type === filters.type);
      }

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
        dispatch('showNotification', {
          type: 'warning',
          message: 'لا توجد فواتير للتصدير'
        });
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
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 30 }
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');

      const filename = `الفواتير_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, filename);

      dispatch('showNotification', {
        type: 'success',
        message: `تم تصدير ${exportData.length} فاتورة بنجاح`
      });

    } catch (error) {
      console.error('❌ Error exporting invoices:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في تصدير الفواتير'
      });
    }
  },

  async refreshInvoices({ dispatch }) {
    console.log('🔄 Refreshing invoices...');
    return await dispatch('loadAllInvoices', { forceRefresh: true });
  },

  async clearInvoiceFilters({ commit, dispatch }) {
    commit('CLEAR_INVOICE_FILTERS');
    await dispatch('loadAllInvoices');
  },

  // ============================================
  // UPDATED: INVOICE DISPATCH – uses exact inventory dispatch logic
  // ============================================
  async dispatchInvoiceItem({ commit, state, dispatch }, {
    invoiceId,
    invoiceNumber,
    itemId,
    itemName,
    itemCode,
    quantity,
    warehouseId,
    destination,
    destinationId,
    notes = '',
    customerName = '',
    customerPhone = ''
  }) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('📄 Invoice dispatch with full inventory logic:', {
        invoiceId,
        invoiceNumber,
        itemId,
        itemName,
        quantity,
        warehouseId,
        destination
      });

      // ========== VALIDATION ==========
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لصرف فواتير');
      }

      if (!invoiceId || !itemId || !quantity || !warehouseId || !destination) {
        throw new Error('بيانات الصرف غير مكتملة');
      }

      if (quantity <= 0) {
        throw new Error('يجب إدخال كمية صحيحة للصرف (أكبر من صفر)');
      }

      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية للصرف من هذا المخزن');
          }
        }
      }

      await ensureFirebaseReady();
      if (!db) throw new Error('Firestore database not available');

      // ========== ATOMIC TRANSACTION (exactly like inventory's dispatchItem) ==========
      const dispatchResult = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'items', itemId);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('الصنف غير موجود في المخزن');
        }

        const itemData = itemDoc.data();

        if (itemData.warehouse_id !== warehouseId) {
          throw new Error(`الصنف ليس في المخزن المحدد. يوجد في: ${itemData.warehouse_id}`);
        }

        const currentCartons = Number(itemData.cartons_count) || 0;
        const currentSingles = Number(itemData.single_bottles_count) || 0;
        const perCarton = Number(itemData.per_carton_count) || 12;

        const dispatchQuantity = Number(quantity);
        const currentTotal = (currentCartons * perCarton) + currentSingles;

        if (dispatchQuantity > currentTotal) {
          throw new Error(`الكمية المطلوبة للصرف (${dispatchQuantity}) أكبر من الكمية المتاحة (${currentTotal})`);
        }

        // --- Exact inventory dispatch calculation ---
        // First, convert the requested quantity into cartons and singles (for display only – the actual deduction uses current stock)
        let requestedCartons = Math.floor(dispatchQuantity / perCarton);
        let requestedSingles = dispatchQuantity % perCarton;

        // Now calculate how many cartons and singles we actually take, respecting current stock
        let newCartons = currentCartons;
        let newSingles = currentSingles;
        let remainingSinglesToDispatch = requestedSingles;

        // 1. Use existing singles first
        if (remainingSinglesToDispatch > 0 && newSingles > 0) {
          const singlesToUse = Math.min(newSingles, remainingSinglesToDispatch);
          newSingles -= singlesToUse;
          remainingSinglesToDispatch -= singlesToUse;
        }

        // 2. If still need singles, break whole cartons
        if (remainingSinglesToDispatch > 0) {
          const cartonsToBreak = Math.ceil(remainingSinglesToDispatch / perCarton);
          if (newCartons < cartonsToBreak) {
            throw new Error(`لا يوجد عدد كافٍ من الكرتونات للأكياس الفردية`);
          }
          newCartons -= cartonsToBreak;
          const bottlesFromBrokenCartons = cartonsToBreak * perCarton;
          // Add the leftover singles from the broken cartons
          newSingles += bottlesFromBrokenCartons - remainingSinglesToDispatch;
          remainingSinglesToDispatch = 0;
        }

        // 3. Now deduct whole cartons
        if (requestedCartons > 0) {
          if (newCartons < requestedCartons) {
            throw new Error(`لا يوجد عدد كافٍ من الكرتونات`);
          }
          newCartons -= requestedCartons;
        }

        // Ensure non-negative
        newCartons = Math.max(0, newCartons);
        newSingles = Math.max(0, newSingles);

        const newTotal = (newCartons * perCarton) + newSingles;
        const takenCartons = currentCartons - newCartons;
        const takenSingles = currentSingles - newSingles; // Note: after breaking cartons, this may be negative; we'll recalc properly
        // Actually takenSingles might be negative because newSingles increased after breaking. We need to compute takenCartons and takenSingles based on the operation.
        // Instead, we compute the number of cartons and singles that were actually removed from stock.
        // This is simpler: the quantity taken is dispatchQuantity, and the breakdown is: cartons taken = (currentCartons - newCartons), singles taken = (currentSingles - newSingles) but careful because breaking increases newSingles.
        // Let's compute the actual numbers taken:
        let takenCartonsCount = currentCartons - newCartons; // net reduction in cartons
        let takenSinglesCount = currentSingles - newSingles; // net reduction in singles (may be negative if singles increased)
        // But the store expects positive numbers. We'll use the requested breakdown for display.

        // For transaction record, we can store the requested breakdown (cartons and singles) and the actual new state.
        // The inventory's dispatchItem stores: cartons_count: dispatchCartons (the number of whole cartons taken), single_bottles_count: dispatchSingles (the number of singles taken), and the new remaining quantities.
        // We'll do the same: dispatchCartons = requestedCartons, dispatchSingles = requestedSingles, but note that if singles were broken, the actual singles taken might be more than requestedSingles? No, requestedSingles is the number of singles we want, and we may break cartons to get them. The number of singles taken from the singles pool is requestedSingles minus any singles that came from broken cartons? This gets messy. The inventory's dispatchItem stores the final numbers after the operation, not the breakdown of what was taken. It stores the new quantities and also records the total quantity taken. It does not store how many cartons were taken vs singles; it only stores the new state. That's what we do here.

        // So we'll update the item and then create a transaction record with the new state and total taken quantity.

        transaction.update(itemRef, {
          cartons_count: newCartons,
          single_bottles_count: newSingles,
          remaining_quantity: newTotal,
          updated_at: serverTimestamp(),
          updated_by: state.user.uid
        });

        // Create transaction record (like inventory's dispatch)
        const transactionRef = doc(collection(db, 'transactions'));
        const transactionData = {
          type: 'DISPATCH',
          item_id: itemId,
          item_name: itemName || itemData.name,
          item_code: itemCode || itemData.code,
          color: itemData.color || '',
          from_warehouse: warehouseId,
          from_warehouse_name: '',
          destination: destination,
          destination_id: destinationId || destination,
          quantity: dispatchQuantity,
          total_delta: dispatchQuantity,
          new_remaining: newTotal,
          cartons_count: requestedCartons,  // store the requested breakdown
          per_carton_count: perCarton,
          single_bottles_count: requestedSingles,
          previous_cartons: currentCartons,
          previous_single_bottles: currentSingles,
          previous_quantity: currentTotal,
          new_cartons: newCartons,
          new_single_bottles: newSingles,
          new_quantity: newTotal,
          user_id: state.user.uid,
          user_name: state.userProfile?.name || '',
          user_role: state.userProfile?.role || '',
          user_email: state.user?.email || '',
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          notes: notes,
          priority: 'normal',
          status: 'completed',
          created_by: state.userProfile?.name || state.user?.email || 'نظام',
          display_type: 'صرف',
          display_quantity: `${dispatchQuantity} وحدة`,
          display_destination: destination,
          atomic_operation: true,
          detailed_breakdown_applied: true
        };

        transaction.set(transactionRef, transactionData);

        // Create item history record
        const historyRef = doc(collection(db, 'item_history'));
        const historyData = {
          item_id: itemId,
          warehouse_id: warehouseId,
          change_type: 'DISPATCH',
          old_quantity: currentTotal,
          new_quantity: newTotal,
          quantity_delta: -dispatchQuantity,
          old_cartons: currentCartons,
          new_cartons: newCartons,
          cartons_delta: -(currentCartons - newCartons),
          old_single_bottles: currentSingles,
          new_single_bottles: newSingles,
          single_bottles_delta: -(currentSingles - newSingles),
          destination: destination,
          destination_id: destinationId || destination,
          user_id: state.user.uid,
          user_name: state.userProfile?.name || '',
          timestamp: serverTimestamp(),
          details: {
            name: itemName || itemData.name,
            code: itemCode || itemData.code,
            color: itemData.color,
            notes: notes,
            priority: 'normal',
            transaction_id: transactionRef.id,
            per_carton: perCarton,
            detailed_dispatch: true
          }
        };

        transaction.set(historyRef, historyData);

        return {
          transactionId: transactionRef.id,
          transactionData,
          dispatchTotal: dispatchQuantity,
          newTotal,
          detailedUpdate: {
            cartons_count: newCartons,
            single_bottles_count: newSingles,
            per_carton_count: perCarton,
            remaining_quantity: newTotal
          },
          requestedCartons,
          requestedSingles
        };
      });

      // ========== AFTER SUCCESSFUL DISPATCH, UPDATE THE INVOICE ==========
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      if (invoiceDoc.exists()) {
        const existingInvoice = invoiceDoc.data();
        const dispatchRecord = {
          id: dispatchResult.transactionId,
          type: 'dispatch',
          item_id: itemId,
          item_name: itemName || (await getDoc(doc(db, 'items', itemId))).data().name,
          item_code: itemCode,
          quantity: dispatchResult.dispatchTotal,
          cartons: dispatchResult.requestedCartons,   // store the requested cartons
          singles: dispatchResult.requestedSingles,   // store the requested singles
          per_carton: dispatchResult.detailedUpdate.per_carton_count,
          destination: destination,
          destination_id: destinationId || destination,
          dispatched_by: state.userProfile?.name || state.user?.email,
          dispatched_at: serverTimestamp(),
          notes: notes,
          transaction_id: dispatchResult.transactionId,
          status: 'completed'
        };

        const invoiceUpdateData = {
          dispatches: [...(existingInvoice.dispatches || []), dispatchRecord],
          updated_at: serverTimestamp(),
          last_dispatch_at: serverTimestamp(),
          dispatch_status: 'partially_dispatched'
        };

        await updateDoc(invoiceRef, invoiceUpdateData);

        const updatedInvoice = {
          ...existingInvoice,
          ...invoiceUpdateData,
          id: invoiceId
        };
        commit('UPDATE_INVOICE', updatedInvoice);
      } else {
        console.warn('⚠️ Invoice document not found, dispatch record not added to invoice');
      }

      // ========== CREATE INVOICE‑SPECIFIC TRANSACTION ==========
      const invoiceTransactionRef = doc(collection(db, 'transactions'));
      const invoiceTransactionData = {
        type: 'INVOICE_DISPATCH',
        invoice_id: invoiceId,
        invoice_number: invoiceNumber || invoiceId,
        item_id: itemId,
        item_name: itemName,
        item_code: itemCode,
        from_warehouse: warehouseId,
        destination: destination,
        destination_id: destinationId || destination,
        quantity: dispatchResult.dispatchTotal,
        cartons_count: dispatchResult.requestedCartons,
        single_bottles_count: dispatchResult.requestedSingles,
        per_carton_count: dispatchResult.detailedUpdate.per_carton_count,
        customer_name: customerName,
        customer_phone: customerPhone,
        user_id: state.user.uid,
        user_name: state.userProfile?.name || '',
        user_role: state.userProfile?.role || '',
        timestamp: serverTimestamp(),
        created_at: serverTimestamp(),
        notes: `صرف للفاتورة #${invoiceNumber || invoiceId}${customerName ? ` - العميل: ${customerName}` : ''}`,
        created_by: state.userProfile?.name || state.user?.email || 'نظام',
        dispatch_transaction_id: dispatchResult.transactionId,
        display_type: 'صرف فاتورة',
        display_quantity: `${dispatchResult.dispatchTotal} وحدة`,
        display_destination: destination
      };

      await setDoc(invoiceTransactionRef, invoiceTransactionData);

      // ========== UPDATE LOCAL STATE ==========
      const transactionForState = {
        id: invoiceTransactionRef.id,
        ...invoiceTransactionData,
        timestamp: new Date(),
        created_at: new Date()
      };
      commit('ADD_TRANSACTION', transactionForState);
      commit('ADD_RECENT_TRANSACTION', transactionForState);

      // Refresh inventory to reflect changes
      await dispatch('refreshInventorySilently', null, { root: true });

      const successMessage = `تم صرف ${dispatchResult.dispatchTotal} وحدة من "${itemName}" للفاتورة #${invoiceNumber || invoiceId}`;
      dispatch('showNotification', {
        type: 'success',
        title: 'تم صرف الفاتورة بنجاح',
        message: successMessage,
        icon: 'check-circle',
        timeout: 5000
      });

      return {
        success: true,
        message: successMessage,
        invoiceId,
        itemId,
        quantityDispatched: dispatchResult.dispatchTotal,
        dispatchTransactionId: dispatchResult.transactionId,
        invoiceTransactionId: invoiceTransactionRef.id
      };

    } catch (error) {
      console.error('❌ Invoice dispatch failed:', error);
      commit('SET_OPERATION_ERROR', error.message);

      let errorMessage = error.message;
      if (error.message.includes('ليس لديك صلاحية')) {
        errorMessage = 'ليس لديك صلاحية لصرف فواتير';
      } else if (error.message.includes('أكبر من المتاح')) {
        errorMessage = 'الكمية المطلوبة تتجاوز الكمية المتاحة';
      }

      dispatch('showNotification', {
        type: 'error',
        title: 'فشل صرف الفاتورة',
        message: errorMessage,
        icon: 'alert-circle',
        timeout: 7000
      });

      return { success: false, message: errorMessage };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // UPDATED: BULK INVOICE DISPATCH – now uses the updated dispatchInvoiceItem for each item
  // ============================================
  async dispatchInvoiceBulk({ commit, state, dispatch }, {
    invoiceId,
    invoiceNumber,
    items,
    warehouseId,
    destination,
    destinationId,
    notes = '',
    customerName = '',
    customerPhone = ''
  }) {
    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('📦 Bulk invoice dispatch:', {
        invoiceId,
        invoiceNumber,
        itemsCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      });

      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager', 'company_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لصرف فواتير');
      }

      if (!invoiceId || !items || items.length === 0 || !warehouseId || !destination) {
        throw new Error('بيانات الصرف غير مكتملة');
      }

      const results = [];
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      const existingInvoice = invoiceDoc.exists() ? invoiceDoc.data() : null;
      const invoiceDispatches = existingInvoice?.dispatches || [];

      // Process each item sequentially – each uses its own transaction
      for (const item of items) {
        try {
          // Call the updated single‑item dispatch function (which uses full inventory logic)
          const dispatchResult = await dispatch('dispatchInvoiceItem', {
            invoiceId,
            invoiceNumber,
            itemId: item.id,
            itemName: item.name,
            itemCode: item.code,
            quantity: item.quantity,
            warehouseId,
            destination,
            destinationId,
            notes,
            customerName,
            customerPhone
          });

          if (dispatchResult.success) {
            // The dispatchInvoiceItem already updates the invoice and creates transactions,
            // so we only need to collect the result.
            results.push({
              itemId: item.id,
              success: true,
              quantity: item.quantity,
              transactionId: dispatchResult.dispatchTransactionId
            });
          } else {
            results.push({
              itemId: item.id,
              success: false,
              error: dispatchResult.message
            });
          }
        } catch (itemError) {
          console.error(`❌ Error processing item ${item.id}:`, itemError);
          results.push({
            itemId: item.id,
            success: false,
            error: itemError.message
          });
        }
      }

      // Create a summary transaction for the bulk operation
      const successfulItems = results.filter(r => r.success);
      if (successfulItems.length > 0) {
        const totalQuantity = successfulItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const transactionRef = doc(collection(db, 'transactions'));
        const transactionData = {
          type: 'INVOICE_BULK_DISPATCH',
          invoice_id: invoiceId,
          invoice_number: invoiceNumber || invoiceId,
          from_warehouse: warehouseId,
          destination: destination,
          destination_id: destinationId || destination,
          total_quantity: totalQuantity,
          items_count: successfulItems.length,
          items: successfulItems.map(item => ({ id: item.itemId, quantity: item.quantity })),
          user_id: state.user.uid,
          user_name: state.userProfile?.name || '',
          user_role: state.userProfile?.role || '',
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          notes: `صرف جماعي للفاتورة #${invoiceNumber || invoiceId} - ${notes}`,
          created_by: state.userProfile?.name || state.user?.email || 'نظام',
          display_type: 'صرف فاتورة جماعي',
          display_quantity: `${totalQuantity} وحدة`,
          display_destination: destination
        };
        await setDoc(transactionRef, transactionData);

        const transactionForState = {
          id: transactionRef.id,
          ...transactionData,
          timestamp: new Date(),
          created_at: new Date()
        };
        commit('ADD_TRANSACTION', transactionForState);
        commit('ADD_RECENT_TRANSACTION', transactionForState);
      }

      // Show summary notification
      const successCount = successfulItems.length;
      const totalDispatched = successfulItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      let message = `تم صرف ${successCount} أصناف (${totalDispatched} وحدة)`;
      if (results.length > successCount) {
        message += ` - فشل ${results.length - successCount} أصناف`;
      }

      dispatch('showNotification', {
        type: successCount > 0 ? 'success' : 'warning',
        title: successCount > 0 ? 'تم الصرف' : 'فشل جزئي',
        message: message,
        icon: successCount > 0 ? 'check-circle' : 'alert-circle',
        timeout: 6000
      });

      return {
        success: successCount > 0,
        message,
        results,
        totalDispatched,
        successfulCount: successCount
      };

    } catch (error) {
      console.error('❌ Bulk invoice dispatch failed:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        title: 'فشل الصرف الجماعي',
        message: error.message || 'حدث خطأ في الصرف الجماعي',
        icon: 'alert-circle',
        timeout: 7000
      });

      return { success: false, message: error.message };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  }
};
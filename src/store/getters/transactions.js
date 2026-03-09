import { TRANSACTION_TYPES } from '../utils/constants';

export default {
  transactions: state => state.transactions,
  transactionsItems: state => Array.isArray(state.transactions) ? state.transactions : [],
  recentTransactions: state => state.recentTransactions,
  transactionsLoading: state => state.transactionsLoading,
  recentTransactionsLoading: state => state.recentTransactionsLoading,
  getTransactionStats: (state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!state.transactions || state.transactions.length === 0) {
      return {
        total: 0,
        today: 0,
        add: 0,
        transfer: 0,
        dispatch: 0,
        update: 0,
        delete: 0,
        lastUpdated: null
      };
    }

    const todayTransactions = state.transactions.filter(t => {
      if (!t.timestamp) return false;
      try {
        const transDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        return transDate >= today;
      } catch {
        return false;
      }
    });

    const addCount = todayTransactions.filter(t => t.type === 'ADD').length;
    const transferCount = todayTransactions.filter(t => t.type === 'TRANSFER').length;
    const dispatchCount = todayTransactions.filter(t => t.type === 'DISPATCH').length;
    const updateCount = todayTransactions.filter(t => t.type === 'UPDATE').length;
    const deleteCount = todayTransactions.filter(t => t.type === 'DELETE').length;

    return {
      total: state.transactions.length,
      today: todayTransactions.length,
      add: addCount,
      transfer: transferCount,
      dispatch: dispatchCount,
      update: updateCount,
      delete: deleteCount,
      lastUpdated: state.transactions.length > 0 ? 
        (state.transactions[0].timestamp?.toDate ? 
         state.transactions[0].timestamp.toDate() : 
         new Date(state.transactions[0].timestamp)) : 
        null
    };
  },
  getTransactionTypeLabel: () => (type) => {
    const labels = {
      'ADD': 'إضافة',
      'TRANSFER': 'تحويل',
      'DISPATCH': 'صرف',
      'UPDATE': 'تحديث',
      'DELETE': 'حذف'
    };
    return labels[type] || type;
  },
  filteredTransactions: (state) => (filters = {}) => {
    let filtered = [...state.transactions];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => 
        (transaction.item_name?.toLowerCase() || '').includes(term) ||
        (transaction.item_code?.toLowerCase() || '').includes(term) ||
        (transaction.notes?.toLowerCase() || '').includes(term) ||
        (transaction.user_name?.toLowerCase() || '').includes(term)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(transaction => {
        if (!transaction.timestamp) return false;
        try {
          const transDate = transaction.timestamp?.toDate ? 
            transaction.timestamp.toDate() : new Date(transaction.timestamp);
          return transDate >= fromDate;
        } catch {
          return false;
        }
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(transaction => {
        if (!transaction.timestamp) return false;
        try {
          const transDate = transaction.timestamp?.toDate ? 
            transaction.timestamp.toDate() : new Date(transaction.timestamp);
          return transDate <= toDate;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  },
  getTransactionById: (state) => (id) => {
    return state.transactions.find(t => t.id === id);
  },
  getTodayTransactions: (state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return state.transactions.filter(t => {
      if (!t.timestamp) return false;
      try {
        const transDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        return transDate >= today;
      } catch {
        return false;
      }
    });
  },
  getTransactionsByWarehouse: (state) => (warehouseId) => {
    return state.transactions.filter(t => 
      t.from_warehouse === warehouseId || t.to_warehouse === warehouseId
    );
  },
  getTransactionsByItem: (state) => (itemId) => {
    return state.transactions.filter(t => t.item_id === itemId);
  },
  getTransactionCountsByType: (state) => {
    const counts = {
      ADD: 0,
      TRANSFER: 0,
      DISPATCH: 0,
      UPDATE: 0,
      DELETE: 0
    };

    state.transactions.forEach(t => {
      if (t.type && counts[t.type] !== undefined) {
        counts[t.type]++;
      }
    });

    return counts;
  },
  getWarehouseArabicName: (state) => (warehouseId, warehouseData = null) => {
    if (!warehouseId || warehouseId === 'undefined') return 'غير محدد';
    
    // If warehouseData is provided, use it
    if (warehouseData && warehouseData.name_ar) {
      return warehouseData.name_ar;
    }
    
    // Find in warehouses array
    const warehouse = state.warehouses.find(w => w.id === warehouseId);
    if (warehouse) {
      return warehouse.name_ar || warehouse.name || warehouseId;
    }
    
    // Check dispatch locations (warehouses with type='dispatch')
    const dispatchLocation = state.warehouses.find(w => 
      w.type === 'dispatch' && w.id === warehouseId
    );
    
    if (dispatchLocation) {
      return dispatchLocation.name_ar || dispatchLocation.name || warehouseId;
    }
    
    // Check common warehouse mappings
    const commonWarehouses = {
      'dubi_factory': 'مصنع دبي',
      'external_wharehouse': 'صرف خارجي',
      'factory': 'مصنع البران',
      'dispat_item': 'موقع صرف',
      'zahra': 'صرف الي مخزن الزهراء',
      'ghabashi': 'مخزن الغباشي',
      'al_ghabashi': 'مخزن الغباشي',
      'main': 'المخزن الرئيسي',
      'primary': 'المخزن الرئيسي'
    };
    
    if (commonWarehouses[warehouseId]) {
      return commonWarehouses[warehouseId];
    }
    
    return warehouseId;
  },
  getDispatchDestinationName: (state, getters) => (transaction) => {
    if (!transaction || transaction.type !== 'DISPATCH') return '';
    
    // Priority 1: Check ALL possible destination fields
    const possibleDestinationIds = [
      transaction.destination_id,
      transaction.destination,
      transaction.to_warehouse,
      transaction.warehouse_id,
      transaction.location
    ].filter(id => id && typeof id === 'string');
    
    // Check each ID against warehouses array
    for (const destId of possibleDestinationIds) {
      // First, check if it's a direct warehouse ID
      const warehouse = state.warehouses?.find(w => w.id === destId);
      if (warehouse) {
        return warehouse.name_ar || warehouse.name || destId;
      }
      
      // Check if it's a partial match (case insensitive)
      const partialMatch = state.warehouses?.find(w => 
        w.id.toLowerCase().includes(destId.toLowerCase()) ||
        (w.name_ar && w.name_ar.toLowerCase().includes(destId.toLowerCase())) ||
        (w.name_en && w.name_en.toLowerCase().includes(destId.toLowerCase()))
      );
      
      if (partialMatch) {
        return partialMatch.name_ar || partialMatch.name || destId;
      }
    }
    
    // Priority 2: Check if transaction has direct Arabic name
    if (transaction.destination && typeof transaction.destination === 'string') {
      const arabicRegex = /[\u0600-\u06FF]/;
      if (arabicRegex.test(transaction.destination)) {
        return transaction.destination;
      }
    }
    
    // Priority 3: Check notes for destination
    if (transaction.notes) {
      // Look for destination patterns in Arabic
      const arabicPatterns = [
        /إلى[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /لـ[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /الوجهة[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /موقع[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /صرف[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /ل[:\s]+(.+?)(?:\n|$|\.|,|;)/i
      ];
      
      // Also check for English patterns
      const englishPatterns = [
        /to[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /destination[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /dest[:\s]+(.+?)(?:\n|$|\.|,|;)/i,
        /location[:\s]+(.+?)(?:\n|$|\.|,|;)/i
      ];
      
      const allPatterns = [...arabicPatterns, ...englishPatterns];
      
      for (const pattern of allPatterns) {
        const match = transaction.notes.match(pattern);
        if (match && match[1]) {
          const destination = match[1].trim();
          
          // Try to match the extracted destination with warehouses
          const matchedWarehouse = state.warehouses?.find(w => 
            w.name_ar === destination || 
            w.name_en === destination ||
            w.id === destination
          );
          
          if (matchedWarehouse) {
            return matchedWarehouse.name_ar || matchedWarehouse.name || destination;
          }
          
          return destination;
        }
      }
    }
    
    // Priority 4: Special handling for common dispatch destinations
    const dispatchWarehouseMapping = {
      'dubi_factory': 'مصنع دبي',
      'external_wharehouse': 'صرف خارجي',
      'factory': 'مصنع البران',
      'dispat_item': 'موقع صرف',
      'zahra': 'صرف الي مخزن الزهراء',
      'dispatch': 'موقع صرف',
      'external': 'صرف خارجي',
      'factory_dispatch': 'مصنع البران',
      'dubi': 'مصنع دبي',
      'external_warehouse': 'صرف خارجي',
      'dispat': 'موقع صرف',
      'item_dispatch': 'موقع صرف'
    };
    
    // Check all possible IDs against the mapping
    const allIds = [
      transaction.destination_id,
      transaction.destination,
      transaction.to_warehouse
    ].filter(id => id);
    
    for (const id of allIds) {
      if (dispatchWarehouseMapping[id]) {
        return dispatchWarehouseMapping[id];
      }
      
      // Case insensitive check
      const lowerId = id.toLowerCase();
      for (const [key, value] of Object.entries(dispatchWarehouseMapping)) {
        if (lowerId.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerId)) {
          return value;
        }
      }
    }
    
    // Priority 5: Check if it's a warehouse with type='dispatch'
    const dispatchWarehouses = state.warehouses?.filter(w => w.type === 'dispatch') || [];
    for (const warehouse of dispatchWarehouses) {
      // Check if any ID matches this warehouse
      const allTransactionIds = [
        transaction.destination_id,
        transaction.destination,
        transaction.to_warehouse
      ];
      
      for (const id of allTransactionIds) {
        if (id && warehouse.id === id) {
          return warehouse.name_ar || warehouse.name || id;
        }
      }
    }
    
    // Fallback options
    if (transaction.destination_id) {
      return `صرف إلى ${transaction.destination_id}`;
    }
    
    if (transaction.destination) {
      return `صرف إلى ${transaction.destination}`;
    }
    
    if (transaction.to_warehouse) {
      return `صرف إلى ${transaction.to_warehouse}`;
    }
    
    return 'موقع صرف';
  },
  getTransactionQuantity: () => (transaction) => {
    const quantity = 
      transaction.quantity || 
      transaction.qty || 
      transaction.total_delta || 
      transaction.total_quantity || 
      transaction.delta_quantity || 
      0;
    
    // For DISPATCH type, show negative value
    if (transaction.type === 'DISPATCH' && quantity > 0) {
      return -Math.abs(quantity);
    }
    
    // For ADD type, ensure positive
    if (transaction.type === 'ADD' && quantity < 0) {
      return Math.abs(quantity);
    }
    
    return quantity;
  }
};
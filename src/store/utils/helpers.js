import { FIELD_MAPPINGS } from './constants';

// Helper function to get auth error message
export function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صالح';
    case 'auth/user-disabled':
      return 'الحساب معطل';
    case 'auth/user-not-found':
      return 'المستخدم غير موجود';
    case 'auth/wrong-password':
      return 'كلمة المرور غير صحيحة';
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني مستخدم بالفعل';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة';
    case 'auth/operation-not-allowed':
      return 'العملية غير مسموح بها';
    case 'auth/too-many-requests':
      return 'تم محاولة الدخول مرات عديدة. الرجاء المحاولة لاحقاً';
    case 'auth/network-request-failed':
      return 'خطأ في الاتصال بالشبكة';
    default:
      return 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى';
  }
}

// Helper function to get invoice type label
export function getInvoiceTypeLabel(type) {
  const labels = {
    'B2B': 'فاتورة ضريبية (B2B)',
    'B2C': 'فاتورة ضريبية (B2C)',
    'simplified': 'فاتورة مبسطة'
  };
  return labels[type] || type;
}

// Helper function to get invoice status label
export function getInvoiceStatusLabel(status) {
  const labels = {
    'draft': 'مسودة',
    'issued': 'صادرة',
    'paid': 'مدفوعة',
    'cancelled': 'ملغية'
  };
  return labels[status] || status;
}

// Helper function to get payment method label
export function getPaymentMethodLabel(method) {
  const labels = {
    'cash': 'نقدي',
    'credit': 'آجل',
    'bank_transfer': 'تحويل بنكي',
    'check': 'شيك'
  };
  return labels[method] || method;
}

/**
 * Ensures all required item fields are present with proper defaults
 * @param {Object} item - The item object to complete
 * @returns {Object} - Complete item object with all fields
 */
export function ensureCompleteItemFields(item) {
  if (!item) return null;
  
  // Define all possible fields with defaults
  const completeItem = {
    id: item.id || '',
    name: item.name || '',
    code: item.code || '',
    color: item.color || '',
    supplier: item.supplier || '',
    warehouse_id: item.warehouse_id || '',
    item_location: item.item_location || '',
    notes: item.notes || '',
    barcode: item.barcode || '',
    sku: item.sku || '',
    category: item.category || '',
    // Quantity fields
    cartons_count: Number(item.cartons_count) || 0,
    per_carton_count: Number(item.per_carton_count) || 12,
    single_bottles_count: Number(item.single_bottles_count) || 0,
    total_added: Number(item.total_added) || 0,
    remaining_quantity: Number(item.remaining_quantity) || 0,
    // Timestamps
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
    created_by: item.created_by || '',
    updated_by: item.updated_by || '',
    // Photo
    photo_url: item.photo_url || '',
    // Include any other fields from the original item
    ...item
  };
  
  // Ensure calculated fields are correct
  if (completeItem.remaining_quantity === 0 && 
      (completeItem.cartons_count > 0 || completeItem.single_bottles_count > 0)) {
    completeItem.remaining_quantity = (completeItem.cartons_count * completeItem.per_carton_count) + 
                                       completeItem.single_bottles_count;
  }
  
  return completeItem;
}
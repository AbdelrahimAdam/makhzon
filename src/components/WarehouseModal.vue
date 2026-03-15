<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg rtl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
          {{ warehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد' }}
        </h2>
        <button 
          @click="closeModal"
          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
        >
          <svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Warehouse ID -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            معرف المخزن <span class="text-red-500">*</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 block mt-1">يجب أن يكون معرفاً فريداً بالإنجليزية</span>
          </label>
          <input
            type="text"
            required
            v-model="formData.id"
            :readonly="!!warehouse"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            placeholder="مثال: main_warehouse"
            :class="{ 'bg-gray-100 dark:bg-gray-800': !!warehouse }"
          />
        </div>

        <!-- Warehouse Name (Arabic) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            اسم المخزن (عربي) <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            v-model="formData.name_ar"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
            placeholder="مخزن رئيسي"
          />
        </div>

        <!-- Warehouse Name (English) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            اسم المخزن (إنجليزي)
          </label>
          <input
            type="text"
            v-model="formData.name_en"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Main Warehouse"
          />
        </div>

        <!-- Warehouse Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            نوع المخزن <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label 
              v-for="type in warehouseTypes" 
              :key="type.value"
              class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors duration-200"
              :class="{
                'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20': formData.type === type.value,
                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700': formData.type !== type.value
              }"
            >
              <input
                type="radio"
                :value="type.value"
                v-model="formData.type"
                class="sr-only"
              />
              <div class="flex w-full items-center justify-between">
                <div class="flex items-center">
                  <div class="text-sm">
                    <div class="font-medium text-gray-900 dark:text-white">{{ type.name }}</div>
                    <div class="text-gray-500 dark:text-gray-400 text-xs mt-1">{{ type.description }}</div>
                  </div>
                </div>
                <svg v-if="formData.type === type.value" class="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- Capacity and Location -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              السعة التخزينية
            </label>
            <div class="relative">
              <input
                type="number"
                v-model.number="formData.capacity"
                min="0"
                step="1"
                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                placeholder="1000"
              />
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">وحدة</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الموقع
            </label>
            <input
              type="text"
              v-model="formData.location"
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="شارع الشيخ، المنوفية"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            وصف المخزن
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="وصف إضافي للمخزن..."
          ></textarea>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">حالة المخزن</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="formData.status" true-value="active" false-value="inactive" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            <span class="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ formData.status === 'active' ? 'نشط' : 'غير نشط' }}
            </span>
          </label>
        </div>

        <!-- Main Warehouse Flag -->
        <div v-if="formData.type === 'primary'">
          <div class="flex items-center">
            <input
              type="checkbox"
              v-model="formData.is_main"
              :true-value="true"
              :false-value="false"
              id="is_main"
              class="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <label for="is_main" class="mr-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              تعيين كمخزن رئيسي
            </label>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            المخزن الرئيسي هو المخزن الافتراضي في النظام
          </p>
        </div>

        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h4 class="text-sm font-medium text-red-800 dark:text-red-300 mb-2">خطأ في التحقق:</h4>
          <ul class="text-sm text-red-700 dark:text-red-300 list-disc pr-5 space-y-1">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            إلغاء
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ loading ? 'جاري الحفظ...' : (warehouse ? 'تحديث' : 'إضافة') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'WarehouseModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    warehouse: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    
    const loading = ref(false);
    const errorMessage = ref('');
    const validationErrors = ref([]);
    
    const formData = ref({
      id: '',
      name_ar: '',
      name_en: '',
      type: 'primary',
      capacity: 0,
      location: '',
      description: '',
      status: 'active',
      is_main: false
    });

    const warehouseTypes = ref([
      {
        value: 'primary',
        name: 'مخزن رئيسي',
        description: 'مخزن للتخزين الداخلي'
      },
      {
        value: 'dispatch',
        name: 'موقع صرف',
        description: 'موقع لصرف الأصناف للخارج'
      }
    ]);

    const isFormValid = computed(() => {
      validationErrors.value = [];

      if (!formData.value.id.trim()) {
        validationErrors.value.push('معرف المخزن مطلوب');
      } else if (!/^[a-z0-9_]+$/.test(formData.value.id)) {
        validationErrors.value.push('معرف المخزن يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط');
      }

      if (!formData.value.name_ar.trim()) {
        validationErrors.value.push('اسم المخزن بالعربي مطلوب');
      }

      if (!formData.value.type) {
        validationErrors.value.push('نوع المخزن مطلوب');
      }

      if (formData.value.capacity < 0) {
        validationErrors.value.push('السعة التخزينية لا يمكن أن تكون سالبة');
      }

      return validationErrors.value.length === 0;
    });

    const resetForm = () => {
      formData.value = {
        id: '',
        name_ar: '',
        name_en: '',
        type: 'primary',
        capacity: 0,
        location: '',
        description: '',
        status: 'active',
        is_main: false
      };
      errorMessage.value = '';
      validationErrors.value = [];
    };

    const closeModal = () => {
      resetForm();
      emit('close');
    };

    const handleSubmit = async () => {
      if (!isFormValid.value) return;

      loading.value = true;
      errorMessage.value = '';

      try {
        // Prepare warehouse data (without timestamps – store will add them)
        const warehouseData = {
          id: formData.value.id.trim(),
          name_ar: formData.value.name_ar.trim(),
          name_en: formData.value.name_en.trim() || formData.value.name_ar.trim(),
          type: formData.value.type,
          capacity: Number(formData.value.capacity) || 0,
          location: formData.value.location.trim(),
          description: formData.value.description.trim(),
          status: formData.value.status,
          is_main: formData.value.is_main || false
        };

        // Check permission using store getter
        if (!store.getters.canManageWarehouses) {
          throw new Error('ليس لديك صلاحية لإدارة المخازن');
        }

        let result;
        if (props.warehouse) {
          // Update existing warehouse
          result = await store.dispatch('updateWarehouse', {
            warehouseId: props.warehouse.id,
            warehouseData: warehouseData
          });
        } else {
          // Add new warehouse – the store action will handle existence check
          result = await store.dispatch('addWarehouse', warehouseData);
        }

        if (result) {
          // Show success notification (already done in store action)
          // Emit save event
          emit('save', { ...warehouseData, id: props.warehouse ? props.warehouse.id : warehouseData.id });
          closeModal();
        }
      } catch (error) {
        console.error('Error saving warehouse:', error);
        errorMessage.value = error.message || 'حدث خطأ أثناء حفظ المخزن';
        
        store.dispatch('showNotification', {
          type: 'error',
          message: errorMessage.value
        });
      } finally {
        loading.value = false;
      }
    };

    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        resetForm();
        
        if (props.warehouse) {
          // Edit mode – populate form with warehouse data (exclude internal fields)
          formData.value = {
            id: props.warehouse.id,
            name_ar: props.warehouse.name_ar || '',
            name_en: props.warehouse.name_en || '',
            type: props.warehouse.type || 'primary',
            capacity: props.warehouse.capacity || 0,
            location: props.warehouse.location || '',
            description: props.warehouse.description || '',
            status: props.warehouse.status || 'active',
            is_main: props.warehouse.is_main || false
          };
        }
      }
    });

    watch(() => formData.value.type, (newType) => {
      // Reset is_main if type changes to dispatch
      if (newType === 'dispatch') {
        formData.value.is_main = false;
      }
    });

    return {
      loading,
      errorMessage,
      validationErrors,
      formData,
      warehouseTypes,
      isFormValid,
      closeModal,
      handleSubmit
    };
  }
};
</script>
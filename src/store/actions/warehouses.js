import { db } from '@/firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, deleteDoc, doc, limit, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { ensureFirebaseReady } from '../utils/firebase-utils';

export default {
  async loadWarehousesEnhanced({ commit, dispatch, rootState }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log('🔄 Loading warehouses with enhanced filtering...');

      const warehousesRef = collection(db, 'warehouses');
      const q = query(
        warehousesRef,
        where('companyId', '==', companyId),
        orderBy('name_ar')
      );
      const snapshot = await getDocs(q);

      const warehouses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // REMOVED THE FILTER THAT EXCLUDED DISPATCH WAREHOUSES
        // .filter(warehouse => {
        //   return warehouse.type !== 'dispatch';
        // });

      commit('SET_WAREHOUSES', warehouses);
      console.log(`✅ Warehouses loaded: ${warehouses.length}`);

      return warehouses;

    } catch (error) {
      console.error('❌ Error loading warehouses:', error);
      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل المخازن'
      });
      return [];
    }
  },

  async getDispatchWarehouses({ dispatch, rootState }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log('🔄 Fetching dispatch warehouses from database...');

      console.log('⏳ Ensuring Firebase is ready for dispatch warehouses...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for dispatch warehouses');

      if (!db) {
        console.error('❌ Firestore database not available');
        throw new Error('Firestore database not available');
      }

      const firebaseFirestore = await import('firebase/firestore');
      const {
        collection,
        query,
        where,
        orderBy,
        getDocs
      } = firebaseFirestore;

      const warehousesRef = collection(db, 'warehouses');
      const q = query(
        warehousesRef,
        where('companyId', '==', companyId),
        where('type', '==', 'dispatch'),
        orderBy('name_ar')
      );

      console.log('🔍 Executing dispatch warehouses query...');
      const snapshot = await getDocs(q);
      console.log(`📊 Found ${snapshot.size} dispatch warehouses in database`);

      const dispatchWarehouses = [];

      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          const warehouseId = doc.id;

          console.log(`📋 Warehouse ${warehouseId}:`, {
            name_ar: data.name_ar,
            name: data.name,
            type: data.type,
            is_active: data.is_active
          });

          const arabicName = data.name_ar || data.name || warehouseId;

          const warehouse = {
            id: warehouseId,
            name_ar: arabicName,
            name: data.name || '',
            type: data.type || 'dispatch',
            location: data.location || '',
            is_active: data.is_active !== false,
            is_main: data.is_main || false,
            created_at: data.created_at,
            updated_at: data.updated_at,
            ...data
          };

          dispatchWarehouses.push(warehouse);
        } catch (docError) {
          console.warn(`⚠️ Error processing warehouse document ${doc.id}:`, docError);
        }
      });

      console.log(`✅ Dispatch warehouses loaded from database: ${dispatchWarehouses.length}`);

      if (dispatchWarehouses.length === 0) {
        console.warn('⚠️ No dispatch warehouses found in database with type="dispatch"');
      }

      return dispatchWarehouses;

    } catch (error) {
      console.error('❌ Error loading dispatch warehouses:', error);
      console.error('Error stack:', error.stack);

      dispatch('showNotification', {
        type: 'error',
        message: `خطأ في تحميل مخازن الصرف: ${error.message || 'يرجى التحقق من اتصال الإنترنت'}`
      });

      return [];
    }
  },

  async loadWarehouses({ dispatch, rootState }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log('🔄 Loading warehouses...');

      const warehousesRef = collection(db, 'warehouses');
      const q = query(
        warehousesRef,
        where('companyId', '==', companyId),
        orderBy('name_ar')
      );
      const snapshot = await getDocs(q);

      const warehouses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return warehouses;

    } catch (error) {
      console.error('❌ Error loading warehouses:', error);
      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل المخازن'
      });
      return [];
    }
  },

  async addWarehouse({ commit, state, dispatch, rootState }, warehouseData) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      // Check permissions based on user role
      const userRole = rootState.userProfile?.role;
      const isSuperAdmin = userRole === 'superadmin';
      const isCompanyManager = userRole === 'company_manager';
      const isWarehouseManager = userRole === 'warehouse_manager';

      // Allow superadmins, company managers, and warehouse managers to create warehouses
      if (!isSuperAdmin && !isCompanyManager && !isWarehouseManager) {
        throw new Error('ليس لديك صلاحية لإضافة مخازن');
      }

      commit('SET_OPERATION_LOADING', true);

      const warehouseToAdd = {
        ...warehouseData,
        is_active: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: rootState.userProfile?.name || rootState.user?.email,
        companyId: companyId
      };

      console.log('Adding warehouse with data:', warehouseToAdd);

      // Use setDoc with the user‑provided ID
      const warehouseRef = doc(db, 'warehouses', warehouseData.id);
      await setDoc(warehouseRef, warehouseToAdd);

      const newWarehouse = {
        id: warehouseData.id,
        ...warehouseToAdd
      };

      // Update both regular warehouses list and dispatch warehouses list if needed
      commit('SET_WAREHOUSES', [...state.warehouses, newWarehouse]);
      
      // If this is a dispatch warehouse, also add to dispatch warehouses list
      if (warehouseData.type === 'dispatch') {
        // You might want to have a separate state for dispatch warehouses
        // For now, just log it
        console.log('Added dispatch warehouse:', newWarehouse);
      }

      dispatch('showNotification', {
        type: 'success',
        message: `تم إضافة ${warehouseData.type === 'dispatch' ? 'موقع الصرف' : 'المخزن'} "${warehouseData.name_ar}" بنجاح`
      });

      return newWarehouse;
    } catch (error) {
      console.error('❌ Error adding warehouse:', error);

      // Provide a user‑friendly message if the error is permission‑denied
      let errorMessage = error.message;
      if (error.code === 'permission-denied') {
        errorMessage = 'لا يمكنك إضافة هذا المخزن. قد يكون المعرف مستخدماً بالفعل في شركة أخرى.';
      }

      dispatch('showNotification', {
        type: 'error',
        message: errorMessage || 'خطأ في إضافة المخزن'
      });
      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async updateWarehouse({ commit, state, dispatch, rootState }, { warehouseId, warehouseData }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      const userRole = rootState.userProfile?.role;
      const isSuperAdmin = userRole === 'superadmin';
      const isCompanyManager = userRole === 'company_manager';

      if (!isSuperAdmin && !isCompanyManager) {
        throw new Error('ليس لديك صلاحية لتعديل المخازن');
      }

      commit('SET_OPERATION_LOADING', true);

      const warehouseRef = doc(db, 'warehouses', warehouseId);

      // Verify warehouse belongs to company
      const warehouseDoc = await getDoc(warehouseRef);
      if (!warehouseDoc.exists()) throw new Error('المخزن غير موجود');
      if (warehouseDoc.data().companyId !== companyId) throw new Error('لا يمكنك تعديل هذا المخزن');

      await updateDoc(warehouseRef, {
        ...warehouseData,
        updated_at: serverTimestamp(),
        updated_by: rootState.userProfile?.name || rootState.user?.email
      });

      const updatedWarehouses = state.warehouses.map(w => 
        w.id === warehouseId ? { ...w, ...warehouseData } : w
      );
      commit('SET_WAREHOUSES', updatedWarehouses);

      dispatch('showNotification', {
        type: 'success',
        message: `تم تحديث ${warehouseData.type === 'dispatch' ? 'موقع الصرف' : 'المخزن'} بنجاح`
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating warehouse:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في تحديث المخزن'
      });
      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async deleteWarehouse({ commit, state, dispatch, rootState }, { warehouseId, warehouseName }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      const userRole = rootState.userProfile?.role;
      const isSuperAdmin = userRole === 'superadmin';
      const isCompanyManager = userRole === 'company_manager';

      if (!isSuperAdmin && !isCompanyManager) {
        throw new Error('ليس لديك صلاحية لحذف المخازن');
      }

      commit('SET_OPERATION_LOADING', true);

      const warehouseRef = doc(db, 'warehouses', warehouseId);

      // Verify warehouse belongs to company
      const warehouseDoc = await getDoc(warehouseRef);
      if (!warehouseDoc.exists()) throw new Error('المخزن غير موجود');
      if (warehouseDoc.data().companyId !== companyId) throw new Error('لا يمكنك حذف هذا المخزن');

      const confirmDelete = confirm(`هل أنت متأكد من حذف ${warehouseDoc.data().type === 'dispatch' ? 'موقع الصرف' : 'المخزن'} "${warehouseName}"؟`);
      if (!confirmDelete) return;

      const itemsRef = collection(db, 'items');
      const q = query(itemsRef, where('warehouse_id', '==', warehouseId), limit(1));
      const itemsSnapshot = await getDocs(q);

      if (!itemsSnapshot.empty) {
        throw new Error('لا يمكن حذف هذا المخزن لأنه يحتوي على أصناف. يجب نقل الأصناف أولاً.');
      }

      await deleteDoc(warehouseRef);

      const updatedWarehouses = state.warehouses.filter(w => w.id !== warehouseId);
      commit('SET_WAREHOUSES', updatedWarehouses);

      dispatch('showNotification', {
        type: 'success',
        message: `تم حذف ${warehouseDoc.data().type === 'dispatch' ? 'موقع الصرف' : 'المخزن'} "${warehouseName}" بنجاح`
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting warehouse:', error);
      commit('SET_OPERATION_ERROR', error.message);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في حذف المخزن'
      });
      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },
};
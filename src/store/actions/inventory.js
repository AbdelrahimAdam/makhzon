import { db } from '@/firebase/config';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, writeBatch, serverTimestamp, increment, runTransaction, startAfter, onSnapshot,getCountFromServer } from 'firebase/firestore';
import { ensureFirebaseReady } from '../utils/firebase-utils';
import { ensureCompleteItemFields } from '../utils/helpers';
import { PERFORMANCE_CONFIG, SPARK_CONFIG, TRANSACTION_TYPES } from '../utils/constants';
import { InventoryService } from '@/services/inventoryService';

export default {
  async loadInventoryWithWarehouse({ commit, state, dispatch }, { 
    warehouseId = null,
    forceRefresh = false 
  } = {}) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_INVENTORY_LOADING', true);

    try {
      const targetWarehouse = warehouseId || state.warehouseFilter;

      if (targetWarehouse) {
        commit('SET_WAREHOUSE_FILTER', targetWarehouse);
      }

      let itemsQuery;
      const itemsRef = collection(db, 'items');

      if (targetWarehouse && targetWarehouse !== 'all') {
        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('warehouse_id', '==', targetWarehouse),
          orderBy('name'),
          limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
        );
      } else {
        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          orderBy('name'),
          limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
        );
      }

      const snapshot = await getDocs(itemsQuery);
      const inventory = snapshot.docs.map(doc => {
        const data = doc.data();
        return InventoryService.convertForDisplay({
          id: doc.id,
          ...data
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      commit('SET_PAGINATION', {
        lastDoc,
        hasMore: snapshot.size === PERFORMANCE_CONFIG.INITIAL_LOAD,
        totalLoaded: inventory.length
      });

      commit('SET_INVENTORY', inventory);
      commit('SET_INVENTORY_LOADED', true);

      if (state.realtimeMode) {
        await dispatch('setupOptimizedRealtimeUpdates', inventory.map(item => item.id));
      }

      return inventory;

    } catch (error) {
      console.error('❌ Error loading inventory with warehouse filter:', error);
      commit('SET_INVENTORY_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_INVENTORY_LOADING', false);
    }
  },

  async loadAllInventory({ commit, state, dispatch }, { forceRefresh = false } = {}) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) {
      console.error('❌ loadAllInventory: companyId missing');
      commit('SET_INVENTORY_ERROR', 'لم يتم العثور على معرف الشركة');
      return [];
    }

    if (state.inventoryLoading) {
      console.log('Inventory load already in progress');
      return state.inventory;
    }

    if (state.inventoryLoaded && !forceRefresh) {
      console.log('Inventory already loaded');
      return state.inventory;
    }

    commit('SET_INVENTORY_LOADING', true);
    commit('SET_INVENTORY_ERROR', null);
    commit('RESET_PAGINATION');

    try {
      console.log('🔄 Loading ALL inventory...');

      console.log('⏳ Ensuring Firebase is ready...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready');

      if (!state.userProfile) {
        throw new Error('User not authenticated');
      }

      if (!db) {
        throw new Error('Database not available');
      }

      const itemsRef = collection(db, 'items');
      let itemsQuery;

      if (state.userProfile.role === 'superadmin' || state.userProfile.role === 'company_manager') {
        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          orderBy('name'),
          limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
        );
      } else if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];

        if (allowedWarehouses.length === 0) {
          throw new Error('No warehouses assigned to this manager');
        }

        if (allowedWarehouses.includes('all')) {
          itemsQuery = query(
            itemsRef,
            where('companyId', '==', companyId),        // NEW
            orderBy('name'),
            limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
          );
        } else {
          const warehouseIds = allowedWarehouses.slice(0, 10);
          
          if (warehouseIds.length === 1) {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),      // NEW
              where('warehouse_id', '==', warehouseIds[0]),
              orderBy('name'),
              limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
            );
          } else {
            try {
              itemsQuery = query(
                itemsRef,
                where('companyId', '==', companyId),    // NEW
                where('warehouse_id', 'in', warehouseIds),
                orderBy('name'),
                limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
              );
            } catch (inError) {
              console.warn('"in" query failed, using first warehouse:', inError);
              itemsQuery = query(
                itemsRef,
                where('companyId', '==', companyId),    // NEW
                where('warehouse_id', '==', warehouseIds[0]),
                orderBy('name'),
                limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
              );
            }
          }
        }
      } else {
        throw new Error('User role not authorized for inventory access');
      }

      const snapshot = await getDocs(itemsQuery);
      console.log(`✅ Initial inventory loaded: ${snapshot.size} items`);

      const inventory = snapshot.docs.map(doc => {
        const data = doc.data();
        return InventoryService.convertForDisplay({
          id: doc.id,
          ...data
        });
      });

      let lastDoc = null;
      if (snapshot.docs.length > 0) {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }

      commit('SET_PAGINATION', {
        lastDoc,
        hasMore: snapshot.size === PERFORMANCE_CONFIG.INITIAL_LOAD,
        totalLoaded: inventory.length
      });

      commit('SET_INVENTORY', inventory);
      commit('SET_INVENTORY_LOADED', true);

      if (state.realtimeMode) {
        await dispatch('setupOptimizedRealtimeUpdates', inventory.map(item => item.id));
      }

      console.log(`🎉 Inventory loaded successfully: ${inventory.length} items`);
      return inventory;

    } catch (error) {
      console.error('❌ Error loading inventory:', error);
      commit('SET_INVENTORY_ERROR', error.message);

      if (error.name === 'DataCloneError' || error.message.includes('could not be cloned')) {
        console.warn('🔧 IndexedDB serialization error detected');
        dispatch('showNotification', {
          type: 'warning',
          message: 'جارٍ إصلاح مخزن البيانات المحلي...'
        });
        
        try {
          localStorage.removeItem('firestore/indexeddb/persistence');
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }
      } else {
        dispatch('showNotification', {
          type: 'error',
          message: 'خطأ في تحميل المخزون'
        });
      }

      return [];
    } finally {
      commit('SET_INVENTORY_LOADING', false);
    }
  },

  async loadMoreInventory({ commit, state, dispatch }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) {
      console.error('❌ loadMoreInventory: companyId missing');
      return [];
    }

    if (!state.pagination.hasMore || state.pagination.isFetching) {
      console.log('⏹️ Not loading more: hasMore =', state.pagination.hasMore, 'isFetching =', state.pagination.isFetching);
      return [];
    }

    commit('SET_PAGINATION', { isFetching: true });

    try {
      console.log('📥 Loading more inventory items...');

      console.log('⏳ Ensuring Firebase is ready for loadMore...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for loadMore');

      if (!state.userProfile) {
        console.log('⚠️ User not authenticated');
        return [];
      }

      if (!db) {
        console.error('❌ Database not available');
        return [];
      }

      let startAfterDoc = null;
      if (state.pagination.lastDoc) {
        try {
          if (state.pagination.lastDoc && typeof state.pagination.lastDoc === 'object') {
            startAfterDoc = state.pagination.lastDoc;
          } else {
            console.warn('⚠️ Invalid lastDoc format, resetting pagination');
            commit('SET_PAGINATION', { 
              lastDoc: null, 
              hasMore: true,
              isFetching: false 
            });
            return [];
          }
        } catch (docError) {
          console.warn('⚠️ Error processing lastDoc:', docError);
          commit('SET_PAGINATION', { 
            lastDoc: null, 
            hasMore: true,
            isFetching: false 
          });
          return [];
        }
      }

      const itemsRef = collection(db, 'items');
      let itemsQuery;

      if (state.userProfile.role === 'superadmin' || state.userProfile.role === 'company_manager') {
        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          orderBy('name'),
          ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
          limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
        );
      } else if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];

        if (allowedWarehouses.includes('all')) {
          itemsQuery = query(
            itemsRef,
            where('companyId', '==', companyId),        // NEW
            orderBy('name'),
            ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
            limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
          );
        } else {
          const warehouseIds = allowedWarehouses.slice(0, 10);
          
          if (warehouseIds.length === 1) {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),      // NEW
              where('warehouse_id', '==', warehouseIds[0]),
              orderBy('name'),
              ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
              limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
            );
          } else {
            try {
              itemsQuery = query(
                itemsRef,
                where('companyId', '==', companyId),    // NEW
                where('warehouse_id', 'in', warehouseIds),
                orderBy('name'),
                ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
                limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
              );
            } catch (inError) {
              console.warn('"in" query failed, using single warehouse:', inError);
              itemsQuery = query(
                itemsRef,
                where('companyId', '==', companyId),    // NEW
                where('warehouse_id', '==', warehouseIds[0]),
                orderBy('name'),
                ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
                limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
              );
            }
          }
        }
      } else {
        console.log('🚫 User role not authorized for pagination');
        return [];
      }

      console.log('🔍 Executing paginated query...');
      let snapshot;
      try {
        snapshot = await getDocs(itemsQuery);
        console.log(`✅ Paginated query returned ${snapshot.size} documents`);
      } catch (queryError) {
        console.error('❌ Paginated query failed:', queryError);
        
        if (queryError.code === 'failed-precondition' || queryError.message.includes('index')) {
          console.log('🔄 Index missing or query error, falling back to simple query');
          const fallbackQuery = query(
            itemsRef,
            where('companyId', '==', companyId),        // NEW
            orderBy('name'),
            limit(PERFORMANCE_CONFIG.SCROLL_LOAD)
          );
          snapshot = await getDocs(fallbackQuery);
        } else {
          throw queryError;
        }
      }

      if (snapshot.empty) {
        console.log('📭 No more items to load');
        commit('SET_PAGINATION', { 
          hasMore: false, 
          isFetching: false 
        });
        return [];
      }

      const newItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return InventoryService.convertForDisplay({
          id: doc.id,
          ...data
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const totalLoaded = state.pagination.totalLoaded + newItems.length;

      console.log(`📥 Loaded ${newItems.length} more items, total now: ${totalLoaded}`);

      const existingIds = new Set(state.inventory.map(item => item.id));
      const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
      
      if (uniqueNewItems.length > 0) {
        commit('APPEND_INVENTORY', uniqueNewItems);
      }

      commit('SET_PAGINATION', {
        lastDoc,
        hasMore: snapshot.size === PERFORMANCE_CONFIG.SCROLL_LOAD,
        totalLoaded,
        currentPage: state.pagination.currentPage + 1,
        isFetching: false
      });

      if (state.realtimeMode) {
        await dispatch('setupOptimizedRealtimeUpdates', newItems.map(item => item.id));
      }

      return newItems;

    } catch (error) {
      console.error('❌ Error loading more inventory:', error);
      
      if (error.name === 'DataCloneError' || error.message.includes('could not be cloned')) {
        console.warn('🔄 IndexedDB serialization error detected, resetting pagination...');
        
        commit('SET_PAGINATION', { 
          lastDoc: null, 
          hasMore: true,
          isFetching: false,
          currentPage: 0
        });
        
        return await dispatch('loadMoreInventory');
      }

      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل المزيد من العناصر. جاري إعادة المحاولة...'
      });

      return [];
    } finally {
      commit('SET_PAGINATION', { isFetching: false });
    }
  },

  // ============================================
  // ADD INVENTORY ITEM ACTION (WITH NAME+CODE+COLOR MATCHING)
  // ============================================
  async addInventoryItem({ commit, state, dispatch }, { itemData, isAddingCartons = true }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🔄 addInventoryItem called with:', {
        itemData: { 
          name: itemData.name,
          code: itemData.code,
          color: itemData.color,
          warehouse_id: itemData.warehouse_id,
          cartons_count: itemData.cartons_count,
          single_bottles_count: itemData.single_bottles_count
        },
        isAddingCartons
      });

      // 🔴 VALIDATION 1: User authentication
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لإضافة أصناف');
      }
      if (!state.user?.uid) {
        throw new Error('معرف المستخدم غير متوفر');
      }

      // 🔴 VALIDATION 2: Required fields
      if (!itemData.name?.trim() || !itemData.code?.trim() || !itemData.warehouse_id || !itemData.color?.trim()) {
        throw new Error('جميع الحقول المطلوبة يجب أن تكون مملوءة (الاسم، الكود، اللون، المخزن)');
      }

      // 🔴 VALIDATION 3: Warehouse access
      const warehouseId = itemData.warehouse_id;
      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية لإضافة/تعديل أصناف في هذا المخزن');
          }
        }
      }

      // ============================================
      // 🔴 STEP 1: CHECK FOR EXISTING ITEM WITH SAME NAME, CODE, COLOR IN SAME WAREHOUSE
      // ============================================
      console.log('🔍 Checking for existing item with same name, code, color in warehouse...');
      
      let existingItem = null;
      let existingItemId = null;
      
      const cleanedData = {
        name: itemData.name.trim(),
        code: itemData.code.trim(),
        color: itemData.color.trim(),
        warehouse_id: warehouseId
      };

      console.log('🔍 Searching for item with:', cleanedData);

      try {
        const itemsRef = collection(db, 'items');
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('name', '==', cleanedData.name),
          where('code', '==', cleanedData.code),
          where('color', '==', cleanedData.color),
          where('warehouse_id', '==', cleanedData.warehouse_id),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          existingItem = snapshot.docs[0].data();
          existingItemId = snapshot.docs[0].id;
          console.log('✅ Found existing item with same name+code+color+warehouse:', {
            id: existingItemId,
            name: existingItem.name,
            code: existingItem.code,
            color: existingItem.color,
            warehouse: existingItem.warehouse_id,
            cartons_count: existingItem.cartons_count,
            per_carton_count: existingItem.per_carton_count,
            single_bottles_count: existingItem.single_bottles_count,
            total_added: existingItem.total_added,
            remaining_quantity: existingItem.remaining_quantity
          });
        } else {
          console.log('📭 No existing item found - will create new item');
        }
      } catch (error) {
        console.error('❌ Error checking existing item:', error.message);
        console.log('⚠️ Will create new item due to check error');
      }

      // ============================================
      // 🔴 STEP 2: BUSINESS LOGIC CALCULATIONS
      // ============================================
      
      let result;
      let totalQuantity = 0;
      let additionalCartonsFromSingles = 0;
      let isCreatingNewItem = false;
      
      if (existingItem && existingItemId) {
        console.log('🔄 UPDATING existing item with ID:', existingItemId);
        
        const itemRef = doc(db, 'items', existingItemId);
        
        const newCartonsCount = Number(itemData.cartons_count) || 0;
        const currentCartonsCount = Number(existingItem.cartons_count) || 0;
        let finalCartonsCount = currentCartonsCount;
        
        if (isAddingCartons && newCartonsCount > 0) {
          finalCartonsCount = currentCartonsCount + newCartonsCount;
          console.log(`➕ عدد الكراتين: ${currentCartonsCount} + ${newCartonsCount} = ${finalCartonsCount}`);
        }
        
        const currentPerCarton = Number(existingItem.per_carton_count) || 12;
        const newPerCartonCount = Number(itemData.per_carton_count) || 0;
        let finalPerCartonCount = currentPerCarton;
        
        if (newPerCartonCount > 0) {
          finalPerCartonCount = newPerCartonCount;
          console.log(`🔄 عدد في الكرتونه: ${currentPerCarton} → ${newPerCartonCount}`);
        }
        
        const currentSingleBottlesCount = Number(existingItem.single_bottles_count) || 0;
        const newSingleBottlesCount = Number(itemData.single_bottles_count) || 0;
        let finalSingleBottlesCount = currentSingleBottlesCount;
        
        if (itemData.single_bottles_count !== undefined) {
          finalSingleBottlesCount = newSingleBottlesCount;
          console.log(`🔄 عدد القزاز الفردي: ${currentSingleBottlesCount} → ${newSingleBottlesCount}`);
        }
        
        if (finalSingleBottlesCount >= finalPerCartonCount) {
          additionalCartonsFromSingles = Math.floor(finalSingleBottlesCount / finalPerCartonCount);
          finalSingleBottlesCount = finalSingleBottlesCount % finalPerCartonCount;
          finalCartonsCount += additionalCartonsFromSingles;
          
          console.log(`🔄 Converting single bottles to cartons: added ${additionalCartonsFromSingles} cartons, remaining singles: ${finalSingleBottlesCount}`);
        }
        
        const currentRemaining = Number(existingItem.remaining_quantity) || 0;
        const currentTotalAdded = Number(existingItem.total_added) || 0;
        
        const oldCartonsQuantity = currentCartonsCount * currentPerCarton;
        const newCartonsQuantity = finalCartonsCount * finalPerCartonCount;
        const cartonsQuantityAdded = Math.max(0, newCartonsQuantity - oldCartonsQuantity);
        
        totalQuantity = (finalCartonsCount * finalPerCartonCount) + finalSingleBottlesCount;
        const newTotalAdded = currentTotalAdded + cartonsQuantityAdded;
        
        console.log('📊 BUSINESS LOGIC RESULTS:', {
          finalCartons: finalCartonsCount,
          finalPerCarton: finalPerCartonCount,
          finalSingle: finalSingleBottlesCount,
          newRemaining: totalQuantity,
          cartonsQuantityAdded,
          newTotalAdded: newTotalAdded
        });
        
        const updateData = {
          cartons_count: finalCartonsCount,
          per_carton_count: finalPerCartonCount,
          single_bottles_count: finalSingleBottlesCount,
          remaining_quantity: totalQuantity,
          updated_at: serverTimestamp(),
          updated_by: state.user.uid
        };
        
        if (cartonsQuantityAdded > 0) {
          updateData.total_added = newTotalAdded;
        }
        
        if (itemData.supplier !== undefined) {
          updateData.supplier = itemData.supplier?.trim() || null;
        }
        
        if (itemData.item_location !== undefined) {
          updateData.item_location = itemData.item_location?.trim() || null;
        }
        
        if (itemData.notes !== undefined) {
          updateData.notes = itemData.notes?.trim() || null;
        }
        
        if (itemData.photo_url !== undefined) {
          updateData.photo_url = itemData.photo_url;
        }
        
        updateData.name = cleanedData.name;
        updateData.code = cleanedData.code;
        updateData.color = cleanedData.color;
        updateData.warehouse_id = cleanedData.warehouse_id;
        updateData.created_by = existingItem.created_by || state.user.uid;
        // companyId remains unchanged – do not include in update
        
        console.log('💾 Update data for existing item:', updateData);
        
        await updateDoc(itemRef, updateData);
        
        if (cartonsQuantityAdded > 0) {
          const transactionData = {
            type: 'ADD',
            item_id: existingItemId,
            item_name: cleanedData.name,
            item_code: cleanedData.code,
            from_warehouse: null,
            to_warehouse: warehouseId,
            cartons_delta: newCartonsCount,
            per_carton_updated: finalPerCartonCount,
            single_delta: newSingleBottlesCount - currentSingleBottlesCount,
            total_delta: cartonsQuantityAdded,
            new_remaining: totalQuantity,
            user_id: state.user.uid,
            timestamp: serverTimestamp(),
            notes: itemData.notes || `إضافة كميات: ${newCartonsCount} كراتين`,
            created_by: state.userProfile?.name || state.user?.email || 'نظام',
            companyId: companyId          // NEW
          };
          
          await addDoc(collection(db, 'transactions'), transactionData);
          commit('ADD_RECENT_TRANSACTION', transactionData);
        }
        
        const itemHistoryData = {
          item_id: existingItemId,
          warehouse_id: warehouseId,
          change_type: 'UPDATE',
          old_quantity: currentRemaining,
          new_quantity: totalQuantity,
          quantity_delta: cartonsQuantityAdded,
          user_id: state.user.uid,
          timestamp: serverTimestamp(),
          details: {
            name: cleanedData.name,
            code: cleanedData.code,
            color: cleanedData.color,
            old_cartons: currentCartonsCount,
            new_cartons: finalCartonsCount,
            old_per_carton: currentPerCarton,
            new_per_carton: finalPerCartonCount,
            old_single: currentSingleBottlesCount,
            new_single: finalSingleBottlesCount,
            single_bottles_converted_to_cartons: additionalCartonsFromSingles,
            cartons_added: newCartonsCount,
            cartons_quantity_added: cartonsQuantityAdded,
            notes: itemData.notes
          },
          companyId: companyId          // NEW
        };
        
        await addDoc(collection(db, 'item_history'), itemHistoryData);
        
        const updatedItem = {
          id: existingItemId,
          ...existingItem,
          ...updateData,
          cartons_count: finalCartonsCount,
          per_carton_count: finalPerCartonCount,
          single_bottles_count: finalSingleBottlesCount,
          remaining_quantity: totalQuantity,
          total_added: newTotalAdded,
          updated_at: updateData.updated_at
        };
        
        console.log('📤 COMPLETE updated item to return:', {
          ...updatedItem,
          created_by: 'HIDDEN',
          updated_by: 'HIDDEN'
        });
        
        commit('UPDATE_INVENTORY_ITEM', updatedItem);
        
        result = {
          success: true,
          type: 'updated',
          item: updatedItem,
          cartonsAdded: cartonsQuantityAdded,
          newRemaining: totalQuantity,
          convertedCartons: additionalCartonsFromSingles,
          message: `تم تحديث الصنف "${cleanedData.name}" بنجاح`
        };
        
      } else {
        console.log('➕ CREATING new item (no matching name+code+color found)');
        isCreatingNewItem = true;
        
        const cartonsCount = Number(itemData.cartons_count) || 0;
        const perCartonCount = Number(itemData.per_carton_count) || 12;
        const singleBottlesCount = Number(itemData.single_bottles_count) || 0;
        
        let finalCartonsCount = cartonsCount;
        let finalSingleBottlesCount = singleBottlesCount;
        additionalCartonsFromSingles = 0;
        
        if (singleBottlesCount >= perCartonCount) {
          additionalCartonsFromSingles = Math.floor(singleBottlesCount / perCartonCount);
          finalSingleBottlesCount = singleBottlesCount % perCartonCount;
          finalCartonsCount += additionalCartonsFromSingles;
          
          console.log(`🔄 Converting single bottles for new item: ${singleBottlesCount} → ${additionalCartonsFromSingles} cartons + ${finalSingleBottlesCount} singles`);
        }
        
        totalQuantity = (finalCartonsCount * perCartonCount) + finalSingleBottlesCount;
        
        if (totalQuantity <= 0) {
          throw new Error('يجب إدخال كمية صحيحة للإضافة (أكبر من صفر)');
        }
        
        const newItemData = {
          name: cleanedData.name,
          code: cleanedData.code,
          color: cleanedData.color,
          warehouse_id: warehouseId,
          cartons_count: finalCartonsCount,
          per_carton_count: perCartonCount,
          single_bottles_count: finalSingleBottlesCount,
          supplier: itemData.supplier?.trim() || null,
          item_location: itemData.item_location?.trim() || null,
          notes: itemData.notes?.trim() || null,
          photo_url: itemData.photo_url || null,
          remaining_quantity: totalQuantity,
          total_added: totalQuantity,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          created_by: state.user.uid,
          updated_by: state.user.uid,
          companyId: companyId          // NEW
        };
        
        console.log('💾 New item data:', newItemData);
        
        const docRef = await addDoc(collection(db, 'items'), newItemData);
        
        const transactionData = {
          type: 'ADD',
          item_id: docRef.id,
          item_name: cleanedData.name,
          item_code: cleanedData.code,
          from_warehouse: null,
          to_warehouse: warehouseId,
          cartons_delta: finalCartonsCount,
          per_carton_updated: perCartonCount,
          single_delta: finalSingleBottlesCount,
          total_delta: totalQuantity,
          new_remaining: totalQuantity,
          user_id: state.user.uid,
          timestamp: serverTimestamp(),
          notes: additionalCartonsFromSingles > 0 ? 
            `إضافة جديدة (تحويل ${additionalCartonsFromSingles} كرتون من القزاز الفردي)` : 
            'عملية إضافة جديدة',
          created_by: state.userProfile?.name || state.user?.email || 'نظام',
          companyId: companyId          // NEW
        };
        
        await addDoc(collection(db, 'transactions'), transactionData);
        
        const newItem = {
          id: docRef.id,
          ...newItemData
        };
        
        console.log('📤 COMPLETE new item to return:', {
          ...newItem,
          created_by: 'HIDDEN',
          updated_by: 'HIDDEN'
        });
        
        commit('UPDATE_INVENTORY_ITEM', newItem);
        commit('ADD_RECENT_TRANSACTION', transactionData);
        
        result = { 
          success: true,
          type: 'created',
          id: docRef.id, 
          item: newItem,
          convertedCartons: additionalCartonsFromSingles,
          message: additionalCartonsFromSingles > 0 ? 
            `تم إضافة صنف جديد ${cleanedData.name} مع تحويل ${additionalCartonsFromSingles} كرتون من القزاز الفردي` :
            `تم إضافة صنف جديد ${cleanedData.name}`
        };
      }

      let successMessage = '';
      
      if (result.type === 'updated') {
        successMessage = `✅ تم تحديث كميات الصنف "${cleanedData.name}" بنجاح. تمت إضافة ${result.cartonsAdded || 0} وحدة`;
      } else if (isCreatingNewItem) {
        if (additionalCartonsFromSingles > 0) {
          successMessage = `✅ تم إضافة الصنف "${cleanedData.name}" بنجاح. تم تحويل ${additionalCartonsFromSingles} كرتون من القزاز الفردي`;
        } else {
          successMessage = `✅ تم إضافة الصنف "${cleanedData.name}" بنجاح. الكمية المضافة: ${totalQuantity} وحدة`;
        }
      }
      
      dispatch('showNotification', {
        type: 'success',
        message: successMessage
      });

      return result;

    } catch (error) {
      console.error('❌ Error adding inventory item:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ غير متوقع أثناء إضافة/تعديث الصنف'
      });

      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // UPDATE ITEM ACTION (WITH VALIDATION FIX)
  // ============================================
  async updateItem({ commit, state, dispatch }, { itemId, itemData }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    console.log('🔄 Updating item via store:', { itemId, itemData });

    try {
      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لتعديل الأصناف');
      }

      console.log('🔍 Validation debug:', {
        name: itemData.name,
        nameTrimmed: itemData.name?.trim(),
        hasName: !!itemData.name?.trim(),
        code: itemData.code,
        codeTrimmed: itemData.code?.trim(),
        hasCode: !!itemData.code?.trim(),
        color: itemData.color,
        colorTrimmed: itemData.color?.trim(),
        hasColor: !!itemData.color?.trim(),
        warehouse_id: itemData.warehouse_id,
        warehouse_idType: typeof itemData.warehouse_id,
        hasWarehouseId: !!itemData.warehouse_id,
        isWarehouseIdEmptyString: itemData.warehouse_id === ''
      });

      const missingFields = [];
      
      if (!itemData.name?.trim()) {
        missingFields.push('الاسم');
      }
      
      if (!itemData.code?.trim()) {
        missingFields.push('الكود');
      }
      
      if (!itemData.color?.trim()) {
        missingFields.push('اللون');
      }
      
      if (!itemData.warehouse_id || itemData.warehouse_id.trim() === '') {
        missingFields.push('المخزن');
      }
      
      if (missingFields.length > 0) {
        throw new Error(`الحقول التالية مطلوبة: ${missingFields.join('، ')}`);
      }

      const warehouseId = itemData.warehouse_id;
      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية لتعديل أصناف في هذا المخزن');
          }
        }
      }

      console.log('⏳ Ensuring Firebase is ready for update...');
      try {
        await ensureFirebaseReady();
        console.log('✅ Firebase ready for update');
      } catch (firebaseError) {
        console.error('❌ Firebase initialization failed:', firebaseError);
        throw new Error('Firebase غير متوفر. يرجى المحاولة مرة أخرى.');
      }

      if (!db) {
        throw new Error('Firestore database not available');
      }

      const firebaseFirestore = await import('firebase/firestore');
      const {
        doc,
        getDoc,
        updateDoc,
        addDoc,
        collection,
        serverTimestamp,
        Timestamp
      } = firebaseFirestore;

      const itemRef = doc(db, 'items', itemId);
      let itemDoc;
      let existingItem;
      
      try {
        itemDoc = await getDoc(itemRef);
        
        if (!itemDoc.exists()) {
          throw new Error('الصنف غير موجود');
        }

        existingItem = itemDoc.data();
        
        // Verify companyId matches
        if (existingItem.companyId !== companyId) {
          throw new Error('لا يمكنك تعديل هذا الصنف');
        }

        existingItem = JSON.parse(JSON.stringify(existingItem, (key, value) => {
          if (value && typeof value === 'object' && value.toDate) {
            return value.toDate().toISOString();
          }
          if (value && typeof value === 'object' && value._seconds !== undefined && value._nanoseconds !== undefined) {
            return new Date(value._seconds * 1000).toISOString();
          }
          return value;
        }));
        
        console.log('📋 Existing item data:', {
          id: itemId,
          name: existingItem.name,
          code: existingItem.code,
          warehouse_id: existingItem.warehouse_id,
          cartons: existingItem.cartons_count,
          singles: existingItem.single_bottles_count,
          per_carton: existingItem.per_carton_count,
          total: existingItem.remaining_quantity
        });
      } catch (docError) {
        console.error('❌ Error getting item document:', docError);
        throw new Error('فشل في تحميل بيانات الصنف');
      }

      const newCartonsCount = Number(itemData.cartons_count) || Number(existingItem.cartons_count) || 0;
      const newPerCartonCount = Number(itemData.per_carton_count) || Number(existingItem.per_carton_count) || 12;
      const newSingleBottlesCount = Number(itemData.single_bottles_count) || Number(existingItem.single_bottles_count) || 0;
      
      let finalCartonsCount = newCartonsCount;
      let finalSingleBottlesCount = newSingleBottlesCount;
      let additionalCartonsFromSingles = 0;
      
      if (finalSingleBottlesCount >= newPerCartonCount) {
        additionalCartonsFromSingles = Math.floor(finalSingleBottlesCount / newPerCartonCount);
        finalSingleBottlesCount = finalSingleBottlesCount % newPerCartonCount;
        finalCartonsCount += additionalCartonsFromSingles;
        
        console.log(`🔄 Converting single bottles to cartons: added ${additionalCartonsFromSingles} cartons, remaining singles: ${finalSingleBottlesCount}`);
      }
      
      const newTotalQuantity = (finalCartonsCount * newPerCartonCount) + finalSingleBottlesCount;
      
      const oldCartons = Number(existingItem.cartons_count) || 0;
      const oldPerCarton = Number(existingItem.per_carton_count) || 12;
      const oldSingles = Number(existingItem.single_bottles_count) || 0;
      const oldTotalQuantity = (oldCartons * oldPerCarton) + oldSingles;
      
      const quantityDiff = newTotalQuantity - oldTotalQuantity;

      console.log('📊 Quantity calculations:', {
        old: { cartons: oldCartons, singles: oldSingles, per_carton: oldPerCarton, total: oldTotalQuantity },
        new: { cartons: finalCartonsCount, singles: finalSingleBottlesCount, per_carton: newPerCartonCount, total: newTotalQuantity },
        diff: quantityDiff,
        convertedCartons: additionalCartonsFromSingles
      });

      const updateData = {
        name: itemData.name.trim(),
        code: itemData.code.trim(),
        color: itemData.color.trim(),
        warehouse_id: warehouseId.trim(),
        
        cartons_count: finalCartonsCount,
        per_carton_count: newPerCartonCount,
        single_bottles_count: finalSingleBottlesCount,
        remaining_quantity: newTotalQuantity,
        
        ...(quantityDiff > 0 && {
          total_added: (Number(existingItem.total_added) || 0) + quantityDiff
        }),
        
        supplier: itemData.supplier?.trim() || existingItem.supplier || '',
        item_location: itemData.item_location?.trim() || existingItem.item_location || '',
        notes: itemData.notes?.trim() || existingItem.notes || '',
        photo_url: itemData.photo_url || existingItem.photo_url || '',
        
        updated_at: serverTimestamp(),
        updated_by: state.user.uid
      };

      // Ensure companyId is not changed
      delete updateData.companyId; // if present, remove it

      console.log('💾 Update data for item:', updateData);

      try {
        await updateDoc(itemRef, updateData);
        console.log('✅ Item updated in Firestore successfully');
      } catch (updateError) {
        console.error('❌ Error updating item in Firestore:', updateError);
        throw new Error('فشل في تحديث الصنف في قاعدة البيانات');
      }

      if (quantityDiff !== 0 || existingItem.warehouse_id !== warehouseId) {
        try {
          const transactionData = {
            type: 'UPDATE',
            item_id: itemId,
            item_name: updateData.name,
            item_code: updateData.code,
            from_warehouse: existingItem.warehouse_id !== warehouseId ? existingItem.warehouse_id : null,
            to_warehouse: warehouseId,
            cartons_delta: finalCartonsCount - oldCartons,
            per_carton_updated: newPerCartonCount,
            single_delta: finalSingleBottlesCount - oldSingles,
            total_delta: quantityDiff,
            new_remaining: newTotalQuantity,
            user_id: state.user.uid,
            timestamp: serverTimestamp(),
            notes: itemData.notes?.trim() || `تعديل الصنف${additionalCartonsFromSingles > 0 ? ` (تحويل ${additionalCartonsFromSingles} كرتون من القزاز الفردي)` : ''}`,
            created_by: state.userProfile?.name || state.user?.email || 'نظام',
            companyId: companyId          // NEW
          };

          await addDoc(collection(db, 'transactions'), transactionData);
          
          const transactionForVuex = {
            ...transactionData,
            id: `temp_${Date.now()}`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          
          commit('ADD_RECENT_TRANSACTION', transactionForVuex);
          console.log('✅ Transaction recorded successfully');
        } catch (transactionError) {
          console.warn('⚠️ Could not create transaction record:', transactionError);
        }
      }

      try {
        const itemHistoryData = {
          item_id: itemId,
          warehouse_id: warehouseId,
          change_type: 'UPDATE',
          old_quantity: oldTotalQuantity,
          new_quantity: newTotalQuantity,
          quantity_delta: quantityDiff,
          user_id: state.user.uid,
          timestamp: serverTimestamp(),
          details: {
            name: updateData.name,
            code: updateData.code,
            color: updateData.color,
            old_cartons: oldCartons,
            new_cartons: finalCartonsCount,
            old_per_carton: oldPerCarton,
            new_per_carton: newPerCartonCount,
            old_single: oldSingles,
            new_single: finalSingleBottlesCount,
            single_bottles_converted_to_cartons: additionalCartonsFromSingles,
            notes: itemData.notes
          },
          companyId: companyId          // NEW
        };

        await addDoc(collection(db, 'item_history'), itemHistoryData);
        console.log('✅ Item history recorded successfully');
      } catch (historyError) {
        console.warn('⚠️ Could not create item history:', historyError);
      }

      const updatedItem = {
        id: itemId,
        created_at: existingItem.created_at,
        created_by: existingItem.created_by,
        ...updateData,
        total_added: updateData.total_added !== undefined ? updateData.total_added : Number(existingItem.total_added) || 0,
        updated_at: new Date().toISOString(),
        companyId: companyId          // ensure it's included
      };

      const cleanUpdatedItem = JSON.parse(JSON.stringify(updatedItem));

      console.log('📤 Clean updated item for Vuex state:', {
        ...cleanUpdatedItem,
        created_by: 'HIDDEN',
        updated_by: 'HIDDEN'
      });

      commit('UPDATE_INVENTORY_ITEM', cleanUpdatedItem);

      let successMessage = `✅ تم تحديث الصنف "${updateData.name}" بنجاح`;
      
      if (additionalCartonsFromSingles > 0) {
        successMessage += ` (تم تحويل ${additionalCartonsFromSingles} كرتون من القزاز الفردي)`;
      }
      
      if (quantityDiff > 0) {
        successMessage += ` - تمت إضافة ${quantityDiff} وحدة`;
      } else if (quantityDiff < 0) {
        successMessage += ` - تم خصم ${Math.abs(quantityDiff)} وحدة`;
      }

      dispatch('showNotification', {
        type: 'success',
        message: successMessage
      });

      console.log('✅ Item update process completed successfully:', {
        id: itemId,
        name: updateData.name,
        cartons: finalCartonsCount,
        singles: finalSingleBottlesCount,
        total: newTotalQuantity,
        converted: additionalCartonsFromSingles
      });

      return { 
        success: true, 
        item: cleanUpdatedItem,
        message: 'تم تحديث الصنف بنجاح'
      };

    } catch (error) {
      console.error('❌ Error updating item:', error);
      console.error('Error stack:', error.stack);
      
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في تحديث الصنف'
      });

      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // DELETE ITEM ACTION
  // ============================================
  async deleteItem({ commit, state, dispatch }, itemId) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log(`🗑️ DELETE Item Action - SPARK Plan: ${itemId}`);

      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (state.userProfile.role !== 'superadmin') {
        throw new Error('فقط المشرف العام يمكنه حذف الأصناف');
      }

      if (!itemId) {
        throw new Error('معرف الصنف مطلوب');
      }

      console.log('⏳ Ensuring Firebase is ready for delete...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for delete');

      if (!db) {
        throw new Error('Firestore database not available');
      }

      const firebaseFirestore = await import('firebase/firestore');
      const {
        doc,
        getDoc,
        deleteDoc,
        addDoc,
        collection,
        serverTimestamp,
        writeBatch
      } = firebaseFirestore;

      const itemRef = doc(db, 'items', itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('الصنف غير موجود');
      }

      const itemData = itemDoc.data();

      // Verify companyId
      if (itemData.companyId !== companyId) {
        throw new Error('لا يمكنك حذف هذا الصنف');
      }

      const itemName = itemData.name || 'غير معروف';
      const warehouseId = itemData.warehouse_id;

      console.log('📋 Item to delete:', {
        id: itemId,
        name: itemName,
        code: itemData.code,
        warehouse: warehouseId,
        quantity: itemData.remaining_quantity
      });

      const batch = writeBatch(db);

      batch.delete(itemRef);

      const transactionRef = doc(collection(db, 'transactions'));
      const transactionData = {
        type: 'DELETE',
        item_id: itemId,
        item_name: itemName,
        item_code: itemData.code || '',
        color: itemData.color || '',
        from_warehouse: warehouseId,
        to_warehouse: null,
        previous_quantity: itemData.remaining_quantity || 0,
        previous_cartons: itemData.cartons_count || 0,
        previous_single_bottles: itemData.single_bottles_count || 0,
        quantity: -(itemData.remaining_quantity || 0),
        total_delta: -(itemData.remaining_quantity || 0),
        new_remaining: 0,
        user_id: state.user.uid,
        user_name: state.userProfile?.name || '',
        user_role: state.userProfile?.role || '',
        user_email: state.user?.email || '',
        timestamp: serverTimestamp(),
        created_at: serverTimestamp(),
        notes: `حذف الصنف "${itemName}"`,
        created_by: state.userProfile?.name || state.user?.email || 'نظام',
        
        display_type: 'حذف',
        display_quantity: `${itemData.remaining_quantity || 0} وحدة`,
        display_destination: 'حذف نهائي',
        
        atomic_operation: true,
        detailed_breakdown_applied: true,
        companyId: companyId          // NEW
      };
      
      batch.set(transactionRef, transactionData);

      const historyRef = doc(collection(db, 'item_history'));
      const historyData = {
        item_id: itemId,
        warehouse_id: warehouseId,
        change_type: 'DELETE',
        old_quantity: itemData.remaining_quantity || 0,
        new_quantity: 0,
        quantity_delta: -(itemData.remaining_quantity || 0),
        old_cartons: itemData.cartons_count || 0,
        new_cartons: 0,
        cartons_delta: -(itemData.cartons_count || 0),
        old_single_bottles: itemData.single_bottles_count || 0,
        new_single_bottles: 0,
        single_bottles_delta: -(itemData.single_bottles_count || 0),
        user_id: state.user.uid,
        user_name: state.userProfile?.name || '',
        timestamp: serverTimestamp(),
        details: {
          name: itemName,
          code: itemData.code,
          color: itemData.color,
          supplier: itemData.supplier,
          notes: 'حذف نهائي للصنف من النظام',
          transaction_id: transactionRef.id
        },
        companyId: companyId          // NEW
      };
      
      batch.set(historyRef, historyData);

      await batch.commit();
      console.log('✅ Batch operations committed successfully');

      commit('REMOVE_INVENTORY_ITEM', itemId);
      
      if (state.search.results.length > 0) {
        const updatedSearchResults = state.search.results.filter(item => item.id !== itemId);
        if (updatedSearchResults.length !== state.search.results.length) {
          commit('SET_SEARCH_RESULTS', {
            results: updatedSearchResults,
            source: state.search.source,
            query: state.search.query
          });
        }
      }
      
      const transactionForState = {
        id: transactionRef.id,
        ...transactionData,
        timestamp: new Date(),
        created_at: new Date(),
        
        display_quantity: `${itemData.remaining_quantity || 0} وحدة`,
        display_type: 'حذف',
        display_destination: 'حذف نهائي'
      };
      
      commit('ADD_TRANSACTION', transactionForState);
      commit('ADD_RECENT_TRANSACTION', transactionForState);

      dispatch('showNotification', {
        type: 'success',
        title: 'تم الحذف بنجاح',
        message: `تم حذف الصنف "${itemName}" من النظام`,
        icon: 'check-circle',
        timeout: 5000
      });

      console.log('📊 Delete completed successfully:', {
        itemId,
        itemName,
        quantityDeleted: itemData.remaining_quantity || 0,
        transactionId: transactionRef.id
      });

      return {
        success: true,
        message: 'تم حذف الصنف بنجاح',
        itemId,
        itemName,
        transactionId: transactionRef.id
      };

    } catch (error) {
      console.error('❌ DELETE Item Error:', error);
      console.error('Error stack:', error.stack);
      
      commit('SET_OPERATION_ERROR', error.message);
      
      let errorMessage = error.message;
      
      if (error.code === 'permission-denied') {
        errorMessage = 'ليس لديك صلاحية لحذف الأصناف';
      } else if (error.code === 'not-found') {
        errorMessage = 'الصنف غير موجود أو تم حذفه بالفعل';
      } else if (error.message.includes('network') || error.message.includes('اتصال')) {
        errorMessage = 'فشل الاتصال. يرجى التحقق من اتصال الإنترنت';
      }

      dispatch('showNotification', {
        type: 'error',
        title: 'فشل الحذف',
        message: errorMessage,
        icon: 'alert-circle',
        timeout: 7000
      });

      return {
        success: false,
        message: errorMessage,
        error: error
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // UPDATE ITEM QUANTITIES ACTION
  // ============================================
  async updateItemQuantities({ commit, state, dispatch }, {
    itemId,
    existingItem,
    newQuantities,
    isAddingCartons = true
  }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🔄 Updating item quantities:', { itemId, existingItem, newQuantities });

      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لتحديث الكميات');
      }

      if (!itemId || !existingItem) {
        throw new Error('بيانات التحديث غير مكتملة');
      }

      const warehouseId = existingItem.warehouse_id;
      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية للتحديث في هذا المخزن');
          }
        }
      }

      const itemRef = doc(db, 'items', itemId);
      const itemDoc = await getDoc(itemRef);

      if (!itemDoc.exists()) {
        throw new Error('الصنف غير موجود');
      }

      const currentItem = itemDoc.data();

      // Verify companyId
      if (currentItem.companyId !== companyId) {
        throw new Error('لا يمكنك تحديث هذا الصنف');
      }

      const cartonsCount = newQuantities.cartons_count || 0;
      const perCartonCount = newQuantities.per_carton_count || 12;
      const singleBottlesCount = newQuantities.single_bottles_count || 0;

      const addedCartonsQuantity = cartonsCount * perCartonCount;
      const addedTotalQuantity = addedCartonsQuantity + singleBottlesCount;

      if (addedTotalQuantity <= 0) {
        throw new Error('يجب إدخال كمية صحيحة للإضافة');
      }

      const currentRemaining = currentItem.remaining_quantity || 0;
      const currentTotalAdded = currentItem.total_added || 0;

      const newRemaining = currentRemaining + addedTotalQuantity;
      const newTotalAdded = currentTotalAdded + addedTotalQuantity;

      const updateData = {
        cartons_count: (currentItem.cartons_count || 0) + cartonsCount,
        per_carton_count: perCartonCount,
        single_bottles_count: (currentItem.single_bottles_count || 0) + singleBottlesCount,
        remaining_quantity: newRemaining,
        total_added: newTotalAdded,
        updated_at: serverTimestamp(),
        updated_by: state.user.uid
      };

      if (newQuantities.supplier !== undefined) {
        updateData.supplier = newQuantities.supplier?.trim() || '';
      }

      if (newQuantities.item_location !== undefined) {
        updateData.item_location = newQuantities.item_location?.trim() || '';
      }

      if (newQuantities.notes !== undefined) {
        updateData.notes = newQuantities.notes?.trim() || '';
      }

      await updateDoc(itemRef, updateData);

      const transactionData = {
        type: TRANSACTION_TYPES.ADD,
        item_id: itemId,
        item_name: currentItem.name,
        item_code: currentItem.code,
        from_warehouse: null,
        to_warehouse: warehouseId,
        cartons_delta: cartonsCount,
        per_carton_updated: perCartonCount,
        single_delta: singleBottlesCount,
        total_delta: addedTotalQuantity,
        new_remaining: newRemaining,
        user_id: state.user.uid,
        timestamp: serverTimestamp(),
        notes: newQuantities.notes || `إضافة كميات للصنف: ${cartonsCount} كراتين، ${singleBottlesCount} فردي`,
        created_by: state.userProfile?.name || state.user?.email || 'نظام',
        companyId: companyId          // NEW
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      const itemHistoryData = {
        item_id: itemId,
        warehouse_id: warehouseId,
        change_type: 'UPDATE',
        old_quantity: currentRemaining,
        new_quantity: newRemaining,
        quantity_delta: addedTotalQuantity,
        user_id: state.user.uid,
        timestamp: serverTimestamp(),
        details: {
          name: currentItem.name,
          code: currentItem.code,
          color: currentItem.color,
          cartons_added: cartonsCount,
          per_carton: perCartonCount,
          single_added: singleBottlesCount,
          total_added: addedTotalQuantity,
          notes: newQuantities.notes
        },
        companyId: companyId          // NEW
      };

      await addDoc(collection(db, 'item_history'), itemHistoryData);

      const updatedItem = {
        id: itemId,
        ...currentItem,
        ...updateData
      };

      const convertedItem = InventoryService.convertForDisplay(updatedItem);
      commit('UPDATE_INVENTORY_ITEM', convertedItem);
      commit('ADD_RECENT_TRANSACTION', transactionData);

      dispatch('showNotification', {
        type: 'success',
        message: `تم تحديث كميات الصنف "${currentItem.name}" بنجاح. تمت إضافة ${addedTotalQuantity} وحدة`
      });

      return {
        success: true,
        type: 'updated',
        item: convertedItem,
        addedQuantity: addedTotalQuantity,
        newRemaining: newRemaining
      };

    } catch (error) {
      console.error('❌ Error updating item quantities:', error);
      commit('SET_OPERATION_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'حدث خطأ في تحديث الكميات'
      });

      throw error;
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // TRANSFER ITEM ACTION
  // ============================================
  async transferItem({ commit, state, dispatch }, transferData) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🔄 START TRANSFER:', {
        item_id: transferData.item_id,
        from_warehouse: transferData.from_warehouse_id,
        to_warehouse: transferData.to_warehouse_id,
        cartons: transferData.cartons_count,
        singles: transferData.single_bottles_count
      });

      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لنقل الأصناف');
      }

      if (!transferData.item_id || !transferData.from_warehouse_id || !transferData.to_warehouse_id) {
        throw new Error('بيانات النقل غير مكتملة (معرف الصنف، المخزن المصدر، المخزن الهدف)');
      }

      if (transferData.from_warehouse_id === transferData.to_warehouse_id) {
        throw new Error('لا يمكن نقل الصنف إلى نفس المخزن');
      }

      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(transferData.from_warehouse_id) ||
              !allowedWarehouses.includes(transferData.to_warehouse_id)) {
            throw new Error('ليس لديك صلاحية للنقل من/إلى هذه المخازن');
          }
        }
      }

      console.log('⚡ Starting atomic transaction for transfer...');
      
      const result = await runTransaction(db, async (transaction) => {
        const sourceItemRef = doc(db, 'items', transferData.item_id);
        const sourceItemDoc = await transaction.get(sourceItemRef);
        
        if (!sourceItemDoc.exists()) {
          throw new Error('الصنف غير موجود في المصدر');
        }

        const sourceItem = sourceItemDoc.data();

        // Verify companyId
        if (sourceItem.companyId !== companyId) {
          throw new Error('لا يمكنك نقل هذا الصنف');
        }

        console.log('📦 Source item data:', {
          id: transferData.item_id,
          name: sourceItem.name,
          code: sourceItem.code,
          color: sourceItem.color,
          warehouse: sourceItem.warehouse_id,
          cartons: sourceItem.cartons_count,
          singles: sourceItem.single_bottles_count,
          per_carton: sourceItem.per_carton_count,
          total: sourceItem.remaining_quantity
        });

        if (sourceItem.warehouse_id !== transferData.from_warehouse_id) {
          throw new Error(`الصنف ليس في المخزن المصدر المحدد. يوجد في: ${sourceItem.warehouse_id}`);
        }

        const currentCartons = Number(sourceItem.cartons_count) || 0;
        const currentSingles = Number(sourceItem.single_bottles_count) || 0;
        const perCarton = Number(sourceItem.per_carton_count) || 12;
        
        const transferCartons = Number(transferData.cartons_count) || 0;
        const transferSingles = Number(transferData.single_bottles_count) || 0;
        
        console.log('🔢 Quantity validation:', {
          current: { cartons: currentCartons, singles: currentSingles },
          transfer: { cartons: transferCartons, singles: transferSingles },
          perCarton: perCarton
        });

        if (transferCartons > currentCartons) {
          throw new Error(`عدد الكرتونات المطلوبة (${transferCartons}) أكبر من المتاح (${currentCartons})`);
        }
        
        if (transferSingles > currentSingles) {
          throw new Error(`عدد القزاز الفردي المطلوب (${transferSingles}) أكبر من المتاح (${currentSingles})`);
        }

        const transferTotalQuantity = (transferCartons * perCarton) + transferSingles;
        const currentTotalQuantity = (currentCartons * perCarton) + currentSingles;
        
        if (transferTotalQuantity <= 0) {
          throw new Error('يجب إدخال كمية صحيحة للنقل (أكبر من صفر)');
        }

        if (transferTotalQuantity > currentTotalQuantity) {
          throw new Error(`الكمية المطلوبة للنقل (${transferTotalQuantity}) أكبر من الكمية المتاحة (${currentTotalQuantity})`);
        }

        const newSourceCartons = currentCartons - transferCartons;
        const newSourceSingles = currentSingles - transferSingles;
        const newSourceTotal = (newSourceCartons * perCarton) + newSourceSingles;

        console.log('📉 Source item update:', {
          before: { cartons: currentCartons, singles: currentSingles, total: currentTotalQuantity },
          after: { cartons: newSourceCartons, singles: newSourceSingles, total: newSourceTotal }
        });

        transaction.update(sourceItemRef, {
          cartons_count: newSourceCartons,
          single_bottles_count: newSourceSingles,
          remaining_quantity: newSourceTotal,
          updated_at: serverTimestamp(),
          updated_by: state.user.uid
        });

        console.log('🔍 Checking for existing item in destination...');
        
        const cleanedData = {
          name: sourceItem.name.trim(),
          code: sourceItem.code.trim(),
          color: sourceItem.color?.trim() || '',
          warehouse_id: transferData.to_warehouse_id
        };

        console.log('🔍 Looking for item with:', cleanedData);

        const itemsRef = collection(db, 'items');
        const destQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('name', '==', cleanedData.name),
          where('code', '==', cleanedData.code),
          where('color', '==', cleanedData.color),
          where('warehouse_id', '==', cleanedData.warehouse_id),
          limit(1)
        );
        
        const destSnapshot = await getDocs(destQuery);
        let destItemRef;
        let isNewItem = false;
        let existingDestinationItem = null;

        if (!destSnapshot.empty) {
          destItemRef = doc(db, 'items', destSnapshot.docs[0].id);
          existingDestinationItem = destSnapshot.docs[0].data();
          
          console.log('✅ Found existing item in destination:', {
            id: destSnapshot.docs[0].id,
            cartons: existingDestinationItem.cartons_count,
            singles: existingDestinationItem.single_bottles_count,
            per_carton: existingDestinationItem.per_carton_count
          });

          const destCartons = Number(existingDestinationItem.cartons_count) || 0;
          const destSingles = Number(existingDestinationItem.single_bottles_count) || 0;
          const destPerCarton = Number(existingDestinationItem.per_carton_count) || perCarton;
          
          const newDestCartons = destCartons + transferCartons;
          const finalPerCarton = destPerCarton;
          const newDestSingles = destSingles + transferSingles;
          
          let additionalCartonsFromSingles = 0;
          let finalDestSingles = newDestSingles;
          let finalDestCartons = newDestCartons;
          
          if (finalDestSingles >= finalPerCarton) {
            additionalCartonsFromSingles = Math.floor(finalDestSingles / finalPerCarton);
            finalDestSingles = finalDestSingles % finalPerCarton;
            finalDestCartons += additionalCartonsFromSingles;
            
            console.log(`🔄 Converting singles to cartons in destination: ${additionalCartonsFromSingles} cartons added`);
          }
          
          const newDestTotal = (finalDestCartons * finalPerCarton) + finalDestSingles;
          
          console.log('📈 Destination item update:', {
            before: { cartons: destCartons, singles: destSingles, total: (destCartons * destPerCarton) + destSingles },
            after: { cartons: finalDestCartons, singles: finalDestSingles, total: newDestTotal },
            added: { cartons: transferCartons, singles: transferSingles },
            converted: additionalCartonsFromSingles
          });

          const updateData = {
            cartons_count: finalDestCartons,
            per_carton_count: finalPerCarton,
            single_bottles_count: finalDestSingles,
            remaining_quantity: newDestTotal,
            updated_at: serverTimestamp(),
            updated_by: state.user.uid
          };

          const cartonsQuantityAdded = transferCartons * finalPerCarton;
          if (cartonsQuantityAdded > 0) {
            updateData.total_added = (existingDestinationItem.total_added || 0) + cartonsQuantityAdded;
          }
          
          if (!existingDestinationItem.supplier && sourceItem.supplier) {
            updateData.supplier = sourceItem.supplier.trim();
          }
          
          if (!existingDestinationItem.item_location && sourceItem.item_location) {
            updateData.item_location = sourceItem.item_location.trim();
          }
          
          if (!existingDestinationItem.notes && sourceItem.notes) {
            updateData.notes = sourceItem.notes.trim();
          }

          transaction.update(destItemRef, updateData);

        } else {
          console.log('➕ Creating new item in destination (no matching item found)');
          
          destItemRef = doc(collection(db, 'items'));
          isNewItem = true;
          
          let finalTransferCartons = transferCartons;
          let finalTransferSingles = transferSingles;
          let additionalCartonsFromSingles = 0;
          
          if (finalTransferSingles >= perCarton) {
            additionalCartonsFromSingles = Math.floor(finalTransferSingles / perCarton);
            finalTransferSingles = finalTransferSingles % perCarton;
            finalTransferCartons += additionalCartonsFromSingles;
            
            console.log(`🔄 Converting singles for new item: ${finalTransferSingles} → ${additionalCartonsFromSingles} cartons + ${finalTransferSingles} singles`);
          }
          
          const destTotalQuantity = (finalTransferCartons * perCarton) + finalTransferSingles;
          
          const newItemData = {
            name: cleanedData.name,
            code: cleanedData.code,
            color: cleanedData.color,
            warehouse_id: cleanedData.warehouse_id,
            cartons_count: finalTransferCartons,
            per_carton_count: perCarton,
            single_bottles_count: finalTransferSingles,
            supplier: sourceItem.supplier?.trim() || null,
            item_location: sourceItem.item_location?.trim() || null,
            notes: sourceItem.notes?.trim() || null,
            photo_url: sourceItem.photo_url || null,
            remaining_quantity: destTotalQuantity,
            total_added: destTotalQuantity,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            created_by: state.user.uid,
            updated_by: state.user.uid,
            companyId: companyId          // NEW
          };

          console.log('📝 New destination item data:', newItemData);
          
          transaction.set(destItemRef, newItemData);
        }

        const transactionRef = doc(collection(db, 'transactions'));
        
        const transactionRecord = {
          type: TRANSACTION_TYPES.TRANSFER,
          
          quantity: transferTotalQuantity,
          total_delta: transferTotalQuantity,
          new_remaining: newSourceTotal,
          
          source_item_id: transferData.item_id,
          item_name: sourceItem.name,
          item_code: sourceItem.code,
          item_color: sourceItem.color || '',
          
          from_warehouse: transferData.from_warehouse_id,
          to_warehouse: transferData.to_warehouse_id,
          
          cartons_transferred: transferCartons,
          per_carton_count: perCarton,
          singles_transferred: transferSingles,
          total_quantity_transferred: transferTotalQuantity,
          
          source_before: {
            cartons_count: currentCartons,
            single_bottles_count: currentSingles,
            remaining_quantity: currentTotalQuantity
          },
          source_after: {
            cartons_count: newSourceCartons,
            single_bottles_count: newSourceSingles,
            remaining_quantity: newSourceTotal
          },
          
          destination_item_id: destItemRef.id,
          is_new_destination_item: isNewItem,
          destination_item_exists: !!existingDestinationItem,
          
          user_id: state.user.uid,
          user_name: state.userProfile?.name || state.user?.email,
          user_role: state.userProfile?.role,
          user_email: state.user?.email,
          
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          
          notes: transferData.notes || 'نقل بين المخازن',
          transfer_type: 'warehouse_transfer',
          detailed_breakdown: true,
          atomic_operation: true,
          
          source_warehouse_name: transferData.from_warehouse_name || '',
          destination_warehouse_name: transferData.to_warehouse_name || '',
          created_by: state.userProfile?.name || state.user?.email || 'نظام',
          companyId: companyId          // NEW
        };

        transaction.set(transactionRef, transactionRecord);

        const sourceHistoryRef = doc(collection(db, 'item_history'));
        const sourceHistoryData = {
          item_id: transferData.item_id,
          warehouse_id: transferData.from_warehouse_id,
          change_type: 'TRANSFER_OUT',
          
          old_cartons: currentCartons,
          old_single_bottles: currentSingles,
          old_quantity: currentTotalQuantity,
          
          new_cartons: newSourceCartons,
          new_single_bottles: newSourceSingles,
          new_quantity: newSourceTotal,
          
          cartons_delta: -transferCartons,
          single_bottles_delta: -transferSingles,
          quantity_delta: -transferTotalQuantity,
          
          transfer_to_warehouse: transferData.to_warehouse_id,
          transfer_to_item_id: destItemRef.id,
          
          user_id: state.user.uid,
          user_name: state.userProfile?.name || state.user?.email,
          timestamp: serverTimestamp(),
          
          details: {
            name: sourceItem.name,
            code: sourceItem.code,
            color: sourceItem.color,
            notes: transferData.notes,
            transaction_id: transactionRef.id
          },
          companyId: companyId          // NEW
        };
        
        transaction.set(sourceHistoryRef, sourceHistoryData);

        const destHistoryRef = doc(collection(db, 'item_history'));
        const destHistoryData = {
          item_id: destItemRef.id,
          warehouse_id: transferData.to_warehouse_id,
          change_type: isNewItem ? 'CREATE' : 'TRANSFER_IN',
          
          ...(existingDestinationItem ? {
            old_cartons: existingDestinationItem.cartons_count || 0,
            old_single_bottles: existingDestinationItem.single_bottles_count || 0,
            old_quantity: existingDestinationItem.remaining_quantity || 0
          } : {}),
          
          transfer_from_warehouse: transferData.from_warehouse_id,
          transfer_from_item_id: transferData.item_id,
          
          user_id: state.user.uid,
          user_name: state.userProfile?.name || state.user?.email,
          timestamp: serverTimestamp(),
          
          details: {
            name: sourceItem.name,
            code: sourceItem.code,
            color: sourceItem.color,
            cartons_received: transferCartons,
            singles_received: transferSingles,
            total_received: transferTotalQuantity,
            notes: transferData.notes,
            transaction_id: transactionRef.id,
            is_new_item: isNewItem
          },
          companyId: companyId          // NEW
        };
        
        transaction.set(destHistoryRef, destHistoryData);

        return {
          sourceItemId: transferData.item_id,
          destItemId: destItemRef.id,
          isNewItem: isNewItem,
          transferTotalQuantity,
          sourceUpdate: {
            cartons_count: newSourceCartons,
            single_bottles_count: newSourceSingles,
            remaining_quantity: newSourceTotal
          },
          transactionId: transactionRef.id,
          transactionData: transactionRecord,
          existingDestinationItem: existingDestinationItem
        };
      });

      console.log('✅ Atomic transaction completed successfully');
      
      const sourceIndex = state.inventory.findIndex(item => item.id === transferData.item_id);
      if (sourceIndex !== -1) {
        const updatedSourceItem = {
          ...state.inventory[sourceIndex],
          cartons_count: result.sourceUpdate.cartons_count,
          single_bottles_count: result.sourceUpdate.single_bottles_count,
          remaining_quantity: result.sourceUpdate.remaining_quantity,
          updated_at: new Date()
        };
        
        commit('UPDATE_INVENTORY_ITEM', updatedSourceItem);
      }
      
      const transactionForState = {
        id: result.transactionId,
        ...result.transactionData,
        timestamp: new Date(),
        created_at: new Date(),
        
        quantity: result.transferTotalQuantity,
        total_delta: result.transferTotalQuantity,
        new_remaining: result.sourceUpdate.remaining_quantity,
        
        display_quantity: `${result.transferTotalQuantity} وحدة`,
        display_type: 'نقل بين مخازن'
      };
      
      commit('ADD_TRANSACTION', transactionForState);
      commit('ADD_RECENT_TRANSACTION', transactionForState);

      const message = result.isNewItem 
        ? `تم إنشاء صنف جديد في المخزن الهدف وتم نقل ${result.transferTotalQuantity} وحدة`
        : `تم نقل ${result.transferTotalQuantity} وحدة إلى المخزن الهدف بنجاح`;

      dispatch('showNotification', {
        type: 'success',
        title: 'تم النقل بنجاح',
        message: message,
        icon: 'check-circle',
        timeout: 5000
      });

      console.log('📊 Transfer completed successfully:', {
        sourceItem: transferData.item_id,
        destinationItem: result.destItemId,
        isNewItem: result.isNewItem,
        quantityTransferred: result.transferTotalQuantity,
        transactionId: result.transactionId,
        transactionAddedToState: true,
        quantityInTransaction: result.transferTotalQuantity
      });

      return {
        success: true,
        message: 'تم النقل بنجاح',
        transactionId: result.transactionId,
        transferTotalQuantity: result.transferTotalQuantity,
        sourceItemId: transferData.item_id,
        destinationItemId: result.destItemId,
        isNewDestinationItem: result.isNewItem,
        details: result.transactionData
      };

    } catch (error) {
      console.error('❌ TRANSFER FAILED:', error);
      console.error('Error stack:', error.stack);
      
      commit('SET_OPERATION_ERROR', error.message);
      
      let errorMessage = error.message;
      if (error.message.includes('ليس لديك صلاحية')) {
        errorMessage = 'ليس لديك صلاحية لإجراء عملية النقل.';
      } else if (error.message.includes('الصنف ليس في المخزن المصدر')) {
        errorMessage = 'الصنف المحدد ليس في المخزن المصدر. ربما تم نقله مؤخراً.';
      } else if (error.message.includes('أكبر من المتاح')) {
        errorMessage = 'الكمية المطلوبة تتجاوز الكمية المتاحة.';
      }

      dispatch('showNotification', {
        type: 'error',
        title: 'فشل النقل',
        message: errorMessage,
        icon: 'alert-circle',
        timeout: 7000
      });

      return {
        success: false,
        message: errorMessage,
        error: error
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // DISPATCH ITEM ACTION
  // ============================================
  async dispatchItem({ commit, state, dispatch }, dispatchData) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🚀 Starting dispatch with enhanced UTF-8 support:', {
        item_id: dispatchData.item_id,
        destination: dispatchData.destination,
        from_warehouse_id: dispatchData.from_warehouse_id,
        cartons_count: dispatchData.cartons_count,
        single_bottles_count: dispatchData.single_bottles_count
      });

      if (!state.userProfile) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      if (!['superadmin', 'warehouse_manager'].includes(state.userProfile.role)) {
        throw new Error('ليس لديك صلاحية لصرف الأصناف');
      }

      const requiredFields = [
        { field: dispatchData.item_id, name: 'معرف الصنف' },
        { field: dispatchData.from_warehouse_id, name: 'المخزن المصدر' },
        { field: dispatchData.destination, name: 'الوجهة' },
        { field: dispatchData.destination_id, name: 'معرف الوجهة' }
      ];

      const missingFields = requiredFields.filter(f => !f.field);
      if (missingFields.length > 0) {
        throw new Error(`بيانات الصرف غير مكتملة: ${missingFields.map(f => f.name).join('، ')}`);
      }

      if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(dispatchData.from_warehouse_id)) {
            throw new Error('ليس لديك صلاحية للصرف من هذا المخزن');
          }
        }
      }

      console.log('⏳ Ensuring Firebase is ready for dispatch...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for dispatch');
      
      if (!db) {
        throw new Error('Firestore database not available');
      }

      const normalizeArabic = (text) => {
        if (!text || typeof text !== 'string') return '';
        return text.trim();
      };

      const normalizedData = {
        item_id: dispatchData.item_id,
        from_warehouse_id: dispatchData.from_warehouse_id,
        destination: normalizeArabic(dispatchData.destination || 'dispat_item'),
        destination_id: dispatchData.destination_id,
        
        item_name: normalizeArabic(dispatchData.item_name || ''),
        from_warehouse_name: normalizeArabic(dispatchData.from_warehouse_name || ''),
        notes: normalizeArabic(dispatchData.notes || ''),
        
        quantity: Number(dispatchData.quantity) || 0,
        cartons_count: Number(dispatchData.cartons_count) || 0,
        per_carton_count: Number(dispatchData.per_carton_count) || 12,
        single_bottles_count: Number(dispatchData.single_bottles_count) || 0,
        
        color: normalizeArabic(dispatchData.color || ''),
        supplier: normalizeArabic(dispatchData.supplier || ''),
        priority: normalizeArabic(dispatchData.priority || 'normal'),
        item_location: normalizeArabic(dispatchData.item_location || '')
      };

      console.log('📤 Normalized dispatch data:', normalizedData);

      const result = await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'items', normalizedData.item_id);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) {
          throw new Error('الصنف غير موجود في المخزن المصدر');
        }

        const itemData = itemDoc.data();

        // Verify companyId
        if (itemData.companyId !== companyId) {
          throw new Error('لا يمكنك صرف هذا الصنف');
        }

        if (itemData.warehouse_id !== normalizedData.from_warehouse_id) {
          throw new Error(`الصنف ليس في المخزن المصدر المحدد. يوجد في: ${itemData.warehouse_id}`);
        }

        const currentCartons = Number(itemData.cartons_count) || 0;
        const currentSingles = Number(itemData.single_bottles_count) || 0;
        const perCarton = normalizedData.per_carton_count;
        
        let dispatchCartons = normalizedData.cartons_count;
        let dispatchSingles = normalizedData.single_bottles_count;
        let dispatchTotal = normalizedData.quantity;

        if (!dispatchCartons && !dispatchSingles && dispatchTotal > 0) {
          dispatchCartons = Math.floor(dispatchTotal / perCarton);
          dispatchSingles = dispatchTotal % perCarton;
        }

        console.log('📊 Quantity calculations:', {
          current: { cartons: currentCartons, singles: currentSingles, perCarton: perCarton },
          dispatch: { cartons: dispatchCartons, singles: dispatchSingles, total: dispatchTotal }
        });

        if (dispatchTotal <= 0) {
          throw new Error('يجب إدخال كمية صحيحة للصرف (أكبر من صفر)');
        }

        const currentTotal = (currentCartons * perCarton) + currentSingles;
        if (dispatchTotal > currentTotal) {
          throw new Error(`الكمية المطلوبة للصرف (${dispatchTotal}) أكبر من الكمية المتاحة (${currentTotal})`);
        }

        let newCartons = currentCartons;
        let newSingles = currentSingles;
        let remainingSinglesToDispatch = dispatchSingles;

        if (remainingSinglesToDispatch > 0 && newSingles > 0) {
          const singlesToUse = Math.min(newSingles, remainingSinglesToDispatch);
          newSingles -= singlesToUse;
          remainingSinglesToDispatch -= singlesToUse;
        }

        if (remainingSinglesToDispatch > 0) {
          const cartonsToBreak = Math.ceil(remainingSinglesToDispatch / perCarton);
          if (newCartons < cartonsToBreak) {
            throw new Error(`لا يوجد عدد كافٍ من الكرتونات للأكياس الفردية`);
          }
          newCartons -= cartonsToBreak;
          const bottlesFromBrokenCartons = cartonsToBreak * perCarton;
          newSingles += bottlesFromBrokenCartons - remainingSinglesToDispatch;
        }

        if (dispatchCartons > 0) {
          if (newCartons < dispatchCartons) {
            throw new Error(`لا يوجد عدد كافٍ من الكرتونات`);
          }
          newCartons -= dispatchCartons;
        }

        newCartons = Math.max(0, newCartons);
        newSingles = Math.max(0, newSingles);

        const newTotal = (newCartons * perCarton) + newSingles;

        console.log('🔄 Quantity update:', {
          previous: { cartons: currentCartons, singles: currentSingles, total: currentTotal },
          dispatch: { cartons: dispatchCartons, singles: dispatchSingles, total: dispatchTotal },
          new: { cartons: newCartons, singles: newSingles, total: newTotal }
        });

        transaction.update(itemRef, {
          cartons_count: newCartons,
          single_bottles_count: newSingles,
          remaining_quantity: newTotal,
          updated_at: serverTimestamp(),
          updated_by: state.user.uid
        });

        const transactionRef = doc(collection(db, 'transactions'));
        
        const transactionData = {
          type: TRANSACTION_TYPES.DISPATCH,
          
          item_id: normalizedData.item_id,
          item_name: normalizedData.item_name,
          item_code: itemData.code || '',
          color: normalizedData.color,
          
          from_warehouse: normalizedData.from_warehouse_id,
          from_warehouse_name: normalizedData.from_warehouse_name,
          destination: normalizedData.destination,
          destination_id: normalizedData.destination_id,
          
          quantity: dispatchTotal,
          total_delta: dispatchTotal,
          new_remaining: newTotal,
          
          cartons_count: dispatchCartons,
          per_carton_count: perCarton,
          single_bottles_count: dispatchSingles,
          
          previous_cartons: currentCartons,
          previous_single_bottles: currentSingles,
          previous_quantity: currentTotal,
          
          new_cartons: newCartons,
          new_single_bottles: newSingles,
          new_quantity: newTotal,
          
          user_id: state.user.uid,
          user_name: normalizeArabic(state.userProfile?.name || ''),
          user_role: state.userProfile?.role || '',
          user_email: state.user?.email || '',
          
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          
          notes: normalizedData.notes,
          priority: normalizedData.priority,
          status: 'completed',
          created_by: normalizeArabic(state.userProfile?.name || state.user?.email || 'نظام'),
          
          display_type: 'صرف',
          display_quantity: `${dispatchTotal} وحدة`,
          display_destination: normalizedData.destination,
          
          atomic_operation: true,
          detailed_breakdown_applied: true,
          utf8_encoded: true,
          companyId: companyId          // NEW
        };

        transaction.set(transactionRef, transactionData);

        const historyRef = doc(collection(db, 'item_history'));
        const historyData = {
          item_id: normalizedData.item_id,
          warehouse_id: normalizedData.from_warehouse_id,
          change_type: 'DISPATCH',
          
          old_quantity: currentTotal,
          new_quantity: newTotal,
          quantity_delta: -dispatchTotal,
          
          old_cartons: currentCartons,
          new_cartons: newCartons,
          cartons_delta: -dispatchCartons,
          
          old_single_bottles: currentSingles,
          new_single_bottles: newSingles,
          single_bottles_delta: -dispatchSingles,
          
          destination: normalizedData.destination,
          destination_id: normalizedData.destination_id,
          
          user_id: state.user.uid,
          user_name: normalizeArabic(state.userProfile?.name || ''),
          timestamp: serverTimestamp(),
          
          details: {
            name: normalizedData.item_name,
            code: itemData.code || '',
            color: normalizedData.color,
            notes: normalizedData.notes,
            priority: normalizedData.priority,
            transaction_id: transactionRef.id,
            per_carton: perCarton,
            detailed_dispatch: true
          },
          companyId: companyId          // NEW
        };
        
        transaction.set(historyRef, historyData);

        return {
          transactionId: transactionRef.id,
          transactionData: transactionData,
          dispatchTotal: dispatchTotal,
          newTotal: newTotal,
          detailedUpdate: {
            cartons_count: newCartons,
            single_bottles_count: newSingles,
            per_carton_count: perCarton,
            remaining_quantity: newTotal
          }
        };
      });

      console.log('✅ Transaction completed successfully');
      
      const inventoryIndex = state.inventory.findIndex(item => item.id === normalizedData.item_id);
      if (inventoryIndex !== -1) {
        const updatedItem = {
          ...state.inventory[inventoryIndex],
          cartons_count: result.detailedUpdate.cartons_count,
          single_bottles_count: result.detailedUpdate.single_bottles_count,
          remaining_quantity: result.detailedUpdate.remaining_quantity,
          updated_at: new Date()
        };
        
        commit('UPDATE_INVENTORY_ITEM', updatedItem);
      }

      const transactionForState = {
        id: result.transactionId,
        ...result.transactionData,
        timestamp: new Date(),
        created_at: new Date(),
        
        quantity: result.dispatchTotal,
        total_delta: result.dispatchTotal,
        new_remaining: result.newTotal,
        
        display_quantity: `${result.dispatchTotal} وحدة`,
        display_type: 'صرف',
        display_destination: normalizedData.destination
      };

      commit('ADD_TRANSACTION', transactionForState);
      commit('ADD_RECENT_TRANSACTION', transactionForState);

      dispatch('showNotification', {
        type: 'success',
        title: 'تم الصرف بنجاح',
        message: `تم صرف ${result.dispatchTotal} وحدة من "${normalizedData.item_name}" إلى ${normalizedData.destination}`,
        icon: 'check-circle',
        timeout: 5000
      });

      console.log('📊 Dispatch completed successfully:', {
        item: normalizedData.item_name,
        quantity: result.dispatchTotal,
        destination: normalizedData.destination,
        transactionId: result.transactionId
      });

      return {
        success: true,
        message: 'تم الصرف بنجاح',
        transactionId: result.transactionId,
        newQuantity: result.newTotal,
        detailedUpdate: result.detailedUpdate
      };

    } catch (error) {
      console.error('❌ Dispatch failed:', error);
      
      commit('SET_OPERATION_ERROR', error.message);
      
      dispatch('showNotification', {
        type: 'error',
        title: 'فشل الصرف',
        message: error.message || 'حدث خطأ أثناء عملية الصرف',
        icon: 'alert-circle',
        timeout: 7000
      });

      return {
        success: false,
        message: error.message || 'فشل الصرف'
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  // ============================================
  // GET ITEM BY ID / CODE / NAME
  // ============================================
  async getItemById({ state, dispatch }, { itemId, itemCode, itemName }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log('🔍 GET ITEM (Real-time):', { itemId, itemCode, itemName });
      if (!itemId && !itemCode && !itemName) {
        throw new Error('معرف الصنف أو الكود أو الاسم مطلوب');
      }
      let item = state.inventory.find(i =>
        i.id === itemId ||
        (itemCode && i.code === itemCode) ||
        (itemName && i.name === itemName)
      );
      if (item) {
        console.log('✅ Item found in recent inventory');
        return item;
      }
      console.log('⚡ Item not in recent inventory. Searching Firestore...');
      if (itemId) {
        try {
          const itemDoc = await getDoc(doc(db, 'items', itemId));
          if (itemDoc.exists()) {
            const itemData = itemDoc.data();
            if (itemData.companyId !== companyId) {
              throw new Error('لا يمكنك الوصول إلى هذا الصنف');
            }
            if (state.user && state.userProfile?.role === 'warehouse_manager') {
              const allowedWarehouses = state.userProfile.allowed_warehouses || [];
              if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
                if (!allowedWarehouses.includes(itemData.warehouse_id)) {
                  throw new Error('ليس لديك صلاحية للوصول إلى هذا الصنف من هذا المخزن');
                }
              }
            }
            const convertedItem = InventoryService.convertForDisplay({
              id: itemDoc.id,
              ...itemData
            });
            console.log('✅ Item fetched from Firestore by ID');
            return convertedItem;
          }
        } catch (error) {
          console.log('Item not found by ID:', error.message);
        }
      }
      if (itemCode) {
        const itemsRef = collection(db, 'items');
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('code', '==', itemCode),
          limit(5)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const validItems = snapshot.docs.filter(doc => {
            if (!state.user) return true;
            const itemData = doc.data();
            if (state.userProfile.role === 'superadmin') return true;
            const allowedWarehouses = state.userProfile.allowed_warehouses || [];
            if (allowedWarehouses.includes('all')) return true;
            return allowedWarehouses.includes(itemData.warehouse_id);
          });
          if (validItems.length > 0) {
            const doc = validItems[0];
            const itemData = doc.data();
            const convertedItem = InventoryService.convertForDisplay({
              id: doc.id,
              ...itemData
            });
            console.log(`✅ Item found by code`);
            return convertedItem;
          }
        }
      }
      if (itemName && itemName.length >= 2) {
        const itemsRef = collection(db, 'items');
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('name', '==', itemName),
          limit(10)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const validItems = snapshot.docs.filter(doc => {
            if (!state.user) return true;
            const itemData = doc.data();
            if (state.userProfile.role === 'superadmin') return true;
            const allowedWarehouses = state.userProfile.allowed_warehouses || [];
            if (allowedWarehouses.includes('all')) return true;
            return allowedWarehouses.includes(itemData.warehouse_id);
          });
          if (validItems.length > 0) {
            const doc = validItems[0];
            const itemData = doc.data();
            const convertedItem = InventoryService.convertForDisplay({
              id: doc.id,
              ...itemData
            });
            console.log(`✅ Item found by name`);
            return convertedItem;
          }
        }
      }
      console.log('🔄 Using direct search...');
      const searchTerm = itemCode || itemName || '';
      if (searchTerm.length >= 2) {
        const searchResults = await dispatch('searchInventorySpark', {
          searchQuery: searchTerm,
          limitResults: 10
        });
        if (searchResults.length > 0) {
          const foundItem = searchResults[0];
          console.log('✅ Item found through direct search');
          return foundItem;
        }
      }
      throw new Error('الصنف غير موجود في المخزون');
    } catch (error) {
      console.error('❌ Error getting item:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في العثور على الصنف'
      });
      return null;
    }
  },

  async getItemsFromWarehouse({ state, dispatch }, { warehouseId, limitResults = 20 }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log('🔄 Getting items from warehouse (real-time):', warehouseId);
      if (!warehouseId) {
        throw new Error('معرف المخزن مطلوب');
      }
      if (state.user && state.userProfile?.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية للوصول إلى هذا المخزن');
          }
        }
      }
      const localItems = state.inventory.filter(item => item.warehouse_id === warehouseId);
      if (localItems.length >= limitResults) {
        console.log('✅ Found items in recent inventory:', localItems.length);
        return localItems.slice(0, limitResults);
      }
      const itemsRef = collection(db, 'items');
      try {
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('warehouse_id', '==', warehouseId),
          orderBy('createdAt', 'desc'),
          limit(limitResults)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => {
          const itemData = doc.data();
          return InventoryService.convertForDisplay({
            id: doc.id,
            ...itemData
          });
        });
        console.log(`✅ Found ${items.length} items in warehouse ${warehouseId}`);
        return items;
      } catch (error) {
        console.warn('Using alternative query...', error);
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('warehouse_id', '==', warehouseId),
          limit(limitResults)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => {
          const itemData = doc.data();
          return InventoryService.convertForDisplay({
            id: doc.id,
            ...itemData
          });
        });
        items.sort((a, b) => {
          const dateA = a.createdAt || a.created_at || 0;
          const dateB = b.createdAt || b.created_at || 0;
          return new Date(dateB) - new Date(dateA);
        });
        return items;
      }
    } catch (error) {
      console.error('❌ Error getting items from warehouse:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في تحميل الأصناف من المخزن'
      });
      return [];
    }
  },

  async loadWarehouseItems({ commit, state, dispatch }, { warehouseId, limit = 50, lastDoc = null } = {}) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      if (!warehouseId) {
        throw new Error('معرف المخزن مطلوب');
      }

      console.log(`🔄 Loading warehouse items (${warehouseId})...`);

      await ensureFirebaseReady();

      if (state.user && state.userProfile?.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];
        if (allowedWarehouses.length > 0 && !allowedWarehouses.includes('all')) {
          if (!allowedWarehouses.includes(warehouseId)) {
            throw new Error('ليس لديك صلاحية للوصول إلى هذا المخزن');
          }
        }
      }

      const itemsRef = collection(db, 'items');
      let itemsQuery;

      if (lastDoc) {
        let lastSnapshot = lastDoc;
        if (typeof lastDoc === 'string') {
          lastSnapshot = await getDoc(doc(db, 'items', lastDoc));
        }

        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('warehouse_id', '==', warehouseId),
          orderBy('name'),
          startAfter(lastSnapshot),
          limit(limit)
        );
      } else {
        itemsQuery = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('warehouse_id', '==', warehouseId),
          orderBy('name'),
          limit(limit)
        );
      }

      const snapshot = await getDocs(itemsQuery);
      console.log(`✅ Loaded ${snapshot.size} items from warehouse ${warehouseId}`);

      const items = snapshot.docs.map(doc => {
        const itemData = doc.data();
        return InventoryService.convertForDisplay({
          id: doc.id,
          ...itemData
        });
      });

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.size === limit;

      return {
        items,
        lastDoc: newLastDoc,
        hasMore
      };

    } catch (error) {
      console.error('❌ Error loading warehouse items:', error);
      
      if (error.name === 'DataCloneError' || error.message.includes('could not be cloned')) {
        console.warn('🔄 IndexedDB serialization error in warehouse items');
        return {
          items: [],
          lastDoc: null,
          hasMore: false
        };
      }
      
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في تحميل الأصناف من المخزن'
      });

      const localItems = state.inventory.filter(item => item.warehouse_id === warehouseId);
      return {
        items: localItems.slice(0, limit),
        lastDoc: null,
        hasMore: false
      };
    }
  },

  async loadMoreWarehouseItems({ commit, state, dispatch }, { warehouseId, currentItems = [] }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    if (state.pagination.isFetching) {
      return { items: [], hasMore: false };
    }

    commit('SET_PAGINATION', { isFetching: true });

    try {
      console.log(`📥 Loading more items from warehouse ${warehouseId}...`);

      const lastItem = currentItems[currentItems.length - 1];
      let lastDoc = null;

      if (lastItem) {
        const itemRef = doc(db, 'items', lastItem.id);
        lastDoc = await getDoc(itemRef);
      }

      const result = await dispatch('loadWarehouseItems', {
        warehouseId,
        limit: PERFORMANCE_CONFIG.SCROLL_LOAD,
        lastDoc: lastItem ? lastDoc : null
      });

      if (result.items.length > 0) {
        const allItems = [...currentItems, ...result.items];

        const newIds = new Set(result.items.map(item => item.id));
        const existingIds = new Set(state.inventory.map(item => item.id));
        const itemsToAdd = result.items.filter(item => !existingIds.has(item.id));

        if (itemsToAdd.length > 0) {
          commit('APPEND_INVENTORY', itemsToAdd);
        }

        commit('SET_PAGINATION', {
          lastDoc: result.lastDoc,
          hasMore: result.hasMore,
          totalLoaded: state.pagination.totalLoaded + result.items.length,
          isFetching: false
        });

        return {
          items: result.items,
          allItems,
          hasMore: result.hasMore
        };
      } else {
        commit('SET_PAGINATION', { 
          hasMore: false, 
          isFetching: false 
        });

        return { items: [], allItems: currentItems, hasMore: false };
      }

    } catch (error) {
      console.error('❌ Error loading more warehouse items:', error);
      commit('SET_PAGINATION', { isFetching: false });

      if (error.name === 'DataCloneError' || error.message.includes('could not be cloned')) {
        console.warn('🔄 IndexedDB serialization error in loadMoreWarehouseItems');
        return { items: [], allItems: currentItems, hasMore: false };
      }

      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل المزيد من الأصناف'
      });

      return { items: [], allItems: currentItems, hasMore: false };
    }
  },

  async resetWarehousePagination({ commit }) {
    commit('RESET_PAGINATION');
  },

  async getWarehouseItemsCount({ state }, warehouseId) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      const itemsRef = collection(db, 'items');
      const q = query(
        itemsRef,
        where('companyId', '==', companyId),          // NEW
        where('warehouse_id', '==', warehouseId)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('❌ Error counting warehouse items:', error);
      const localCount = state.inventory.filter(item => item.warehouse_id === warehouseId).length;
      return localCount;
    }
  },

  async getTotalItemCount({ state }, warehouseId = 'all') {
    try {
      console.log(`📊 Getting total item count from local data for ${warehouseId === 'all' ? 'all warehouses' : 'warehouse ' + warehouseId}`);
      
      const inventory = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      return filteredItems.length;
    } catch (error) {
      console.error('❌ Error getting total item count:', error);
      const items = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? items 
        : items.filter(item => item.warehouse_id === warehouseId);
      return filteredItems.length;
    }
  },

  async getLowStockCount({ state }, warehouseId = 'all') {
    try {
      console.log(`📊 Getting low stock count from local data for ${warehouseId === 'all' ? 'all warehouses' : 'warehouse ' + warehouseId}`);
      
      const inventory = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      return filteredItems.filter(item => 
        (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0
      ).length;
    } catch (error) {
      console.error('❌ Error getting low stock count:', error);
      const items = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? items 
        : items.filter(item => item.warehouse_id === warehouseId);
      return filteredItems.filter(item => 
        (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0
      ).length;
    }
  },

  async getOutOfStockCount({ state }, warehouseId = 'all') {
    try {
      console.log(`📊 Getting out of stock count from local data for ${warehouseId === 'all' ? 'all warehouses' : 'warehouse ' + warehouseId}`);
      
      const inventory = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      return filteredItems.filter(item => (item.remaining_quantity || 0) === 0).length;
    } catch (error) {
      console.error('❌ Error getting out of stock count:', error);
      const items = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? items 
        : items.filter(item => item.warehouse_id === warehouseId);
      return filteredItems.filter(item => (item.remaining_quantity || 0) === 0).length;
    }
  },

  async getTotalQuantitySum({ state }, warehouseId = 'all') {
    try {
      console.log(`📊 Getting total quantity sum from local data for ${warehouseId === 'all' ? 'all warehouses' : 'warehouse ' + warehouseId}`);
      
      const inventory = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      return filteredItems.reduce((sum, item) => 
        sum + (item.remaining_quantity || 0), 0
      );
    } catch (error) {
      console.error('❌ Error getting total quantity sum:', error);
      const inventory = state.inventory;
      const filteredItems = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      return filteredItems.reduce((sum, item) => 
        sum + (item.remaining_quantity || 0), 0
      );
    }
  },

  async refreshDashboardCounts({ commit, state, dispatch }, warehouseId = 'all') {
    try {
      console.log('🔄 Refreshing dashboard counts from local data...');
      
      const inventory = state.inventory;
      const filteredInventory = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      const totalItems = filteredInventory.length;
      const totalQuantity = filteredInventory.reduce((sum, item) => 
        sum + (item.remaining_quantity || 0), 0
      );
      const lowStockItems = filteredInventory.filter(item => 
        (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0
      ).length;
      
      const counts = {
        totalItems,
        totalQuantity,
        lowStockItems,
        lastUpdated: new Date()
      };
      
      console.log('✅ Dashboard counts calculated from local data:', counts);
      return counts;
      
    } catch (error) {
      console.error('❌ Error calculating dashboard counts:', error);
      
      const inventory = state.inventory;
      const filteredInventory = warehouseId === 'all' 
        ? inventory 
        : inventory.filter(item => item.warehouse_id === warehouseId);
      
      const fallbackCounts = {
        totalItems: filteredInventory.length,
        totalQuantity: filteredInventory.reduce((sum, item) => 
          sum + (item.remaining_quantity || 0), 0
        ),
        lowStockItems: filteredInventory.filter(item => 
          (item.remaining_quantity || 0) < 10 && (item.remaining_quantity || 0) > 0
        ).length,
        lastUpdated: new Date()
      };
      
      return fallbackCounts;
    }
  },

  async getDashboardStats({ state, dispatch }, warehouseId = 'all') {
    try {
      const counts = await dispatch('refreshDashboardCounts', warehouseId);
      return {
        ...counts,
        recentTransactions: 0 // Or calculate from state.recentTransactions
      };
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      throw error;
    }
  },

  async getAllWarehousesSummary({ dispatch, getters }) {
    try {
      const warehouses = getters.warehouses;
      const summary = {
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        warehouseCount: warehouses.length,
        lastUpdated: new Date()
      };

      for (const warehouse of warehouses) {
        const counts = await dispatch('refreshDashboardCounts', warehouse.id);
        summary.totalItems += counts.totalItems;
        summary.totalQuantity += counts.totalQuantity;
        summary.lowStockItems += counts.lowStockItems;
      }

      return summary;
    } catch (error) {
      console.error('❌ Error getting all warehouses summary:', error);
      throw error;
    }
  },

  async setupOptimizedRealtimeUpdates({ commit, state }, itemIds) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) {
      console.warn('setupOptimizedRealtimeUpdates: companyId missing');
      return;
    }

    if (!state.realtimeMode || !itemIds || itemIds.length === 0) return;

    try {
      console.log(`🔴 Setting up optimized real-time for ${itemIds.length} items`);

      const limitedItemIds = itemIds.slice(0, PERFORMANCE_CONFIG.MAX_REALTIME_LISTENERS);

      state.realtimeListeners.forEach(listener => {
        try {
          if (typeof listener === 'function') {
            listener();
          }
        } catch (error) {
          console.warn('Error unsubscribing listener:', error);
        }
      });
      state.realtimeListeners = [];
      state.activeItemListeners.clear();

      if (limitedItemIds.length <= PERFORMANCE_CONFIG.BATCH_SIZE) {
        const itemsRef = collection(db, 'items');
        const q = query(
          itemsRef,
          where('companyId', '==', companyId),          // NEW
          where('__name__', 'in', limitedItemIds)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'modified' || change.type === 'added') {
              const data = change.doc.data();
              const updatedItem = InventoryService.convertForDisplay({
                id: change.doc.id,
                ...data
              });

              commit('UPDATE_INVENTORY_ITEM', updatedItem);
            } else if (change.type === 'removed') {
              commit('REMOVE_INVENTORY_ITEM', change.doc.id);
            }
          });
        });

        commit('ADD_REALTIME_LISTENER', unsubscribe);

      } else {
        const listeners = limitedItemIds.map(itemId => {
          const itemRef = doc(db, 'items', itemId);

          const unsubscribe = onSnapshot(itemRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              // No need to check companyId here because we're listening to a specific doc – but if data is stale, it's fine.
              const updatedItem = InventoryService.convertForDisplay({
                id: docSnapshot.id,
                ...data
              });

              commit('UPDATE_INVENTORY_ITEM', updatedItem);
            } else {
              commit('REMOVE_INVENTORY_ITEM', itemId);
              commit('REMOVE_ITEM_LISTENER', itemId);
            }
          });

          return unsubscribe;
        });

        listeners.forEach(listener => commit('ADD_REALTIME_LISTENER', listener));
      }

      console.log(`✅ Optimized real-time updates set up for ${limitedItemIds.length} items`);

    } catch (error) {
      console.error('❌ Error setting up optimized real-time updates:', error);
    }
  },

  async setupRealtimeUpdatesForInventory({ commit, state, dispatch }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) {
      console.warn('setupRealtimeUpdatesForInventory: companyId missing');
      return;
    }

    if (!state.realtimeMode || state.inventory.length === 0) return;

    try {
      console.log('🔴 Setting up real-time updates for inventory...');

      commit('CLEAR_REALTIME_LISTENERS');

      const listeners = state.inventory.map(item => {
        if (state.activeItemListeners.has(item.id)) {
          console.log(`⚠️ Already listening to item ${item.id}, skipping...`);
          return null;
        }

        const itemRef = doc(db, 'items', item.id);

        const unsubscribe = onSnapshot(itemRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            // Optionally verify companyId, but if we have the doc, it's correct
            const updatedItem = InventoryService.convertForDisplay({
              id: docSnapshot.id,
              ...data
            });

            commit('UPDATE_INVENTORY_ITEM', updatedItem);
          } else {
            commit('REMOVE_INVENTORY_ITEM', item.id);
            commit('REMOVE_ITEM_LISTENER', item.id);
          }
        }, (error) => {
          console.error(`❌ Real-time error for item ${item.id}:`, error);
          commit('REMOVE_ITEM_LISTENER', item.id);
        });

        commit('ADD_ITEM_LISTENER', item.id);
        return unsubscribe;
      }).filter(Boolean);

      listeners.forEach(listener => commit('ADD_REALTIME_LISTENER', listener));

      console.log(`✅ Real-time updates set up for ${listeners.length} items`);

    } catch (error) {
      console.error('❌ Error setting up real-time updates:', error);
    }
  },

  async setupRealtimeUpdatesForItems({ commit, state }, itemIds) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) {
      console.warn('setupRealtimeUpdatesForItems: companyId missing');
      return;
    }

    if (!state.realtimeMode || !itemIds || itemIds.length === 0) return;

    try {
      console.log(`🔴 Setting up real-time for ${itemIds.length} items`);

      const listeners = itemIds.map(itemId => {
        if (state.activeItemListeners.has(itemId)) {
          return null;
        }

        const itemRef = doc(db, 'items', itemId);

        const unsubscribe = onSnapshot(itemRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const updatedItem = InventoryService.convertForDisplay({
              id: docSnapshot.id,
              ...data
            });

            commit('UPDATE_INVENTORY_ITEM', updatedItem);
          } else {
            commit('REMOVE_INVENTORY_ITEM', itemId);
            commit('REMOVE_ITEM_LISTENER', itemId);
          }
        });

        commit('ADD_ITEM_LISTENER', itemId);
        return unsubscribe;
      }).filter(Boolean);

      listeners.forEach(listener => commit('ADD_REALTIME_LISTENER', listener));

    } catch (error) {
      console.error('❌ Error setting up real-time updates for items:', error);
    }
  },

  async clearRealtimeUpdates({ commit }) {
    console.log('🧹 Clearing real-time listeners...');
    commit('CLEAR_REALTIME_LISTENERS');
  },

  async fetchInventory({ dispatch }) {
    console.log('📦 Fetching inventory...');
    return await dispatch('loadAllInventory');
  },

  async fetchInventoryOnce({ dispatch }) {
    console.log('📦 Using loadAllInventory');
    return await dispatch('loadAllInventory');
  },

  async searchInventory({ commit, state, dispatch }, searchParams) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_INVENTORY_LOADING', true);
    commit('SET_INVENTORY_ERROR', null);
    commit('RESET_PAGINATION');

    try {
      const { search, warehouse, searchField = 'name' } = searchParams || {};

      commit('SET_FILTERS', { search, warehouse, searchField });

      if (!state.userProfile) {
        throw new Error('User not authenticated');
      }

      if (search && search.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS) {
        const results = await dispatch('searchInventorySpark', {
          searchQuery: search,
          warehouseId: warehouse
        });

        commit('SET_INVENTORY', results);
        commit('SET_INVENTORY_LOADED', true);
        commit('SET_PAGINATION', {
          hasMore: false,
          totalLoaded: results.length
        });

        return results;
      }

      const itemsRef = collection(db, 'items');
      let itemsQuery;

      if (state.userProfile.role === 'superadmin' || state.userProfile.role === 'company_manager') {
        if (warehouse) {
          itemsQuery = query(
            itemsRef,
            where('companyId', '==', companyId),          // NEW
            where('warehouse_id', '==', warehouse),
            orderBy('name'),
            limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
          );
        } else {
          itemsQuery = query(
            itemsRef,
            where('companyId', '==', companyId),          // NEW
            orderBy('name'),
            limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
          );
        }
      } else if (state.userProfile.role === 'warehouse_manager') {
        const allowedWarehouses = state.userProfile.allowed_warehouses || [];

        if (allowedWarehouses.includes('all')) {
          if (warehouse) {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),          // NEW
              where('warehouse_id', '==', warehouse),
              orderBy('name'),
              limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
            );
          } else {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),          // NEW
              orderBy('name'),
              limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
            );
          }
        } else {
          const warehousesFilter = allowedWarehouses.slice(0, 10);

          if (warehouse && warehousesFilter.includes(warehouse)) {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),          // NEW
              where('warehouse_id', '==', warehouse),
              orderBy('name'),
              limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
            );
          } else {
            itemsQuery = query(
              itemsRef,
              where('companyId', '==', companyId),          // NEW
              where('warehouse_id', 'in', warehousesFilter),
              orderBy('name'),
              limit(PERFORMANCE_CONFIG.INITIAL_LOAD)
            );
          }
        }
      } else {
        throw new Error('User role not authorized');
      }

      const snapshot = await getDocs(itemsQuery);
      console.log(`🔍 Search found: ${snapshot.size} items`);

      const inventory = snapshot.docs.map(doc => {
        const data = doc.data();
        return InventoryService.convertForDisplay({
          id: doc.id,
          ...data
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      commit('SET_PAGINATION', {
        lastDoc,
        hasMore: snapshot.size === PERFORMANCE_CONFIG.INITIAL_LOAD,
        totalLoaded: inventory.length
      });

      commit('SET_INVENTORY', inventory);
      commit('SET_INVENTORY_LOADED', true);

      if (state.realtimeMode) {
        await dispatch('setupRealtimeUpdatesForInventory');
      }

      return inventory;

    } catch (error) {
      console.error('❌ Error searching inventory:', error);
      commit('SET_INVENTORY_ERROR', error.message);

      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في البحث'
      });

      return [];
    } finally {
      commit('SET_INVENTORY_LOADING', false);
    }
  },

  async clearFiltersAndShowAll({ dispatch }) {
    await dispatch('searchInventory', {});
  },

  async refreshInventory({ dispatch }) {
    console.log('🔄 Refreshing inventory...');
    await dispatch('clearRealtimeUpdates');
    return await dispatch('loadAllInventory', { forceRefresh: true });
  },

  async refreshInventorySilently({ commit, state, dispatch }) {
    const companyId = state.userProfile?.companyId;
    if (!companyId) return;

    try {
      commit('SET_IS_REFRESHING_SILENTLY', true);
      console.log('🔄 تحديث المخزون بصمت...');
      
      await dispatch('loadAllInventory', { forceRefresh: true });
      
      console.log('✅ تم تحديث المخزون بصمت');
    } catch (error) {
      console.warn('⚠️ تعذر تحديث المخزون بصمت:', error.message);
    } finally {
      commit('SET_IS_REFRESHING_SILENTLY', false);
    }
  },
};
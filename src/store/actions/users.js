import { db, auth } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, limit, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore'; // added import
import { ensureFirebaseReady } from '../utils/firebase-utils';

export default {
  async loadUsers({ commit, state, dispatch, rootState }) {
    try {
      console.log('🔄 Loading users...');

      const role = state.userProfile?.role;
      const companyId = rootState.userProfile?.companyId;

      if (role !== 'superadmin' && role !== 'company_manager') {
        console.log('⚠️ User is not superadmin or company manager, skipping users load');
        return [];
      }

      const usersRef = collection(db, 'users');
      let q;

      if (role === 'superadmin') {
        // Superadmin sees all users
        q = query(usersRef, orderBy('created_at', 'desc'));
      } else {
        // Company manager sees only users of their company
        if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');
        q = query(
          usersRef,
          where('companyId', '==', companyId),
          orderBy('created_at', 'desc')
        );
      }

      const snapshot = await getDocs(q);

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Users loaded: ${users.length}`);
      commit('SET_ALL_USERS', users);
      return users;

    } catch (error) {
      console.error('❌ Error loading users:', error);
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'خطأ في تحميل المستخدمين'
      });
      return [];
    }
  },

  async createUser({ commit, state, dispatch, rootState }, userData) {
    const creatorCompanyId = rootState.userProfile?.companyId;
    if (!creatorCompanyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🔄 CREATE USER - SIMPLE MATCH:', {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions?.length || 0,
        warehouses: userData.allowedWarehouses?.length || 0,
        allWarehouses: userData.allWarehouses
      });

      const creatorRole = state.userProfile?.role;
      if (creatorRole !== 'superadmin' && creatorRole !== 'company_manager') {
        throw new Error('ليس لديك صلاحية لإنشاء مستخدمين');
      }

      if (!userData.name?.trim() || !userData.email?.trim() || !userData.role) {
        throw new Error('الاسم والبريد والدور مطلوبون');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('البريد الإلكتروني غير صالح');
      }

      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', userData.email.toLowerCase().trim()), limit(1));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }

      let allowedWarehouses = {};
      
      if (userData.allWarehouses === true) {
        allowedWarehouses = { all: true };
      } else if (userData.allowedWarehouses && Array.isArray(userData.allowedWarehouses) && userData.allowedWarehouses.length > 0) {
        userData.allowedWarehouses.forEach(warehouseId => {
          allowedWarehouses[warehouseId] = true;
        });
      } else {
        throw new Error('يجب تحديد المخازن المسموح بها');
      }

      const permissions = userData.permissions || [];
      
      if (permissions.length === 0) {
        throw new Error('يجب تحديد صلاحيات للمستخدم');
      }

      const defaultViewPermissions = [
        'view_items',      // View items in allowed warehouses
        'view_invoices',   // View invoices
        'view_reports',    // View reports
        'view_movements'   // View item movements
      ];

      const allPermissions = [...new Set([...defaultViewPermissions, ...permissions])];

      let password = userData.password;
      if (!password || password === 'auto') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        password = Array.from(crypto.getRandomValues(new Uint32Array(10)))
          .map(value => chars[value % chars.length])
          .join('');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      const userDoc = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        role: userData.role,
        permissions: allPermissions,
        allowed_warehouses: allowedWarehouses,
        phone: userData.phone || '',
        phoneCountryCode: userData.phoneCountryCode || '+966',
        is_active: userData.isActive !== false,
        two_factor_enabled: userData.twoFactorEnabled || false,
        notes: userData.notes || '',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        created_by: state.user.uid,
        created_by_name: state.userProfile?.name || state.user?.email,
        last_login: null,
        login_count: 0,
        companyId: creatorCompanyId   // NEW – user belongs to creator's company
      };

      console.log('💾 Saving user to Firestore...');
      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

      const newUser = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: allPermissions,
        allowed_warehouses: allowedWarehouses,
        is_active: userData.isActive !== false,
        created_at: new Date().toISOString()
      };

      // Update local state if the new user belongs to the current company (or always for superadmin)
      if (creatorRole === 'superadmin' || creatorCompanyId === userDoc.companyId) {
        commit('SET_ALL_USERS', [...state.allUsers, newUser]);
      }

      const warehouseText = userData.allWarehouses ? 
        'جميع المخازن' : 
        `${Object.keys(allowedWarehouses).length} مخزن`;

      dispatch('showNotification', {
        type: 'success',
        message: `تم إنشاء ${userData.name}<br>الصلاحيات: ${permissions.length}<br>المخازن: ${warehouseText}`,
        timeout: 8000,
        html: true
      });

      return {
        success: true,
        user: newUser,
        password: userData.sendWelcomeEmail ? null : password,
        message: 'تم إنشاء المستخدم بنجاح'
      };

    } catch (error) {
      console.error('❌ CREATE USER ERROR:', error);

      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'البريد مستخدم بالفعل';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'بريد غير صالح';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة مرور ضعيفة';
      }

      commit('SET_OPERATION_ERROR', errorMessage);

      dispatch('showNotification', {
        type: 'error',
        message: errorMessage,
        timeout: 5000
      });

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async updateUser({ commit, state, dispatch, rootState }, { userId, userData }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    commit('SET_OPERATION_LOADING', true);
    commit('CLEAR_OPERATION_ERROR');

    try {
      console.log('🔄 UPDATE USER - SIMPLE:', {
        userId,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions?.length || 0
      });

      const role = state.userProfile?.role;
      if (role !== 'superadmin' && role !== 'company_manager') {
        throw new Error('ليس لديك صلاحية لتعديل المستخدمين');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('المستخدم غير موجود');
      }

      const existingUser = userDoc.data();

      // If user is company manager, ensure the target user belongs to same company
      if (role === 'company_manager' && existingUser.companyId !== companyId) {
        throw new Error('لا يمكنك تعديل هذا المستخدم');
      }

      const updateData = {
        updated_at: serverTimestamp(),
        updated_by: state.user.uid
      };

      if (userData.name !== undefined) updateData.name = userData.name.trim();
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
      if (userData.notes !== undefined) updateData.notes = userData.notes;

      if (userData.permissions !== undefined) {
        const defaultViewPermissions = ['view_items', 'view_invoices', 'view_reports', 'view_movements'];
        const allPermissions = [...new Set([...defaultViewPermissions, ...userData.permissions])];
        updateData.permissions = allPermissions;
      }

      if (userData.allowedWarehouses !== undefined || userData.allWarehouses !== undefined) {
        let allowedWarehouses = {};
        
        if (userData.allWarehouses === true) {
          allowedWarehouses = { all: true };
        } else if (userData.allowedWarehouses && Array.isArray(userData.allowedWarehouses)) {
          userData.allowedWarehouses.forEach(warehouseId => {
            allowedWarehouses[warehouseId] = true;
          });
        }
        
        updateData.allowed_warehouses = allowedWarehouses;
      }

      console.log('💾 Updating user with:', updateData);

      await updateDoc(userRef, updateData);

      const updatedUser = { ...existingUser, ...updateData, id: userId };
      
      // Update local state if the user belongs to the current company or if superadmin
      if (role === 'superadmin' || existingUser.companyId === companyId) {
        const updatedUsers = state.allUsers.map(user => 
          user.id === userId ? updatedUser : user
        );
        commit('SET_ALL_USERS', updatedUsers);
      }

      dispatch('showNotification', {
        type: 'success',
        message: `تم تحديث ${userData.name || 'المستخدم'}`,
        timeout: 5000
      });

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      console.error('❌ UPDATE ERROR:', error);
      
      commit('SET_OPERATION_ERROR', error.message);
      
      dispatch('showNotification', {
        type: 'error',
        message: error.message || 'فشل التحديث',
        timeout: 5000
      });

      return {
        success: false,
        message: error.message
      };
    } finally {
      commit('SET_OPERATION_LOADING', false);
    }
  },

  async notifyAdminAboutPendingUser({ state }, { userId, userEmail }) {
    try {
      const adminsRef = collection(db, 'users');
      const q = query(adminsRef, where('role', '==', 'superadmin'));
      const snapshot = await getDocs(q);

      const notifications = snapshot.docs.map(doc => ({
        to: doc.id,
        type: 'pending_user',
        title: 'مستخدم جديد يحتاج الموافقة',
        message: `المستخدم ${userEmail} يحتاج الموافقة على حسابه`,
        data: { userId, userEmail },
        created_at: serverTimestamp(),
        read: false,
        created_by: 'system'
      }));

      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, notification);
      });

      await batch.commit();
      console.log('✅ Admin notified about pending user');
    } catch (error) {
      console.error('❌ Error notifying admin:', error);
    }
  },
};
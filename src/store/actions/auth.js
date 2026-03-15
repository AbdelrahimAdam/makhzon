import { auth, db } from '@/firebase/config';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ensureFirebaseReady } from '../utils/firebase-utils';
import { getAuthErrorMessage } from '../utils/helpers';
import { NOTIFICATION_CONFIG } from '../utils/constants';

export default {
  async initializeAuth({ commit, dispatch }) {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          commit('SET_USER', user);

          try {
            // 🔹 Retry fetching user document up to 10 times with 500ms delay
            let userDoc = null;
            let attempts = 0;
            const maxAttempts = 10;
            const delay = 500; // milliseconds

            while (attempts < maxAttempts) {
              userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) break;
              attempts++;
              if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for user document (attempt ${attempts}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

            if (!userDoc || !userDoc.exists()) {
              console.error('❌ User document not found after multiple attempts – logging out.');
              await dispatch('logout');
              return;
            }

            const userProfile = userDoc.data();

            if (userProfile.is_active === false) {
              dispatch('showNotification', {
                type: 'error',
                message: 'حسابك غير نشط. يرجى التواصل مع المشرف.'
              });
              await dispatch('logout');
              return;
            }

            commit('SET_USER_PROFILE', {
              ...userProfile,
              companyId: userProfile.companyId
            });

            await dispatch('loadWarehousesEnhanced');
            await dispatch('loadAllInventory');
            await dispatch('fetchTransactions');
            dispatch('getRecentTransactions');

            dispatch('showNotification', {
              type: 'success',
              message: `مرحباً ${userProfile.name}! تم تسجيل الدخول بنجاح.`
            });
          } catch (error) {
            console.error('Error in auth initialization:', error);
            commit('SET_AUTH_ERROR', 'فشل في تحميل بيانات المستخدم');
          }
        } else {
          commit('RESET_STATE');
          commit('SET_USER', null);
          commit('SET_USER_PROFILE', null);
        }
        resolve();
      });
    });
  },

  async login({ commit, dispatch }, { email, password }) {
    commit('SET_LOADING', true);
    commit('SET_AUTH_ERROR', null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      commit('SET_USER', user);
      return user;
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      commit('SET_AUTH_ERROR', errorMessage);
      dispatch('showNotification', {
        type: 'error',
        message: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async logout({ commit, dispatch }) {
    try {
      await signOut(auth);
      commit('RESET_STATE');
      commit('SET_AUTH_ERROR', null);
      commit('SET_OPERATION_ERROR', null);
      dispatch('showNotification', {
        type: 'info',
        message: 'تم تسجيل الخروج بنجاح'
      });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تسجيل الخروج'
      });
      throw error;
    }
  },

  async loadUserProfile({ commit, state, dispatch }) {
    try {
      console.log('🔄 Loading user profile...');
      if (!state.user || !state.user.uid) {
        console.log('❌ No user found');
        return null;
      }

      // 🔹 Retry fetching user document up to 5 times with 500ms delay
      let userDoc = null;
      let attempts = 0;
      const maxAttempts = 5;
      const delay = 500;

      while (attempts < maxAttempts) {
        userDoc = await getDoc(doc(db, 'users', state.user.uid));
        if (userDoc.exists()) break;
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting for user profile (attempt ${attempts}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!userDoc || !userDoc.exists()) {
        console.error('⚠️ User document not found – logging out.');
        await dispatch('logout');
        return null;
      }

      const userData = userDoc.data();
      console.log('✅ User profile loaded:', userData);

      const userProfile = {
        id: state.user.uid,
        email: state.user.email,
        name: userData.name || state.user.displayName || state.user.email.split('@')[0],
        role: userData.role || 'viewer',
        permissions: userData.permissions || [],
        allowed_warehouses: userData.allowed_warehouses || [],
        is_active: userData.is_active !== false,
        profile_complete: userData.profile_complete || false,
        createdAt: userData.createdAt || new Date(),
        lastLogin: new Date(),
        companyId: userData.companyId
      };

      commit('SET_USER_PROFILE', userProfile);
      return userProfile;
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      return null;
    }
  },

  async testFirebaseConnection({ state }) {
    try {
      console.log('🔧 Testing Firebase connection...');
      if (!db) {
        console.error('❌ db is undefined');
        return false;
      }
      const firebaseFirestore = await import('firebase/firestore');
      const { collection, query, limit, getDocs } = firebaseFirestore;
      const testRef = collection(db, 'items');
      const testQuery = query(testRef, limit(1));
      const snapshot = await getDocs(testQuery);
      console.log(`✅ Firebase test: ${snapshot.empty ? 'Connected (no items)' : 'Connected with items'}`);
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
      return false;
    }
  },

  async clearOperationError({ commit }) {
    commit('CLEAR_OPERATION_ERROR');
  },
};
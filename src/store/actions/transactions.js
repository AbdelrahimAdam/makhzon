import { db, auth } from '@/firebase/config';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ensureFirebaseReady } from '../utils/firebase-utils';
import { PERFORMANCE_CONFIG, TRANSACTION_TYPES } from '../utils/constants';

export default {
  async fetchTransactions({ commit, dispatch }) {
    commit('SET_TRANSACTIONS_LOADING', true);

    try {
      // Ensure Firebase is ready (optional but good practice)
      await ensureFirebaseReady();

      if (!auth.currentUser) {
        console.log('No authenticated user, returning empty transactions');
        return [];
      }

      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      commit('SET_TRANSACTIONS', transactions);
      return transactions;

    } catch (error) {
      console.error('Error loading transactions:', error);
      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل الحركات'
      });
      return [];
    } finally {
      commit('SET_TRANSACTIONS_LOADING', false);
    }
  },

  async getRecentTransactions({ commit, dispatch }) {
    try {
      await ensureFirebaseReady();

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('timestamp', '>=', oneDayAgo),
        orderBy('timestamp', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      commit('SET_RECENT_TRANSACTIONS', transactions);
      return transactions;

    } catch (error) {
      console.error('Error loading recent transactions:', error);
      return [];
    }
  },

  async loadMoreTransactions({ commit, state, dispatch }) {
    if (state.pagination.isFetching) {
      return [];
    }

    commit('SET_PAGINATION', { isFetching: true });

    try {
      console.log('📥 Loading more transactions (simple method)...');
      await ensureFirebaseReady();

      const transactionsRef = collection(db, 'transactions');
      const allDocs = await getDocs(transactionsRef);
      
      const allTransactions = allDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
      });

      const currentCount = state.transactions.length;
      const newTransactions = allTransactions.slice(currentCount, currentCount + PERFORMANCE_CONFIG.SCROLL_LOAD);

      if (newTransactions.length === 0) {
        console.log('📭 No more transactions to load');
        commit('SET_PAGINATION', { 
          hasMore: false, 
          isFetching: false 
        });
        return [];
      }

      const updatedTransactions = [...state.transactions, ...newTransactions];
      commit('SET_TRANSACTIONS', updatedTransactions);
      
      const hasMore = currentCount + newTransactions.length < allTransactions.length;
      commit('SET_PAGINATION', {
        hasMore: hasMore,
        isFetching: false,
        totalLoaded: updatedTransactions.length
      });

      console.log(`✅ Loaded ${newTransactions.length} more transactions (total: ${updatedTransactions.length}, hasMore: ${hasMore})`);

      return newTransactions;

    } catch (error) {
      console.error('❌ Error loading more transactions:', error);
      
      commit('SET_PAGINATION', { 
        isFetching: false 
      });
      
      dispatch('showNotification', {
        type: 'error',
        message: 'خطأ في تحميل المزيد من الحركات'
      });

      return [];
    }
  },

  async setupRealtimeTransactions({ commit, state }) {
    if (state.realtimeListeners.length > 0) {
      console.log('⚠️ Real-time transactions already set up');
      return;
    }

    try {
      console.log('🔴 Setting up real-time transactions...');
      await ensureFirebaseReady();

      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        commit('SET_TRANSACTIONS', transactions);
        
        const recentTransactions = transactions.slice(0, 30);
        commit('SET_RECENT_TRANSACTIONS', recentTransactions);
      });

      commit('ADD_REALTIME_LISTENER', unsubscribe);
      console.log('✅ Real-time transactions set up successfully');

    } catch (error) {
      console.error('❌ Error setting up real-time transactions:', error);
    }
  },
};
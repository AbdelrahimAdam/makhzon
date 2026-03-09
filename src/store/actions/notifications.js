import { NOTIFICATION_CONFIG } from '../utils/constants';

export default {
  showNotification({ commit }, notification) {
    if (!notification?.message) return;

    let duration = NOTIFICATION_CONFIG.DEFAULT_DURATION;
    if (notification.type === 'error') {
      duration = NOTIFICATION_CONFIG.ERROR_DURATION;
    } else if (notification.type === 'success') {
      duration = NOTIFICATION_CONFIG.SUCCESS_DURATION;
    }

    const finalNotification = {
      id: Date.now().toString(),
      type: 'info',
      duration,
      ...notification,
      timestamp: new Date()
    };

    const timeoutId = setTimeout(() => {
      commit('REMOVE_NOTIFICATION', finalNotification.id);
    }, duration);

    commit('ADD_NOTIFICATION', { 
      notification: finalNotification, 
      timeoutId 
    });
  },

  async logError({ }, errorData) {
    try {
      await addDoc(collection(db, 'error_logs'), {
        ...errorData,
        timestamp: serverTimestamp(),
        user_agent: navigator.userAgent,
        url: window.location.href
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  },
};
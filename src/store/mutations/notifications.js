import { NOTIFICATION_CONFIG } from '../utils/constants';

export default {
  ADD_NOTIFICATION(state, { notification, timeoutId }) {
    notification.id = Date.now().toString();
    notification.timestamp = new Date();
    notification.timeoutId = timeoutId;
    state.notifications.unshift(notification);

    if (timeoutId) {
      state.notificationTimeouts[notification.id] = timeoutId;
    }

    if (state.notifications.length > NOTIFICATION_CONFIG.MAX_NOTIFICATIONS) {
      const removed = state.notifications.pop();
      if (removed.timeoutId) {
        clearTimeout(removed.timeoutId);
        delete state.notificationTimeouts[removed.id];
      }
    }
  },
  REMOVE_NOTIFICATION(state, notificationId) {
    if (state.notificationTimeouts[notificationId]) {
      clearTimeout(state.notificationTimeouts[notificationId]);
      delete state.notificationTimeouts[notificationId];
    }
    state.notifications = state.notifications.filter(n => n.id !== notificationId);
  },
  CLEAR_NOTIFICATIONS(state) {
    Object.values(state.notificationTimeouts).forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    state.notificationTimeouts = {};
    state.notifications = [];
  },
};
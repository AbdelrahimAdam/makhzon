export default {
  allUsers: state => state.allUsers,
  usersLoading: state => state.usersLoading,
  getUserNameById: (state) => (userId) => {
    const allUsers = Array.isArray(state.allUsers) ? state.allUsers : [];
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : userId;
  },
  getUserDisplayName: (state, getters) => (userId) => {
    if (!userId) return 'نظام';
    if (userId === state.user?.uid) {
      return state.userProfile?.name || state.user?.email || 'نظام';
    }
    return getters.getUserNameById(userId) || userId;
  },
  getUserRoleLabel: () => (role) => {
    const labels = {
      'superadmin': 'مدير عام',
      'company_manager': 'مدير شركة',
      'warehouse_manager': 'مدير مستودع',
      'staff': 'موظف'
    };
    return labels[role] || role || 'غير معروف';
  },
};
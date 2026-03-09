export default {
  canEdit: (state, getters) => {
    return ['superadmin', 'warehouse_manager'].includes(getters.userRole);
  },
  canDelete: (state, getters) => {
    if (getters.userRole === 'superadmin') return true;
    if (getters.userRole === 'warehouse_manager') {
      const permissions = getters.userPermissions;
      return permissions.includes('full_access') || permissions.includes('delete_items');
    }
    return false;
  },
  canManageUsers: state => state.userProfile?.role === 'superadmin',
  canManageWarehouses: state => state.userProfile?.role === 'superadmin',
  canDispatch: (state, getters) => {
    if (getters.userRole === 'superadmin') return true;
    if (getters.userRole === 'warehouse_manager') {
      const permissions = getters.userPermissions;
      return permissions.includes('full_access') || permissions.includes('dispatch_items');
    }
    return false;
  },
  canTransfer: (state, getters) => {
    if (!state.user) return false;
    const role = getters.userRole;
    if (role === 'superadmin') return true;
    if (role === 'warehouse_manager') {
      const permissions = getters.userPermissions;
      return permissions.includes('full_access') || permissions.includes('transfer_items');
    }
    return false;
  },
  canViewTransfers: () => true,
  canViewDispatch: () => true,
  canViewItems: () => true,
  canViewTransactions: () => true,
  canViewReports: (state, getters) => {
    if (!state.user) return false;
    const role = getters.userRole;
    return ['superadmin', 'company_manager'].includes(role);
  },
};
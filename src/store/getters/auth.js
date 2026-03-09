export default {
  isAuthenticated: state => !!state.user,
  userRole: state => state.userProfile?.role || '',
  userName: state => state.userProfile?.name || '',
  userProfile: state => state.userProfile,
  allowedWarehouses: state => Array.isArray(state.userProfile?.allowed_warehouses) ? 
    state.userProfile.allowed_warehouses : [],
  userPermissions: state => Array.isArray(state.userProfile?.permissions) ? 
    state.userProfile.permissions : [],
  authError: state => state.authError,
  operationError: state => state.operationError,
  operationLoading: state => state.operationLoading,
};
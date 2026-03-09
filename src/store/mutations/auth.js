export default {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_USER_PROFILE(state, profile) {
    state.userProfile = profile;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_AUTH_ERROR(state, error) {
    state.authError = error;
  },
  SET_OPERATION_LOADING(state, loading) {
    state.operationLoading = loading;
  },
  SET_OPERATION_ERROR(state, error) {
    state.operationError = error;
  },
  CLEAR_OPERATION_ERROR(state) {
    state.operationError = null;
  },
  SET_REQUIRES_COMPOSITE_INDEX(state, value) {
    state.requiresCompositeIndex = value;
  },
};
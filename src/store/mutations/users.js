export default {
  SET_ALL_USERS(state, users) {
    state.allUsers = users;
  },
  SET_USERS_LOADING(state, loading) {
    state.usersLoading = loading;
  },
};
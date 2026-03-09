export default {
  SET_WAREHOUSES(state, warehouses) {
    state.warehouses = warehouses;
    state.warehousesLoaded = true;
  },
};
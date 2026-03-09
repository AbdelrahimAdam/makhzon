export default {
  warehouses: state => state.warehouses,
  warehousesLoaded: state => state.warehousesLoaded,
  primaryWarehouses: state => state.warehouses.filter(w => w.type === 'primary' || !w.type),
  dispatchWarehouses: state => state.warehouses.filter(w => w.type === 'dispatch'),
  mainWarehouse: state => state.warehouses.find(w => w.is_main) || null,
  getAllWarehouses: (state) => {
    return state.warehouses.map(w => ({
      id: w.id,
      name: w.name_ar || w.name,
      location: w.location || '',
      code: w.code || '',
      type: w.type || 'primary'
    }));
  },
  accessibleWarehouses: (state, getters) => {
    if (!state.warehousesLoaded) return [];

    const role = getters.userRole;
    if (role === 'superadmin' || role === 'company_manager') {
      return state.warehouses;
    }

    if (role === 'warehouse_manager') {
      const allowedWarehouses = getters.allowedWarehouses;
      if (allowedWarehouses.length === 0) return [];

      if (allowedWarehouses.includes('all')) {
        return state.warehouses;
      }

      return state.warehouses.filter(w => allowedWarehouses.includes(w.id));
    }

    return [];
  },
  accessiblePrimaryWarehouses: (state, getters) => {
    const accessible = getters.accessibleWarehouses;
    return accessible.filter(w => w.type === 'primary' || !w.type);
  },
  accessibleDispatchWarehouses: (state, getters) => {
    const accessible = getters.accessibleWarehouses;
    return accessible.filter(w => w.type === 'dispatch');
  },
  dispatchFromWarehouses: (state, getters) => {
    const warehouses = Array.isArray(state.warehouses) ? state.warehouses : [];
    if (!warehouses.length || !state.warehousesLoaded) return [];

    const primaryWarehouses = warehouses.filter(w => w.type === 'primary' || !w.type);

    if (!state.user) {
      return primaryWarehouses;
    }

    const role = getters.userRole;
    if (role === 'superadmin') {
      return primaryWarehouses;
    }

    if (role === 'warehouse_manager') {
      const allowedWarehouses = getters.allowedWarehouses;
      if (allowedWarehouses.length > 0) {
        if (allowedWarehouses.includes('all')) {
          return primaryWarehouses;
        }
        return primaryWarehouses.filter(w =>
          allowedWarehouses.includes(w.id)
        );
      }
    }

    return [];
  },
  getWarehouseById: (state) => (warehouseId) => {
    const warehouses = Array.isArray(state.warehouses) ? state.warehouses : [];
    return warehouses.find(w => w.id === warehouseId) || null;
  },
  getWarehouseLabel: (state) => (warehouseId) => {
    if (!warehouseId) return '';

    const warehouse = state.warehouses.find(w => w.id === warehouseId);
    return warehouse?.name_ar || warehouse?.name || warehouseId;
  },
};
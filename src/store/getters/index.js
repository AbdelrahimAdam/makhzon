import authGetters from './auth';
import inventoryGetters from './inventory';
import searchGetters from './search';
import transactionsGetters from './transactions';
import usersGetters from './users';
import invoicesGetters from './invoices';
import warehousesGetters from './warehouses';
import notificationsGetters from './notifications';
import dashboardGetters from './dashboard';
import permissionsGetters from './permissions';

export default {
  ...authGetters,
  ...inventoryGetters,
  ...searchGetters,
  ...transactionsGetters,
  ...usersGetters,
  ...invoicesGetters,
  ...warehousesGetters,
  ...notificationsGetters,
  ...dashboardGetters,
  ...permissionsGetters,
};
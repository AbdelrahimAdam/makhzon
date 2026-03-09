import authActions from './auth';
import usersActions from './users';
import inventoryActions from './inventory';
import searchActions from './search';
import transactionsActions from './transactions';
import warehousesActions from './warehouses';
import invoicesActions from './invoices';
import notificationsActions from './notifications';

export default {
  ...authActions,
  ...usersActions,
  ...inventoryActions,
  ...searchActions,
  ...transactionsActions,
  ...warehousesActions,
  ...invoicesActions,
  ...notificationsActions,
};
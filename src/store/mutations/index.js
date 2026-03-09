import authMutations from './auth';
import inventoryMutations from './inventory';
import searchMutations from './search';
import transactionsMutations from './transactions';
import usersMutations from './users';
import invoicesMutations from './invoices';
import warehousesMutations from './warehouses';
import notificationsMutations from './notifications';
import realtimeMutations from './realtime';
import rootMutations from './root';

export default {
  ...authMutations,
  ...inventoryMutations,
  ...searchMutations,
  ...transactionsMutations,
  ...usersMutations,
  ...invoicesMutations,
  ...warehousesMutations,
  ...notificationsMutations,
  ...realtimeMutations,
  ...rootMutations,
};
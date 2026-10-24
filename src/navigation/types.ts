import type { DirectoryCustomer } from '../types/customer';
import type { TransactionType } from '../types/repair';

export type RootStackParamList = {
  Home: undefined;
  Khata: undefined;
  AddRepair:
    | { repairId?: number; scannedImei?: string; prefillCustomer?: DirectoryCustomer; transactionType?: TransactionType }
    | undefined;
  RepairDetail: { repairId: number };
  Search: undefined;
  CustomerDirectory: undefined;
  ScanImei: { repairId?: number } | undefined;
  ScanQr: undefined;
  Settings: undefined;
  ManageLabour: undefined;
  Finance: undefined;
  AdminDashboard: undefined;
  CustomerHistory: { customer: { customerName: string; phone: string; email?: string } };
  BuySell: undefined;
};

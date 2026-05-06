import type { DirectoryCustomer } from '../types/customer';

export type RootStackParamList = {
  Home: undefined;
  AddRepair:
    | { repairId?: number; scannedImei?: string; prefillCustomer?: DirectoryCustomer }
    | undefined;
  RepairDetail: { repairId: number };
  Search: undefined;
  CustomerDirectory: undefined;
  ScanImei: { repairId?: number } | undefined;
  Settings: undefined;
};

import type { LockType, Repair, RepairImageSlot, RepairStatus } from '../../types/repair';

export type WarrantyType = 'none' | '30' | '90' | '180';
export type PaymentStep = 'paid_status' | 'payment_method';

export interface RepairFormState {
  customerName: string;
  phone: string;
  deviceModel: string;
  imei: string;
  lockType: LockType;
  lockValue: string;
  problem: string;
  warranty: string;
  customWarranty: string;
  warrantyType: WarrantyType;
  dateReceived: string;
  status: RepairStatus;
  repairCost: string;
  expense: string;
  advanceAmount: string;
  isPaid: boolean;
  paymentType: 'cash' | 'online';
  images: Record<RepairImageSlot, string>;
  accessories: Pick<Repair, 'accSimTray' | 'accBackCover'>;
  orderCode: string;
  sendWhatsAppInvoice: boolean;
}

export type RepairFormAction =
  | { type: 'SET_FIELD'; field: keyof RepairFormState; value: RepairFormState[keyof RepairFormState] }
  | { type: 'SET_ACCESSORY'; key: 'accSimTray' | 'accBackCover'; value: boolean }
  | { type: 'SET_IMAGE'; slot: RepairImageSlot; uri: string }
  | { type: 'SET_FORM_DATA'; payload: Partial<RepairFormState> }
  | { type: 'RESET' };

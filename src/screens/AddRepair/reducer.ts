import { todayISODate } from '../../utils/format';
import { emptyImageState } from '../../utils/repairImages';
import type { RepairFormAction, RepairFormState } from './types';

export const initialRepairFormState: RepairFormState = {
  customerName: '',
  phone: '',
  deviceModel: '',
  imei: '',
  lockType: '',
  lockValue: '',
  problem: '',
  warranty: 'No Warranty',
  customWarranty: '',
  warrantyType: 'none',
  dateReceived: todayISODate(),
  status: 'pending',
  repairCost: '',
  expense: '',
  advanceAmount: '',
  isPaid: false,
  paymentType: 'cash',
  images: emptyImageState(),
  accessories: {
    accSimTray: false,
    accBackCover: false,
  },
  orderCode: '',
  sendWhatsAppInvoice: false,
  selectedInventoryItemIds: [],
};

export function repairFormReducer(
  state: RepairFormState,
  action: RepairFormAction
): RepairFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_ACCESSORY':
      return {
        ...state,
        accessories: {
          ...state.accessories,
          [action.key]: action.value,
        },
      };

    case 'SET_IMAGE':
      return {
        ...state,
        images: {
          ...state.images,
          [action.slot]: action.uri,
        },
      };

    case 'SET_FORM_DATA':
      return { ...state, ...action.payload };

    case 'RESET':
      return initialRepairFormState;

    default:
      return state;
  }
}

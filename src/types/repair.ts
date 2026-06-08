export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export const REPAIR_STATUSES: { value: RepairStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Photo URLs: `https://…` from cloud storage, or local `file://` while picking before upload. */
export interface Repair {
  id: number;
  /** Unique display id from record id (e.g. ord00123 — `ord` + up to 5-digit number). */
  orderCode: string;
  customerName: string;
  phone: string;
  deviceModel: string;
  imei: string;
  problem: string;
  dateReceived: string;
  status: RepairStatus;
  repairCost: number;
  advanceAmount: number;
  isPaid: boolean;
  imagePhoneFront: string;
  imagePhoneBack: string;
  imageThumbnail: string;
  imageId1: string;
  imageId2: string;
  /** Customer handed in with device (accessories checklist). */
  accSimTray: boolean;
  accBackCover: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fixed list for Yes/No “received with device” accessories. */
export const ACCESSORY_ITEMS: {
  key: keyof Pick<Repair, 'accSimTray' | 'accBackCover'>;
  label: string;
}[] = [
  { key: 'accSimTray', label: 'SIM tray' },
  { key: 'accBackCover', label: 'Back cover' },
];

export type RepairImageSlot = 'front' | 'back' | 'thumb' | 'id1' | 'id2';

export function countRepairImages(r: Repair): number {
  return [
    r.imagePhoneFront,
    r.imagePhoneBack,
    r.imageThumbnail,
    r.imageId1,
    r.imageId2,
  ].filter((u) => u && u.length > 0).length;
}

export function formatAccessoriesSummary(r: Repair): string {
  return ACCESSORY_ITEMS.map(({ key, label }) => `${label}: ${r[key] ? 'Yes' : 'No'}`).join(' · ');
}

export type RepairInput = Omit<Repair, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: number;
};

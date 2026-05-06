import type { RepairImageSlot } from '../types/repair';

const REQUIRED_IMAGE_SLOTS: RepairImageSlot[] = ['front', 'back', 'thumb'];

function digitsOnlyPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Phone input: digits only, max 10 (typical local mobile). */
export function normalizePhoneInput(raw: string): string {
  return digitsOnlyPhone(raw).slice(0, 10);
}

/** When loading saved data, keep up to 10 digits (use last 10 if longer, e.g. country prefix). */
export function normalizeStoredPhoneForDisplay(raw: string): string {
  const d = digitsOnlyPhone(raw);
  if (d.length >= 10) return d.slice(-10);
  return d;
}

/** IMEI (GSMA): digits only, max 15. */
export function normalizeImeiInput(raw: string): string {
  return digitsOnlyPhone(raw).slice(0, 15);
}

/** When loading a repair, cap stored IMEI to 15 digits. */
export function normalizeStoredImeiForDisplay(raw: string): string {
  return digitsOnlyPhone(raw).slice(0, 15);
}

/** Strip invalid characters while typing — letters (Unicode), spaces, . ' - */
export function sanitizeCustomerNameInput(input: string): string {
  return input.replace(/[^\p{L}\s'.-]/gu, '');
}

function validateCustomerName(name: string): string | null {
  const t = name.trim();
  if (!t) return 'Customer name is required.';
  if (!/^[\p{L}\s'.-]+$/u.test(t)) {
    return 'Name should use only letters and spaces (and . \' -).';
  }
  if (!/\p{L}/u.test(t)) return 'Name must include at least one letter.';
  return null;
}

function validatePhone10(phone: string): string | null {
  const d = digitsOnlyPhone(phone);
  if (d.length !== 10) return 'Phone must be exactly 10 digits.';
  return null;
}

export function validateRepairFormFields(params: {
  customerName: string;
  phone: string;
  deviceModel: string;
  problem: string;
  images: Record<RepairImageSlot, string>;
}): string | null {
  const nameErr = validateCustomerName(params.customerName);
  if (nameErr) return nameErr;
  const phoneErr = validatePhone10(params.phone);
  if (phoneErr) return phoneErr;
  if (!params.deviceModel.trim()) return 'Device model is required.';
  if (!params.problem.trim()) return 'Problem / notes is required.';
  for (const slot of REQUIRED_IMAGE_SLOTS) {
    if (!params.images[slot]?.trim()) {
      return 'Add photos: phone front, phone back, and thumbnail.';
    }
  }
  return null;
}

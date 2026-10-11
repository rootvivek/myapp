import type { Repair, RepairStatus } from '../types/repair';

/** Normalize a 10-digit Indian mobile number for WhatsApp's international format. */
export function getWhatsAppPhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  const digits = rawPhone.trim().replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return null;
}

/** Build the WhatsApp draft for a repair status change. */
export function buildRepairStatusMessage(
  repair: Pick<Repair, 'customerName' | 'deviceModel' | 'orderCode'>,
  status: RepairStatus,
): string {
  const statusText: Record<RepairStatus, string> = {
    pending: 'pending',
    in_progress: 'in progress',
    completed: 'ready for pickup',
    delivered: 'delivered',
  };

  return `Hello ${repair.customerName}, your repair order${repair.orderCode ? ` (${repair.orderCode})` : ''} for ${repair.deviceModel} is now ${statusText[status]}. Thank you!\nMCA Phone Wala`;
}
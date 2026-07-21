import { Alert } from 'react-native';

import type { AppColors } from '../../theme';
import type { Repair, RepairStatus } from '../../types/repair';

// ------------------------------------------------------------------
// UI Labels
// ------------------------------------------------------------------

export const LABELS = {
  CUSTOMER: 'Customer',
  DEVICE: 'Device',
  PROBLEM: 'Problem',
  DATE: 'Date',
  CALL: 'Call',
  WHATSAPP: 'WhatsApp',
  INVOICE: 'Invoice',
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  CASH: 'Cash',
  ONLINE: 'Online',
  CANCEL: 'Cancel',
  SET_STATUS: 'Set status',
  IS_PAID_QUESTION: 'Is this repair paid?',
  SELECT_PAYMENT: 'Select payment method',
  CLOSE: 'Close',
  ADDED_BY: 'Added by',
} as const;

// ------------------------------------------------------------------
// Status Configuration (replaces switch/case)
// ------------------------------------------------------------------

type StringColorKey = {
  [K in keyof AppColors]: AppColors[K] extends string ? K : never;
}[keyof AppColors];

type StatusColorKeys = {
  bg: StringColorKey;
  text: StringColorKey;
  border: StringColorKey;
};

const STATUS_COLOR_KEYS: Record<RepairStatus, StatusColorKeys> = {
  pending: { bg: 'statusPendingBg', text: 'statusPendingText', border: 'statusPendingBorder' },
  in_progress: { bg: 'statusInProgressBg', text: 'statusInProgressText', border: 'statusInProgressBorder' },
  completed: { bg: 'statusCompletedBg', text: 'statusCompletedText', border: 'statusCompletedBorder' },
  delivered: { bg: 'statusDeliveredBg', text: 'statusDeliveredText', border: 'statusDeliveredBorder' },
  cancelled: { bg: 'statusCancelledBg', text: 'statusCancelledText', border: 'statusCancelledBorder' },
};

export const STATUS_ICONS: Record<RepairStatus, string> = {
  pending: '⏳',
  in_progress: '🔄',
  completed: '✅',
  delivered: '📦',
  cancelled: '❌',
};

export type PillConfig = {
  bg: string;
  text: string;
  border: string;
  icon: string;
};

export function getStatusPill(status: RepairStatus, colors: AppColors): PillConfig {
  const keys = STATUS_COLOR_KEYS[status] ?? STATUS_COLOR_KEYS.pending;
  return {
    bg: colors[keys.bg],
    text: colors[keys.text],
    border: colors[keys.border],
    icon: STATUS_ICONS[status] ?? '⏳',
  };
}

// ------------------------------------------------------------------
// Phone Helpers
// ------------------------------------------------------------------

/**
 * Normalize a phone string to a 10-digit Indian mobile number.
 * Handles: `9876543210`, `+919876543210`, `919876543210`.
 * Returns the 10-digit string, or `null` if invalid.
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.trim().replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
}

/**
 * Returns a dialable phone string (`tel:` safe), or `null` if blank/invalid.
 */
export function getDialString(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[^\d+]/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

// ------------------------------------------------------------------
// Image Helpers
// ------------------------------------------------------------------

const APP_LOGO = require('../../../assets/app-logo.jpg');

export function getImageSource(repair: Repair) {
  const front = repair.imagePhoneFront?.trim();
  const thumb = repair.imageThumbnail?.trim();
  const uri = front || thumb;
  if (uri && uri.length > 0) {
    return { uri };
  }
  return APP_LOGO;
}

// ------------------------------------------------------------------
// Error Helper
// ------------------------------------------------------------------

export function showError(title: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  Alert.alert(title, message);
}

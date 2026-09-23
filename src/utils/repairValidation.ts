import type { RepairImageSlot } from '../types/repair';

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
  return input.replace(/[^\p{L}\d\s'.-]/gu, '');
}

function validateCustomerName(name: string): string | null {
  const t = name.trim();
  if (!t) return 'Customer name is required.';
  if (!/^[\p{L}\d\s'.-]+$/u.test(t)) {
    return 'Name should use only letters, numbers and spaces (and . \' -).';
  }
  if (!/[\p{L}\d]/u.test(t)) return 'Name must include at least one letter or number.';
  return null;
}

function validatePhone10(phone: string): string | null {
  const d = digitsOnlyPhone(phone);
  if (d.length !== 10) return 'Phone must be exactly 10 digits.';
  return null;
}

/**
 * Every required field of the repair form, keyed exactly like the form state
 * (`customerName`, `phone`, `deviceModel`, `problem`) plus the two required
 * photo slots. Used to attach an inline error under the matching input.
 */
export type RepairFormField =
  | 'customerName'
  | 'phone'
  | 'deviceModel'
  | 'problem'
  | 'imageFront'
  | 'imageBack';

export type RepairFormErrors = Partial<Record<RepairFormField, string>>;

/** Visual order of the fields — the first entry is the top-most input. */
export const REPAIR_FORM_FIELD_ORDER: readonly RepairFormField[] = [
  'customerName',
  'phone',
  'deviceModel',
  'problem',
  'imageFront',
  'imageBack',
];

const REPAIR_FORM_FIELDS: readonly string[] = REPAIR_FORM_FIELD_ORDER;

/** Type guard: does this form-state key also carry a validation message? */
export function isRepairFormField(key: string): key is RepairFormField {
  return REPAIR_FORM_FIELDS.includes(key);
}

export type RepairFormFieldValues = {
  customerName: string;
  phone: string;
  deviceModel: string;
  problem: string;
  images: Record<RepairImageSlot, string>;
};

/**
 * Message for one field, or `null` when that field is valid. Used both for the
 * whole-form check and to re-validate a single input while the user types (so
 * the red state only goes away once the value is actually valid).
 */
export function validateRepairFormField(
  field: RepairFormField,
  params: RepairFormFieldValues
): string | null {
  switch (field) {
    case 'customerName':
      return validateCustomerName(params.customerName);
    case 'phone':
      return validatePhone10(params.phone);
    case 'deviceModel':
      return params.deviceModel.trim() ? null : 'Device model is required.';
    case 'problem':
      return params.problem.trim() ? null : 'Problem / notes is required.';
    case 'imageFront':
      return params.images.front?.trim() ? null : 'Front device photo is required.';
    case 'imageBack':
      return params.images.back?.trim() ? null : 'Back device photo is required.';
    default:
      return null;
  }
}

/**
 * Validates the whole repair form and returns one message per invalid field.
 * An empty object means the form is valid. Nothing is thrown/shown here so
 * callers can render the messages inline instead of in a popup.
 */
export function validateRepairFormErrors(params: RepairFormFieldValues): RepairFormErrors {
  const errors: RepairFormErrors = {};

  for (const field of REPAIR_FORM_FIELD_ORDER) {
    const message = validateRepairFormField(field, params);
    if (message) errors[field] = message;
  }

  return errors;
}

/** First invalid field in visual order, or `null` when there is none. */
export function firstInvalidRepairField(errors: RepairFormErrors): RepairFormField | null {
  for (const field of REPAIR_FORM_FIELD_ORDER) {
    if (errors[field]) return field;
  }
  return null;
}

/**
 * Message of the first invalid field, or `null` when the form is valid.
 * Kept for callers that only need a single message.
 */
export function validateRepairFormFields(params: RepairFormFieldValues): string | null {
  const errors = validateRepairFormErrors(params);
  const field = firstInvalidRepairField(errors);
  return field ? errors[field] ?? null : null;
}

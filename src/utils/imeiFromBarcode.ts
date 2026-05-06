/** Normalize barcode text to an IMEI-like digit string (max 15 digits). */
export function imeiDigitsFromBarcodeData(data: string): string | null {
  const digits = data.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits.length > 15 ? digits.slice(0, 15) : digits;
}

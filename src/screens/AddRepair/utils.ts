import { Alert } from 'react-native';

export function parseMoney(s: string): number {
  if (!s || typeof s !== 'string') return 0;
  const trimmed = s.trim();
  if (!trimmed) return 0;
  // Strict regex check for numeric format (e.g. 100, 100.50)
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    const cleaned = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
    return Number.isFinite(cleaned) ? cleaned : 0;
  }
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : 0;
}

export function showError(title: string, message: string): void {
  Alert.alert(title, message);
}

export function showValidationError(message: string): void {
  Alert.alert('Cannot save', message);
}

export function showDatabaseError(error: unknown): void {
  const msg = error instanceof Error ? error.message : 'Something went wrong';
  Alert.alert('Error saving', msg);
}

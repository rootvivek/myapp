import { formatCurrency, formatDateDisplay, parseMoney } from '../utils/format';

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as INR', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(1234.56)).toBe('₹1,235');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-500)).toBe('-₹500');
    });
  });

  describe('formatDateDisplay', () => {
    it('formats ISO date strings', () => {
      expect(formatDateDisplay('2026-01-15')).toContain('15');
      expect(formatDateDisplay('2026-01-15')).toContain('Jan');
      expect(formatDateDisplay('2026-01-15')).toContain('2026');
    });

    it('returns empty string for invalid input', () => {
      expect(formatDateDisplay('')).toBe('');
      expect(formatDateDisplay('invalid')).toBe('invalid');
    });
  });

  describe('parseMoney', () => {
    it('parses valid currency strings', () => {
      expect(parseMoney('₹1,000')).toBe(1000);
      expect(parseMoney('₹1,234.56')).toBe(1234.56);
      expect(parseMoney('1000')).toBe(1000);
    });

    it('returns 0 for invalid input', () => {
      expect(parseMoney('')).toBe(0);
      expect(parseMoney('abc')).toBe(0);
      expect(parseMoney(null as any)).toBe(0);
      expect(parseMoney(undefined as any)).toBe(0);
    });
  });
});
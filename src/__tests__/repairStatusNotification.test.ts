import { buildRepairStatusMessage, getWhatsAppPhone } from '../utils/repairStatusNotification';

describe('repair status WhatsApp notifications', () => {
  describe('getWhatsAppPhone', () => {
    it('adds the India country code to a 10-digit number', () => {
      expect(getWhatsAppPhone('9876543210')).toBe('919876543210');
    });

    it('preserves an India country code and strips formatting', () => {
      expect(getWhatsAppPhone('+91 98765-43210')).toBe('919876543210');
    });

    it('returns null for missing or unsupported phone numbers', () => {
      expect(getWhatsAppPhone('')).toBeNull();
      expect(getWhatsAppPhone('12345')).toBeNull();
      expect(getWhatsAppPhone('+1 415 555 2671')).toBeNull();
    });
  });

  describe('buildRepairStatusMessage', () => {
    const repair = {
      customerName: 'Asha',
      deviceModel: 'Pixel 8',
      orderCode: 'ord00123',
    };

    it.each([
      ['pending', 'pending'],
      ['in_progress', 'in progress'],
      ['completed', 'ready for pickup'],
      ['delivered', 'delivered'],
    ] as const)('describes %s as %s', (status, statusText) => {
      expect(buildRepairStatusMessage(repair, status)).toBe(
        `Hello Asha, your repair order (ord00123) for Pixel 8 is now ${statusText}. Thank you!\nMCA Phone Wala`,
      );
    });
  });
});
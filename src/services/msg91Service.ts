import { OTPWidget } from '@msg91comm/sendotp-react-native';

// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import { EXPO_PUBLIC_MSG91_TOKEN_AUTH, EXPO_PUBLIC_MSG91_WIDGET_ID } from '@env';

let initialized = false;
let requestId = '';

async function ensureWidgetInitialized(): Promise<{ ok: boolean; message: string }> {
  const widgetId = String(EXPO_PUBLIC_MSG91_WIDGET_ID ?? '').trim();
  const tokenAuth = String(EXPO_PUBLIC_MSG91_TOKEN_AUTH ?? '').trim();

  if (!widgetId || !tokenAuth) {
    return {
      ok: false,
      message: 'MSG91 is not configured. Add EXPO_PUBLIC_MSG91_WIDGET_ID and EXPO_PUBLIC_MSG91_TOKEN_AUTH to .env.',
    };
  }

  if (!initialized) {
    await OTPWidget.initializeWidget(widgetId, tokenAuth);
    initialized = true;
  }

  return { ok: true, message: '' };
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

export async function sendOtp(phone: string): Promise<{ ok: boolean; message: string; verified?: boolean }> {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 10) {
    return { ok: false, message: 'Enter a valid mobile number.' };
  }

  try {
    const setup = await ensureWidgetInitialized();
    if (!setup.ok) return setup;

    const result = await OTPWidget.sendOTP({
      identifier: normalized.replace(/^\+/, ''),
    });

    if (!result || result.type !== 'success') {
      return { ok: false, message: result?.message || 'Unable to send OTP.' };
    }

    requestId = result.message || '';
    return {
      ok: true,
      message: result.invisibleVerified
        ? 'Phone verified successfully.'
        : 'OTP sent successfully.',
      verified: Boolean(result.invisibleVerified),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to send OTP right now.',
    };
  }
}

export async function verifyOtp(otp: string): Promise<{ ok: boolean; message: string }> {
  try {
    const setup = await ensureWidgetInitialized();
    if (!setup.ok) return setup;
    if (!requestId) return { ok: false, message: 'Request an OTP first.' };

    const result = await OTPWidget.verifyOTP({ reqId: requestId, otp: otp.trim() });
    if (!result || result.type !== 'success') {
      return { ok: false, message: result?.message || 'OTP verification failed.' };
    }

    requestId = '';
    return { ok: true, message: 'OTP verified successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'OTP verification failed.',
    };
  }
}

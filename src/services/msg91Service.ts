// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import { UPDATE_API_URL } from '@env';

let pendingPhone = '';
let verifiedPhone = '';
let verificationTicket = '';

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
    const response = await fetch(`${String(UPDATE_API_URL ?? '').replace(/\/$/, '')}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized }),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) return { ok: false, message: result?.error || 'Unable to send OTP.' };
    pendingPhone = normalized;
    verifiedPhone = '';
    verificationTicket = '';
    return { ok: true, message: result.message || 'OTP sent successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to send OTP right now.',
    };
  }
}

export async function verifyOtp(otp: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!pendingPhone) return { ok: false, message: 'Request an OTP first.' };
    const response = await fetch(`${String(UPDATE_API_URL ?? '').replace(/\/$/, '')}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: pendingPhone, otp: otp.trim() }),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) return { ok: false, message: result?.error || 'OTP verification failed.' };
    verificationTicket = String(result.verificationTicket || '');
    verifiedPhone = pendingPhone;
    pendingPhone = '';
    return verificationTicket
      ? { ok: true, message: 'OTP verified successfully.' }
      : { ok: false, message: 'The server did not issue a verification ticket.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'OTP verification failed.',
    };
  }
}

export async function claimVerifiedPhone(accessToken: string, phone: string): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!verificationTicket || verifiedPhone !== normalized) {
    throw new Error('Verify this phone number before creating the account.');
  }
  const response = await fetch(`${String(UPDATE_API_URL ?? '').replace(/\/$/, '')}/api/claim-verified-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ phone: normalized, verificationTicket }),
  });
  const result = await response.json();
  if (!response.ok || !result?.ok) throw new Error(result?.error || 'Could not save verified phone identity.');
  verificationTicket = '';
  verifiedPhone = '';
}

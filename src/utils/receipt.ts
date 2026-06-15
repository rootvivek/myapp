import { generatePDF } from 'react-native-html-to-pdf';
import RNShare, { Social } from 'react-native-share';

import type { Repair } from '../types/repair';
import { REPAIR_STATUSES, formatAccessoriesSummary } from '../types/repair';
import type { ShopBranding } from './shopSettings';
import { getShopBranding } from './shopSettings';
import { formatCurrency, formatDateDisplay } from './format';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(status: Repair['status']): string {
  return REPAIR_STATUSES.find((x) => x.value === status)?.label ?? status;
}

function monogramLetter(shopName: string): string {
  const t = shopName.trim();
  const ch = t[0];
  if (ch) {
    try {
      if (/\p{L}/u.test(ch)) return escapeHtml(ch.toUpperCase());
    } catch {
      if (/[a-zA-Z]/.test(ch)) return escapeHtml(ch.toUpperCase());
    }
  }
  return '◆';
}

function buildReceiptHtml(
  repair: Repair,
  branding: ShopBranding,
  logoDataUrl: string | null
): string {
  const shopPhone = escapeHtml(branding.shopPhone);
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);
  const paidLine = repair.isPaid ? 'Paid in full' : `Balance due: ${formatCurrency(balance)}`;
  const shop = escapeHtml(branding.shopName);
  const logoBlock = logoDataUrl
    ? `<img class="logo-img" src="${logoDataUrl}" alt="" />`
    : `<div class="logo-fallback" aria-hidden="true">${monogramLetter(branding.shopName)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px 20px 36px; font-family: system-ui, sans-serif; color: #0f172a; background: #f1f5f9; }
    .sheet { max-width: 440px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .hero { background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 55%, #172554 100%); color: #f8fafc; padding: 22px; }
    .hero-top { display: flex; align-items: center; gap: 16px; }
    .logo-img { width: 72px; height: 72px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.12); flex-shrink: 0; }
    .logo-fallback { width: 72px; height: 72px; border-radius: 12px; background: linear-gradient(145deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; flex-shrink: 0; }
    .shop-name { font-size: 22px; font-weight: 800; margin: 0; }
    .invoice-tag { margin: 6px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; }
    .shop-phone { margin: 6px 0 0; font-size: 13px; color: #cbd5e1; }
    .order-strip { margin-top: 18px; padding: 12px 14px; background: rgba(255,255,255,0.08); border-radius: 10px; display: flex; justify-content: space-between; }
    .order-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
    .order-value { font-size: 18px; font-weight: 800; color: #fff; }
    .body { padding: 20px 22px 24px; }
    table.meta { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.meta tr { border-bottom: 1px solid #f1f5f9; }
    table.meta td { padding: 10px 0; vertical-align: top; }
    table.meta td.l { color: #64748b; font-weight: 600; width: 38%; }
    table.meta td.r { color: #0f172a; font-weight: 500; text-align: right; }
    .section-title { font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin: 18px 0 8px; }
    .amount-row { display: flex; justify-content: space-between; padding: 12px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 8px; }
    .amt-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .amt-value { font-size: 20px; font-weight: 800; color: #1e40af; }
    .terms-box { margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 14px; }
    .terms-title { font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin: 0 0 6px; }
    .terms-list { margin: 0; padding-left: 14px; font-size: 9px; color: #64748b; line-height: 1.45; }
    .terms-list li { margin-bottom: 4px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="hero">
      <div class="hero-top">
        ${logoBlock}
        <div>
          <p class="shop-name">${shop}</p>
          <p class="shop-phone">${shopPhone}</p>
          <p class="invoice-tag">Service invoice</p>
        </div>
      </div>
      <div class="order-strip">
        <span class="order-label">Order ID</span>
        <span class="order-value">${escapeHtml(repair.orderCode)}</span>
      </div>
    </header>
    <div class="body">
      <p class="section-title">Job details</p>
      <table class="meta" role="presentation">
        <tr><td class="l">Customer</td><td class="r">${escapeHtml(repair.customerName)}</td></tr>
        <tr><td class="l">Phone</td><td class="r">${escapeHtml(repair.phone)}</td></tr>
        <tr><td class="l">Device</td><td class="r">${escapeHtml(repair.deviceModel)}</td></tr>
        <tr><td class="l">IMEI</td><td class="r">${escapeHtml(repair.imei || '—')}</td></tr>
        ${repair.lockType ? `<tr><td class="l">Device lock</td><td class="r">${escapeHtml(
          repair.lockType === 'pattern'
            ? 'Set (Pattern)'
            : repair.lockType === 'pin'
            ? 'Set (PIN)'
            : 'Set (Password)'
        )}</td></tr>` : ''}
        <tr><td class="l">Received</td><td class="r">${escapeHtml(formatDateDisplay(repair.dateReceived))}</td></tr>
        <tr><td class="l">Issue</td><td class="r">${escapeHtml(repair.problem)}</td></tr>
        <tr><td class="l">Accessories</td><td class="r">${escapeHtml(formatAccessoriesSummary(repair))}</td></tr>
        <tr><td class="l">Status</td><td class="r">${escapeHtml(statusLabel(repair.status))}</td></tr>
        ${repair.warranty ? `<tr><td class="l">Warranty</td><td class="r">${escapeHtml(repair.warranty)}</td></tr>` : ''}
      </table>
      <p class="section-title">Payment</p>
      <table class="meta" role="presentation">
        <tr><td class="l">Repair cost</td><td class="r">${formatCurrency(repair.repairCost)}</td></tr>
        <tr><td class="l">Advance</td><td class="r">${formatCurrency(repair.advanceAmount)}</td></tr>
        <tr><td class="l">Payment</td><td class="r">${repair.isPaid ? 'Paid' : 'Unpaid'} — ${escapeHtml(paidLine)}</td></tr>
      </table>
      <div class="amount-row">
        <span class="amt-label">Total job</span>
        <span class="amt-value">${formatCurrency(repair.repairCost)}</span>
      </div>
      <div class="terms-box">
        <p class="terms-title">Terms & Conditions</p>
        <ul class="terms-list">
          <li>No warranty on physical, liquid, or accidental damage.</li>
          <li>All repaired devices must be claimed within 30 days of notification, otherwise they are subject to disposal.</li>
          <li>Please back up all device data. The service center is not responsible for any data loss.</li>
          <li>Estimated repair times and costs may vary depending on spare parts availability.</li>
        </ul>
      </div>
      <p class="footer">Thank you for your business.</p>
    </div>
  </div>
</body>
</html>`;
}

/** Shared helper: generate a PDF file from a repair and return its file path. */
async function generateInvoicePdf(repair: Repair): Promise<string> {
  const branding = await getShopBranding();
  const html = buildReceiptHtml(repair, branding, null);

  const file = await generatePDF({
    html,
    fileName: `Invoice_${repair.orderCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
    forceReset: true,
  });

  if (!file.filePath) {
    throw new Error('Failed to generate PDF file path.');
  }

  return file.filePath;
}

function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Generate a PDF invoice and open the system share sheet.
 *  Throws on failure so callers can surface the error to the user. */
export async function shareReceiptPdf(repair: Repair): Promise<void> {
  const filePath = await generateInvoicePdf(repair);
  await RNShare.open({
    title: `Invoice ${repair.orderCode}`,
    subject: `Invoice for repair ${repair.orderCode}`,
    message: 'Attached is the invoice for your repair.',
    url: `file://${filePath}`,
    type: 'application/pdf',
    failOnCancel: false,
  });
}

/** Generate a PDF invoice and share directly to a WhatsApp contact. */
export async function shareReceiptPdfToWhatsAppContact(repair: Repair, customerPhone: string): Promise<void> {
  try {
    const filePath = await generateInvoicePdf(repair);
    const phone = normalizeWhatsAppPhone(customerPhone);

    await RNShare.shareSingle({
      social: Social.Whatsapp,
      url: `file://${filePath}`,
      type: 'application/pdf',
      // @ts-ignore - whatsAppNumber is valid at runtime but missing from types
      whatsAppNumber: phone,
    });
  } catch (err) {
    console.warn('Direct WhatsApp share error, falling back to general share:', err);
    await shareReceiptPdf(repair);
  }
}

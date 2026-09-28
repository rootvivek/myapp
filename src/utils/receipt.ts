import { generatePDF } from 'react-native-html-to-pdf';
import RNShare, { Social } from 'react-native-share';
import RNFS from 'react-native-fs';

import type { Repair } from '../types/repair';
import { logger } from './logger';
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
    // Use simple ASCII check instead of Unicode regex for compatibility
    if (/[a-zA-Z]/.test(ch)) return escapeHtml(ch.toUpperCase());
  }
  return '◆';
}

/**
 * Convert a file URI (local or remote) to base64 data URL for embedding in PDF.
 * Handles: file://, content://, https:// (Supabase Storage), and other local URIs.
 */
async function readUriAsDataUrl(uri: string): Promise<string | null> {
  try {
    // Remote URL (Supabase Storage, etc.) - fetch and convert to base64
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      if (!response.ok) {
        logger.warn('Failed to fetch remote logo:', response.status);
        return null;
      }
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const mimeType = blob.type || 'image/png';
      return `data:${mimeType};base64,${base64}`;
    }

    // Local file URI - use react-native-fs
    let filePath = uri;
    if (uri.startsWith('file://')) {
      filePath = uri.replace('file://', '');
    } else if (uri.startsWith('content://')) {
      // Content URIs need to be copied to a local file first
      // For now, try to fetch via fetch() which works with content:// on Android
      try {
        const response = await fetch(uri);
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          const mimeType = blob.type || 'image/png';
          return `data:${mimeType};base64,${base64}`;
        }
      } catch (e) {
        logger.warn('Failed to fetch content:// URI:', e);
      }
    }

    // Check if file exists (for file:// paths)
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      logger.warn('Logo file does not exist:', filePath);
      return null;
    }

    // Read as base64
    const base64 = await RNFS.readFile(filePath, 'base64');

    // Detect MIME type from extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    logger.warn('Failed to read logo image as data URL:', err);
    return null;
  }
}

/** Convert Blob to base64 string (React Native compatible). */
async function blobToBase64(blob: Blob): Promise<string> {
  // In React Native, use arrayBuffer instead of FileReader
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildReceiptHtml(
  repair: Repair,
  branding: ShopBranding,
  logoDataUrl: string | null
): string {
  const shopPhone = branding.shopPhone.trim();
  // Omit the line entirely rather than printing a blank/placeholder number.
  const phoneLine = shopPhone ? `<p class="shop-phone">${escapeHtml(shopPhone)}</p>` : '';
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
    body { margin: 0; padding: 10px 10px 10px; font-family: system-ui, sans-serif; color: #0f172a; background: #f1f5f9; }
    .sheet { max-width: 440px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .hero { background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 55%, #172554 100%); color: #f8fafc; padding: 14px 18px; text-align: center; }
    .hero-logo { display: flex; justify-content: center; margin-bottom: 8px; }
    .logo-img { width: 64px; height: 64px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.12); }
    .logo-fallback { width: 64px; height: 64px; border-radius: 12px; background: linear-gradient(145deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #fff; }
    .shop-name { font-size: 18px; font-weight: 800; margin: 0; }
    .invoice-tag { margin: 3px 0 0; font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #cbd5e1; }
    .shop-phone { margin: 3px 0 0; font-size: 12px; color: #cbd5e1; }
    .hero-order { margin-top: 8px; }
    .hero-order-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #cbd5e1; margin: 0; }
    .hero-order-value { font-size: 20px; font-weight: 800; color: #fff; margin: 4px 0 0; }
    .body { padding: 12px 18px 12px; }
    table.meta { width: 100%; border-collapse: collapse; font-size: 12px; }
    table.meta tr { border-bottom: 1px solid #f1f5f9; }
    table.meta td { padding: 5px 0; vertical-align: top; }
    table.meta td.l { color: #64748b; font-weight: 600; width: 38%; }
    table.meta td.r { color: #0f172a; font-weight: 500; text-align: right; }
    .section-title { font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin: 8px 0 4px; }
    .amount-row { display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px; }
    .amt-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .amt-value { font-size: 18px; font-weight: 800; color: #1e40af; }
    .terms-box { margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
    .terms-title { font-size: 8px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px; }
    .terms-list { margin: 0; padding-left: 12px; font-size: 8px; color: #64748b; line-height: 1.4; }
    .terms-list li { margin-bottom: 2px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="hero">
      <div class="hero-logo">
        ${logoBlock}
      </div>
      <p class="shop-name">${shop}</p>
      ${phoneLine}
      <p class="invoice-tag">Service invoice</p>
      <div class="hero-order">
        <p class="hero-order-label">Order ID</p>
        <p class="hero-order-value">${escapeHtml(repair.orderCode)}</p>
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
      <div style="text-align: center; margin-top: 12px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
        <p style="font-size: 8px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px;">Order Barcode</p>
        <img src="https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(repair.orderCode)}" style="width: 180px; height: 48px; object-fit: contain; background: #fff; padding: 4px;" />
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
  let logoDataUrl: string | null = null;
  if (branding.logoUri) {
    logoDataUrl = await readUriAsDataUrl(branding.logoUri);
  }
  const html = buildReceiptHtml(repair, branding, logoDataUrl);

  const timestamp = Date.now();
  const file = await generatePDF({
    html,
    fileName: `MCA_Phone_Wala_Invoice_${repair.orderCode.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`,
    forceReset: true,
  });

  if (!file.filePath) {
    throw new Error('Failed to generate PDF file path.');
  }

  return file.filePath;
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

/** Generate a PDF invoice and share directly via WhatsApp.
 *  WhatsApp will show its contact picker with the PDF attached. */
export async function shareReceiptPdfToWhatsAppContact(repair: Repair, phone: string): Promise<void> {
  const filePath = await generateInvoicePdf(repair);

  // Format phone for WhatsApp: must include country code without + or leading zeros
  const whatsAppNumber = phone.length === 10 ? `91${phone}` : phone.replace(/^\+/, '');

  try {
    await RNShare.shareSingle({
      social: Social.Whatsapp,
      whatsAppNumber,
      url: `file://${filePath}`,
      type: 'application/pdf',
      message: `Invoice for repair ${repair.orderCode}`,
      title: `Invoice ${repair.orderCode}`,
    } as any);
  } catch (err: any) {
    const msg = String(err?.message || err).toLowerCase();
    const isCancel = msg.includes('user did not share') || msg.includes('cancel') || msg.includes('abort');
    if (isCancel) {
      throw err;
    }
    logger.warn('Direct WhatsApp share error, falling back to general share:', err);
    await shareReceiptPdf(repair);
  }
}

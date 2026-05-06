import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';

import type { Repair } from '../types/repair';
import { REPAIR_STATUSES, countRepairImages, formatAccessoriesSummary } from '../types/repair';
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

async function fileUriToDataUrl(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const lower = uri.toLowerCase();
    const mime = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
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

export function buildReceiptHtml(
  repair: Repair,
  branding: ShopBranding,
  logoDataUrl: string | null
): string {
  const shopPhone = '8881765192';
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
    body {
      margin: 0;
      padding: 28px 20px 36px;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 440px;
      margin: 0 auto;
      background: #fff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }
    .hero {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 55%, #172554 100%);
      color: #f8fafc;
      padding: 22px 22px 20px;
    }
    .hero-top {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 12px;
      background: rgba(255,255,255,0.12);
      flex-shrink: 0;
    }
    .logo-fallback {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      background: linear-gradient(145deg, #3b82f6, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .shop-block { min-width: 0; }
    .shop-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin: 0;
    }
    .invoice-tag {
      margin: 6px 0 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .shop-phone {
      margin: 6px 0 0;
      font-size: 13px;
      font-weight: 700;
      color: #cbd5e1;
      letter-spacing: 0.01em;
    }
    .order-strip {
      margin-top: 18px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      flex-wrap: wrap;
    }
    .order-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
    .order-value { font-size: 18px; font-weight: 800; letter-spacing: 0.02em; color: #fff; }
    .body { padding: 20px 22px 24px; }
    table.meta { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.meta tr { border-bottom: 1px solid #f1f5f9; }
    table.meta tr:last-child { border-bottom: none; }
    table.meta td { padding: 10px 0; vertical-align: top; }
    table.meta td.l { color: #64748b; font-weight: 600; width: 38%; padding-right: 10px; }
    table.meta td.r { color: #0f172a; font-weight: 500; text-align: right; }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 18px 0 8px;
    }
    .section-title:first-child { margin-top: 0; }
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-top: 8px;
    }
    .amount-row .amt-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .amount-row .amt-value { font-size: 20px; font-weight: 800; color: #1e40af; }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="hero">
      <div class="hero-top">
        ${logoBlock}
        <div class="shop-block">
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
        <tr><td class="l">Received</td><td class="r">${escapeHtml(formatDateDisplay(repair.dateReceived))}</td></tr>
        <tr><td class="l">Issue</td><td class="r">${escapeHtml(repair.problem)}</td></tr>
        <tr><td class="l">Accessories</td><td class="r">${escapeHtml(formatAccessoriesSummary(repair))}</td></tr>
        <tr><td class="l">Status</td><td class="r">${escapeHtml(statusLabel(repair.status))}</td></tr>
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
      <p class="footer">Thank you for your business.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function shareReceiptPdf(repair: Repair): Promise<void> {
  const branding = await getShopBranding();
  let logoDataUrl: string | null = null;
  if (branding.logoUri) {
    logoDataUrl = await fileUriToDataUrl(branding.logoUri);
  }
  const html = buildReceiptHtml(repair, branding, logoDataUrl);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share receipt',
    UTI: 'com.adobe.pdf',
  });
}

function normalizeWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function createReceiptPdfUri(repair: Repair): Promise<string> {
  const branding = await getShopBranding();
  let logoDataUrl: string | null = null;
  if (branding.logoUri) logoDataUrl = await fileUriToDataUrl(branding.logoUri);
  const html = buildReceiptHtml(repair, branding, logoDataUrl);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

function invoiceCaption(repair: Repair): string {
  return `Invoice ${repair.orderCode}`;
}

/**
 * Open a WhatsApp chat for this number. Tries several URL forms — iOS often
 * fails `canOpenURL(whatsapp://)` unless LSApplicationQueriesSchemes includes whatsapp
 * (see app.config.js); we always attempt openURL and fall back to wa.me.
 */
async function openWhatsAppToNumber(phoneDigits: string, message: string): Promise<void> {
  const text = encodeURIComponent(message);
  const candidates = [
    `whatsapp://send?phone=${phoneDigits}&text=${text}`,
    `https://wa.me/${phoneDigits}?text=${text}`,
    `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`,
  ];
  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try next
    }
  }
}

/**
 * Best-effort WhatsApp handoff:
 * 1) Open the PDF share sheet so the user can send the file
 * 2) After the sheet closes, open that customer's WhatsApp chat (short delay so the OS finishes dismissing the share UI)
 *
 * Note: Fully automatic, silent sending is not allowed by mobile OS + WhatsApp APIs.
 */
export async function shareReceiptPdfToWhatsAppContact(repair: Repair, customerPhone: string): Promise<void> {
  const pdfUri = await createReceiptPdfUri(repair);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;

  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Send invoice PDF',
    UTI: 'com.adobe.pdf',
  });

  const phone = normalizeWhatsAppPhone(customerPhone);
  if (phone.length < 10) return;

  const caption = invoiceCaption(repair);
  await new Promise<void>((r) => setTimeout(r, 450));
  await openWhatsAppToNumber(phone, caption);
}

export async function receiptSummaryText(repair: Repair): Promise<string> {
  const branding = await getShopBranding();
  const n = countRepairImages(repair);
  const lines = [
    `*${branding.shopName}* — ${repair.orderCode}`,
    `Record #: ${repair.id}`,
    `Customer: ${repair.customerName}`,
    `Phone: ${repair.phone}`,
    `Device: ${repair.deviceModel}`,
    `Issue: ${repair.problem}`,
    `Accessories: ${formatAccessoriesSummary(repair)}`,
    `Status: ${statusLabel(repair.status)}`,
    `Cost: ${formatCurrency(repair.repairCost)} | Advance: ${formatCurrency(repair.advanceAmount)}`,
    repair.isPaid ? 'Paid' : 'Unpaid',
  ];
  if (n > 0) lines.push(`Photos on file: ${n}`);
  return lines.join('\n');
}

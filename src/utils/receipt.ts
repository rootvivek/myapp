import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import RNShare, { Social } from 'react-native-share';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

import type { Repair } from '../types/repair';
import { logger } from './logger';
import { REPAIR_STATUSES, formatAccessoriesSummary } from '../types/repair';
import type { ShopBranding } from './shopSettings';
import { getShopBranding } from './shopSettings';
import { formatDateDisplay } from './format';

/** PDF-safe currency formatter: uses 'Rs.' instead of '₹' (WinAnsi can't encode ₹). */
function pdfCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Sanitize a string for WinAnsi (pdf-lib standard fonts).
 * Replaces common Unicode chars with ASCII equivalents and strips anything
 * outside the printable Latin-1 range (0x20–0xFF), including newlines.
 */
function pdfSafe(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[\r\n\t]+/g, ' ')          // newlines / tabs -> space
    .replace(/[\u2018\u2019]/g, "'")     // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')     // smart double quotes
    .replace(/[\u2013\u2014]/g, '-')     // en-dash / em-dash
    .replace(/[\u2022\u25C6]/g, '-')     // bullet / diamond -> dash
    .replace(/\u20B9/g, 'Rs.')           // ₹ rupee sign
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ''); // strip remaining non-WinAnsi
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function statusLabel(status: Repair['status']): string {
  return REPAIR_STATUSES.find((x) => x.value === status)?.label ?? status;
}

function monogramLetter(shopName: string): string {
  const t = (shopName || '').trim();
  const ch = t[0];
  if (ch && /[a-zA-Z0-9]/.test(ch)) return ch.toUpperCase();
  return 'M';
}

/**
 * Convert a file URI (local or remote) to base64 data URL for embedding in PDF.
 * Handles: file://, content://, https:// (Supabase Storage), and other local URIs.
 */
async function readUriAsBase64(uri: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // Remote URL (Supabase Storage, etc.) - fetch and convert to base64
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      if (!response.ok) {
        logger.warn('Failed to fetch remote logo:', response.status);
        return null;
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const mimeType = blob.type || 'image/png';
      return { base64, mimeType };
    }

    // Local file URI - use react-native-fs
    let filePath = uri;
    if (uri.startsWith('file://')) {
      filePath = uri.replace('file://', '');
    } else if (uri.startsWith('content://')) {
      // Content URIs - try to fetch via fetch() which works with content:// on Android
      try {
        const response = await fetch(uri);
        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          const mimeType = blob.type || 'image/png';
          return { base64, mimeType };
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

    return { base64, mimeType };
  } catch (err) {
    logger.warn('Failed to read logo image as base64:', err);
    return null;
  }
}

/** Generate PDF using pdf-lib (pure JS, no native modules needed). */
export async function shareReceiptPdf(repair: Repair): Promise<void> {
  const branding = await getShopBranding();
  let logoDataUrl: string | null = null;
  if (branding.logoUri) {
    const logoResult = await readUriAsBase64(branding.logoUri);
    if (logoResult) {
      logoDataUrl = `data:${logoResult.mimeType};base64,${logoResult.base64}`;
    }
  }

  // Generate PDF using pdf-lib
  const pdfBase64 = await generateInvoicePdfBase64(repair, branding, logoDataUrl);

  // Write to temp file
  const timestamp = Date.now();
  const fileName = `MCA_Phone_Wala_Invoice_${repair.orderCode.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
  const filePath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
  
  await RNFS.writeFile(filePath, pdfBase64, 'base64');

  // Share the generated PDF
  try {
    await RNShare.open({
      title: `Invoice ${repair.orderCode}`,
      subject: `Invoice for repair ${repair.orderCode}`,
      message: 'Attached is the invoice for your repair.',
      url: `file://${filePath}`,
      type: 'application/pdf',
      failOnCancel: false,
    });
  } catch (err) {
    logger.warn('Share failed:', err);
    // Fallback: copy to Documents directory
    const docPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    await RNFS.copyFile(filePath, docPath);
    logger.warn('Sharing not available; PDF saved to:', docPath);
  }
}

/** Generate a PDF invoice and share directly via WhatsApp. */
export async function shareReceiptPdfToWhatsAppContact(repair: Repair, phone: string): Promise<void> {
  const branding = await getShopBranding();
  let logoDataUrl: string | null = null;
  if (branding.logoUri) {
    const logoResult = await readUriAsBase64(branding.logoUri);
    if (logoResult) {
      logoDataUrl = `data:${logoResult.mimeType};base64,${logoResult.base64}`;
    }
  }

  // Generate PDF using pdf-lib
  const pdfBase64 = await generateInvoicePdfBase64(repair, branding, logoDataUrl);

  // Write to temp file
  const timestamp = Date.now();
  const fileName = `MCA_Phone_Wala_Invoice_${repair.orderCode.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
  const filePath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
  
  await RNFS.writeFile(filePath, pdfBase64, 'base64');

  // Format phone for WhatsApp: must include country code without + or leading zeros
  const whatsAppNumber = phone.length === 10 ? `91${phone}` : phone.replace(/^\+/, '');

  try {
    // Try to share directly to WhatsApp
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

/** Generate PDF base64 using pdf-lib (pure JS, no native modules). */
async function generateInvoicePdfBase64(
  repair: Repair,
  branding: ShopBranding,
  logoDataUrl: string | null
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const darkBlue = rgb(0.06, 0.09, 0.16);
  const lightBlue = rgb(0.95, 0.97, 0.99);
  const accentBlue = rgb(0.46, 0.53, 0.93);
  const white = rgb(1, 1, 1);
  const gray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.9, 0.9, 0.9);

  // Helper to draw text — always sanitizes to WinAnsi-safe chars
  const drawText = (text: string, x: number, y: number, size: number, fontRef = font, color = darkBlue) => {
    page.drawText(pdfSafe(text), { x, y, size, font: fontRef, color });
  };

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: lightBlue,
  });

  // Hero section
  const heroHeight = 180;
  page.drawRectangle({
    x: 0,
    y: height - heroHeight,
    width,
    height: heroHeight,
    color: darkBlue,
  });

  // Logo
  let logoY = height - 80;
  if (logoDataUrl) {
    try {
      const logoImg = await pdfDoc.embedPng(logoDataUrl.replace(/^data:image\/(png|jpeg);base64,/, ''));
      const logoDims = logoImg.scale(0.3);
      page.drawImage(logoImg, {
        x: (width - logoDims.width) / 2,
        y: height - 100,
        width: logoDims.width,
        height: logoDims.height,
      });
      logoY = height - 100 - logoDims.height - 10;
    } catch {
      // Fallback to monogram
      drawText(monogramLetter(branding.shopName), (width - 30) / 2, logoY, 40, fontBold, white);
    }
  } else {
    drawText(monogramLetter(branding.shopName), (width - 30) / 2, logoY, 40, fontBold, white);
  }

  // Shop name
  const safeShopName = pdfSafe(branding.shopName);
  drawText(safeShopName, (width - fontBold.widthOfTextAtSize(safeShopName, 20)) / 2, logoY - 30, 20, fontBold, white);

  // Phone
  const safeShopPhone = pdfSafe(branding.shopPhone.trim());
  if (safeShopPhone) {
    drawText(safeShopPhone, (width - font.widthOfTextAtSize(safeShopPhone, 11)) / 2, logoY - 50, 11, font, rgb(0.8, 0.85, 0.95));
  }

  // Invoice tag
  drawText('SERVICE INVOICE', (width - fontBold.widthOfTextAtSize('SERVICE INVOICE', 10)) / 2, logoY - 70, 10, fontBold, rgb(0.8, 0.85, 0.95));

  // Order ID
  const safeOrderCode = pdfSafe(repair.orderCode);
  drawText('Order ID', (width - fontBold.widthOfTextAtSize('Order ID', 10)) / 2, logoY - 95, 10, fontBold, rgb(0.8, 0.85, 0.95));
  drawText(safeOrderCode, (width - fontBold.widthOfTextAtSize(safeOrderCode, 18)) / 2, logoY - 110, 18, fontBold, white);

  // Body section
  let y = height - heroHeight - 30;
  const leftMargin = 30;
  const rightMargin = width - 30;
  const colWidth = (width - 60) / 2;

  // Helper for section
  const drawSectionTitle = (title: string) => {
    drawText(title.toUpperCase(), leftMargin, y, 8, fontBold, rgb(0.5, 0.55, 0.6));
    y -= 20;
  };

  const drawMetaRow = (label: string, value: string, labelColor = darkBlue, valueColor = darkBlue) => {
    const safeLabel = pdfSafe(label);
    const safeValue = pdfSafe(value);
    drawText(safeLabel, leftMargin, y, 11, fontBold, labelColor);
    const valueWidth = font.widthOfTextAtSize(safeValue, 11);
    drawText(safeValue, Math.max(leftMargin + 100, rightMargin - valueWidth), y, 11, font, valueColor);
    y -= 22;
  };

  // Job Details
  drawSectionTitle('Job Details');
  drawMetaRow('Customer', repair.customerName);
  drawMetaRow('Phone', repair.phone);
  drawMetaRow('Device', repair.deviceModel);
  if (repair.imei) drawMetaRow('IMEI', repair.imei);
  if (repair.lockType) {
    const lockLabel = repair.lockType === 'pattern' ? 'Set (Pattern)' : repair.lockType === 'pin' ? 'Set (PIN)' : 'Set (Password)';
    drawMetaRow('Device lock', lockLabel);
  }
  drawMetaRow('Received', formatDateDisplay(repair.dateReceived));
  drawMetaRow('Issue', repair.problem);
  drawMetaRow('Accessories', formatAccessoriesSummary(repair));
  drawMetaRow('Status', statusLabel(repair.status));
  if (repair.warranty) drawMetaRow('Warranty', repair.warranty);

  y -= 10;

  // Payment
  drawSectionTitle('Payment');
  drawMetaRow('Repair cost', pdfCurrency(repair.repairCost));
  drawMetaRow('Advance', pdfCurrency(repair.advanceAmount));
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);
  const paidLine = repair.isPaid ? 'Paid in full' : `Balance due: ${pdfCurrency(balance)}`;
  drawMetaRow('Payment', `${repair.isPaid ? 'Paid' : 'Unpaid'} - ${paidLine}`);

  // Total row
  y -= 10;
  page.drawRectangle({
    x: leftMargin,
    y: y - 10,
    width: width - 60,
    height: 40,
    color: lightGray,
    borderColor: rgb(0.85, 0.88, 0.93),
    borderWidth: 1,
  });
  drawText('TOTAL JOB', leftMargin + 15, y + 5, 11, fontBold, rgb(0.4, 0.45, 0.5));
  const totalText = pdfCurrency(repair.repairCost);
  drawText(totalText, rightMargin - fontBold.widthOfTextAtSize(totalText, 18) - 15, y + 2, 18, fontBold, accentBlue);

  y -= 60;

  // Terms
  drawSectionTitle('Terms & Conditions');
  const terms = [
    'No warranty on physical, liquid, or accidental damage.',
    'All repaired devices must be claimed within 30 days of notification, otherwise they are subject to disposal.',
    'Please back up all device data. The service center is not responsible for any data loss.',
    'Estimated repair times and costs may vary depending on spare parts availability.',
  ];
  for (const term of terms) {
    drawText(`- ${term}`, leftMargin + 10, y, 8, font, gray);
    y -= 16;
  }

  // Barcode placeholder
  y -= 10;
  drawText('ORDER BARCODE', leftMargin, y, 8, fontBold, gray);
  y -= 15;
  // Simple barcode representation (lines)
  for (let i = 0; i < 30; i++) {
    const lineWidth = Math.random() > 0.5 ? 2 : 1;
    page.drawRectangle({
      x: leftMargin + i * 6,
      y: y - 40,
      width: lineWidth,
      height: 40,
      color: darkBlue,
    });
  }

  y -= 60;

  // Footer
  drawText('Thank you for your business.', (width - font.widthOfTextAtSize('Thank you for your business.', 11)) / 2, y, 11, font, gray);

  // Serialize to base64
  return pdfDoc.saveAsBase64({ dataUri: false });
}
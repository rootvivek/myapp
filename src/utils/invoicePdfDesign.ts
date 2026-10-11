import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Repair } from '../types/repair';
import { formatAccessoriesSummary, REPAIR_STATUSES } from '../types/repair';
import { formatDateDisplay } from './format';
import type { ShopBranding } from './shopSettings';
import { logger } from './logger';

// Code 128 pattern table, indexed by the standard code value (0-106).
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

function safeText(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u25C6]/g, '-')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim();
}

function currency(amount: number): string {
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}`;
}

/** Generate a single-page A4 service invoice styled after the supplied reference. */
export async function generateInvoicePdfBase64(
  repair: Repair,
  branding: ShopBranding,
  logoDataUrl: string | null,
): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.045, 0.105, 0.20);
  const navyShade = rgb(0.08, 0.16, 0.28);
  const blue = rgb(0.055, 0.34, 0.86);
  const paleBlue = rgb(0.91, 0.95, 1);
  const ink = rgb(0.055, 0.10, 0.20);
  const muted = rgb(0.29, 0.35, 0.47);
  const border = rgb(0.87, 0.90, 0.94);
  const white = rgb(1, 1, 1);
  const amber = rgb(1, 0.72, 0.28);
  const margin = 32;
  const cardWidth = width - margin * 2;

  const textAt = (text: string, x: number, top: number, size: number, face = regular, color = ink) => {
    const value = safeText(text);
    if (value) page.drawText(value, { x, y: height - top - size, size, font: face, color });
  };

  const fitText = (
    text: string,
    x: number,
    top: number,
    maxWidth: number,
    size: number,
    face = regular,
    color = ink,
    align: 'left' | 'right' = 'left',
  ) => {
    const value = safeText(text);
    if (!value || maxWidth <= 0) return;
    let fitted = size;
    while (fitted > 7 && face.widthOfTextAtSize(value, fitted) > maxWidth) fitted -= 0.5;
    const measured = face.widthOfTextAtSize(value, fitted);
    textAt(value, align === 'right' ? x + Math.max(0, maxWidth - measured) : x, top, fitted, face, color);
  };

  const card = (top: number, cardHeight: number) => {
    page.drawRectangle({
      x: margin,
      y: height - top - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: white,
      borderColor: border,
      borderWidth: 0.8,
    });
  };

  const heading = (title: string, top: number) => {
    textAt(title, margin + 20, top + 5, 15, bold, ink);
  };

  const row = (label: string, value: string, top: number, color = ink, face = regular) => {
    const labelX = margin + 56;
    const valueX = margin + 196;
    fitText(label, labelX, top, 128, 11, regular, muted);
    fitText(value, valueX, top, width - margin - 16 - valueX, 11, face, color, 'right');
  };

  // Page and dark masthead.
  page.drawRectangle({ x: 0, y: 0, width, height, color: white });
  const heroHeight = 140;
  page.drawRectangle({ x: 0, y: height - heroHeight, width, height: heroHeight, color: navy });
  page.drawCircle({ x: width - 4, y: height - 121, size: 90, color: navyShade, opacity: 0.55 });
  page.drawCircle({ x: width - 155, y: height - 151, size: 62, color: navyShade, opacity: 0.42 });
  page.drawLine({ start: { x: 145, y: height - 26 }, end: { x: 145, y: height - 116 }, thickness: 0.8, color: rgb(0.25, 0.35, 0.49) });
  page.drawLine({ start: { x: width - 165, y: height - 26 }, end: { x: width - 165, y: height - 116 }, thickness: 0.8, color: rgb(0.25, 0.35, 0.49) });

  // Use the uploaded shop logo when possible; otherwise draw a small phone mark.
  let logoDrawn = false;
  const logoMatch = logoDataUrl?.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (logoMatch) {
    try {
      const image = logoMatch[1].toLowerCase() === 'png'
        ? await pdf.embedPng(logoMatch[2])
        : await pdf.embedJpg(logoMatch[2]);
      const scale = Math.min(66 / image.width, 78 / image.height);
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;
      page.drawImage(image, {
        x: 72 - imageWidth / 2,
        y: height - 70 - imageHeight / 2,
        width: imageWidth,
        height: imageHeight,
      });
      logoDrawn = true;
    } catch (error) {
      logger.warn('Could not embed invoice logo; using the default shop mark:', error);
    }
  }
  if (!logoDrawn) {
    page.drawRectangle({ x: 51, y: height - 111, width: 42, height: 70, color: white, borderColor: white, borderWidth: 1.5 });
    page.drawRectangle({ x: 56, y: height - 101, width: 32, height: 48, color: blue });
    page.drawLine({ start: { x: 63, y: height - 51 }, end: { x: 81, y: height - 51 }, thickness: 2, color: white });
    page.drawCircle({ x: 72, y: height - 94, size: 2, color: white });
    page.drawLine({ start: { x: 64, y: height - 85 }, end: { x: 80, y: height - 70 }, thickness: 4, color: rgb(0.18, 0.75, 0.95) });
  }

  const orderCode = safeText(repair.orderCode || String(repair.id));
  const titleX = 170;
  const shopTitleWidth = width - 348;
  fitText(branding.shopName || 'Mobile Repair Shop', titleX, 37, shopTitleWidth, 23, bold, white);
  const shopPhone = branding.shopPhone.trim();
  fitText(shopPhone ? `+91 ${shopPhone.replace(/^\+?91\s*/, '')}` : 'Mobile phone repair service', titleX, 72, shopTitleWidth, 12, regular, rgb(0.87, 0.90, 0.96));
  textAt('Service & device care', titleX, 96, 10, regular, rgb(0.70, 0.76, 0.86));
  const invoiceX = width - 151;
  fitText('SERVICE INVOICE', invoiceX, 39, 120, 10, bold, rgb(0.82, 0.87, 0.95));
  textAt('Order ID', invoiceX, 67, 10, regular, rgb(0.75, 0.80, 0.89));
  fitText(orderCode, invoiceX, 86, 120, 16, bold, white);

  // Customer details panel.
  let top = 152;
  card(top, 128);
  heading('Customer Details', top + 8);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  fitText(formatDateDisplay(today), width - margin - 145, top + 16, 125, 11, regular, muted, 'right');
  row('Customer', repair.customerName || 'Walk-in customer', top + 43);
  row('Phone', repair.phone || '—', top + 63);
  row('Device', repair.deviceModel || '—', top + 83);
  row('Shop', branding.shopName || '—', top + 103);

  // Repair job panel.
  top += 139;
  card(top, 143);
  heading('Job Details', top + 8);
  row('Received', formatDateDisplay(repair.dateReceived) || '—', top + 42);
  row('Issue', repair.problem || '—', top + 62);
  row('Accessories', formatAccessoriesSummary(repair), top + 82);
  const status = REPAIR_STATUSES.find((item) => item.value === repair.status)?.label ?? repair.status;
  const statusColor = repair.status === 'completed' || repair.status === 'delivered' ? rgb(0.12, 0.55, 0.34) : amber;
  row('Status', status, top + 102, statusColor, bold);
  row('Warranty', repair.warranty || 'No Warranty', top + 122);

  // Payment panel.
  top += 154;
  card(top, 101);
  heading('Payment Details', top + 7);
  row('Repair cost', currency(repair.repairCost), top + 40);
  row('Advance', currency(repair.advanceAmount), top + 60);
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);
  row('Payment', repair.isPaid ? 'Paid in full' : `Unpaid - Balance due: ${currency(balance)}`, top + 80);

  // Highlighted total band.
  top += 113;
  page.drawRectangle({ x: margin, y: height - top - 50, width: cardWidth, height: 50, color: paleBlue });
  textAt('TOTAL JOB', margin + 20, top + 16, 14, bold, muted);
  fitText(currency(repair.repairCost), width - margin - 190, top + 9, 168, 24, bold, blue, 'right');

  // Terms and order barcode share the lower section, like the reference.
  top += 65;
  page.drawLine({ start: { x: width - 188, y: height - top - 113 }, end: { x: width - 188, y: height - top - 4 }, thickness: 0.8, color: border });
  textAt('Terms & Conditions', margin + 2, top, 12, bold, ink);
  const terms = [
    'No warranty on physical, liquid, or accidental damage.',
    'Claim repaired devices within 30 days of notification.',
    'Please back up device data; the service center is not responsible for data loss.',
    'Repair time and cost may vary with spare-parts availability.',
  ];
  const termX = margin + 14;
  const termWidth = width - 245;
  let termTop = top + 23;
  for (const term of terms) {
    textAt('-', margin + 3, termTop, 8, regular, muted);
    let remaining = safeText(term);
    while (remaining) {
      let line = remaining;
      while (line && regular.widthOfTextAtSize(line, 8) > termWidth) {
        const lastSpace = line.lastIndexOf(' ');
        if (lastSpace <= 0) break;
        line = line.slice(0, lastSpace);
      }
      textAt(line, termX, termTop, 8, regular, muted);
      remaining = remaining.slice(line.length).trimStart();
      termTop += 12;
    }
  }

  const barcodeX = width - 170;
  textAt('ORDER BARCODE', barcodeX, top, 10, bold, ink);
  const barTop = top + 31;
  // Encode the order id as a real Code 128-B barcode so common scanners can
  // read the same identifier printed beneath the bars.
  const barcodeValue = (orderCode || String(repair.id)).replace(/[^\x20-\x7E]/g, '') || String(repair.id);
  const encoded = [104, ...Array.from(barcodeValue, (char) => char.charCodeAt(0) - 32)];
  let checksum = encoded[0];
  for (let index = 1; index < encoded.length; index += 1) checksum += encoded[index] * index;
  encoded.push(checksum % 103, 106);

  let barX = barcodeX;
  const availableBarcodeWidth = width - margin - 12 - barcodeX;
  const modules = encoded.reduce((total, value) => total + CODE128_PATTERNS[value].split('').reduce((sum, digit) => sum + Number(digit), 0), 0);
  const moduleWidth = Math.min(0.85, availableBarcodeWidth / modules);
  for (const code of encoded) {
    const pattern = CODE128_PATTERNS[code];
    for (let segment = 0; segment < pattern.length; segment += 1) {
      const segmentWidth = Number(pattern[segment]) * moduleWidth;
      if (segment % 2 === 0) {
        page.drawRectangle({ x: barX, y: height - barTop - 38, width: segmentWidth, height: 38, color: navy });
      }
      barX += segmentWidth;
    }
  }
  fitText(barcodeValue, barcodeX, barTop + 43, availableBarcodeWidth, 12, bold, ink, 'right');

  // Divider and closing note.
  const footerY = height - top - 143;
  page.drawLine({ start: { x: margin, y: footerY }, end: { x: width - margin, y: footerY }, thickness: 0.8, color: border });
  const thanks = 'Thank you for your business!';
  const thanksWidth = regular.widthOfTextAtSize(thanks, 14);
  textAt(thanks, (width - thanksWidth) / 2, height - footerY + 10, 14, regular, blue);
  page.drawLine({ start: { x: width / 2 - 22, y: footerY - 26 }, end: { x: width / 2 + 22, y: footerY - 26 }, thickness: 1.6, color: blue });

  return pdf.saveAsBase64({ dataUri: false });
}
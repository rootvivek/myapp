import RNShare, { Social } from 'react-native-share';
import RNFS from 'react-native-fs';

import type { Repair } from '../types/repair';
import { logger } from './logger';
import type { ShopBranding } from './shopSettings';
import { getShopBranding } from './shopSettings';
import { generateInvoicePdfBase64 } from './invoicePdfDesign';

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
  const orderFilePart = (repair.orderCode || String(repair.id)).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `MCA_Phone_Wala_Invoice_${orderFilePart}_${timestamp}.pdf`;
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
  const orderFilePart = (repair.orderCode || String(repair.id)).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `MCA_Phone_Wala_Invoice_${orderFilePart}_${timestamp}.pdf`;
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const msg = message.toLowerCase();
    const isCancel = msg.includes('user did not share') || msg.includes('cancel') || msg.includes('abort');
    if (isCancel) {
      throw err;
    }
    logger.warn('Direct WhatsApp share error, falling back to general share:', err);
    await shareReceiptPdf(repair);
  }
}

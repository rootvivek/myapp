import { PDFDocument } from 'pdf-lib';
import type { Repair } from '../types/repair';
import { generateInvoicePdfBase64 } from '../utils/invoicePdfDesign';

const repair: Repair = {
  id: 676,
  orderCode: 'ORD00676',
  transactionType: undefined,
  customerName: 'Sahil',
  phone: '8218125066',
  deviceModel: 'Oppo a15',
  imei: '',
  lockType: '',
  lockValue: '',
  problem: 'FRP lock',
  warranty: 'No Warranty',
  dateReceived: '2026-10-09',
  status: 'pending',
  repairCost: 100,
  expense: 0,
  advanceAmount: 0,
  isPaid: false,
  imagePhoneFront: '',
  imagePhoneBack: '',
  imageThumbnail: '',
  imageId1: '',
  imageId2: '',
  accSimTray: false,
  accBackCover: false,
  paymentType: 'cash',
  sellerId: null,
  createdBy: '',
  createdByName: '',
  createdByRole: null,
  createdAt: '',
  updatedAt: '',
};

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

describe('invoice PDF design', () => {
  it('creates a valid one-page A4 PDF with invoice content', async () => {
    const base64 = await generateInvoicePdfBase64(
      repair,
      { shopName: 'MCA Phone Wala', shopPhone: '8881765192', logoUri: null },
      null,
    );

    const pdf = await PDFDocument.load(decodeBase64(base64));
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize().width).toBeCloseTo(595.28, 1);
    expect(base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('handles a missing order code and long shop name without failing', async () => {
    const base64 = await generateInvoicePdfBase64(
      { ...repair, orderCode: '' },
      { shopName: 'A very long neighborhood mobile repair shop name', shopPhone: '', logoUri: null },
      null,
    );

    const pdf = await PDFDocument.load(decodeBase64(base64));
    expect(pdf.getPageCount()).toBe(1);
  });
});
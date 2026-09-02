import { useCallback, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

import type { Repair } from '../../types/repair';
import { shareReceiptPdf, shareReceiptPdfToWhatsAppContact } from '../../utils/receipt';
import { getDialString, normalizePhone, showError } from './constants';

type RepairActions = {
  handleCall: () => void;
  handleWhatsApp: () => void;
  handleShare: () => void;
  pdfBusy: boolean;
  shareBusy: boolean;
};

export function useRepairActions(repair: Repair): RepairActions {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  const pdfBusyRef = useRef(false);
  const shareBusyRef = useRef(false);
  const callBusyRef = useRef(false);

  const handleCall = useCallback(() => {
    if (callBusyRef.current) return;
    callBusyRef.current = true;

    const dial = getDialString(repair.phone);
    if (!dial) {
      Alert.alert('No phone number', 'Add a phone number on this job to call.');
      callBusyRef.current = false;
      return;
    }

    Linking.canOpenURL(`tel:${dial}`)
      .then((ok) => {
        if (ok) return Linking.openURL(`tel:${dial}`);
        Alert.alert('Cannot call', 'No app can handle phone calls on this device.');
      })
      .catch(() => {
        Alert.alert('Cannot call', 'Try again or dial manually.');
      })
      .finally(() => {
        callBusyRef.current = false;
      });
  }, [repair.phone]);

  const handleWhatsApp = useCallback(async () => {
    if (pdfBusyRef.current) return;
    pdfBusyRef.current = true;
    setPdfBusy(true);

    try {
      const tenDigit = normalizePhone(repair.phone);
      if (tenDigit) {
        await shareReceiptPdfToWhatsAppContact(repair, tenDigit);
      } else {
        await shareReceiptPdf(repair);
      }
    } catch (err: unknown) {
      const msg = String((err as any)?.message || err).toLowerCase();
      const isCancel = msg.includes('user did not share') || msg.includes('cancel') || msg.includes('abort');
      if (!isCancel) {
        showError('WhatsApp PDF', err);
      }
    } finally {
      pdfBusyRef.current = false;
      setPdfBusy(false);
    }
  }, [repair]);

  const handleShare = useCallback(async () => {
    if (shareBusyRef.current) return;
    shareBusyRef.current = true;
    setShareBusy(true);

    try {
      await shareReceiptPdf(repair);
    } catch (err: unknown) {
      showError('Share Invoice', err);
    } finally {
      shareBusyRef.current = false;
      setShareBusy(false);
    }
  }, [repair]);

  return { handleCall, handleWhatsApp, handleShare, pdfBusy, shareBusy };
}

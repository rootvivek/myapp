import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { repairService } from '../../../services/repairService';
import type { RepairImageSlot, RepairInput } from '../../../types/repair';
import { emptyImageState } from '../../../utils/repairImages';
import { resolveImagesForSaveCloud } from '../../../utils/repairImageUpload';
import {
  normalizeImeiInput,
  normalizePhoneInput,
  validateRepairFormFields,
} from '../../../utils/repairValidation';
import { shareReceiptPdfToWhatsAppContact } from '../../../utils/receipt';
import { useRepairActions } from '../../../context/RepairsContext';
import type { RepairFormState } from '../types';
import { parseMoney, showDatabaseError, showValidationError } from '../utils';

type SaveOptions = {
  isEdit: boolean;
  repairId?: number;
  initialImagesRef: React.MutableRefObject<Record<RepairImageSlot, string>>;
  onSuccess: () => void;
};

export function useRepairSave() {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const { upsertRepairInState } = useRepairActions();

  const saveRepair = useCallback(
    async (state: RepairFormState, options: SaveOptions) => {
      // Synchronous ref lock to prevent duplicate taps
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);

      const { isEdit, repairId, initialImagesRef, onSuccess } = options;

      try {
        const formErr = validateRepairFormFields({
          customerName: state.customerName,
          phone: state.phone,
          deviceModel: state.deviceModel,
          problem: state.problem,
          images: state.images,
        });

        if (formErr) {
          showValidationError(formErr);
          savingRef.current = false;
          setSaving(false);
          return;
        }

        const name = state.customerName.trim();
        const ph = normalizePhoneInput(state.phone);
        const shouldAutoSendWhatsApp = !isEdit && state.sendWhatsAppInvoice;

        if (shouldAutoSendWhatsApp && ph.length !== 10) {
          showValidationError('Enter a valid 10-digit WhatsApp number.');
          savingRef.current = false;
          setSaving(false);
          return;
        }

        const base: RepairInput = {
          orderCode: state.orderCode || '',
          customerName: name,
          phone: ph,
          deviceModel: state.deviceModel.trim(),
          imei: normalizeImeiInput(state.imei),
          lockType: state.lockType,
          lockValue: state.lockValue,
          problem: state.problem.trim(),
          warranty: state.warranty.trim(),
          dateReceived: state.dateReceived,
          status: state.status,
          repairCost: parseMoney(state.repairCost),
          expense: parseMoney(state.expense),
          advanceAmount: parseMoney(state.advanceAmount),
          isPaid: state.isPaid,
          paymentType: state.paymentType,
          imagePhoneFront: '',
          imagePhoneBack: '',
          imageThumbnail: '',
          imageId1: '',
          imageId2: '',
          ...state.accessories,
        };

        let savedRepairId = repairId ?? 0;
        if (isEdit && repairId != null) {
          const resolved = await resolveImagesForSaveCloud(
            repairId,
            state.images,
            initialImagesRef.current
          );
          await repairService.update({ ...base, id: repairId, ...resolved });
          savedRepairId = repairId;
        } else {
          const newId = await repairService.create(base);
          const resolved = await resolveImagesForSaveCloud(newId, state.images, emptyImageState());
          await repairService.update({ ...base, id: newId, ...resolved });
          savedRepairId = newId;
        }

        // Fetch single created/updated record and update local cache atomically
        const savedRepair = await repairService.getById(savedRepairId);
        if (savedRepair) {
          upsertRepairInState(savedRepair);
        }

        if (shouldAutoSendWhatsApp && savedRepair) {
          try {
            await shareReceiptPdfToWhatsAppContact(savedRepair, ph);
          } catch {
            Alert.alert(
              'WhatsApp',
              'Job saved, but could not open WhatsApp PDF share. You can share it manually from the job list.'
            );
          }
        }

        onSuccess();
      } catch (err: unknown) {
        showDatabaseError(err);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [upsertRepairInState]
  );

  return { saving, saveRepair };
}

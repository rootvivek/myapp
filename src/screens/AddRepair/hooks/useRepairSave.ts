import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { deductInventoryStock, getRepairById, insertRepair, updateRepair } from '../../../db/database';
import type { RepairImageSlot, RepairInput } from '../../../types/repair';
import { emptyImageState } from '../../../utils/repairImages';
import { resolveImagesForSaveCloud } from '../../../utils/repairImageUpload';
import {
  normalizeImeiInput,
  normalizePhoneInput,
  validateRepairFormFields,
} from '../../../utils/repairValidation';
import { shareReceiptPdfToWhatsAppContact } from '../../../utils/receipt';
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
          let resolvedImages = {
            imagePhoneFront: initialImagesRef.current.front || '',
            imagePhoneBack: initialImagesRef.current.back || '',
            imageThumbnail: initialImagesRef.current.front || '',
            imageId1: initialImagesRef.current.id1 || '',
            imageId2: initialImagesRef.current.id2 || '',
          };
          try {
            resolvedImages = await resolveImagesForSaveCloud(
              repairId,
              state.images,
              initialImagesRef.current
            );
          } catch (imgErr) {
            console.warn('[useRepairSave] Image upload failed on edit, keeping existing images:', imgErr);
          }
          await updateRepair({ ...base, id: repairId, ...resolvedImages });
          savedRepairId = repairId;
        } else {
          let resolvedImages = {
            imagePhoneFront: '',
            imagePhoneBack: '',
            imageThumbnail: '',
            imageId1: '',
            imageId2: '',
          };
          const newId = await insertRepair(base);
          try {
            resolvedImages = await resolveImagesForSaveCloud(newId, state.images, emptyImageState());
          } catch (imgErr) {
            console.warn('[useRepairSave] Image upload failed on create, repair record created:', imgErr);
          }
          await updateRepair({ ...base, id: newId, ...resolvedImages });
          savedRepairId = newId;
        }

        if (state.selectedInventoryItemIds && state.selectedInventoryItemIds.length > 0) {
          for (const invId of state.selectedInventoryItemIds) {
            void deductInventoryStock(invId, 1);
          }
        }

        if (shouldAutoSendWhatsApp) {
          try {
            const savedRepair = await getRepairById(savedRepairId);
            if (savedRepair) {
              await shareReceiptPdfToWhatsAppContact(savedRepair, ph);
            }
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
    []
  );

  return { saving, saveRepair };
}

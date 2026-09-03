import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
<<<<<<< HEAD
import { repairService } from '../../../services/repairService';
=======
import { deductInventoryStock, getRepairById, insertRepair, updateRepair } from '../../../db/database';
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
          try {
            await shareReceiptPdfToWhatsAppContact(savedRepair, ph);
          } catch (err: any) {
            const msg = String(err?.message || err).toLowerCase();
            const isCancel = msg.includes('user did not share') || msg.includes('cancel') || msg.includes('abort');
            if (!isCancel) {
              Alert.alert(
                'WhatsApp',
                'Job saved, but could not open WhatsApp PDF share. You can share it manually from the job list.'
              );
            }
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

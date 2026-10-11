import React, { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { AppColors } from '../../theme';
import type { RepairStatus } from '../../types/repair';
import { LABELS, showError } from './constants';
import type { CardStyles } from './styles';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';

type PaymentStep = 'paid_status' | 'payment_method';

type PaymentUpdate = {
  isPaid: boolean;
  paymentType?: 'cash' | 'online';
};

/** Which button is currently processing, or null if idle */
type LoadingTarget = 'unpaid' | 'cash' | 'online' | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  onStatusChange: (
    repairId: number,
    status: RepairStatus,
    paymentUpdate?: PaymentUpdate,
  ) => Promise<void> | void;
  onStatusUpdated: (status: RepairStatus) => void;
  repairId: number;
  deviceModel: string;
  customerName: string;
  styles: CardStyles;
  colors: AppColors;
};

export const PaymentModal = React.memo(function PaymentModal({
  visible,
  onClose,
  onStatusChange,
  onStatusUpdated,
  repairId,
  deviceModel,
  customerName,
  styles,
  colors,
}: Props) {
  const [step, setStep] = useState<PaymentStep>('paid_status');
  const [loadingTarget, setLoadingTarget] = useState<LoadingTarget>(null);
  const busyRef = useRef(false);

  const isBusy = loadingTarget !== null;

  const handleClose = useCallback(() => {
    if (isBusy) return;
    setStep('paid_status');
    setLoadingTarget(null);
    onClose();
  }, [isBusy, onClose]);

  const submitPayment = useCallback(
    async (update: PaymentUpdate, target: LoadingTarget) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setLoadingTarget(target);

      try {
        await onStatusChange(repairId, 'delivered', update);
        setStep('paid_status');
        setLoadingTarget(null);
        onClose();
        onStatusUpdated('delivered');
      } catch (err: unknown) {
        showError('Status Update Failed', err);
      } finally {
        busyRef.current = false;
        setLoadingTarget(null);
      }
    },
    [onStatusChange, onStatusUpdated, repairId, onClose],
  );

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title={step === 'paid_status' ? LABELS.IS_PAID_QUESTION : LABELS.SELECT_PAYMENT}
      subtitle={`${deviceModel} · ${customerName}`}
      size="medium"
      showCloseButton={true}
    >
      <View style={styles.paymentModalBody}>
        {step === 'paid_status' ? (
          <>
            <AppButton
              variant="outline"
              fullWidth
              leftIcon={<Text style={styles.badgePillIcon}>💵</Text>}
              onPress={() => setStep('payment_method')}
              disabled={isBusy}
              accessibilityLabel={LABELS.PAID}
              accessibilityHint="Proceeds to select payment method"
              style={{ marginBottom: 8 }}
            >
              {LABELS.PAID}
            </AppButton>
            <AppButton
              variant="outline"
              fullWidth
              leftIcon={<Text style={styles.badgePillIcon}>⏳</Text>}
              onPress={() => submitPayment({ isPaid: false }, 'unpaid')}
              loading={loadingTarget === 'unpaid'}
              disabled={isBusy}
              accessibilityLabel={LABELS.UNPAID}
              accessibilityHint="Marks repair as delivered but unpaid"
              accessibilityState={{ busy: loadingTarget === 'unpaid' }}
              style={{ marginBottom: 8 }}
            >
              {LABELS.UNPAID}
            </AppButton>
          </>
        ) : (
          <>
            <AppButton
              variant="outline"
              fullWidth
              leftIcon={<Text style={styles.badgePillIcon}>📱</Text>}
              onPress={() => submitPayment({ isPaid: true, paymentType: 'online' }, 'online')}
              loading={loadingTarget === 'online'}
              disabled={isBusy}
              accessibilityLabel={LABELS.ONLINE}
              accessibilityHint="Marks as paid via online payment"
              accessibilityState={{ busy: loadingTarget === 'online' }}
              style={{ marginBottom: 8, borderColor: colors.accent }}
            >
              {LABELS.ONLINE}
            </AppButton>
            <AppButton
              variant="primary"
              fullWidth
              leftIcon={<Text style={styles.badgePillIcon}>💵</Text>}
              onPress={() => submitPayment({ isPaid: true, paymentType: 'cash' }, 'cash')}
              loading={loadingTarget === 'cash'}
              disabled={isBusy}
              accessibilityLabel={LABELS.CASH}
              accessibilityHint="Marks as paid via cash"
              accessibilityState={{ busy: loadingTarget === 'cash' }}
            >
              {LABELS.CASH}
            </AppButton>
          </>
        )}
      </View>
    </AppModal>
  );
});
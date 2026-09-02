import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';

import { X } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { RepairStatus } from '../../types/repair';
import { LABELS, showError } from './constants';
import type { CardStyles } from './styles';

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
      } catch (err: unknown) {
        showError('Status Update Failed', err);
      } finally {
        busyRef.current = false;
        setLoadingTarget(null);
      }
    },
    [onStatusChange, repairId, onClose],
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' }}
      >
      <View style={styles.modalWrap}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={LABELS.CLOSE}
        />
        <View style={styles.modalOuter}>
          <View style={styles.modalSheet}>
            {/* Close Button */}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={handleClose}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={LABELS.CLOSE}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>

            <Text style={styles.modalTitle}>
              {step === 'paid_status'
                ? LABELS.IS_PAID_QUESTION
                : LABELS.SELECT_PAYMENT}
            </Text>
            <Text style={styles.modalSub}>
              {deviceModel} · {customerName}
            </Text>

            <View style={styles.paymentModalBody}>
              {step === 'paid_status' ? (
                <>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.success }]}
                    onPress={() => setStep('payment_method')}
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.PAID}
                    accessibilityHint="Proceeds to select payment method"
                  >
                    <Text style={styles.badgePillIcon}>💵</Text>
                    <Text
                      style={[
                        styles.paymentButtonText,
                        { color: colors.success },
                      ]}
                    >
                      {LABELS.PAID}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.danger }]}
                    onPress={() => submitPayment({ isPaid: false }, 'unpaid')}
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.UNPAID}
                    accessibilityHint="Marks repair as delivered but unpaid"
                    accessibilityState={{ busy: loadingTarget === 'unpaid' }}
                  >
                    {loadingTarget === 'unpaid' ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <>
                        <Text style={styles.badgePillIcon}>⏳</Text>
                        <Text
                          style={[
                            styles.paymentButtonText,
                            { color: colors.danger },
                          ]}
                        >
                          {LABELS.UNPAID}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.paymentButton,
                      { borderColor: colors.accent },
                    ]}
                    onPress={() =>
                      submitPayment({ isPaid: true, paymentType: 'online' }, 'online')
                    }
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.ONLINE}
                    accessibilityHint="Marks as paid via online payment"
                    accessibilityState={{ busy: loadingTarget === 'online' }}
                  >
                    {loadingTarget === 'online' ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <>
                        <Text style={styles.badgePillIcon}>📱</Text>
                        <Text
                          style={[
                            styles.paymentButtonText,
                            { color: colors.accent },
                          ]}
                        >
                          {LABELS.ONLINE}
                        </Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[
                      styles.paymentButton,
                      { borderColor: colors.success },
                    ]}
                    onPress={() =>
                      submitPayment({ isPaid: true, paymentType: 'cash' }, 'cash')
                    }
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.CASH}
                    accessibilityHint="Marks as paid via cash"
                    accessibilityState={{ busy: loadingTarget === 'cash' }}
                  >
                    {loadingTarget === 'cash' ? (
                      <ActivityIndicator size="small" color={colors.success} />
                    ) : (
                      <>
                        <Text style={styles.badgePillIcon}>💵</Text>
                        <Text
                          style={[
                            styles.paymentButtonText,
                            { color: colors.success },
                          ]}
                        >
                          {LABELS.CASH}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
      </Modal>
    </Portal>
  );
});

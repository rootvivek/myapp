import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const handleClose = useCallback(() => {
    if (loading) return;
    setStep('paid_status');
    onClose();
  }, [loading, onClose]);

  const submitPayment = useCallback(
    async (update: PaymentUpdate) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setLoading(true);

      try {
        await onStatusChange(repairId, 'delivered', update);
        setStep('paid_status');
        onClose();
      } catch (err: unknown) {
        showError('Status Update Failed', err);
      } finally {
        busyRef.current = false;
        setLoading(false);
      }
    },
    [onStatusChange, repairId, onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
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
              disabled={loading}
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
                    disabled={loading}
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
                    onPress={() => submitPayment({ isPaid: false })}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.UNPAID}
                    accessibilityHint="Marks repair as delivered but unpaid"
                    accessibilityState={{ busy: loading }}
                  >
                    {loading ? (
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
                      submitPayment({ isPaid: true, paymentType: 'online' })
                    }
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.ONLINE}
                    accessibilityHint="Marks as paid via online payment"
                    accessibilityState={{ busy: loading }}
                  >
                    {loading ? (
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
                      submitPayment({ isPaid: true, paymentType: 'cash' })
                    }
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={LABELS.CASH}
                    accessibilityHint="Marks as paid via cash"
                    accessibilityState={{ busy: loading }}
                  >
                    {loading ? (
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
  );
});

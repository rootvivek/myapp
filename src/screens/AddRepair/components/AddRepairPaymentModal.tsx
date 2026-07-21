import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import type { RepairStatus } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';
import type { PaymentStep } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectDeliveredPaid: (paymentType: 'cash' | 'online') => void;
  onSelectDeliveredUnpaid: () => void;
  deviceModel: string;
  customerName: string;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const AddRepairPaymentModal = React.memo(function AddRepairPaymentModal({
  visible,
  onClose,
  onSelectDeliveredPaid,
  onSelectDeliveredUnpaid,
  deviceModel,
  customerName,
  styles,
  colors,
}: Props) {
  const [step, setStep] = useState<PaymentStep>('paid_status');

  const handleClose = useCallback(() => {
    setStep('paid_status'); // Bug fix: Reset paymentStep on close
    onClose();
  }, [onClose]);

  const handleSelectPaid = useCallback(
    (type: 'cash' | 'online') => {
      setStep('paid_status');
      onSelectDeliveredPaid(type);
    },
    [onSelectDeliveredPaid]
  );

  const handleSelectUnpaid = useCallback(() => {
    setStep('paid_status');
    onSelectDeliveredUnpaid();
  }, [onSelectDeliveredUnpaid]);

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
          accessibilityLabel="Close modal"
        />
        <View style={styles.modalOuter}>
          <View style={styles.modalSheet}>
            {/* Close Button */}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close payment modal"
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>

            <Text style={styles.modalTitle}>
              {step === 'paid_status' ? 'Is this repair paid?' : 'Select payment method'}
            </Text>
            <Text style={styles.modalSub}>
              {deviceModel || 'Unknown Device'} · {customerName || 'Walk-in Customer'}
            </Text>

            <View style={styles.paymentModalBody}>
              {step === 'paid_status' ? (
                <>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.success }]}
                    onPress={() => setStep('payment_method')}
                    accessibilityRole="button"
                    accessibilityLabel="Paid"
                    accessibilityHint="Select payment method"
                  >
                    <Text style={{ fontSize: 16 }}>💵</Text>
                    <Text style={[styles.paymentButtonText, { color: colors.success }]}>Paid</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.danger }]}
                    onPress={handleSelectUnpaid}
                    accessibilityRole="button"
                    accessibilityLabel="Unpaid"
                    accessibilityHint="Mark repair as delivered and unpaid"
                  >
                    <Text style={{ fontSize: 16 }}>⏳</Text>
                    <Text style={[styles.paymentButtonText, { color: colors.danger }]}>Unpaid</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.accent }]}
                    onPress={() => handleSelectPaid('online')}
                    accessibilityRole="button"
                    accessibilityLabel="Online payment"
                  >
                    <Text style={{ fontSize: 16 }}>📱</Text>
                    <Text style={[styles.paymentButtonText, { color: colors.accent }]}>Online</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.paymentButton, { borderColor: colors.success }]}
                    onPress={() => handleSelectPaid('cash')}
                    accessibilityRole="button"
                    accessibilityLabel="Cash payment"
                  >
                    <Text style={{ fontSize: 16 }}>💵</Text>
                    <Text style={[styles.paymentButtonText, { color: colors.success }]}>Cash</Text>
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

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../../theme';
import type { PaymentStep } from '../types';
import { AppChip } from '../../../components/ui/AppChip';
import { AppModal } from '../../../components/ui/AppModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectDeliveredPaid: (paymentType: 'cash' | 'online') => void;
  onSelectDeliveredUnpaid: () => void;
  deviceModel: string;
  customerName: string;
};

export const AddRepairPaymentModal = React.memo(function AddRepairPaymentModal({
  visible,
  onClose,
  onSelectDeliveredPaid,
  onSelectDeliveredUnpaid,
  deviceModel,
  customerName,
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
    <AppModal
      visible={visible}
      onClose={handleClose}
      title={step === 'paid_status' ? 'Is this repair paid?' : 'Select payment method'}
      subtitle={`${deviceModel || 'Unknown Device'} · ${customerName || 'Walk-in Customer'}`}
      size="medium"
      showCloseButton={true}
    >
      <View style={localStyles.choicesRow}>
        {step === 'paid_status' ? (
          <>
            <AppChip
              variant="success"
              containerStyle={localStyles.choice}
              onPress={() => setStep('payment_method')}
              accessibilityRole="button"
              accessibilityLabel="Paid"
              accessibilityHint="Select payment method"
            >
              Paid
            </AppChip>
            <AppChip
              variant="danger"
              containerStyle={localStyles.choice}
              onPress={handleSelectUnpaid}
              accessibilityRole="button"
              accessibilityLabel="Unpaid"
              accessibilityHint="Mark repair as delivered and unpaid"
            >
              Unpaid
            </AppChip>
          </>
        ) : (
          <>
            <AppChip
              variant="info"
              containerStyle={localStyles.choice}
              onPress={() => handleSelectPaid('online')}
              accessibilityRole="button"
              accessibilityLabel="Online payment"
            >
              Online
            </AppChip>
            <AppChip
              variant="success"
              containerStyle={localStyles.choice}
              onPress={() => handleSelectPaid('cash')}
              accessibilityRole="button"
              accessibilityLabel="Cash payment"
            >
              Cash
            </AppChip>
          </>
        )}
      </View>
    </AppModal>
  );
});

const localStyles = StyleSheet.create({
  choicesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choice: {
    flex: 1,
  },
});

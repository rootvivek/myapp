import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import type { Repair, RepairStatus } from '../../types/repair';
import { REPAIR_STATUSES } from '../../types/repair';
import { getStatusPill, showError } from './constants';
import { PaymentModal } from './PaymentModal';
import { RepairActions } from './RepairActions';
import { RepairInfo } from './RepairInfo';
import { StatusModal } from './StatusModal';
import { createCardStyles } from './styles';
import { AppCard } from '../../components/ui/AppCard';
import { buildRepairStatusMessage, getWhatsAppPhone } from '../../utils/repairStatusNotification';

import Animated, { FadeInUp } from 'react-native-reanimated';

type Props = {
  repair: Repair;
  index?: number;
  onPress: () => void;
  onStatusChange?: (
    repairId: number,
    status: RepairStatus,
    paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' },
  ) => void | Promise<void>;
};

export const RepairCard = React.memo(function RepairCard({
  repair,
  index,
  onPress,
  onStatusChange,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  const [statusModal, setStatusModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const statusBusyRef = useRef(false);

  const pill = useMemo(() => getStatusPill(repair.status, colors), [repair.status, colors]);

  const statusLabel =
    REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;

  const handleStatusChipPress = useCallback(() => {
    setStatusModal(true);
  }, []);

  const promptWhatsAppNotification = useCallback((status: RepairStatus) => {
    const phone = getWhatsAppPhone(repair.phone);
    if (!phone) return;

    const message = buildRepairStatusMessage(repair, status);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
    const webUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    const openWhatsApp = async () => {
      try {
        await Linking.openURL(whatsappUrl);
      } catch {
        try {
          await Linking.openURL(webUrl);
        } catch {
          Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp or its web version.');
        }
      }
    };

    Alert.alert(
      'Status updated',
      `Would you like to notify ${repair.customerName} about this update on WhatsApp?`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Send WhatsApp', onPress: () => void openWhatsApp() },
      ],
    );
  }, [repair]);

  const handleStatusSelect = useCallback(
    async (newStatus: RepairStatus) => {
      if (statusBusyRef.current) return;

      setStatusModal(false);

      if (newStatus === 'delivered') {
        setPaymentModal(true);
        return;
      }

      if (!onStatusChange || newStatus === repair.status) return;

      statusBusyRef.current = true;
      try {
        await onStatusChange(repair.id, newStatus);
        promptWhatsAppNotification(newStatus);
      } catch (err: unknown) {
        showError('Status Update Failed', err);
      } finally {
        statusBusyRef.current = false;
      }
    },
    [onStatusChange, promptWhatsAppNotification, repair.id, repair.status],
  );

  const handlePaymentClose = useCallback(() => {
    setPaymentModal(false);
  }, []);

  const handleStatusModalClose = useCallback(() => {
    setStatusModal(false);
  }, []);

  return (
    <Animated.View
      entering={FadeInUp.delay((index ?? 0) * 40).duration(300)}
    >
      <AppCard variant="outlined" style={styles.card}>
        <RepairInfo
          repair={repair}
          onPress={onPress}
          styles={styles}
          colors={colors}
        />

        <RepairActions
          repair={repair}
          pill={pill}
          statusLabel={statusLabel}
          onStatusChipPress={onStatusChange ? handleStatusChipPress : undefined}
          styles={styles}
          colors={colors}
        />

        {onStatusChange && (
          <StatusModal
            visible={statusModal}
            onClose={handleStatusModalClose}
            onSelect={handleStatusSelect}
            currentStatus={repair.status}
            deviceModel={repair.deviceModel}
          />
        )}

        {onStatusChange && (
          <PaymentModal
            visible={paymentModal}
            onClose={handlePaymentClose}
            onStatusChange={onStatusChange}
            repairId={repair.id}
            deviceModel={repair.deviceModel}
            customerName={repair.customerName}
            onStatusUpdated={promptWhatsAppNotification}
            styles={styles}
            colors={colors}
          />
        )}
      </AppCard>
    </Animated.View>
  );
});
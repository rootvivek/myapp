import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../context/ThemeContext';
import type { Repair, RepairStatus } from '../../types/repair';
import { REPAIR_STATUSES } from '../../types/repair';
import { getStatusPill, showError } from './constants';
import { PaymentModal } from './PaymentModal';
import { RepairActions } from './RepairActions';
import { RepairInfo } from './RepairInfo';
import { StatusModal } from './StatusModal';
import { createCardStyles } from './styles';

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
      } catch (err: unknown) {
        showError('Status Update Failed', err);
      } finally {
        statusBusyRef.current = false;
      }
    },
    [onStatusChange, repair.id, repair.status],
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
      style={styles.card}
    >
      <RepairInfo
        repair={repair}
        onPress={onPress}
        onPaymentPress={onStatusChange ? () => setPaymentModal(true) : undefined}
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
          styles={styles}
          colors={colors}
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
          styles={styles}
          colors={colors}
        />
      )}
    </Animated.View>
  );
});

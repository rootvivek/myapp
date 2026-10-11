import React from 'react';
import { View } from 'react-native';

import type { RepairStatus } from '../../types/repair';
import { REPAIR_STATUSES } from '../../types/repair';
import { LABELS } from './constants';
import { AppModal } from '../../components/ui/AppModal';
import { AppButton } from '../../components/ui/AppButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: RepairStatus) => void;
  currentStatus: RepairStatus;
  deviceModel: string;
};

export const StatusModal = React.memo(function StatusModal({
  visible,
  onClose,
  onSelect,
  currentStatus,
  deviceModel,
}: Props) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={LABELS.SET_STATUS}
      subtitle={deviceModel}
      size="medium"
      showCloseButton={true}
    >
      {REPAIR_STATUSES.map((s) => {
        const isCurrent = s.value === currentStatus;
        return (
          <View key={s.value} style={{ marginBottom: 4 }}>
            <AppButton
              variant={isCurrent ? 'primary' : 'outline'}
              fullWidth
              onPress={() => onSelect(s.value)}
              accessibilityRole="button"
              accessibilityLabel={`${s.label}${isCurrent ? ', current status' : ''}`}
              accessibilityState={{ selected: isCurrent }}
              style={{ marginBottom: 4 }}
            >
              {s.label}
              {isCurrent && '  ✓'}
            </AppButton>
          </View>
        );
      })}
    </AppModal>
  );
});
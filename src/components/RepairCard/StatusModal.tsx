import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

import type { AppColors } from '../../theme';
import type { RepairStatus } from '../../types/repair';
import { REPAIR_STATUSES } from '../../types/repair';
import { LABELS } from './constants';
import type { CardStyles } from './styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: RepairStatus) => void;
  currentStatus: RepairStatus;
  deviceModel: string;
  styles: CardStyles;
  colors: AppColors;
};

export const StatusModal = React.memo(function StatusModal({
  visible,
  onClose,
  onSelect,
  currentStatus,
  deviceModel,
  styles,
  colors,
}: Props) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' }}
      >
        <View style={styles.modalWrap}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={LABELS.CLOSE}
          />
          <View style={styles.modalOuter}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{LABELS.SET_STATUS}</Text>
              <Text style={styles.modalSub}>{deviceModel}</Text>
              {REPAIR_STATUSES.map((s) => {
                const isCurrent = s.value === currentStatus;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => onSelect(s.value)}
                    style={[styles.modalRow, isCurrent && styles.modalRowCur]}
                    android_ripple={{ color: 'rgba(124,58,237,0.12)' }}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.label}${isCurrent ? ', current status' : ''}`}
                    accessibilityState={{ selected: isCurrent }}
                  >
                    <Text
                      style={[
                        styles.modalRowText,
                        isCurrent && styles.modalRowTextCur,
                      ]}
                    >
                      {s.label}
                      {isCurrent ? '  ✓' : ''}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={onClose}
                style={styles.modalCancel}
                accessibilityRole="button"
                accessibilityLabel={LABELS.CANCEL}
              >
                <Text style={styles.modalCancelText}>{LABELS.CANCEL}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
});

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
  onSelect: (status: RepairStatus, sendWhatsApp?: boolean) => void;
  currentStatus: RepairStatus;
  deviceModel: string;
  customerPhone?: string;
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
<<<<<<< HEAD
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
=======
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
                <View key={s.value} style={{ marginBottom: 4 }}>
                  <Pressable
                    onPress={() => onSelect(s.value, false)}
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
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
<<<<<<< HEAD
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
=======
                  {(s.value === 'completed' || s.value === 'delivered') && !isCurrent ? (
                    <Pressable
                      onPress={() => onSelect(s.value, true)}
                      style={{
                        alignSelf: 'flex-end',
                        marginTop: -8,
                        marginBottom: 6,
                        marginRight: 8,
                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E' }}>
                        💬 Set & Notify via WhatsApp
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
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
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
          </View>
        </View>
      </Modal>
    </Portal>
  );
});

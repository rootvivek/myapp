import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { CheckSquare, Square } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { styles } from './styles';

type Props = {
  editingRepair: Repair | null;
  editCost: string;
  setEditCost: (val: string) => void;
  editAdvance: string;
  setEditAdvance: (val: string) => void;
  editPaid: boolean;
  setEditPaid: (val: boolean) => void;
  savingEdit: boolean;
  savingTarget: 'cash' | 'online' | null;
  onClose: () => void;
  onSavePayment: (type: 'cash' | 'online') => void;
  colors: AppColors;
};

export const EditPaymentModal = React.memo(function EditPaymentModal({
  editingRepair,
  editCost,
  setEditCost,
  editAdvance,
  setEditAdvance,
  editPaid,
  setEditPaid,
  savingEdit,
  savingTarget,
  onClose,
  onSavePayment,
  colors,
}: Props) {
  if (!editingRepair) return null;

  return (
    <Portal>
      <Modal
        visible={!!editingRepair}
        onDismiss={onClose}
        contentContainerStyle={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Payment</Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]} numberOfLines={1}>
                {editingRepair.customerName} · {editingRepair.deviceModel}
              </Text>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Total Repair Cost (₹)</Text>
                <TextInput
                  value={editCost}
                  onChangeText={setEditCost}
                  keyboardType="decimal-pad"
                  style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface2 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Advance Amount (₹)</Text>
                <TextInput
                  value={editAdvance}
                  onChangeText={setEditAdvance}
                  keyboardType="decimal-pad"
                  style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface2 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Pressable
                onPress={() => {
                  const nextPaid = !editPaid;
                  setEditPaid(nextPaid);
                  if (nextPaid) {
                    setEditAdvance(editCost);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}
              >
                {editPaid ? (
                  <CheckSquare size={20} color={colors.success} />
                ) : (
                  <Square size={20} color={colors.textMuted} />
                )}
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                  Mark as fully paid
                </Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => onSavePayment('cash')}
                  disabled={savingEdit}
                  style={[styles.modalBtn, { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }]}
                >
                  {savingTarget === 'cash' ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: colors.text, fontWeight: '700' }]}>💵 Cash</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => onSavePayment('online')}
                  disabled={savingEdit}
                  style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                >
                  {savingTarget === 'online' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>📱 Online</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
});

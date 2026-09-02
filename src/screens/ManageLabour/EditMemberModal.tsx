import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  visible: boolean;
  editName: string;
  setEditName: (val: string) => void;
  editPhone: string;
  setEditPhone: (val: string) => void;
  editBusy: boolean;
  onClose: () => void;
  onSave: () => void;
  colors: AppColors;
};

export const EditMemberModal = React.memo(function EditMemberModal({
  visible,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  editBusy,
  onClose,
  onSave,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Team Member</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="e.g. rahul123"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="9876543210"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={editBusy}
              style={[styles.saveBtn, editBusy && styles.dim]}
            >
              {editBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

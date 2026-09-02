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
  addName: string;
  setAddName: (val: string) => void;
  addPhone: string;
  setAddPhone: (val: string) => void;
  addPassword: string;
  setAddPassword: (val: string) => void;
  addBusy: boolean;
  onClose: () => void;
  onAdd: () => void;
  colors: AppColors;
};

export const AddMemberModal = React.memo(function AddMemberModal({
  visible,
  addName,
  setAddName,
  addPhone,
  setAddPhone,
  addPassword,
  setAddPassword,
  addBusy,
  onClose,
  onAdd,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Team Member</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={addName}
            onChangeText={setAddName}
            placeholder="e.g. rahul123"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={addPhone}
            onChangeText={setAddPhone}
            placeholder="9876543210"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={addPassword}
            onChangeText={setAddPassword}
            placeholder="Min 6 characters"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            secureTextEntry
          />

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onAdd}
              disabled={addBusy}
              style={[styles.saveBtn, addBusy && styles.dim]}
            >
              {addBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Create</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

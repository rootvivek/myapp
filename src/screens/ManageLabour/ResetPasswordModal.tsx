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
import { spacing } from '../../theme';
import type { UserProfile } from '../../types/profile';
import { createStyles } from './styles';

type Props = {
  visible: boolean;
  resettingUser: UserProfile | null;
  resetPassword: string;
  setResetPassword: (val: string) => void;
  resetBusy: boolean;
  onClose: () => void;
  onReset: () => void;
  colors: AppColors;
};

export const ResetPasswordModal = React.memo(function ResetPasswordModal({
  visible,
  resettingUser,
  resetPassword,
  setResetPassword,
  resetBusy,
  onClose,
  onReset,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Reset Password</Text>
          {resettingUser ? (
            <Text style={[styles.label, { marginBottom: spacing.md, textTransform: 'none' }]}>
              Set new password for {resettingUser.name || 'team member'}
            </Text>
          ) : null}

          <Text style={styles.label}>New Password</Text>
          <TextInput
            value={resetPassword}
            onChangeText={setResetPassword}
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
              onPress={onReset}
              disabled={resetBusy}
              style={[styles.saveBtn, resetBusy && styles.dim]}
            >
              {resetBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Reset</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

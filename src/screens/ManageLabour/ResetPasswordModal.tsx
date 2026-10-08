import React from 'react';

import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppModal } from '../../components/ui/AppModal';
import type { UserProfile } from '../../types/profile';

type Props = {
  visible: boolean;
  resettingUser: UserProfile | null;
  resetPassword: string;
  setResetPassword: (val: string) => void;
  resetBusy: boolean;
  onClose: () => void;
  onReset: () => void;
};

export const ResetPasswordModal = React.memo(function ResetPasswordModal({
  visible,
  resettingUser,
  resetPassword,
  setResetPassword,
  resetBusy,
  onClose,
  onReset,
}: Props) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Reset Password"
      subtitle={
        resettingUser
          ? `Set new password for ${resettingUser.name || 'team member'}`
          : undefined
      }
      closeOnOverlayPress={false}
      dismissableBackButton
      footer={
        <>
          <AppButton
            variant="secondary"
            onPress={onClose}
            accessibilityLabel="Cancel"
            containerStyle={{ flex: 1 }}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            loading={resetBusy}
            onPress={onReset}
            accessibilityLabel="Reset password"
            containerStyle={{ flex: 1 }}
          >
            Reset
          </AppButton>
        </>
      }
    >
      <AppInput
        label="New Password"
        value={resetPassword}
        onChangeText={setResetPassword}
        placeholder="Min 6 characters"
        secureTextEntry
        accessibilityLabel="New password"
      />
    </AppModal>
  );
});

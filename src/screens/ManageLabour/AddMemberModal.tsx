import React from 'react';

import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppModal } from '../../components/ui/AppModal';

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
}: Props) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Add Team Member"
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
            loading={addBusy}
            onPress={onAdd}
            accessibilityLabel="Create team member"
            containerStyle={{ flex: 1 }}
          >
            Create
          </AppButton>
        </>
      }
    >
      <AppInput
        label="Username"
        value={addName}
        onChangeText={setAddName}
        placeholder="e.g. rahul123"
        autoCapitalize="none"
        accessibilityLabel="Username"
      />

      <AppInput
        label="Phone number"
        value={addPhone}
        onChangeText={setAddPhone}
        placeholder="9876543210"
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
      />

      <AppInput
        label="Password"
        value={addPassword}
        onChangeText={setAddPassword}
        placeholder="Min 6 characters"
        secureTextEntry
        accessibilityLabel="Password"
      />
    </AppModal>
  );
});

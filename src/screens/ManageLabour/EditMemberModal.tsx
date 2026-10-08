import React from 'react';

import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { AppModal } from '../../components/ui/AppModal';

type Props = {
  visible: boolean;
  editName: string;
  setEditName: (val: string) => void;
  editPhone: string;
  setEditPhone: (val: string) => void;
  editBusy: boolean;
  onClose: () => void;
  onSave: () => void;
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
}: Props) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Edit Team Member"
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
            loading={editBusy}
            onPress={onSave}
            accessibilityLabel="Save changes"
            containerStyle={{ flex: 1 }}
          >
            Save
          </AppButton>
        </>
      }
    >
      <AppInput
        label="Username"
        value={editName}
        onChangeText={setEditName}
        placeholder="e.g. rahul123"
        autoCapitalize="none"
        accessibilityLabel="Username"
      />

      <AppInput
        label="Phone number"
        value={editPhone}
        onChangeText={setEditPhone}
        placeholder="9876543210"
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
      />
    </AppModal>
  );
});

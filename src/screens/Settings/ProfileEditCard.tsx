import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react-native';
import { spacing } from '../../theme';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';

type Props = {
  name: string;
  shopName: string;
  isOwner: boolean;
  busy: boolean;
  onSave: (name: string, shopName: string) => void;
};

export const ProfileEditCard = React.memo(function ProfileEditCard({
  name,
  shopName,
  isOwner,
  busy,
  onSave,
}: Props) {
  const [draftName, setDraftName] = useState(name);
  const [draftShopName, setDraftShopName] = useState(shopName);

  useEffect(() => {
    setDraftName(name);
    setDraftShopName(shopName);
  }, [name, shopName]);

  return (
    <AppCard>
      <AppInput
        label="Your name"
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Your name"
        editable={!busy}
        accessibilityLabel="Your name"
      />

      {isOwner && (
        <AppInput
          label="Shop name"
          value={draftShopName}
          onChangeText={setDraftShopName}
          placeholder="Shop name"
          editable={!busy}
          accessibilityLabel="Shop name"
        />
      )}

      <AppButton
        fullWidth
        loading={busy}
        disabled={busy}
        onPress={() => onSave(draftName, draftShopName)}
        leftIcon={<Save size={18} color="#FFFFFF" strokeWidth={2.4} />}
        accessibilityLabel="Save profile details"
        containerStyle={{ marginTop: spacing.sm }}
      >
        Save Details
      </AppButton>
    </AppCard>
  );
});

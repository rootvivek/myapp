import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Plus } from 'lucide-react-native';
import { sizes, spacing, type AppColors } from '../../../theme';
import { AppButton } from '../../../components/ui/AppButton';

type Props = {
  isEdit: boolean;
  saving: boolean;
  onSave: () => void;
  colors: AppColors;
};

export const SaveButton = React.memo(function SaveButton({
  isEdit,
  saving,
  onSave,
  colors,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      <AppButton
        variant="primary"
        fullWidth
        loading={saving}
        onPress={onSave}
        leftIcon={
          isEdit ? (
            <Check color="#FFFFFF" size={18} strokeWidth={2.4} />
          ) : (
            <Plus color="#FFFFFF" size={18} strokeWidth={2.4} />
          )
        }
        accessibilityLabel={isEdit ? 'Save changes' : 'Create repair job'}
        accessibilityState={{ busy: saving, disabled: saving }}
      >
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Repair Job'}
      </AppButton>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.gutter,
    borderTopWidth: sizes.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
});

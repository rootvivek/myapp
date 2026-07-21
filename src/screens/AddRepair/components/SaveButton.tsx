import React from 'react';
import { View } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { Plus } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import type { AddRepairStyles } from '../styles';

type Props = {
  isEdit: boolean;
  saving: boolean;
  onSave: () => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const SaveButton = React.memo(function SaveButton({
  isEdit,
  saving,
  onSave,
  styles,
  colors,
}: Props) {
  return (
    <View style={styles.bottomBtn}>
      <PaperButton
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving}
        style={styles.savePaperBtn}
        contentStyle={styles.savePaperBtnContent}
        labelStyle={styles.savePaperBtnLabel}
        buttonColor={colors.accent}
        textColor="#FFFFFF"
        icon={saving ? undefined : () => <Plus color="#FFFFFF" size={20} />}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Save changes' : 'Create job'}
        accessibilityState={{ busy: saving, disabled: saving }}
      >
        {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create job'}
      </PaperButton>
    </View>
  );
});

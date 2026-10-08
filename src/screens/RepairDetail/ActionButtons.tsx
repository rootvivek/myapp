import React from 'react';
import { View } from 'react-native';
import { FileText } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import { AppButton } from '../../components/ui/AppButton';
import { createStyles } from './styles';

type Props = {
  canModify: boolean;
  onPdf: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colors: AppColors;
};

export const ActionButtons = React.memo(function ActionButtons({
  canModify,
  onPdf,
  onEdit,
  onDelete,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.actions}>
      {/* Invoice */}
      <AppButton
        variant="primary"
        fullWidth
        leftIcon={<FileText size={18} color="#FFFFFF" strokeWidth={1.8} />}
        onPress={onPdf}
        accessibilityLabel="Generate invoice"
      >
        Generate Invoice
      </AppButton>
      {canModify && (
        <View style={{ flexDirection: 'row', gap: spacing.sm + 2 }}>
          <AppButton
            variant="secondary"
            onPress={onEdit}
            style={{ flex: 1 }}
            accessibilityLabel="Edit job"
          >
            Edit job
          </AppButton>
          <AppButton
            variant="danger"
            onPress={onDelete}
            style={{ paddingHorizontal: 20 }}
            accessibilityLabel="Delete job"
          >
            Delete
          </AppButton>
        </View>
      )}
    </View>
  );
});

import React from 'react';
import { View } from 'react-native';
import { FileText } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import { AppButton } from '../../components/ui/AppButton';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import { createStyles } from './styles';

type Props = {
  canModify: boolean;
  onPdf: () => void;
  onWhatsApp: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colors: AppColors;
};

export const ActionButtons = React.memo(function ActionButtons({
  canModify,
  onPdf,
  onWhatsApp,
  onEdit,
  onDelete,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.actions}>
      {/* Invoice & WhatsApp row */}
      <View style={{ flexDirection: 'row', gap: spacing.sm + 2 }}>
        <AppButton
          variant="primary"
          style={{ flex: 1 }}
          leftIcon={<FileText size={18} color="#FFFFFF" strokeWidth={1.8} />}
          onPress={onPdf}
          accessibilityLabel="Generate invoice"
          labelStyle={{ fontSize: 13 }}
        >
          Generate Invoice
        </AppButton>
        <AppButton
          variant="secondary"
          style={{ flex: 1 }}
          leftIcon={<WhatsAppIcon size={16} />}
          onPress={onWhatsApp}
          accessibilityLabel="Send status update on WhatsApp"
          labelStyle={{ fontSize: 13 }}
        >
          WhatsApp
        </AppButton>
      </View>
      {canModify && (
        <View style={{ flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.sm + 2 }}>
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

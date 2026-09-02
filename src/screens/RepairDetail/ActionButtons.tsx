import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FileText } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  canModify: boolean;
  onPdf: () => void;
  onEdit: () => void;
  onDelete: () => void;
  mode: 'light' | 'dark';
  colors: AppColors;
};

export const ActionButtons = React.memo(function ActionButtons({
  canModify,
  onPdf,
  onEdit,
  onDelete,
  mode,
  colors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <View style={styles.actions}>
      {/* Invoice */}
      <Pressable onPress={onPdf} style={styles.actionBtn}>
        <LinearGradient colors={['#7C3AED', '#4F46E5']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}>
          <View style={styles.actionBtnInner}>
            <FileText size={18} color="#fff" strokeWidth={1.8} />
            <Text style={styles.actionBtnText}>Generate Invoice</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Edit & Delete */}
      {canModify && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onEdit}
            style={[styles.actionBtnSecondary, { flex: 1 }]}
          >
            <Text style={styles.actionBtnSecondaryText}>Edit job</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert('Delete Repair', 'Are you sure? This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]);
            }}
            style={[
              styles.actionBtnSecondary,
              {
                borderColor: 'rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                paddingHorizontal: 20,
              },
            ]}
          >
            <Text style={[styles.actionBtnSecondaryText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

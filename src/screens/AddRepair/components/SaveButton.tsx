import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Check, Plus } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { radius, spacing } from '../../../theme';
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
  colors,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 10,
        paddingBottom: bottomPadding,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => [
          {
            borderRadius: radius.lg,
            overflow: 'hidden',
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 4,
          },
          (saving || pressed) && { opacity: 0.8 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Save changes' : 'Create job'}
        accessibilityState={{ busy: saving, disabled: saving }}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : isEdit ? (
            <Check color="#FFFFFF" size={20} strokeWidth={2.4} />
          ) : (
            <Plus color="#FFFFFF" size={20} strokeWidth={2.6} />
          )}
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Repair Job'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
});


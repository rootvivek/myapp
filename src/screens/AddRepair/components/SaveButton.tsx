import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
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
  const bottomPadding = Math.max(insets.bottom, 14);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 14,
        paddingBottom: bottomPadding,
        paddingHorizontal: 18,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={{
          backgroundColor: saving ? accentAlpha(colors.accent, 0.6) : colors.accent,
          height: 50,
          borderRadius: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }}
        accessibilityRole="button"
        accessibilityLabel={isEdit ? 'Save changes' : 'Create job'}
        accessibilityState={{ busy: saving, disabled: saving }}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Plus color="#FFFFFF" size={20} />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create job'}
        </Text>
      </Pressable>
    </View>
  );
});

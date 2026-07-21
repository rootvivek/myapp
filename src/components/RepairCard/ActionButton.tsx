import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import type { CardStyles } from './styles';

type Props = {
  icon: React.ReactNode;
  title: string;
  titleStyle: object;
  onPress: () => void;
  loading: boolean;
  disabled?: boolean;
  loadingColor: string;
  rippleColor: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  styles: CardStyles;
};

export const ActionButton = React.memo(function ActionButton({
  icon,
  title,
  titleStyle,
  onPress,
  loading,
  disabled = false,
  loadingColor,
  rippleColor,
  accessibilityLabel,
  accessibilityHint,
  styles,
}: Props) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.actionBtn, isDisabled && styles.disabled]}
      android_ripple={{ color: rippleColor }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loadingColor} />
      ) : (
        <>
          {icon}
          <Text style={titleStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
});

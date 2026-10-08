import React, { type ReactNode } from 'react';
import { Chip, type ChipProps } from 'react-native-paper';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes } from '../../theme';

export type ChipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface AppChipProps extends Omit<ChipProps, 'mode' | 'textStyle' | 'theme'> {
  variant?: ChipVariant;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

/**
 * The app's single chip/tag/badge. Wraps Paper `Chip`; colours and radius come
 * from the design system, selected + disabled states come from Paper.
 */
function AppChip({
  variant = 'default',
  children,
  containerStyle,
  labelStyle,
  disabled,
  style,
  ...rest
}: AppChipProps) {
  const { colors } = useAppTheme();

  const fill =
    variant === 'success'
      ? colors.success
      : variant === 'warning'
        ? colors.warning
        : variant === 'danger'
          ? colors.danger
          : variant === 'info' || variant === 'primary'
            ? colors.accent
            : colors.chipBg;

  const isFilled = variant !== 'default';
  const labelColor = isFilled ? '#FFFFFF' : colors.text;

  const chipStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius.sm,
      minHeight: 22,
      backgroundColor: disabled ? colors.surfaceDisabled : fill,
      borderWidth: isFilled ? 0 : sizes.hairline,
      borderColor: colors.border,
    },
    containerStyle,
    style as StyleProp<ViewStyle>,
  ];

  return (
    <Chip
      mode="flat"
      disabled={disabled}
      textStyle={[{ fontSize: 11, fontWeight: isFilled ? '600' : '500', color: labelColor }, labelStyle]}
      style={chipStyle}
      {...rest}
    >
      {children}
    </Chip>
  );
}

export { AppChip };

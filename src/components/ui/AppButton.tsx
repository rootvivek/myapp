import React, { type ReactNode } from 'react';
import { Button, type ButtonProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { accentAlpha, radius, sizes } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger';

export interface AppButtonProps
  extends Omit<ButtonProps, 'mode' | 'buttonColor' | 'textColor' | 'icon' | 'uppercase' | 'theme'> {
  /** Visual variant. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Stretch to the full width of the parent. */
  fullWidth?: boolean;
  /** Leading node (usually a lucide icon). Hidden automatically while `loading`. */
  leftIcon?: ReactNode;
  /** Extra style applied to the wrapper (margins, flex, ...). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The app's single button. A thin wrapper over React Native Paper `Button`
 * that maps our design-system variants onto Paper's `mode` + colour props, so
 * disabled/focus/ripple states come from the theme instead of hard-coded styles.
 */
function AppButton({
  variant = 'primary',
  fullWidth = false,
  leftIcon,
  loading = false,
  disabled,
  children,
  containerStyle,
  style,
  labelStyle,
  contentStyle,
  ...rest
}: AppButtonProps) {
  const { colors } = useAppTheme();

  const isDisabled = disabled || loading;

  const preset =
    variant === 'primary'
      ? { mode: 'contained' as const, buttonColor: colors.accent, textColor: '#FFFFFF' }
      : variant === 'secondary'
        ? { mode: 'contained' as const, buttonColor: colors.surface2, textColor: colors.text }
        : variant === 'danger'
          ? { mode: 'contained' as const, buttonColor: colors.danger, textColor: '#FFFFFF' }
          : variant === 'outline'
            ? { mode: 'outlined' as const, buttonColor: undefined, textColor: colors.accent }
            : { mode: 'text' as const, buttonColor: undefined, textColor: colors.accent };

  const buttonStyle: StyleProp<ViewStyle> = [
    { minHeight: sizes.buttonHeight, borderRadius: radius.md, paddingHorizontal: sizes.controlPadding },
    variant === 'outline' && { borderWidth: 1, borderColor: accentAlpha(colors.accent, 0.4) },
    variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
    fullWidth && { width: '100%' },
    containerStyle,
    style as StyleProp<ViewStyle>,
  ];

  return (
    <Button
      mode={preset.mode}
      buttonColor={preset.buttonColor}
      textColor={preset.textColor}
      loading={loading}
      disabled={isDisabled}
      icon={leftIcon ? () => leftIcon : undefined}
      style={buttonStyle}
      labelStyle={[{ fontSize: 15, fontWeight: '600', letterSpacing: -0.15 }, labelStyle]}
      contentStyle={[{ minHeight: sizes.buttonHeight - 2 }, contentStyle]}
      {...rest}
    >
      {children}
    </Button>
  );
}

export { AppButton };

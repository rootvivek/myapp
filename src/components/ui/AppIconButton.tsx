import React, { type ReactNode } from 'react';
import { IconButton, type IconButtonProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';

export interface AppIconButtonProps extends Omit<IconButtonProps, 'mode' | 'icon' | 'theme'> {
  variant?: IconButtonVariant;
  /** Container size in dp; the glyph scales with it. */
  size?: number;
  /**
   * Icon to render. Accepts an icon *element* (`<X size={18} />`), a Paper icon
   * name, or a component. Elements are the norm here (lucide-react-native).
   */
  icon?: ReactNode;
  /** Alternative to `icon` when the glyph is produced by a child expression. */
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Adapts our icon nodes to Paper's `IconSource` (which cannot take an element). */
function toIconSource(icon: ReactNode): IconButtonProps['icon'] {
  if (typeof icon === 'string') return icon;
  // Already a function component Paper can call.
  if (typeof icon === 'function') return icon;
  if (React.isValidElement(icon)) return () => icon;
  // Icon *components* (e.g. lucide's forwardRef icons): instantiate them with
  // the size/colour Paper asks for.
  if (icon && typeof icon === 'object') {
    return (props) =>
      React.createElement(icon as React.ElementType, {
        size: props.size,
        color: props.color,
      });
  }
  return () => null;
}

/**
 * The app's single icon button. Wraps Paper `IconButton` so hit area, ripple,
 * disabled and accessibility behaviour stay native to Paper.
 */
function AppIconButton({
  variant = 'tertiary',
  size = 40,
  icon,
  children,
  disabled,
  containerStyle,
  onPress,
  style,
  ...rest
}: AppIconButtonProps) {
  const { colors } = useAppTheme();

  const node = icon ?? children;

  const preset =
    variant === 'primary'
      ? { containerColor: colors.accent, iconColor: '#FFFFFF' }
      : variant === 'danger'
        ? { containerColor: colors.danger, iconColor: '#FFFFFF' }
        : variant === 'secondary'
          ? { containerColor: colors.surface2, iconColor: colors.text }
          : variant === 'ghost'
            ? { containerColor: 'transparent', iconColor: colors.textMuted }
            : { containerColor: 'transparent', iconColor: colors.accent };

  const iconSize = Math.round(size * 0.5);

  const buttonStyle: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: radius.full,
      backgroundColor: disabled ? colors.surfaceDisabled : preset.containerColor,
    },
    variant === 'secondary' && !disabled && { borderWidth: 1, borderColor: colors.border },
    containerStyle,
    style as StyleProp<ViewStyle>,
  ];

  return (
    <IconButton
      icon={node === undefined ? () => null : toIconSource(node)}
      size={iconSize}
      iconColor={disabled ? colors.onSurfaceDisabled : preset.iconColor}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={buttonStyle}
      {...rest}
    />
  );
}

AppIconButton.displayName = 'AppIconButton';

export { AppIconButton };

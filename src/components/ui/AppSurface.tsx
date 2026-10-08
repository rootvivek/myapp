import React, { type ReactNode } from 'react';
import { Surface, type SurfaceProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';

export interface AppSurfaceProps extends Omit<SurfaceProps, 'theme'> {
  variant?: 'default' | 'elevated' | 'tonal';
  /** Inner padding applied to the surface. */
  padding?: number;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Elevated/tonal container built on Paper `Surface`. Uses Paper's elevation
 * levels instead of hand-rolled shadow styles.
 */
function AppSurface({
  variant = 'default',
  padding = spacing.md,
  children,
  containerStyle,
  style,
  ...rest
}: AppSurfaceProps) {
  const { colors } = useAppTheme();

  const elevated = variant === 'elevated';

  const surfaceStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius.lg,
      backgroundColor: variant === 'tonal' ? colors.surface2 : colors.surface,
      borderColor: colors.border,
      borderWidth: variant === 'default' ? sizes.hairline : 0,
      padding,
    },
    containerStyle,
    style as StyleProp<ViewStyle>,
  ];

  return (
    <Surface
      mode={elevated ? 'elevated' : 'flat'}
      elevation={elevated ? 2 : 0}
      style={surfaceStyle as SurfaceProps['style']}
      {...rest}
    >
      {children}
    </Surface>
  );
}

export { AppSurface };

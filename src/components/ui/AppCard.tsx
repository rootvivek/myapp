import React, { type ReactNode } from 'react';
import { Card, type CardProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';

export interface AppCardProps extends Omit<CardProps, 'mode' | 'theme' | 'elevation'> {
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Inner padding applied to the whole card. */
  padding?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The app's single card: a Paper `Card` with the design-system radius, fill and
 * hairline border. Cards stay visually light — no gradients, no heavy shadows.
 */
function AppCard({
  variant = 'outlined',
  padding = spacing.sm,
  children,
  containerStyle,
  style,
  ...rest
}: AppCardProps) {
  const { colors } = useAppTheme();

  const mode = variant === 'outlined' ? 'contained' : variant === 'elevated' ? 'elevated' : 'contained';

  const cardStyle: StyleProp<ViewStyle> = [
    {
      borderRadius: radius.lg,
      backgroundColor: variant === 'filled' ? colors.surface2 : colors.surface,
      borderColor: colors.border,
      borderWidth: variant === 'outlined' ? sizes.hairline : 0,
      padding,
    },
    containerStyle,
    style as StyleProp<ViewStyle>,
  ];

  return (
    <Card mode={mode} style={cardStyle} {...rest}>
      {children}
    </Card>
  );
}

export { AppCard };

// Convenience exports for common card sections
export const AppCardCover = Card.Cover;
export const AppCardContent = Card.Content;
export const AppCardActions = Card.Actions;

import React, { type ReactNode } from 'react';
import { View, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

export interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  padding?: number;
}

/**
 * Standardized screen container ensuring consistent background color,
 * layout gutters, and optional scrolling across all screens.
 */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  padding = spacing.gutter,
}: ScreenContainerProps) {
  const { colors } = useAppTheme();

  const containerStyle: StyleProp<ViewStyle> = [
    {
      flex: 1,
      backgroundColor: colors.bg,
    },
    style,
  ];

  const innerStyle: StyleProp<ViewStyle> = [
    {
      padding,
      paddingBottom: spacing.xxl,
    },
    contentContainerStyle,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={innerStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, innerStyle]}>
      {children}
    </View>
  );
}

import React from 'react';
import { View, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

/**
 * Standardized section header with title, optional subtitle, and right-hand action element.
 */
export function SectionHeader({
  title,
  subtitle,
  rightAction,
  style,
  titleStyle,
}: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginVertical: spacing.md,
          paddingHorizontal: spacing.xs,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text
          style={[
            {
              fontSize: 18,
              fontWeight: '700',
              color: colors.text,
              letterSpacing: -0.3,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  );
}

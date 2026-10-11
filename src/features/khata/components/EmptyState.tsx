import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '../../../context/ThemeContext';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  icon?: LucideIcon;
  style?: ViewStyle;
};

export function EmptyState({
  title,
  description,
  actionButton,
  icon: Icon = BookOpen,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        ...style,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon
          size={32}
          color={colors.textMuted}
          strokeWidth={1.5}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' }}
      >
        {title}
      </Text>
      {description ? (
        <Text style={{ fontSize: 13, color: colors.textMuted, maxWidth: 260, textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {actionButton ? <View style={{ marginTop: 16 }}>{actionButton}</View> : null}
    </View>
  );
}

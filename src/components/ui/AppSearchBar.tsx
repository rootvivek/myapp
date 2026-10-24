import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { accentAlpha, radius, sizes } from '../../theme';

export interface AppSearchBarProps {
  /** Placeholder text. Defaults to "Search...". */
  placeholder?: string;
  /** Value for active text input mode. */
  value?: string;
  /** Callback when text changes (enables active text input mode). */
  onChangeText?: (text: string) => void;
  /** Callback when search bar is pressed (for navigation trigger mode). */
  onPress?: () => void;
  /** Callback when clear button is pressed. */
  onClear?: () => void;
  /** Auto focus when mounted. */
  autoFocus?: boolean;
  /** Container style overrides. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Return key type for keyboard. */
  returnKeyType?: 'search' | 'done' | 'go' | 'next';
  /** Submit editing callback. */
  onSubmitEditing?: () => void;
}

/**
  * Centralized search bar component supporting both touchable navigation triggers
  * and active text input modes, styled according to `src/theme.ts`.
  */
export function AppSearchBar({
  placeholder = 'Search customer, device, order ID...',
  value,
  onChangeText,
  onPress,
  onClear,
  autoFocus = false,
  containerStyle,
  returnKeyType = 'search',
  onSubmitEditing,
}: AppSearchBarProps) {
  const { colors } = useAppTheme();
  const isInputMode = typeof onChangeText === 'function';

  const barStyle: StyleProp<ViewStyle> = [
    {
      flex: 1,
      height: sizes.inputHeight, // 44
      borderRadius: radius.lg,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.controlPadding, // 16
      gap: 10,
    },
    containerStyle,
  ];

  if (!isInputMode) {
    return (
      <Pressable
        onPress={onPress}
        style={barStyle}
        android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      >
        <Search size={18} color={colors.accent} strokeWidth={2.2} />
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 14,
            fontWeight: '500',
            flex: 1,
          }}
          numberOfLines={1}
        >
          {placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={barStyle}>
      <Search size={18} color={colors.accent} strokeWidth={2.2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 14,
          fontWeight: '500',
          padding: 0,
        }}
      />
      {Boolean(value) && onClear && (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <X size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

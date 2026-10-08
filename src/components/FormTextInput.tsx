import React, { forwardRef, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppInput, type AppInputRef, type InputTrailingAction } from './ui/AppInput';

export type FormTextInputProps = {
  label?: ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  rightIcon?: LucideIcon;
  /** Compact trailing action rendered inside the input (e.g. "Scan"). */
  rightAction?: InputTrailingAction;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
  dense?: boolean;
};

/**
 * Backwards-compatible alias over `AppInput` (React Native Paper TextInput).
 * Kept so existing form call sites did not have to change their imports.
 */
export const FormTextInput = forwardRef<AppInputRef, FormTextInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      error,
      rightIcon,
      rightAction,
      containerStyle,
      style,
      multiline,
      numberOfLines,
      keyboardType,
      maxLength,
      autoCapitalize,
      returnKeyType,
      onSubmitEditing,
      editable,
      onFocus,
      onBlur,
      accessibilityLabel,
      dense,
    },
    ref
  ) => (
    <AppInput
      ref={ref}
      label={label}
      error={error}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      rightIcon={rightIcon}
      rightAction={rightAction}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      editable={editable}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityLabel={accessibilityLabel}
      dense={dense}
      containerStyle={containerStyle}
      inputStyle={style}
    />
  )
);

FormTextInput.displayName = 'FormTextInput';

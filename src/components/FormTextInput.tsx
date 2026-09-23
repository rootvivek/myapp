import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { HelperText, TextInput as PaperTextInput } from 'react-native-paper';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';

type PaperTextInputProps = React.ComponentProps<typeof PaperTextInput>;

export type FormTextInputProps = Omit<
  PaperTextInputProps,
  'mode' | 'error' | 'theme' | 'outlineColor' | 'activeOutlineColor' | 'textColor' | 'placeholderTextColor'
> & {
  /**
   * Validation message. When set, the outline turns red — **including while the
   * field is focused** — and the message is rendered under the input.
   */
  error?: string | null;
  /** Icon shown inside the input on the left. */
  icon?: LucideIcon;
  /** Icon shown inside the input on the right. */
  rightIcon?: LucideIcon;
  /** Style for the wrapper that also holds the error message (spacing/flex). */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Project-wide text input built on react-native-paper:
 * `TextInput` (outlined) + `HelperText` (error) so no screen has to repeat
 * theme/outline/error boilerplate.
 *
 * Usage:
 * ```tsx
 * <FormTextInput label="Phone" value={phone} onChangeText={setPhone}
 *   error={errors.phone} icon={Phone} containerStyle={styles.inputStack} />
 * ```
 */
export const FormTextInput = React.memo(function FormTextInput({
  error,
  icon: Icon,
  rightIcon: RightIcon,
  containerStyle,
  left,
  right,
  dense = true,
  style,
  ...rest
}: FormTextInputProps) {
  const { colors } = useTheme();
  const hasError = Boolean(error);

  // Paper merges this deep into its MD3 theme; `error` is what makes the
  // outline/label red (also in dark mode) instead of Paper's default red.
  const paperTheme = useMemo(
    () => ({
      colors: {
        background: colors.surface2,
        placeholder: colors.textMuted,
        error: colors.danger,
      },
    }),
    [colors]
  );

  return (
    <View style={containerStyle}>
      <PaperTextInput
        {...rest}
        dense={dense}
        style={[styles.input, style]}
        mode="outlined"
        error={hasError}
        // Keep the outline red in every state (idle *and* focused).
        outlineColor={hasError ? colors.danger : colors.border}
        activeOutlineColor={hasError ? colors.danger : colors.accent}
        textColor={colors.text}
        placeholderTextColor={colors.textMuted}
        theme={paperTheme}
        left={
          left ??
          (Icon ? (
            <PaperTextInput.Icon
              icon={() => <Icon size={18} color={hasError ? colors.danger : colors.accent} />}
            />
          ) : undefined)
        }
        right={
          right ??
          (RightIcon ? (
            <PaperTextInput.Icon
              icon={() => <RightIcon size={18} color={hasError ? colors.danger : colors.accent} />}
            />
          ) : undefined)
        }
      />

      {hasError ? (
        <HelperText type="error" visible padding="none" theme={paperTheme} style={styles.helper}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    fontSize: 14,
  },
  helper: {
    paddingVertical: 0,
    marginTop: 2,
  },
});

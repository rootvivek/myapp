import React, { forwardRef, useState, type ReactNode } from 'react';
import { Button, HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing, type AppColors } from '../../theme';
import type { LucideIcon } from 'lucide-react-native';

/** Ref type accepted by Paper's TextInput (and therefore by `AppInput`). */
export type AppInputRef = React.ComponentRef<typeof TextInput>;

/**
 * Shared label style for the "Label / [ input ]" form structure. Exported so
 * selects and any other control that cannot use `AppInput` still label fields
 * identically.
 */
export function appFieldLabelStyle(colors: AppColors): TextStyle {
  return {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: colors.text,
    marginBottom: sizes.labelGap,
  };
}

/** A compact trailing action rendered inside the input row (e.g. "Scan"). */
export type InputTrailingAction = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export interface AppInputProps
  extends Omit<TextInputProps, 'mode' | 'style' | 'theme' | 'error' | 'label' | 'left' | 'right'> {
  /** Label rendered above the input. */
  label?: ReactNode;
  /** Error message; renders Paper `HelperText` and the error border. */
  error?: string | null;
  /** Trailing icon (decorative affordance, e.g. calendar). */
  rightIcon?: LucideIcon;
  /** Trailing text action shown inside the input row. */
  rightAction?: InputTrailingAction;
  /** Extra style for the label + input + helper group. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the underlying Paper TextInput. */
  inputStyle?: StyleProp<TextStyle>;
  /** Render at 40dp instead of 48dp. */
  dense?: boolean;
}

/**
 * The app's single text input: a label, a Paper `TextInput` and an optional
 * helper/error line. Height, radius, padding, placeholder and focus/error
 * behaviour are identical everywhere because they are defined here once.
 */
const AppInput = forwardRef<AppInputRef, AppInputProps>(
  (
    {
      label,
      error,
      rightIcon: RightIcon,
      rightAction,
      containerStyle,
      inputStyle,
      dense = false,
      placeholder,
      value,
      onChangeText,
      editable = true,
      multiline,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { colors } = useAppTheme();
    const [focused, setFocused] = useState(false);
    const hasError = Boolean(error);

    const borderColor = hasError ? colors.danger : focused ? colors.accent : colors.border;

    const groupStyle: StyleProp<ViewStyle> = [{ marginBottom: spacing.sm }, containerStyle];

    const labelTextStyle = appFieldLabelStyle(colors);

    const trailing = RightIcon ? <RightIcon size={18} color={colors.textMuted} strokeWidth={2} /> : null;
    const hasTrailing = Boolean(rightAction || trailing);
    /* Paper only renders its `right` adornment for TextInputAffix/TextInputIcon
       nodes; a custom node is silently dropped, so the trailing action is
       overlaid inside the field instead. Reserve room so text/placeholder
       doesn't run underneath it. */
    const trailingReserve = (rightAction ? 92 : 0) + (trailing ? 26 : 0);

    return (
      <View style={groupStyle}>
        {label ? <Text style={labelTextStyle}>{label}</Text> : null}
        <View>
        <TextInput
          /* Paper declares two overlapping `ref` types on `TextInput` (the
             public handle and the native input's), and `forwardRef` can only
             name one instance type — neither type is exported, so this is the
             single unavoidable cast in this wrapper. */
          ref={ref as unknown as React.ComponentPropsWithRef<typeof TextInput>['ref']}
          mode="outlined"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          underlineColor="transparent"
          style={[
            {
              backgroundColor: editable ? colors.surface2 : colors.surface,
              borderRadius: radius.lg,
              height: dense ? sizes.inputHeightDense : multiline ? undefined : sizes.inputHeight,
              minHeight: multiline ? 96 : undefined,
              fontSize: 15,
              paddingRight: hasTrailing ? trailingReserve : undefined,
            },
            multiline && { paddingTop: spacing.sm },
            inputStyle,
          ]}
          theme={{
            roundness: radius.md,
            colors: {
              primary: colors.accent,
              background: editable ? colors.surface2 : colors.surface,
              placeholder: colors.textMuted,
              text: colors.text,
              error: colors.danger,
              outline: borderColor,
            },
          }}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {hasTrailing ? (
          <View style={trailingRowStyle}>
            {rightAction ? (
              <Button
                mode="text"
                compact
                textColor={colors.accent}
                onPress={rightAction.onPress}
                accessibilityLabel={rightAction.accessibilityLabel ?? rightAction.label}
                style={trailingActionStyle}
                labelStyle={{ fontSize: 13, fontWeight: '600' }}
              >
                {rightAction.label}
              </Button>
            ) : null}
            {trailing}
          </View>
        ) : null}
        </View>
        {hasError ? (
          <HelperText type="error" visible padding="none" style={errorTextStyle}>
            {error}
          </HelperText>
        ) : null}
      </View>
    );
  }
);

const trailingRowStyle: ViewStyle = {
  position: 'absolute',
  right: spacing.xs,
  top: 0,
  bottom: 0,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
};

const trailingActionStyle: ViewStyle = {
  minHeight: 32,
  borderRadius: radius.sm,
};

const errorTextStyle: TextStyle = {
  fontSize: 12,
  marginTop: 2,
  marginLeft: 2,
};

AppInput.displayName = 'AppInput';

export { AppInput };

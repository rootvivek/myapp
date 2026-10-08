import React, { useCallback, useState, type ReactNode } from 'react';
import { HelperText, Menu, TextInput, TouchableRipple, type MenuProps } from 'react-native-paper';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';
import { appFieldLabelStyle } from './AppInput';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps extends Omit<MenuProps, 'visible' | 'onDismiss' | 'anchor' | 'children' | 'theme'> {
  label?: ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  error?: string | null;
  disabled?: boolean;
  /** Show a search field inside the menu (for long option lists). */
  searchable?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The app's single dropdown. Paper ships no select control, so this is a thin
 * wrapper around Paper `Menu`: the trigger matches `AppInput` exactly (same
 * height, radius, border, focus and error states) and the rows are Paper
 * `Menu.Item`s.
 */
function AppSelect({
  label,
  placeholder = 'Select...',
  value,
  onChange,
  options,
  error,
  disabled = false,
  searchable = false,
  accessibilityLabel,
  containerStyle,
  ...menuRest
}: AppSelectProps) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasError = Boolean(error);

  const borderColor = hasError ? colors.danger : visible ? colors.accent : colors.border;
  const backgroundColor = disabled ? colors.surfaceDisabled : colors.surface2;

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setVisible(true);
      setSearchQuery('');
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      if (!option.disabled) {
        onChange?.(option.value);
        handleClose();
      }
    },
    [onChange, handleClose]
  );

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value ?? '';

  return (
    <View style={[{ marginBottom: spacing.sm }, containerStyle]}>
      {label ? <Text style={appFieldLabelStyle(colors)}>{label}</Text> : null}

      <Menu
        visible={visible}
        onDismiss={handleClose}
        anchorPosition="bottom"
        contentStyle={[
          styles.menu,
          { maxHeight: 260, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        style={styles.menuAnchor}
        {...menuRest}
        anchor={
          <TouchableRipple
            onPress={handleOpen}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? (typeof label === 'string' ? label : undefined) ?? placeholder}
            accessibilityState={{ expanded: visible, disabled }}
            style={[
              styles.trigger,
              {
                backgroundColor,
                borderColor,
                opacity: disabled ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.triggerRow}>
              <Text
                style={[
                  styles.triggerText,
                  { color: selectedLabel ? colors.text : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {selectedLabel || placeholder}
              </Text>
              {visible ? (
                <ChevronUp size={18} color={colors.textMuted} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} color={colors.textMuted} strokeWidth={2.2} />
              )}
            </View>
          </TouchableRipple>
        }
      >
        {searchable && (
          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <TextInput
              mode="outlined"
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
        )}
        {filteredOptions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No options found</Text>
        ) : (
          filteredOptions.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <Menu.Item
                key={`${opt.value}-${i}`}
                title={opt.label}
                disabled={opt.disabled}
                onPress={() => handleSelect(opt)}
                titleStyle={[
                  styles.itemText,
                  isSelected && { color: colors.accent, fontWeight: '600' },
                  opt.disabled && styles.itemTextDisabled,
                ]}
                accessibilityState={{ selected: isSelected, disabled: opt.disabled }}
              />
            );
          })
        )}
      </Menu>

      {hasError ? (
        <HelperText type="error" visible padding="none" style={styles.errorText}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: sizes.inputHeight,
    borderRadius: radius.md,
    borderWidth: sizes.hairline,
    justifyContent: 'center',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  menu: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuAnchor: {
    marginTop: spacing.xs,
  },
  searchWrap: {
    padding: spacing.sm,
    borderBottomWidth: sizes.hairline,
  },
  searchInput: {
    fontSize: 14,
  },
  itemText: {
    fontSize: 15,
  },
  itemTextDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    padding: spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 2,
  },
});

export { AppSelect };

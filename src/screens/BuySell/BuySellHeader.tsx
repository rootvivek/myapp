import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, QrCode, Search, X } from 'lucide-react-native';

import { AppIconButton } from '../../components/ui/AppIconButton';
import { useTheme } from '../../context/ThemeContext';
import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export type BuySellFilter = 'all' | 'buy' | 'sell';

export const FILTER_TABS: readonly { key: BuySellFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All Entries', icon: '📱' },
  { key: 'buy', label: 'Buy Phone', icon: '📥' },
  { key: 'sell', label: 'Sell Phone', icon: '📤' },
];

type Props = {
  onBack: () => void;
  onScanQr: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  typeFilter: BuySellFilter;
  onTypeFilterChange: (filter: BuySellFilter) => void;
  countAll: number;
  countBuy: number;
  countSell: number;
};

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    headerContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: sizes.hairline,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
    searchBar: {
      flex: 1,
      height: 44,
      borderRadius: radius.lg,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      padding: 0,
    },
    filterSection: {
      paddingVertical: spacing.xs,
    },
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.gutter,
    },
    filterChip: {
      height: 32,
      borderRadius: radius.sm,
      borderWidth: sizes.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 6,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}

export const BuySellHeader = React.memo(function BuySellHeader({
  onBack,
  onScanQr,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  countAll,
  countBuy,
  countSell,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getChipCount = (key: BuySellFilter) => {
    if (key === 'buy') return countBuy;
    if (key === 'sell') return countSell;
    return countAll;
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.searchRow}>
        <AppIconButton
          variant="secondary"
          size={40}
          icon={<ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />}
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
        />

        <View style={styles.searchBar}>
          <Search size={18} color={colors.accent} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phone, IMEI, customer..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <AppIconButton
          variant="secondary"
          size={44}
          icon={<QrCode size={20} color={colors.text} strokeWidth={2.2} />}
          accessibilityRole="button"
          accessibilityLabel="Scan QR"
          onPress={onScanQr}
        />
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TABS.map(({ key, label, icon }) => {
            const active = typeFilter === key;
            const count = getChipCount(key);
            return (
              <Pressable
                key={key}
                onPress={() => onTypeFilterChange(key)}
                accessibilityRole="tab"
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface2,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 11 }}>{icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? '#FFFFFF' : colors.textMuted, fontWeight: active ? '700' : '600' },
                  ]}
                  numberOfLines={1}
                >
                  {label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
});

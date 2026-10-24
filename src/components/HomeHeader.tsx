import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, QrCode } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { RepairStatus } from '../types/repair';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppChip } from './ui/AppChip';
import { AppIconButton } from './ui/AppIconButton';
import { AppSearchBar } from './ui/AppSearchBar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StatusFilter = 'all' | RepairStatus;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  statusFilter: StatusFilter;
  onStatusFilterChange: (key: StatusFilter) => void;
  searchVisible?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Filter chips data                                                  */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS: readonly { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'in_progress', label: 'Progress', icon: '🔄' },
  { key: 'completed', label: 'Repaired', icon: '✅' },
  { key: 'delivered', label: 'Delivered', icon: '📦' },
] as const;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
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
      gap: 10,
    },
    searchPlaceholder: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeHeader({ navigation, statusFilter, onStatusFilterChange, searchVisible = true }: Props) {
  const { colors } = useTheme();
  const { setActiveTab } = useTab();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* ── Search Bar & QR Scanner ── */}
      {searchVisible && (
        <View style={styles.searchRow}>
          <AppIconButton
            variant="secondary"
            size={40}
            icon={<ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            onPress={() => setActiveTab('home')}
          />
          <AppSearchBar
            onPress={() => navigation.navigate('Search')}
            placeholder="Search customer, device, order ID..."
          />

          <AppIconButton
            variant="secondary"
            size={44}
            icon={<QrCode size={20} color={colors.text} strokeWidth={2.2} />}
            accessibilityRole="button"
            accessibilityLabel="Scan QR or Barcode"
            onPress={() => navigation.navigate('ScanQr')}
          />
        </View>
      )}

      {/* ── Filter Chips ── */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_CHIPS.map(({ key, label, icon }) => {
            const active = statusFilter === key;
            return (
              <Pressable
                key={key}
                onPress={() => onStatusFilterChange(key)}
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
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
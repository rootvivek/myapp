import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { QrCode, Search } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { RepairStatus } from '../types/repair';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  { key: 'all', label: 'All Jobs', icon: '📋' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'in_progress', label: 'In Progress', icon: '🔄' },
  { key: 'completed', label: 'Repaired', icon: '✅' },
  { key: 'delivered', label: 'Delivered', icon: '📦' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
] as const;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      paddingBottom: spacing.xs,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.sm,
    },
    searchBar: {
      flex: 1,
      height: 44,
      borderRadius: radius.lg,
      borderWidth: 1,
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
    qrBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterSection: {
      paddingVertical: spacing.xs,
    },
    filterScroll: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.full,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    activeChip: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    chipIcon: {
      fontSize: 12,
    },
    chipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textMuted,
    },
    activeChipText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeHeader({ navigation, statusFilter, onStatusFilterChange, searchVisible = true }: Props) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* ── Search Bar & QR Scanner ── */}
      {searchVisible && (
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => navigation.navigate('Search')}
            style={styles.searchBar}
            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
            accessibilityRole="search"
            accessibilityLabel="Search repairs"
          >
            <Search size={18} color={colors.accent} strokeWidth={2.2} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search customer, device, order ID...
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('ScanQr')}
            style={styles.qrBtn}
            android_ripple={{ color: accentAlpha(colors.accent, 0.15) }}
            accessibilityRole="button"
            accessibilityLabel="Scan QR or Barcode"
          >
            <QrCode size={20} color={colors.accent} strokeWidth={2.2} />
          </Pressable>
        </View>
      )}

      {/* ── Filter Chips ── */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_CHIPS.map(({ key, label, icon }) => {
            const active = statusFilter === key;
            return (
              <Pressable
                key={key}
                onPress={() => onStatusFilterChange(key)}
                style={[styles.chip, active && styles.activeChip]}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.chipIcon}>{icon}</Text>
                <Text style={[styles.chipText, active && styles.activeChipText]}>
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
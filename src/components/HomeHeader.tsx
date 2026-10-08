import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, QrCode, Search } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import type { AppColors } from '../theme';
import { accentAlpha, radius, sizes, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { RepairStatus } from '../types/repair';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppChip } from './ui/AppChip';
import { AppIconButton } from './ui/AppIconButton';

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
      paddingHorizontal: spacing.md,
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
      paddingHorizontal: spacing.md,
    },
    filterScroll: {
      gap: spacing.xs,
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
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_CHIPS.map(({ key, label, icon }) => {
            const active = statusFilter === key;
            return (
              <AppChip
                key={key}
                variant={active ? 'primary' : 'default'}
                selected={active}
                showSelectedCheck={false}
                onPress={() => onStatusFilterChange(key)}
                accessibilityRole="tab"
                containerStyle={{ paddingHorizontal: 2 }}
                labelStyle={{
                  color: active ? '#FFFFFF' : colors.textMuted,
                  fontWeight: active ? '700' : '600',
                  fontSize: 11,
                }}
              >
                <Text style={{ fontSize: 11, marginRight: 6 }}>{icon}</Text>
                {label}
              </AppChip>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
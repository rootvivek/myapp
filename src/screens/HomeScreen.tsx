import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HamburgerIcon } from '../components/HamburgerIcon';
import { HomeSideMenu } from '../components/HomeSideMenu';
import { RepairCard } from '../components/RepairCard';

import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { updateRepairStatus } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import { REPAIR_STATUSES, type RepairStatus } from '../types/repair';

type StatusFilter = 'all' | RepairStatus;

const FILTER_CHIPS: readonly { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...REPAIR_STATUSES.map((s) => ({
    key: s.value as StatusFilter,
    label: s.value === 'completed' ? 'Repaired' : s.label,
  })),
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    main: {
      flex: 1,
      position: 'relative',
    },
    topContainer: {
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      gap: spacing.sm,
    },
    hamburgerBtn: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    filterSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      backgroundColor: colors.surface2,
    },
    filterScroll: {
      flexGrow: 0,
    },
    filterChipsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingBottom: 2,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: {
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.2),
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    filterChipText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 14,
      letterSpacing: 0.2,
    },
    filterChipTextActive: {
      color: colors.accent,
    },
    title: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'left',
      letterSpacing: -0.5,
    },
    iconBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    iconBtnText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 10,
    },
    fabPlus: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 28,
    },
    fabNew: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: 100,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xxl,
      paddingHorizontal: spacing.lg,
      fontSize: 16,
      lineHeight: 24,
    },
  });
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading, refresh } = useRepairs();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredRepairs = useMemo(() => {
    if (statusFilter === 'all') return repairs;
    return repairs.filter((r) => r.status === statusFilter);
  }, [repairs, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleStatusChange = useCallback(
    async (repairId: number, status: RepairStatus): Promise<void> => {
      await updateRepairStatus(repairId, status);
      await refresh();
    },
    [refresh]
  );

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleMenuOpen = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const handleFilterChange = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeSideMenu
        open={menuOpen}
        onClose={handleMenuClose}
        onPressShop={() => navigation.navigate('Settings')}
        onPressCustomers={() => navigation.navigate('CustomerDirectory')}
        topInset={insets.top}
      />
      <View style={styles.main}>
        <View style={styles.topContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={handleMenuOpen}
                style={styles.hamburgerBtn}
                android_ripple={{ color: colors.border }}
                hitSlop={8}
              >
                <HamburgerIcon lineColor={colors.text} />
              </Pressable>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                MCA Phone Wala
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={styles.iconBtn}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.iconBtnText}>Search</Text>
            </Pressable>
          </View>

          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContent}
              style={styles.filterScroll}
            >
              {FILTER_CHIPS.map(({ key, label }) => {
                const active = statusFilter === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleFilterChange(key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    android_ripple={{ color: colors.border }}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {loading && repairs.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={filteredRepairs}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {repairs.length === 0 ? 'No repairs yet.' : 'No jobs with this status.'}
              </Text>
            }
            renderItem={({ item }) => (
              <RepairCard
                repair={item}
                onPress={() => navigation.navigate('RepairDetail', { repairId: item.id })}
                onStatusChange={handleStatusChange}
              />
            )}
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New job"
          onPress={() => navigation.navigate('AddRepair', {})}
          style={[styles.fab, { bottom: spacing.md + insets.bottom }]}
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabNew}>New</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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

import { HomeSideMenu } from '../components/HomeSideMenu';
import { RepairCard } from '../components/RepairCard';
import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { updateRepairStatus } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, spacing } from '../theme';
import { REPAIR_STATUSES, type RepairStatus } from '../types/repair';

type StatusFilter = 'all' | RepairStatus;

const FILTER_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...REPAIR_STATUSES.map((s) => ({
    key: s.value as StatusFilter,
    label: s.value === 'completed' ? 'Repaired' : s.label,
  })),
];

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HamburgerIcon({ lineColor }: { lineColor: string }) {
  return (
    <View style={hamburgerStyles.icon} accessibilityLabel="Open menu">
      <View style={[hamburgerStyles.line, { backgroundColor: lineColor }]} />
      <View style={[hamburgerStyles.line, { backgroundColor: lineColor }]} />
      <View style={[hamburgerStyles.line, { backgroundColor: lineColor }]} />
    </View>
  );
}

const hamburgerStyles = StyleSheet.create({
  icon: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
  },
  line: {
    height: 2,
    borderRadius: 1,
    width: '100%',
  },
});

function createStyles(colors: AppColors) {
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
      borderRadius: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
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
      paddingVertical: 6,
      justifyContent: 'center',
    },
    filterSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface2,
    },
    filterScroll: {
      flexGrow: 0,
    },
    filterChipsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: 2,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipActive: {
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.2),
    },
    filterChipText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 13,
    },
    filterChipTextActive: {
      color: colors.accent,
    },
    title: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'left',
    },
    iconBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconBtnText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 28,
      backgroundColor: colors.accent,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
    },
    fabPlus: {
      color: '#fff',
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 24,
    },
    fabNew: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    list: {
      paddingHorizontal: 0,
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
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      fontSize: 15,
    },
  });
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading, refresh } = useRepairs();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
    async (repairId: number, status: RepairStatus) => {
      await updateRepairStatus(repairId, status);
      await refresh();
    },
    [refresh]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPressShop={() => navigation.navigate('Settings')}
        onPressCustomers={() => navigation.navigate('CustomerDirectory')}
        topInset={insets.top}
      />
      <View style={styles.main}>
        <View style={styles.topContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => setMenuOpen(true)}
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
                    onPress={() => setStatusFilter(key)}
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
                {repairs.length === 0
                  ? 'No repairs yet. Tap + below to add a job.'
                  : 'No jobs with this status.'}
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
          style={[
            styles.fab,
            {
              bottom: spacing.md + insets.bottom,
              shadowOpacity: 0.35,
            },
          ]}
          android_ripple={{ color: '#fff' }}
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabNew}>New</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

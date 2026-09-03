import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wrench } from 'lucide-react-native';
import { EmptyState } from '../components/EmptyState';
import { HomeHeader } from '../components/HomeHeader';
import type { StatusFilter } from '../components/HomeHeader';
import { RepairCard } from '../components/RepairCard';
import { RepairCardSkeleton } from '../components/Skeleton';

import {
  useFilteredRepairs,
  useRepairActions,
  useRepairsState,
} from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function createStyles(colors: AppColors) {
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgGradient[0] || colors.bg },
    main: { flex: 1, position: 'relative' },

    list: { paddingHorizontal: 6, paddingTop: spacing.sm, paddingBottom: 120 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });
  return s;
}

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading } = useRepairsState();
  const { refresh, updateRepairInState } = useRepairActions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const filteredRepairs = useFilteredRepairs(statusFilter);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleStatusChange = useCallback(
    async (
      repairId: number,
      status: RepairStatus,
      paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' }
    ): Promise<void> => {
<<<<<<< HEAD
      const existing = repairs.find((r) => r.id === repairId);
      if (!existing) return;
=======
      await updateRepairStatus(repairId, status, paymentUpdate);
      await refresh(true);
    },
    [refresh]
  );
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9

      const previousState: Partial<Repair> = {
        status: existing.status,
        isPaid: existing.isPaid,
        paymentType: existing.paymentType,
      };

      const localUpdates: Partial<Repair> = { status };
      if (paymentUpdate) {
        localUpdates.isPaid = paymentUpdate.isPaid;
        if (paymentUpdate.paymentType) {
          localUpdates.paymentType = paymentUpdate.paymentType;
        }
      }
      updateRepairInState(repairId, localUpdates);

      try {
        await repairService.updateStatus(repairId, status, paymentUpdate);
      } catch {
        // Rollback local state on error
        updateRepairInState(repairId, previousState);
      }
    },
    [repairs, updateRepairInState]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Repair; index: number }) => (
      <RepairCard
        repair={item}
        index={index}
        onPress={() => navigation.navigate('RepairDetail', { repairId: item.id })}
        onStatusChange={handleStatusChange}
      />
    ),
    [navigation, handleStatusChange]
  );

  const keyExtractor = useCallback((item: Repair) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.main}>
        <LinearGradient
          colors={colors.bgGradient}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />
        <HomeHeader
          navigation={navigation}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* ── Repair list ── */}
        {loading && repairs.length === 0 ? (
          <View style={styles.list}>
            <RepairCardSkeleton />
            <RepairCardSkeleton />
            <RepairCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filteredRepairs}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={handleRefresh}
<<<<<<< HEAD
=======
            stickySectionHeadersEnabled={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
            ListEmptyComponent={
              <EmptyState
                icon={<Wrench size={36} color={colors.accent} />}
                title={repairs.length === 0 ? 'No repairs yet' : 'No jobs found'}
                description={
                  repairs.length === 0
                    ? 'Tap the + button above to log your first repair job.'
                    : 'No repair jobs match the selected status filter.'
                }
                actionLabel={repairs.length === 0 ? 'Create Repair' : undefined}
                onAction={repairs.length === 0 ? () => navigation.navigate('AddRepair', {}) : undefined}
              />
            }
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

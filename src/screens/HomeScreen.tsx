import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Plus, Wrench } from 'lucide-react-native';
import { EmptyState } from '../components/EmptyState';
import { HomeHeader } from '../components/HomeHeader';
import type { StatusFilter } from '../components/HomeHeader';
import { RepairCard } from '../components/RepairCard';
import { RepairCardSkeleton } from '../components/Skeleton';
import { checkInternetConnection } from '../utils/network';

import { useAuth } from '../context/AuthContext';
import {
  useFilteredRepairs,
  useRepairActions,
  useRepairsState,
} from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function createStyles(colors: AppColors) {
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    main: { flex: 1, position: 'relative' },

    list: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, paddingBottom: 120 },

    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 99,
    },
  });
  return s;
}

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading } = useRepairsState();
  const { refresh, updateRepairInState } = useRepairActions();
  const { session } = useAuth();
  const { setActiveTab } = useTab();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const filteredRepairs = useFilteredRepairs(statusFilter);

  const handleRefresh = useCallback(async () => {
    const online = await checkInternetConnection();
    if (!online) {
      Alert.alert('Offline', 'No internet connection detected. Please check your network and try again.');
      return;
    }
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
      const existing = repairs.find((r) => r.id === repairId);
      if (!existing) return;

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
      } catch (error) {
        // Rollback local state on error
        updateRepairInState(repairId, previousState);
        throw error;
      }
    },
    [repairs, updateRepairInState]
  );

  // Guests must log in before opening a repair card.
  const handleOpenRepair = useCallback(
    (repairId: number) => {
      if (!session) {
        setActiveTab('settings'); // User tab → login / sign-up screen
        return;
      }
      navigation.navigate('RepairDetail', { repairId });
    },
    [session, navigation, setActiveTab]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Repair; index: number }) => (
      <RepairCard
        repair={item}
        index={index}
        onPress={() => handleOpenRepair(item.id)}
        onStatusChange={handleStatusChange}
      />
    ),
    [handleOpenRepair, handleStatusChange]
  );

  const keyExtractor = useCallback((item: Repair) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.main}>
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
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
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

        <TouchableOpacity
          onPress={() => navigation.navigate('AddRepair', {})}
          style={styles.fab}
          accessibilityLabel="Add New Job"
          accessibilityRole="button"
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Repeat, Search } from 'lucide-react-native';

import { EmptyState } from '../../components/EmptyState';
import { RepairCard } from '../../components/RepairCard';
import { RepairCardSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useRepairActions, useRepairsState } from '../../context/RepairsContext';
import { useTab } from '../../context/TabContext';
import { useTheme } from '../../context/ThemeContext';
import type { RootStackParamList } from '../../navigation/types';
import { repairService } from '../../services/repairService';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import type { Repair, RepairStatus } from '../../types/repair';
import { checkInternetConnection } from '../../utils/network';
import { BuySellHeader, type BuySellFilter } from './BuySellHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'BuySell'>;

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
    list: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.sm,
      paddingBottom: 120,
    },
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
}

export function BuySellScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading } = useRepairsState();
  const { refresh, updateRepairInState } = useRepairActions();
  const { session } = useAuth();
  const { setActiveTab } = useTab();

  const [typeFilter, setTypeFilter] = useState<BuySellFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filter only Buy & Sell entries
  const allBuySellEntries = useMemo(() => {
    return repairs.filter((r) => r.transactionType === 'buy' || r.transactionType === 'sell');
  }, [repairs]);

  // Counts for filter chips
  const countAll = allBuySellEntries.length;
  const countBuy = useMemo(
    () => allBuySellEntries.filter((r) => r.transactionType === 'buy').length,
    [allBuySellEntries]
  );
  const countSell = useMemo(
    () => allBuySellEntries.filter((r) => r.transactionType === 'sell').length,
    [allBuySellEntries]
  );

  // Tab filter
  const tabFiltered = useMemo(() => {
    if (typeFilter === 'buy') {
      return allBuySellEntries.filter((r) => r.transactionType === 'buy');
    }
    if (typeFilter === 'sell') {
      return allBuySellEntries.filter((r) => r.transactionType === 'sell');
    }
    return allBuySellEntries;
  }, [allBuySellEntries, typeFilter]);

  // Search filter
  const displayedEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((r) => {
      const name = r.customerName?.toLowerCase() || '';
      const phone = r.phone?.toLowerCase() || '';
      const model = r.deviceModel?.toLowerCase() || '';
      const imei = r.imei?.toLowerCase() || '';
      const order = r.orderCode?.toLowerCase() || '';
      return (
        name.includes(q) ||
        phone.includes(q) ||
        model.includes(q) ||
        imei.includes(q) ||
        order.includes(q)
      );
    });
  }, [tabFiltered, searchQuery]);

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
        updateRepairInState(repairId, previousState);
        throw error;
      }
    },
    [repairs, updateRepairInState]
  );

  const handleOpenRepair = useCallback(
    (repairId: number) => {
      if (!session) {
        setActiveTab('settings');
        return;
      }
      navigation.navigate('RepairDetail', { repairId });
    },
    [session, navigation, setActiveTab]
  );

  const handleCreate = useCallback(() => {
    if (!session) {
      setActiveTab('settings');
      return;
    }

    navigation.navigate('AddRepair', {
      transactionType: typeFilter === 'sell' ? 'sell' : 'buy',
    });
  }, [session, typeFilter, navigation, setActiveTab]);

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
        {/* ── Header with Search & Filter Chips ── */}
        <BuySellHeader
          onBack={() => navigation.goBack()}
          onScanQr={() => navigation.navigate('ScanQr')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          countAll={countAll}
          countBuy={countBuy}
          countSell={countSell}
        />

        {/* ── List of Buy & Sell entries ── */}
        {loading && allBuySellEntries.length === 0 ? (
          <View style={styles.list}>
            <RepairCardSkeleton />
            <RepairCardSkeleton />
            <RepairCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={displayedEntries}
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
                icon={
                  searchQuery ? (
                    <Search size={36} color={colors.accent} />
                  ) : (
                    <Repeat size={36} color={colors.accent} />
                  )
                }
                title={allBuySellEntries.length === 0 ? 'No Buy / Sell entries yet' : 'No matching entries'}
                description={
                  allBuySellEntries.length === 0
                    ? 'Tap the + button below to log your first Buy or Sell phone.'
                    : 'No buy or sell records match the current filter or search.'
                }
                actionLabel={allBuySellEntries.length === 0 ? 'Create Entry' : undefined}
                onAction={allBuySellEntries.length === 0 ? handleCreate : undefined}
              />
            }
            renderItem={renderItem}
          />
        )}

        {/* ── Floating Action Button ── */}
        <TouchableOpacity
          onPress={handleCreate}
          style={styles.fab}
          accessibilityLabel="New Buy / Sell Entry"
          accessibilityRole="button"
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

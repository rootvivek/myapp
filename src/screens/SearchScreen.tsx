import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { QrCode, Search, X } from 'lucide-react-native';

import { AppChip } from '../components/ui/AppChip';
import { AppIconButton } from '../components/ui/AppIconButton';
import { RepairCard } from '../components/RepairCard';
import { useRepairActions, useRepairsState } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    searchbar: {
      flex: 1,
      height: 46,
      justifyContent: 'center',
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    list: {
      paddingHorizontal: 6,
      paddingBottom: spacing.xl,
    },
  });
}

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { updateRepairInState } = useRepairActions();
  const { repairs } = useRepairsState();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Display', 'Battery', 'Unpaid', 'Pending']);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(text);
      const trimmed = text.trim();
      if (trimmed.length >= 3) {
        setRecentSearches(prev => {
          const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
          return [trimmed, ...filtered].slice(0, 5);
        });
      }
    }, 220);
  }, []);

  // Cancel the pending debounce on unmount so it can't setState after the
  // screen is gone.
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const filteredResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const normalizedQuery = q.replace(/[%_,#\- ]/g, '');
    const digitsOnly = q.replace(/\D/g, '');

    return repairs.filter((repair) => {
      // 1. Customer Name
      if (
        repair.customerName.toLowerCase().includes(q) ||
        repair.customerName.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }
      // 2. Phone
      if (
        repair.phone.includes(normalizedQuery) ||
        (digitsOnly && repair.phone.includes(digitsOnly))
      ) {
        return true;
      }
      // 3. IMEI
      if (
        repair.imei.includes(normalizedQuery) ||
        (digitsOnly && repair.imei.includes(digitsOnly))
      ) {
        return true;
      }
      // 4. Device Model
      if (repair.deviceModel.toLowerCase().includes(q)) {
        return true;
      }
      // 5. Order Code / ID
      if (
        repair.orderCode.toLowerCase().includes(q) ||
        repair.orderCode.toLowerCase().includes(normalizedQuery)
      ) {
        return true;
      }
      // Record ID (direct integer match)
      if (
        String(repair.id) === normalizedQuery ||
        (digitsOnly && String(repair.id) === digitsOnly)
      ) {
        return true;
      }
      // Padded digits for order code (e.g. '5' matches 'ord00005')
      if (
        digitsOnly &&
        repair.orderCode.includes(digitsOnly.padStart(5, '0'))
      ) {
        return true;
      }

      return false;
    });
  }, [repairs, debouncedQuery]);

  const handleStatusChange = useCallback(
    async (
      repairId: number,
      status: RepairStatus,
      paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' }
    ): Promise<void> => {
      const existing = repairs.find((r) => r.id === repairId);
      // Snapshot the fields we are about to change so a failed request can be
      // rolled back (the optimistic update below has no context-level rollback).
      const snapshot: Partial<Repair> = existing
        ? { status: existing.status, isPaid: existing.isPaid, paymentType: existing.paymentType }
        : { status };

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
        updateRepairInState(repairId, snapshot);
      }
    },
    [repairs, updateRepairInState]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Repair; index: number }) => (
      <RepairCard
        repair={item}
        index={index}
        onPress={() =>
          navigation.navigate('RepairDetail', {
            repairId: item.id,
          })
        }
        onStatusChange={handleStatusChange}
      />
    ),
    [navigation, handleStatusChange]
  );

  const keyExtractor = useCallback((item: Repair) => String(item.id), []);

  // Only show "no results" once the debounced query matches what the user has
  // typed, otherwise the empty state flashes while typing.
  const showNoResults = debouncedQuery.trim().length > 0 && debouncedQuery === query;

  return (
    <View style={styles.safe}>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search name, number, or order ID"
          placeholderTextColor={colors.textMuted}
          onChangeText={handleQueryChange}
          value={query}
          style={styles.searchbar}
          icon={({ size }) => <Search size={18} color={colors.accent} />}
          clearIcon={({ size }) => <X size={18} color={colors.textMuted} />}
          inputStyle={{ color: colors.text, fontSize: 14, minHeight: 0, paddingVertical: 0, alignSelf: 'center' }}
          theme={{ colors: { elevation: { level3: colors.surface } } }}
          autoFocus
        />
        <AppIconButton
          variant="secondary"
          icon={<QrCode size={20} color={colors.accent} />}
          onPress={() => navigation.navigate('ScanQr')}
          accessibilityLabel="Scan barcode"
        />
      </View>

      {/* ── Recent searches ── */}
      {query.trim() === '' && recentSearches.length > 0 && (
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Recent Searches
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {recentSearches.map((term) => (
              <AppChip
                key={term}
                onPress={() => {
                  setQuery(term);
                  setDebouncedQuery(term);
                }}
              >
                {term}
              </AppChip>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={filteredResults}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          showNoResults ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: spacing.xl }}>
              <Search size={48} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: spacing.md }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.xs }}>
                No Results Found
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
                We couldn't find any job matching "{query}". Try checking spelling, names, or order IDs.
              </Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
    </View>
  );
}

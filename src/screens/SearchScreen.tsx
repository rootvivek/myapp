import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { QrCode, Search, X } from 'lucide-react-native';

import { RepairCard } from '../components/RepairCard';
import { useRepairActions, useRepairsState } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bgGradient[0] || colors.bg,
    },
    searchbar: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    list: {
      paddingHorizontal: 6,
      paddingBottom: spacing.xl,
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
      fontSize: 14,
      fontWeight: '500',
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
        // Context handles rollback if necessary
      }
    },
    [updateRepairInState]
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

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={colors.bgGradient}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 4, marginBottom: spacing.sm, gap: 10 }}>
        <Searchbar
          placeholder="Search name, number, or order ID"
          placeholderTextColor={colors.textMuted}
          onChangeText={handleQueryChange}
          value={query}
          style={[styles.searchbar, { marginHorizontal: 0, marginTop: 0, marginBottom: 0, flex: 1, height: 46, justifyContent: 'center' }]}
          icon={({ size }) => <Search size={18} color={colors.accent} />}
          clearIcon={({ size }) => <X size={18} color={colors.textMuted} />}
          inputStyle={{ color: colors.text, fontSize: 14, minHeight: 0, paddingVertical: 0, alignSelf: 'center' }}
          theme={{ colors: { elevation: { level3: colors.surface } } }}
          autoFocus
        />
        <Pressable
          onPress={() => navigation.navigate('ScanQr')}
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          android_ripple={{ color: colors.border }}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
        >
          <QrCode size={20} color={colors.accent} />
        </Pressable>
      </View>

      {/* ── Recent searches ── */}
      {query.trim() === '' && recentSearches.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Recent Searches
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recentSearches.map((term, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setQuery(term);
                  setDebouncedQuery(term);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                android_ripple={{ color: colors.border }}
              >
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={filteredResults}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim() ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 32 }}>
              <Search size={48} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: 14 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 }}>
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

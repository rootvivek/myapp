import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RepairCard } from '../components/RepairCard';
import { useTheme } from '../context/ThemeContext';
import { searchRepairs, updateRepairStatus } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';
import { formatDateDisplay } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bgGradient[0] || colors.bg,
    },
    searchbar: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    list: {
      paddingHorizontal: 0,
      paddingBottom: spacing.xl,
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    sectionHeader: {
      backgroundColor: colors.bgGradient[0] || colors.bg,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeaderText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
      textAlign: 'center',
    },
  });
}

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Repair[]>([]);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runSearch = useCallback(async (q: string): Promise<void> => {
    const currentRequestId = ++requestIdRef.current;
    try {
      const list = await searchRepairs(q);
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setResults(list);
      }
    } catch {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setResults([]);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleStatusChange = useCallback(
    async (
      repairId: number,
      status: RepairStatus,
      paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' }
    ): Promise<void> => {
      await updateRepairStatus(repairId, status, paymentUpdate);
      if (mountedRef.current) {
        await runSearch(query);
      }
    },
    [query, runSearch]
  );

  const sections = useMemo(() => {
    const groups: Record<string, Repair[]> = {};
    for (const r of results) {
      const date = r.dateReceived || 'Unknown Date';
      if (!groups[date]) groups[date] = [];
      groups[date].push(r);
    }
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({
      title: formatDateDisplay(date) || date,
      data: groups[date],
    }));
  }, [results]);

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    ),
    [styles.sectionHeader, styles.sectionHeaderText]
  );

  const renderItem = useCallback(
    ({ item }: { item: Repair }) => (
      <RepairCard
        repair={item}
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={colors.bgGradient}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />
      <Searchbar
        placeholder="Search name, phone, or IMEI"
        placeholderTextColor={colors.textMuted}
        onChangeText={setQuery}
        value={query}
        style={styles.searchbar}
        iconColor={colors.accent}
        inputStyle={{ color: colors.text }}
        theme={{ colors: { elevation: { level3: colors.surface } } }}
        autoFocus
      />
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <Text style={styles.empty}>No matches. Try another keyword.</Text>
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

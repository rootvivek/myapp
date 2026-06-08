import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RepairCard } from '../components/RepairCard';
import { useTheme } from '../context/ThemeContext';
import { searchRepairs, updateRepairStatus } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    input: {
      marginHorizontal: 0,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface2,
      borderWidth: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      borderRadius: 0,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 16,
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
  });
}

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Repair[]>([]);

  const runSearch = useCallback(async (q: string): Promise<void> => {
    const list = await searchRepairs(q);
    setResults(list);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleStatusChange = useCallback(
    async (repairId: number, status: RepairStatus): Promise<void> => {
      await updateRepairStatus(repairId, status);
      await runSearch(query);
    },
    [query, runSearch]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TextInput
        style={styles.input}
        placeholder="Search name, phone, or IMEI"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoFocus
        autoCorrect={false}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No matches. Try another keyword.</Text>
        }
        renderItem={({ item }) => (
          <RepairCard
            repair={item}
            onPress={() =>
              navigation.navigate('RepairDetail', {
                repairId: item.id,
              })
            }
            onStatusChange={handleStatusChange}
          />
        )}
      />
    </SafeAreaView>
  );
}

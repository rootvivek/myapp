import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

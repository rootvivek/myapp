import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeHeader } from '../components/HomeHeader';
import type { StatusFilter } from '../components/HomeHeader';
import { RepairCard } from '../components/RepairCard';

import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { updateRepairStatus } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { RepairStatus } from '../types/repair';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function createStyles(colors: AppColors) {
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgGradient[0] || colors.bg },
    main: { flex: 1, position: 'relative' },

    list: { paddingHorizontal: 6, paddingTop: spacing.sm, paddingBottom: 120 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xxl,
      paddingHorizontal: spacing.lg,
      fontSize: 15,
      lineHeight: 22,
    },
  });
  return s;
}

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairs, loading, refresh } = useRepairs();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');

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
      </View>
    </SafeAreaView>
  );
}

import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import { getDirectoryCustomers } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { DirectoryCustomer } from '../types/customer';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDirectory'>;

function sortCustomers(list: DirectoryCustomer[]): DirectoryCustomer[] {
  return [...list].sort((a, b) => {
    const an = a.customerName.trim().toLowerCase() || a.phone;
    const bn = b.customerName.trim().toLowerCase() || b.phone;
    return an.localeCompare(bn, undefined, { sensitivity: 'base' });
  });
}

function telUri(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  return d.length > 0 ? `tel:${d}` : null;
}

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    search: {
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
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: 0,
      paddingBottom: spacing.xl,
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      overflow: 'hidden',
      marginBottom: 2,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    avatarText: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '800',
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    phone: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    device: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    callBtn: {
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
      backgroundColor: colors.surface2,
    },
    callBtnText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 14,
    },
  });
}

export function CustomerDirectoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<DirectoryCustomer[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async (): Promise<void> => {
    try {
      const list = await getDirectoryCustomers();
      setCustomers(sortCustomers(list));
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [customers, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TextInput
        style={styles.search}
        placeholder="Search name or number"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {loading && customers.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.phone}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {customers.length === 0
                ? 'No customers yet. Save a repair job to add people here.'
                : 'No matches. Try another search.'}
            </Text>
          }
          renderItem={({ item }) => {
            const name = item.customerName.trim() || '—';
            const initial = (name === '—' ? '?' : name).slice(0, 1).toUpperCase();
            const href = telUri(item.phone);
            return (
              <View style={styles.row}>
                <Pressable
                  onPress={() => navigation.navigate('AddRepair', { prefillCustomer: item })}
                  style={styles.rowMain}
                  android_ripple={{ color: colors.border }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={2}>
                      {name}
                    </Text>
                    <Text style={styles.phone} selectable>
                      {item.phone}
                    </Text>
                    {item.deviceModel ? (
                      <Text style={styles.device} numberOfLines={1}>
                        Last device: {item.deviceModel}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                {href ? (
                  <Pressable
                    onPress={() => void Linking.openURL(href)}
                    style={styles.callBtn}
                    android_ripple={{ color: colors.border }}
                  >
                    <Text style={styles.callBtnText}>Call</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

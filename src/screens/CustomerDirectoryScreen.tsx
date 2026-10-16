import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Appbar, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Search, X, ArrowLeft, Phone } from 'lucide-react-native';
import { AppActivityIndicator } from '../components/ui/AppActivityIndicator';
import { EmptyState } from '../components/EmptyState';
import { AppIconButton } from '../components/ui/AppIconButton';
import { useTheme } from '../context/ThemeContext';
import { dialPhone } from '../utils/phone';
import { useRepairs } from '../context/RepairsContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';
import type { DirectoryCustomer } from '../types/customer';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDirectory'>;

function sortCustomers(list: DirectoryCustomer[]): DirectoryCustomer[] {
  return [...list].sort((a, b) => {
    const an = a.customerName.trim().toLowerCase() || a.phone;
    const bn = b.customerName.trim().toLowerCase() || b.phone;
    return an.localeCompare(bn, undefined, { sensitivity: 'base' });
  });
}

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    searchbar: {
      flex: 1,
      height: 44,
      marginHorizontal: spacing.sm,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: 0,
      paddingBottom: 100,
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
      borderRadius: radius.full,
      backgroundColor: colors.surface2,
      borderWidth: sizes.hairline,
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
      alignSelf: 'center',
      marginRight: spacing.sm,
    },
  });
}

/** Last-10-digit key, consistent with matchPhone() in CustomerHistoryModal. */
function phoneKey(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function CustomerDirectoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { repairs, loading } = useRepairs();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const customers = useMemo(() => {
    // Pre-index repair ids by phone/name so each customer's job count is a cheap
    // set union instead of scanning the whole repairs array per row (O(n*m)).
    const byPhone = new Map<string, Set<number>>();
    const byName = new Map<string, Set<number>>();
    const addTo = (map: Map<string, Set<number>>, key: string, id: number) => {
      if (!key) return;
      let set = map.get(key);
      if (!set) {
        set = new Set<number>();
        map.set(key, set);
      }
      set.add(id);
    };

    const seen = new Set<string>();
    const out: DirectoryCustomer[] = [];

    for (const r of repairs) {
      const p = (r.phone || '').trim();
      const nameKey = (r.customerName || '').trim().toLowerCase();
      addTo(byPhone, phoneKey(p), r.id);
      addTo(byName, nameKey, r.id);

      if (!p || seen.has(p)) continue;
      seen.add(p);
      out.push({
        phone: p,
        customerName: r.customerName || '',
        deviceModel: r.deviceModel || '',
      });
    }

    return sortCustomers(out).map((c) => {
      const ids = new Set<number>();
      byPhone.get(phoneKey(c.phone))?.forEach((id) => ids.add(id));
      if (c.customerName) {
        byName.get(c.customerName.trim().toLowerCase())?.forEach((id) => ids.add(id));
      }
      return { ...c, jobCount: ids.size };
    });
  }, [repairs]);

  const handleCall = useCallback((phone: string) => {
    void dialPhone(phone);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [customers, query]);

  const renderItem = useCallback(
    ({ item }: { item: DirectoryCustomer }) => {
      const name = item.customerName.trim() || '—';
      const initial = (name === '—' ? '?' : name).slice(0, 1).toUpperCase();
      const jobCount = item.jobCount ?? 0;

      return (
        <View style={styles.row}>
          <Pressable
            onPress={() => navigation.navigate('CustomerHistory', {
              customer: {
                customerName: item.customerName,
                phone: item.phone,
              },
            })}
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
              <Text style={[styles.device, { color: colors.accent, fontWeight: '600' }]} numberOfLines={1}>
                {jobCount} {jobCount === 1 ? 'Job' : 'Jobs'} • Tap for History & Warranties
              </Text>
            </View>
          </Pressable>
          {item.phone ? (
            <AppIconButton
              variant="secondary"
              icon={<Phone size={20} color={colors.accent} />}
              onPress={() => handleCall(item.phone)}
              accessibilityLabel={`Call ${item.phone}`}
              containerStyle={styles.callBtn}
            />
          ) : null}
        </View>
      );
    },
    [colors, handleCall, navigation, styles]
  );

  const keyExtractor = useCallback((item: DirectoryCustomer) => item.phone, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Appbar.Header
        mode="center-aligned"
        style={{ backgroundColor: colors.surface, elevation: 0 }}
      >
        <Appbar.Action
          icon={() => <ArrowLeft size={22} color={colors.text} />}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Searchbar
          placeholder="Search name or number"
          placeholderTextColor={colors.textMuted}
          onChangeText={setQuery}
          value={query}
          style={styles.searchbar}
          icon={() => <Search size={18} color={colors.accent} />}
          clearIcon={() => <X size={18} color={colors.textMuted} />}
          inputStyle={{ color: colors.text, fontSize: 14, minHeight: 0, paddingVertical: 0, alignSelf: 'center' }}
          theme={{ colors: { elevation: { level3: colors.surface } } }}
        />
      </Appbar.Header>
      {loading && customers.length === 0 ? (
        <View style={styles.centered}>
          <AppActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title={customers.length === 0 ? 'No customers yet.' : 'No matches.'}
              description={
                customers.length === 0
                  ? 'Save a repair job to add people here.'
                  : 'Try another search.'
              }
            />
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

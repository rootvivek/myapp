import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Search, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useRepairs } from '../context/RepairsContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { DirectoryCustomer } from '../types/customer';
import { CustomerHistoryModal, matchPhone } from '../components/CustomerHistoryModal';

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
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: 0,
      paddingBottom: 100,
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
  const { repairs, loading } = useRepairs();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const customers = useMemo(() => {
    const seen = new Set<string>();
    const out: DirectoryCustomer[] = [];
    for (const r of repairs) {
      const p = (r.phone || '').trim();
      if (!p || seen.has(p)) continue;
      seen.add(p);
      out.push({
        phone: p,
        customerName: r.customerName || '',
        deviceModel: r.deviceModel || '',
      });
    }
    return sortCustomers(out);
  }, [repairs]);

  const handleCall = useCallback(async (href: string) => {
    try {
      const canOpen = await Linking.canOpenURL(href);
      if (canOpen) {
        await Linking.openURL(href);
      } else {
        Alert.alert('Call Error', 'Phone calls are not supported on this device.');
      }
    } catch {
      Alert.alert('Call Error', 'Could not place phone call.');
    }
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

  const [selectedCustomer, setSelectedCustomer] = useState<DirectoryCustomer | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: DirectoryCustomer }) => {
      const name = item.customerName.trim() || '—';
      const initial = (name === '—' ? '?' : name).slice(0, 1).toUpperCase();
      const href = telUri(item.phone);

      const jobCount = repairs.filter((r) => {
        if (item.phone && matchPhone(r.phone, item.phone)) return true;
        if (item.customerName && r.customerName.trim().toLowerCase() === item.customerName.trim().toLowerCase()) return true;
        return false;
      }).length;

      return (
        <View style={styles.row}>
          <Pressable
            onPress={() => setSelectedCustomer(item)}
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
          {href ? (
            <Pressable
              onPress={() => void handleCall(href)}
              style={styles.callBtn}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.callBtnText}>Call</Text>
            </Pressable>
          ) : null}
        </View>
      );
    },
    [colors, handleCall, styles, repairs]
  );

  const keyExtractor = useCallback((item: DirectoryCustomer) => item.phone, []);

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
        placeholder="Search name or number"
        placeholderTextColor={colors.textMuted}
        onChangeText={setQuery}
        value={query}
        style={[styles.searchbar, { height: 46, justifyContent: 'center' }]}
        icon={({ size }) => <Search size={18} color={colors.accent} />}
        clearIcon={({ size }) => <X size={18} color={colors.textMuted} />}
        inputStyle={{ color: colors.text, fontSize: 14, minHeight: 0, paddingVertical: 0, alignSelf: 'center' }}
        theme={{ colors: { elevation: { level3: colors.surface } } }}
      />
      {loading && customers.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
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
            <Text style={styles.empty}>
              {customers.length === 0
                ? 'No customers yet. Save a repair job to add people here.'
                : 'No matches. Try another search.'}
            </Text>
          }
          renderItem={renderItem}
        />
      )}

      <CustomerHistoryModal
        visible={Boolean(selectedCustomer)}
        customer={selectedCustomer}
        repairs={repairs}
        onClose={() => setSelectedCustomer(null)}
        onSelectRepair={(repairId) => navigation.navigate('RepairDetail', { repairId })}
        onNewRepair={(prefillCustomer) => navigation.navigate('AddRepair', { prefillCustomer })}
      />
    </SafeAreaView>
  );
}

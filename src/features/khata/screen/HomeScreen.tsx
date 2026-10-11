import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Search } from 'lucide-react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { useTheme } from '../../../context/ThemeContext';

import { useKhata } from '../hooks/useKhata';
import { useKhataRouter } from '../hooks/useKhataRouter';
import { PartyRow } from '../components/PartyRow';
import { EmptyState } from '../components/EmptyState';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { getBalanceLabel } from '../utils/ledger';

type FilterTab = 'all' | 'payable' | 'receivable' | 'settled';

export function KhataHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<FilterTab>('all');
  const { parties, loading, refresh, error, lastUpdated } = useKhata();
  const router = useKhataRouter();

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      if (query && !p.name.toLowerCase().includes(query) && !p.phone.includes(query)) {
        return false;
      }
      if (balanceFilter === 'payable' && p.balancePaise <= 0) return false;
      if (balanceFilter === 'receivable' && p.balancePaise >= 0) return false;
      if (balanceFilter === 'settled' && p.balancePaise !== 0) return false;
      return true;
    });
  }, [parties, searchQuery, balanceFilter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ flex: 1, padding: 16, paddingBottom: insets.bottom + 24 }}>
          <AppInput
            placeholder="Search parties by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            rightIcon={Search}
            containerStyle={{ marginBottom: 12 }}
          />
          <AppButton variant="secondary" fullWidth onPress={() => router.navigate('SharedKhata')} style={{ marginBottom: 12 }}>
            Shared Khata / Invitations
          </AppButton>
          {error ? (
            <Pressable onPress={() => void refresh(true)} style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.danger ?? '#B91C1C', fontSize: 13 }}>
                {parties.length ? `Showing saved data; refresh failed: ${error}. Tap to retry.` : `${error}. Tap to retry.`}
              </Text>
            </Pressable>
          ) : lastUpdated && parties.length > 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>Balances refreshed from Khata ledger</Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 12,
              backgroundColor: colors.surface2,
              padding: 4,
              borderRadius: 12,
            }}
          >
            {(['all', 'payable', 'receivable', 'settled'] as FilterTab[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setBalanceFilter(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: balanceFilter === tab ? colors.accent : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: balanceFilter === tab ? '#FFFFFF' : colors.textMuted,
                    fontWeight: balanceFilter === tab ? '700' : '500',
                    fontSize: 13,
                  }}
                >
                  {tab === 'all' ? 'All' : tab === 'payable' ? 'You\'ll Give' : tab === 'receivable' ? 'You\'ll Get' : 'Settled'}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading parties...</Text>
            </View>
          ) : filteredParties.length === 0 ? (
            <EmptyState
              title="No parties yet"
              description="Tap the + button to add your first seller, dealer, supplier, or customer."
              actionButton={<AppButton variant="primary" onPress={() => router.navigate('AddParty')}>Add Party</AppButton>}
            />
          ) : (
            <FlatList
              data={filteredParties}
              keyExtractor={(party) => party.id}
              renderItem={({ item: party }) => (
                <PartyRow
                  party={party}
                  onPress={() => router.navigate('PartyDetail', { partyId: party.id })}
                  balanceLabel={getBalanceLabel(party.balancePaise)}
                />
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}

          <FloatingActionButton onPress={() => router.navigate('AddParty')} />
        </View>
    </SafeAreaView>
  );
}

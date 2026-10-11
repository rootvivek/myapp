import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatPaise } from '../utils/ledger';
import type { KhataParty } from '../types';

export function PartyRow({
  party,
  onPress,
  balanceLabel = 'settled',
}: {
  party: KhataParty;
  onPress: () => void;
  balanceLabel?: 'settled' | 'payable' | 'receivable';
}) {
  const name = party.name || 'Unnamed Party';
  const displayPhone = party.phone || 'No phone';
  const balance = balanceLabel === 'settled' ? '₹0.00' : formatPaise(party.balancePaise);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2E',
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#1C1C1E',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '800',
            color: '#F5F5F7',
          }}
        >
          {name[0]?.toUpperCase() ?? 'P'}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: '#F5F5F7',
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#98989E',
            marginBottom: 4,
          }}
        >
          {displayPhone}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: '#98989E',
          }}
        >
          {party.partyType ? party.partyType : ''} · {party.transactionCount} transactions
        </Text>
      </View>

      <View
        style={{
          alignItems: 'flex-end',
          minWidth: 80,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: '#F5F5F7',
            lineHeight: 20,
          }}
        >
          {balance}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: '#98989E',
            textTransform: 'uppercase',
          }}
        >
          {balanceLabel === 'settled' ? 'Settled' : balanceLabel === 'payable' ? 'You\'ll Give' : 'You\'ll Get'}
        </Text>
      </View>
    </Pressable>
  );
}

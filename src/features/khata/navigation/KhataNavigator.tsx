import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { KhataHomeScreen } from '../screen/HomeScreen';
import { PartyDetailScreen } from '../screen/PartyDetailScreen';
import { AddTransactionScreen } from '../screen/AddTransactionScreen';
import { AddPartyScreen } from '../screen/AddPartyScreen';
import { SharedKhataScreen } from '../screen/SharedKhataScreen';

import type { KhataParamList } from './types';

const Stack = createNativeStackNavigator<KhataParamList>();

export function KhataNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0C' },
        headerTintColor: '#F5F5F7',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0A0A0C' },
      }}
    >
      <Stack.Screen
        name="KhataHome"
        component={KhataHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PartyDetail"
        component={PartyDetailScreen}
        options={{ title: 'Party Ledger' }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'New Transaction' }}
      />
      <Stack.Screen
        name="AddParty"
        component={AddPartyScreen}
        options={{ title: 'Add Party' }}
      />
      <Stack.Screen
        name="SharedKhata"
        component={SharedKhataScreen}
        options={{ title: 'Shared Khata' }}
      />
    </Stack.Navigator>
  );
}
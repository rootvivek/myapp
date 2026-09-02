import React, { useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import { AddRepairScreen } from '../screens/AddRepairScreen';
import { MainTabScreen } from '../screens/MainTabScreen';
import { RepairDetailScreen } from '../screens/RepairDetailScreen';
import { ScanImeiScreen } from '../screens/ScanImeiScreen';
import { CustomerDirectoryScreen } from '../screens/CustomerDirectoryScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ManageLabourScreen } from '../screens/ManageLabourScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { ScanQrScreen } from '../screens/ScanQrScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors, mode } = useTheme();

  const theme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, mode]);

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700' as const },
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  );

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={MainTabScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddRepair"
          component={AddRepairScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="RepairDetail" component={RepairDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
        <Stack.Screen
          name="CustomerDirectory"
          component={CustomerDirectoryScreen}
          options={{ title: 'Customers' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Shop & invoice' }} />
        <Stack.Screen name="ManageLabour" component={ManageLabourScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScanImei" component={ScanImeiScreen} options={{ title: 'Scan IMEI' }} />
        <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Finance" component={FinanceScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

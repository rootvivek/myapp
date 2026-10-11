import React, { useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import { AddRepairScreen } from '../screens/AddRepair';
import { MainTabScreen } from '../screens/MainTabScreen';
import { RepairDetailScreen } from '../screens/RepairDetailScreen';
import { ScanImeiScreen } from '../screens/ScanImeiScreen';
import { CustomerDirectoryScreen } from '../screens/CustomerDirectoryScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ManageLabourScreen } from '../screens/ManageLabourScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { AdminDashboard } from '../screens/AdminDashboard';
import { KhataNavigator } from '../features/khata/navigation/KhataNavigator';
import { ScanQrScreen } from '../screens/ScanQrScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function AppNavigator() {
  const { colors } = useTheme();
  const { activeTab, setActiveTab } = useTab();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigationRef.isReady()) return false;

      const state = navigationRef.getRootState();
      if (!state) return false;
      const currentRoute = state.routes[state.index];

      // Screens such as Khata and Customer Directory are pushed above Home.
      // Back from any of them should return directly to the Home dashboard.
      if (state.index > 0 || currentRoute?.name !== 'Home') {
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'Home' }] });
        setActiveTab('home');
        return true;
      }

      // Main-tab screens (including login) share the Home stack route, so
      // switch tabs first. A subsequent back on Home is allowed to exit.
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [activeTab, setActiveTab]);

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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Home" component={MainTabScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Khata"
            component={KhataNavigator}
            options={{ headerShown: false }}
          />
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
            options={{ title: 'Customers', headerShown: false }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Shop & invoice' }} />
          <Stack.Screen name="ManageLabour" component={ManageLabourScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ScanImei" component={ScanImeiScreen} options={{ title: 'Scan IMEI' }} />
          <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Finance" component={FinanceScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

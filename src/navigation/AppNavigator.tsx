import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../context/ThemeContext';
import { AddRepairScreen } from '../screens/AddRepairScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RepairDetailScreen } from '../screens/RepairDetailScreen';
import { ScanImeiScreen } from '../screens/ScanImeiScreen';
import { CustomerDirectoryScreen } from '../screens/CustomerDirectoryScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors, mode } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
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

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddRepair"
          component={AddRepairScreen}
          options={({ route }) => ({
            title: route.params?.repairId != null ? 'Edit job' : 'New job',
          })}
        />
        <Stack.Screen name="RepairDetail" component={RepairDetailScreen} options={{ title: 'Job details' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
        <Stack.Screen
          name="CustomerDirectory"
          component={CustomerDirectoryScreen}
          options={{ title: 'Customers' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Shop & invoice' }} />
        <Stack.Screen name="ScanImei" component={ScanImeiScreen} options={{ title: 'Scan IMEI' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

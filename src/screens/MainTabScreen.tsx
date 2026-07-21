import React, { createContext, useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomNavBar } from '../components/BottomNavBar';
import { HomeScreen } from './HomeScreen';
import { CustomerDirectoryScreen } from './CustomerDirectoryScreen';
import { FinanceScreen } from './FinanceScreen';
import { SettingsScreen } from './SettingsScreen';
import { InventoryScreen } from './InventoryScreen';

import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

export type TabType = 'jobs' | 'inventory' | 'finance' | 'settings';

type TabContextValue = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

const TabContext = createContext<TabContextValue | null>(null);

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTab must be used within TabProvider');
  return ctx;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function MainTabScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('jobs');

  const renderContent = () => {
    switch (activeTab) {
      case 'jobs':
        return <HomeScreen navigation={navigation} route={route} />;
      case 'inventory':
        return <InventoryScreen navigation={navigation as any} route={route as any} />;
      case 'finance':
        return <FinanceScreen navigation={navigation as any} />;
      case 'settings':
        return <SettingsScreen navigation={navigation as any} route={route as any} />;
      default:
        return <HomeScreen navigation={navigation} route={route} />;
    }
  };


  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>
          {renderContent()}
        </View>
        <BottomNavBar />
      </View>
    </TabContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

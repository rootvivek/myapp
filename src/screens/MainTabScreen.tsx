import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BottomNavBar } from '../components/BottomNavBar';
import { HomeDashboardScreen } from './HomeDashboardScreen';
import { HomeScreen } from './HomeScreen';
import { AuthScreen } from './AuthScreen';
import { SettingsScreen } from './SettingsScreen';
import { InventoryScreen } from './InventoryScreen';
import { FinanceScreen } from './FinanceScreen';

import { ArrowLeft } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

export type TabType = 'home' | 'jobs' | 'inventory' | 'finance' | 'settings';

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
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // After signing in from the User tab, continue to the repair list the user
  // originally asked for (repairs are gated behind login). On logout, send the
  // user back to the home dashboard.
  const hadSessionRef = useRef(!!session);
  useEffect(() => {
    const hasSession = !!session;
    if (hasSession && !hadSessionRef.current && activeTab === 'settings') {
      setActiveTab('jobs');
    } else if (!hasSession && hadSessionRef.current && activeTab !== 'home') {
      setActiveTab('home'); // logged out → home page
    }
    hadSessionRef.current = hasSession;
  }, [session, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboardScreen navigation={navigation} />;
      case 'jobs':
        return <HomeScreen navigation={navigation} route={route} />;
      case 'inventory':
        return <InventoryScreen navigation={navigation as any} route={route as any} />;
      case 'finance':
        return <FinanceScreen navigation={navigation as any} />;
      case 'settings':
        // Logged out → login / sign-up screen. Logged in → profile & shop settings.
        if (session) {
          return <SettingsScreen navigation={navigation as any} route={route as any} />;
        }
        return (
          <View style={styles.authWrap}>
            {/* Bottom back-to-home button is in AuthScreen — removed top duplicate */}
            <AuthScreen />
          </View>
        );
      default:
        return <HomeDashboardScreen navigation={navigation} />;
    }
  };


  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>
          {renderContent()}
        </View>
        {/* Bottom bar appears only for logged-in users, and never on the
            home dashboard or the login screen. */}
        {!!session && activeTab !== 'home' && <BottomNavBar />}
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
  authWrap: {
    flex: 1,
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  backBarText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

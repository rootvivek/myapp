import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, IndianRupee, PlusCircle, Package, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab, type TabType } from '../screens/MainTabScreen';
import type { RootStackParamList } from '../navigation/types';

export function BottomNavBar() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const { activeTab, setActiveTab } = useTab();
  const { isLabour } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const allTabs: { key: TabType; label: string; icon: React.ComponentType<any> }[] = useMemo(() => {
    const base: { key: TabType; label: string; icon: React.ComponentType<any> }[] = [
      { key: 'jobs', label: 'Jobs', icon: ClipboardList },
      { key: 'inventory', label: 'Inventory', icon: Package },
    ];
    if (!isLabour) {
      base.push({ key: 'finance', label: 'Finance', icon: IndianRupee });
    }
    base.push({ key: 'settings', label: 'Profile', icon: User });
    return base;
  }, [isLabour]);

  // Split tabs: first half left of +, second half right
  const midpoint = Math.ceil(allTabs.length / 2);
  const leftTabs = allTabs.slice(0, midpoint);
  const rightTabs = allTabs.slice(midpoint);

  const renderTab = (tab: typeof allTabs[0]) => {
    const isActive = activeTab === tab.key;
    const Icon = tab.icon;
    return (
      <Pressable
        key={tab.key}
        onPress={() => setActiveTab(tab.key)}
        style={styles.tabBtn}
        android_ripple={{ color: 'rgba(124, 58, 237, 0.08)' }}
      >
        <View style={styles.iconWrap}>
          <Icon size={22} color={isActive ? colors.accent : colors.textMuted} strokeWidth={isActive ? 2.5 : 2.0} />
        </View>
        <Text
          style={[
            styles.label,
            {
              color: isActive ? colors.accent : colors.textMuted,
              fontWeight: isActive ? '700' : '600',
            },
          ]}
        >
          {tab.label}
        </Text>
        {isActive && (
          <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
        )}
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {leftTabs.map(renderTab)}

      {/* Center Plus Button */}
      <Pressable
        onPress={() => navigation.navigate('AddRepair', {})}
        style={styles.tabBtn}
        android_ripple={{ color: 'rgba(124, 58, 237, 0.08)' }}
      >
        <View style={styles.iconWrap}>
          <PlusCircle size={28} color={colors.accent} strokeWidth={2.2} />
        </View>
        <Text
          style={[
            styles.label,
            {
              color: colors.accent,
              fontWeight: '700',
            },
          ]}
        >
          New
        </Text>
      </Pressable>

      {rightTabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

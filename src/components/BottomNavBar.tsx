import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  ClipboardList,
  IndianRupee,
  Package,
  Plus,
  User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab, type TabType } from '../screens/MainTabScreen';
import type { RootStackParamList } from '../navigation/types';
import { accentAlpha, radius, spacing } from '../theme';

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

  // Split tabs evenly around the center action button
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
        android_ripple={{ color: accentAlpha(colors.accent, 0.12), borderless: true, radius: 24 }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={tab.label}
      >
        <View
          style={[
            styles.iconWrap,
            isActive && {
              backgroundColor: accentAlpha(colors.accent, 0.14),
            },
          ]}
        >
          <Icon
            size={20}
            color={isActive ? colors.accent : colors.textMuted}
            strokeWidth={isActive ? 2.5 : 2.0}
          />
        </View>
        <Text
          style={[
            styles.label,
            {
              color: isActive ? colors.accent : colors.textMuted,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
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
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* Left Tabs */}
      {leftTabs.map(renderTab)}

      {/* Center Floating Plus Button */}
      <View style={styles.centerButtonContainer}>
        <Pressable
          onPress={() => navigation.navigate('AddRepair', {})}
          style={styles.centerPressable}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true, radius: 26 }}
          accessibilityRole="button"
          accessibilityLabel="Add New Repair Job"
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerGradient}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.8} />
          </LinearGradient>
        </Pressable>
        <Text style={[styles.centerLabel, { color: colors.accent }]}>New</Text>
      </View>

      {/* Right Tabs */}
      {rightTabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 28,
    borderRadius: radius.full,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerPressable: {
    borderRadius: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 6,
  },
  centerGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.1,
  },
});


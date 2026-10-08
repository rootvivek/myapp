import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB } from 'react-native-paper';
import { Home, IndianRupee, Package, Plus, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab, type TabType } from '../context/TabContext';
import type { RootStackParamList } from '../navigation/types';
import { radius, sizes, spacing } from '../theme';
import { AppIconButton } from './ui/AppIconButton';

export function BottomNavBar() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { activeTab, setActiveTab } = useTab();
  const { isLabour, session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Guests must log in before creating or opening repair jobs.
  const handleNewRepair = () => {
    if (!session) {
      setActiveTab('settings'); // User tab → login / sign-up screen
      return;
    }
    navigation.navigate('AddRepair', {});
  };

  const allTabs: { key: TabType; label: string; icon: React.ComponentType<any> }[] = useMemo(() => {
    const base: { key: TabType; label: string; icon: React.ComponentType<any> }[] = [
      // Home opens the repair list, exactly like the original home tab.
      { key: 'jobs', label: 'Home', icon: Home },
      { key: 'inventory', label: 'Inventory', icon: Package },
    ];
    if (!isLabour) {
      base.push({ key: 'finance', label: 'Finance', icon: IndianRupee });
    }
    base.push({ key: 'settings', label: 'User', icon: User });
    return base;
  }, [isLabour]);

  // Split tabs evenly around the center action button
  const midpoint = Math.ceil(allTabs.length / 2);
  const leftTabs = allTabs.slice(0, midpoint);
  const rightTabs = allTabs.slice(midpoint);

  const renderTab = (tab: (typeof allTabs)[number]) => {
    const isActive = activeTab === tab.key;
    const Icon = tab.icon;

    return (
      <View style={styles.tabBtn}>
        <AppIconButton
          key={tab.key}
          variant={isActive ? 'primary' : 'ghost'}
          size={36}
          icon={<Icon size={20} color={isActive ? '#FFFFFF' : colors.textMuted} strokeWidth={2.2} />}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={tab.label}
          onPress={() => setActiveTab(tab.key)}
        />
        <Text style={[styles.tabLabel, { color: isActive ? colors.accent : colors.textMuted }]}>
          {tab.label}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {/* Left Tabs */}
      {leftTabs.map(renderTab)}

      {/* Center Floating Plus Button */}
      <View style={styles.centerButtonContainer}>
        <FAB
          onPress={handleNewRepair}
          accessibilityLabel="Add New Repair Job"
          style={styles.centerFab}
          color={colors.accent}
          icon={(props) => (
            <View style={styles.fabIconWrapper}>
              <Plus size={props.size} color={props.color} strokeWidth={2.4} />
            </View>
          )}
        />

        {/* Label below the FAB */}
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
    borderTopWidth: sizes.hairline,
    paddingTop: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
});

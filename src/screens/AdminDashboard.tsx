import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import { ArrowLeft, ChevronRight, RefreshCw, Users, Store, Wrench, Package } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import { AppActivityIndicator } from '../components/ui/AppActivityIndicator';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { accentAlpha, radius, sizes, spacing, type AppColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

type DashboardStats = {
  totalShops: number;
  totalUsers: number;
  totalRepairs: number;
  totalInventory: number;
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  colors: AppColors;
};

type QuickActionRowProps = {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: AppColors;
  borderless?: boolean;
};

function StatCard({ icon, label, value, color, colors }: StatCardProps) {
  return (
    <AppCard variant="outlined" containerStyle={{ flex: 1 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: accentAlpha(color, 0.12),
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 2 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{label}</Text>
    </AppCard>
  );
}

function QuickActionRow({ label, subtitle, icon, onPress, colors, borderless }: QuickActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: borderless ? 0 : 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      android_ripple={{ color: accentAlpha(colors.text, 0.05) }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: colors.surface2,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.md,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function DashboardContent({
  stats,
  colors,
  signOut,
}: {
  stats: DashboardStats | null;
  colors: AppColors;
  signOut: () => Promise<void>;
}) {
  return (
    <>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
        }}
      >
        Overview
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <StatCard
          icon={<Store size={20} color={colors.accent} />}
          label="Shops"
          value={stats?.totalShops ?? 0}
          color={colors.accent}
          colors={colors}
        />
        <StatCard
          icon={<Users size={20} color={colors.text} />}
          label="Users"
          value={stats?.totalUsers ?? 0}
          color={colors.text}
          colors={colors}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <StatCard
          icon={<Wrench size={20} color={colors.warning} />}
          label="Repairs"
          value={stats?.totalRepairs ?? 0}
          color={colors.warning}
          colors={colors}
        />
        <StatCard
          icon={<Package size={20} color={colors.success} />}
          label="Inventory"
          value={stats?.totalInventory ?? 0}
          color={colors.success}
          colors={colors}
        />
      </View>

      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
        }}
      >
        Quick Actions
      </Text>

      <AppCard
        variant="outlined"
        padding={0}
        containerStyle={{ marginBottom: spacing.md, overflow: 'hidden' }}
      >
        <QuickActionRow
          label="Manage Shops"
          subtitle="View all registered shops"
          icon={<Store size={18} color={colors.accent} />}
          onPress={() => Alert.alert('Coming soon', 'Shop management screen coming soon.')}
          colors={colors}
        />
        <QuickActionRow
          label="Manage Users"
          subtitle="View all users & labour accounts"
          icon={<Users size={18} color={colors.text} />}
          onPress={() => Alert.alert('Coming soon', 'User management screen coming soon.')}
          colors={colors}
          borderless
        />
      </AppCard>

      <AppButton
        variant="danger"
        fullWidth
        containerStyle={{ marginTop: spacing.md }}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
          ]);
        }}
      >
        Sign Out
      </AppButton>
    </>
  );
}

export function AdminDashboard({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    try {
      const [shopsRes, profilesRes, repairsRes, inventoryRes] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('repairs').select('*', { count: 'exact', head: true }),
        supabase.from('inventory').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalShops: shopsRes.count ?? 0,
        totalUsers: profilesRes.count ?? 0,
        totalRepairs: repairsRes.count ?? 0,
        totalInventory: inventoryRes.count ?? 0,
      });
    } catch (err) {
      logger.warn('[AdminDashboard] Failed to load stats:', err);
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Appbar.Header
        mode="center-aligned"
        style={{
          backgroundColor: colors.surface,
          elevation: 0,
          borderBottomWidth: sizes.hairline,
          borderBottomColor: colors.border,
        }}
      >
        <Appbar.Action
          icon={() => <ArrowLeft size={22} color={colors.text} />}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Appbar.Content
          title={
            <View accessible accessibilityRole="header">
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
                Admin Dashboard
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                {user?.email || 'Super Admin'}
              </Text>
            </View>
          }
        />
        <Appbar.Action
          icon={() => <RefreshCw size={22} color={colors.accent} />}
          onPress={() => void loadStats()}
          disabled={loading}
          accessibilityLabel="Refresh dashboard"
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingVertical: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !stats ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <AppActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
              Loading dashboard...
            </Text>
          </View>
        ) : (
          <DashboardContent stats={stats} colors={colors} signOut={signOut} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

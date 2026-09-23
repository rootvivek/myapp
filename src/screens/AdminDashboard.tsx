import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw, Users, Store, Wrench, Package } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { spacing, radius, type AppColors } from '../theme';

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
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: color + '20',
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
    </View>
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
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
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
      <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
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
          icon={<Store size={20} color="#8B5CF6" />}
          label="Shops"
          value={stats?.totalShops ?? 0}
          color="#8B5CF6"
          colors={colors}
        />
        <StatCard
          icon={<Users size={20} color="#3B82F6" />}
          label="Users"
          value={stats?.totalUsers ?? 0}
          color="#3B82F6"
          colors={colors}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <StatCard
          icon={<Wrench size={20} color="#F59E0B" />}
          label="Repairs"
          value={stats?.totalRepairs ?? 0}
          color="#F59E0B"
          colors={colors}
        />
        <StatCard
          icon={<Package size={20} color="#10B981" />}
          label="Inventory"
          value={stats?.totalInventory ?? 0}
          color="#10B981"
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

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          marginBottom: spacing.md,
        }}
      >
        <QuickActionRow
          label="Manage Shops"
          subtitle="View all registered shops"
          icon={<Store size={18} color="#8B5CF6" />}
          onPress={() => Alert.alert('Coming soon', 'Shop management screen coming soon.')}
          colors={colors}
        />
        <QuickActionRow
          label="Manage Users"
          subtitle="View all users & labour accounts"
          icon={<Users size={18} color="#3B82F6" />}
          onPress={() => Alert.alert('Coming soon', 'User management screen coming soon.')}
          colors={colors}
          borderless
        />
      </View>

      <Pressable
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
          ]);
        }}
        style={{
          marginTop: spacing.md,
          paddingVertical: 14,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: '#DC2626',
          alignItems: 'center',
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
      </Pressable>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ marginRight: spacing.sm, padding: 4 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
            Admin Dashboard
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {user?.email || 'Super Admin'}
          </Text>
        </View>
        <Pressable
          onPress={() => void loadStats()}
          hitSlop={8}
          style={{ padding: 8 }}
          disabled={loading}
        >
          <RefreshCw size={20} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !stats ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color={colors.accent} />
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
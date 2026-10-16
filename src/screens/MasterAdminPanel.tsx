import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import { Users, Store, Wrench, Package, RefreshCw, LogOut, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AppActivityIndicator } from '../components/ui/AppActivityIndicator';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { AppInput } from '../components/ui/AppInput';
import { AppModal } from '../components/ui/AppModal';
import { AppChip } from '../components/ui/AppChip';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { radius, sizes, spacing, type AppColors } from '../theme';
import type { UserProfile } from '../types/profile';

type Props = NativeStackScreenProps<RootStackParamList, 'MasterAdminPanel'>;
type UserRow = UserProfile & { shops?: { name: string } | null };

export function MasterAdminPanel({ navigation }: Props) {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ s: 0, u: 0, r: 0, i: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<UserRow | null>(null);
  const [vis, setVis] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [s, u, r, i, all] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('repairs').select('*', { count: 'exact', head: true }),
        supabase.from('inventory').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*, shops(name)').order('created_at', { ascending: false }),
      ]);
      setStats({ s: s.count ?? 0, u: u.count ?? 0, r: r.count ?? 0, i: i.count ?? 0 });
      if (all.data) setUsers(all.data as UserRow[]);
    } catch (e) {
      logger.warn('[MasterAdmin]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const filtered = users.filter(x => x.username?.toLowerCase().includes(query.toLowerCase()) || x.phone?.includes(query));

  const st = StyleSheet.create({
    c: { flex: 1, backgroundColor: colors.bg },
    h: { backgroundColor: colors.surface, borderBottomWidth: sizes.hairline, borderBottomColor: colors.border },
    cnt: { padding: spacing.gutter },
    box: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    sb: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: sizes.hairline, borderColor: colors.border, padding: spacing.sm },
    t: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.xs, marginTop: spacing.md },
    card: { marginBottom: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    det: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: sizes.hairline, borderBottomColor: colors.border },
  });

  return (
    <SafeAreaView style={st.c} edges={['bottom']}>
      <Appbar.Header mode="center-aligned" style={st.h}>
        <Appbar.Content title={<Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Master Admin Portal</Text>} />
        <Appbar.Action icon={() => <RefreshCw size={20} color={colors.accent} />} onPress={() => void load()} />
        <Appbar.Action icon={() => <LogOut size={20} color={colors.danger} />} onPress={() => void signOut().then(() => navigation.navigate('Home'))} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={st.cnt}>
        <Text style={st.t}>System Metrics</Text>
        <View style={st.box}>
          <View style={st.sb}><Store size={16} color={colors.accent} /><Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{stats.s}</Text><Text style={{ fontSize: 10, color: colors.textMuted }}>Shops</Text></View>
          <View style={st.sb}><Users size={16} color={colors.success} /><Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{stats.u}</Text><Text style={{ fontSize: 10, color: colors.textMuted }}>Users</Text></View>
          <View style={st.sb}><Wrench size={16} color={colors.warning} /><Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{stats.r}</Text><Text style={{ fontSize: 10, color: colors.textMuted }}>Repairs</Text></View>
          <View style={st.sb}><Package size={16} color={colors.text} /><Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{stats.i}</Text><Text style={{ fontSize: 10, color: colors.textMuted }}>Stock</Text></View>
        </View>
        <Text style={st.t}>User Accounts</Text>
        <View style={{ marginBottom: spacing.sm }}>
          <AppInput placeholder="Search users..." value={query} onChangeText={setQuery} />
        </View>
        {loading ? <View style={{ padding: 40, alignItems: 'center' }}><AppActivityIndicator size="large" color={colors.accent} /></View> :
          filtered.map(u => (
            <AppCard key={u.id} variant="outlined" containerStyle={st.card}>
              <Pressable style={st.row} onPress={() => { setSel(u); setVis(true); }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{u.username}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Phone: {u.phone || 'N/A'} • Shop: {u.shops?.name || 'None'}</Text>
                  <View style={{ marginTop: 2 }}><AppChip dense>{u.role?.toUpperCase()}</AppChip></View>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            </AppCard>
          ))
        }
      </ScrollView>
      <AppModal visible={vis} onClose={() => setVis(false)} title="User Management" subtitle={sel?.username}>
        {sel && (
          <View style={{ gap: spacing.sm }}>
            <View style={st.det}><Text style={{ color: colors.textMuted }}>ID</Text><Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{sel.id}</Text></View>
            <View style={st.det}><Text style={{ color: colors.textMuted }}>Username</Text><Text style={{ fontWeight: '700', color: colors.text }}>{sel.username}</Text></View>
            <View style={st.det}><Text style={{ color: colors.textMuted }}>Phone</Text><Text style={{ fontWeight: '700', color: colors.text }}>{sel.phone || 'N/A'}</Text></View>
            <View style={st.det}><Text style={{ color: colors.textMuted }}>Role</Text><Text style={{ fontWeight: '700', color: colors.accent }}>{sel.role?.toUpperCase()}</Text></View>
            <View style={st.det}><Text style={{ color: colors.textMuted }}>Shop</Text><Text style={{ fontWeight: '700', color: colors.text }}>{sel.shops?.name || 'None'}</Text></View>
            <AppButton variant="danger" fullWidth containerStyle={{ marginTop: spacing.sm }} onPress={() => {
              Alert.alert('Delete', 'Delete user profile?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('profiles').delete().eq('id', sel.id); setVis(false); void load(); } }
              ]);
            }}>Delete Profile</AppButton>
          </View>
        )}
      </AppModal>
    </SafeAreaView>
  );
}

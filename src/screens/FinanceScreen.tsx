import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, CheckCircle, ArrowUpRight, Square, Pencil, CheckSquare } from 'lucide-react-native';

import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateRepair } from '../db/database';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing, radius } from '../theme';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import type { Repair } from '../types/repair';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function FinanceScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { isOwner } = useAuth();
  const { repairs, loading, refresh } = useRepairs();
  const [subTab, setSubTab] = useState<'dues' | 'paid'>('dues');

  // Edit payment states
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editAdvance, setEditAdvance] = useState('');
  const [editPaid, setEditPaid] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isOwner) {
        void refresh();
      }
    }, [refresh, isOwner])
  );

  if (!isOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
          Access Denied
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Only the shop owner can view finance data.
        </Text>
      </SafeAreaView>
    );
  }

  const stats = useMemo(() => {
    let totalPaid = 0;
    let totalDues = 0;
    let totalValue = 0;
    let totalExpense = 0;

    repairs.forEach((r) => {
      if (r.status === 'cancelled') return;
      totalValue += r.repairCost;
      totalExpense += r.expense || 0;
      if (r.isPaid) {
        totalPaid += r.repairCost;
      } else {
        totalPaid += r.advanceAmount;
        const due = r.repairCost - r.advanceAmount;
        if (due > 0) totalDues += due;
      }
    });

    const netProfit = totalValue - totalExpense;

    return { totalPaid, totalDues, totalValue, totalExpense, netProfit };
  }, [repairs]);

  const duesList = useMemo(() => {
    return repairs.filter((r) => r.status !== 'cancelled' && !r.isPaid && r.repairCost > r.advanceAmount);
  }, [repairs]);

  const paidList = useMemo(() => {
    return repairs.filter((r) => r.status !== 'cancelled' && r.isPaid);
  }, [repairs]);

  const activeList = subTab === 'dues' ? duesList : paidList;

  const handleCall = (phone: string) => {
    const raw = phone.trim();
    if (!raw) return;
    const dial = raw.replace(/[^\d+]/g, '');
    void Linking.openURL(`tel:${dial}`).catch(() => { });
  };

  const handleMarkPaid = async (item: Repair) => {
    Alert.alert(
      'Complete Due',
      `Mark ${item.customerName}'s job as fully paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          style: 'default',
          onPress: async () => {
            try {
              const { id, createdAt, updatedAt, ...baseInput } = item;
              await updateRepair({
                ...baseInput,
                id,
                isPaid: true,
              });
              await refresh();
            } catch {
              Alert.alert('Error', 'Failed to update payment status.');
            }
          },
        },
      ]
    );
  };

  const startEditPayment = (item: Repair) => {
    setEditingRepair(item);
    setEditCost(String(item.repairCost));
    setEditAdvance(String(item.advanceAmount));
    setEditPaid(item.isPaid);
  };

  const onSavePayment = async () => {
    if (!editingRepair) return;
    const cost = parseFloat(editCost) || 0;
    const advance = parseFloat(editAdvance) || 0;

    if (advance > cost) {
      Alert.alert('Invalid amounts', 'Advance cannot be higher than total cost.');
      return;
    }

    setSavingEdit(true);
    try {
      const { id, createdAt, updatedAt, ...baseInput } = editingRepair;
      await updateRepair({
        ...baseInput,
        id,
        repairCost: cost,
        advanceAmount: advance,
        isPaid: editPaid || (advance === cost && cost > 0),
      });
      setEditingRepair(null);
      await refresh();
    } catch {
      Alert.alert('Error', 'Failed to save payment details.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <LinearGradient colors={colors.bgGradient} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Earnings & Dues</Text>
      </View>

      {/* KPI Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Received</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatCurrency(stats.totalPaid)}
          </Text>
          <Text style={[styles.statSubText, { color: colors.textMuted }]}>Collected amount</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Dues</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {formatCurrency(stats.totalDues)}
          </Text>
          <Text style={[styles.statSubText, { color: colors.textMuted }]}>Outstanding dues</Text>
        </View>
      </View>


      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Expense</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {formatCurrency(stats.totalExpense)}
          </Text>
          <Text style={[styles.statSubText, { color: colors.textMuted }]}>Out of pocket</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Net Profit</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatCurrency(stats.netProfit)}
          </Text>
          <Text style={[styles.statSubText, { color: colors.textMuted }]}>Business - Expense</Text>
        </View>
      </View>

      <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.fullStatHeader}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Grand Total Business</Text>
          <ArrowUpRight size={16} color={colors.accent} />
        </View>
        <Text style={[styles.fullStatValue, { color: colors.text }]}>
          {formatCurrency(stats.totalValue)}
        </Text>
      </View>

      {/* Sub tabs selection */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setSubTab('dues')}
          style={[
            styles.tabBtn,
            { backgroundColor: subTab === 'dues' ? colors.surface2 : 'transparent', borderColor: subTab === 'dues' ? colors.border : 'transparent' },
          ]}
        >
          <Text style={[styles.tabText, { color: subTab === 'dues' ? colors.text : colors.textMuted, fontWeight: subTab === 'dues' ? '700' : '500' }]}>
            Outstanding Dues ({duesList.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSubTab('paid')}
          style={[
            styles.tabBtn,
            { backgroundColor: subTab === 'paid' ? colors.surface2 : 'transparent', borderColor: subTab === 'paid' ? colors.border : 'transparent' },
          ]}
        >
          <Text style={[styles.tabText, { color: subTab === 'paid' ? colors.text : colors.textMuted, fontWeight: subTab === 'paid' ? '700' : '500' }]}>
            Fully Paid ({paidList.length})
          </Text>
        </Pressable>
      </View>

      {/* List content */}
      {loading && repairs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={activeList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {subTab === 'dues' ? 'No outstanding dues! All paid up.' : 'No paid jobs yet.'}
            </Text>
          }
          renderItem={({ item }) => {
            const balance = item.repairCost - item.advanceAmount;
            return (
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                <Pressable
                  onPress={() => navigation.navigate('RepairDetail', { repairId: item.id })}
                  style={styles.rowMain}
                >
                  <View style={styles.rowHeader}>
                    <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
                      {item.customerName}
                    </Text>
                    <Text style={[styles.date, { color: colors.textMuted }]}>
                      {formatDateDisplay(item.dateReceived)}
                    </Text>
                  </View>
                  <Text style={[styles.device, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.deviceModel}
                  </Text>
                  <View style={styles.amountRow}>
                    <Text style={[styles.costBreakdown, { color: colors.textMuted }]}>
                      Total: {formatCurrency(item.repairCost)} (Adv: {formatCurrency(item.advanceAmount)})
                    </Text>
                    {subTab === 'dues' ? (
                      <Text style={[styles.balanceText, { color: colors.danger }]}>
                        Due: {formatCurrency(balance)}
                      </Text>
                    ) : (
                      <View style={styles.paidBadge}>
                        <CheckCircle size={14} color={colors.success} />
                        <Text style={[styles.paidText, { color: colors.success }]}>Paid</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
                {subTab === 'dues' ? (
                  <View style={[styles.rowActions, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}>
                    <Pressable
                      onPress={() => handleMarkPaid(item)}
                      style={[styles.actionIconBtn, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    >
                      <CheckCircle size={15} color={colors.success} />
                    </Pressable>
                    <Pressable
                      onPress={() => startEditPayment(item)}
                      style={[styles.actionIconBtn, item.phone ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : {}]}
                    >
                      <Pencil size={15} color={colors.textMuted} />
                    </Pressable>
                    {item.phone ? (
                      <Pressable
                        onPress={() => handleCall(item.phone)}
                        style={[styles.actionIconBtn, { backgroundColor: colors.surface2 }]}
                      >
                        <Phone size={15} color={colors.accent} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* Edit Payment Modal */}
      {editingRepair && (
        <Modal
          visible={!!editingRepair}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingRepair(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Payment</Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]} numberOfLines={1}>
                {editingRepair.customerName} · {editingRepair.deviceModel}
              </Text>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Total Repair Cost (₹)</Text>
                <TextInput
                  value={editCost}
                  onChangeText={setEditCost}
                  keyboardType="decimal-pad"
                  style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface2 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Advance Amount (₹)</Text>
                <TextInput
                  value={editAdvance}
                  onChangeText={setEditAdvance}
                  keyboardType="decimal-pad"
                  style={[styles.modalTextInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface2 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Pressable
                onPress={() => {
                  const nextPaid = !editPaid;
                  setEditPaid(nextPaid);
                  if (nextPaid) {
                    setEditAdvance(editCost);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}
              >
                {editPaid ? (
                  <CheckSquare size={20} color={colors.success} />
                ) : (
                  <Square size={20} color={colors.textMuted} />
                )}
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                  Mark as fully paid
                </Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setEditingRepair(null)}
                  style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onSavePayment()}
                  disabled={savingEdit}
                  style={[styles.modalBtn, savingEdit && { opacity: 0.7 }, { backgroundColor: colors.accent }]}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 9,
    opacity: 0.8,
  },
  fullStatCard: {
    marginHorizontal: 18,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  fullStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullStatValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    padding: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  custName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    fontSize: 10,
  },
  device: {
    fontSize: 11,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costBreakdown: {
    fontSize: 10,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
  },
  callBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },

  rowActions: {
    flexDirection: 'column',
    width: 44,
  },
  actionIconBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

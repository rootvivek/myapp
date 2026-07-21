import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, CheckCircle, ArrowUpRight, Square, Pencil, CheckSquare, MessageSquare, ArrowLeft } from 'lucide-react-native';

import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateRepair } from '../db/database';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import type { Repair } from '../types/repair';

// ------------------------------------------------------------------
// REUSABLE FINANCE HELPERS
// ------------------------------------------------------------------

function parseMoney(value: string): number {
  if (typeof value !== 'string') return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calculateDue(cost: number, advance: number): number {
  const due = cost - advance;
  return due > 0 ? due : 0;
}

function calculatePaidAmount(isPaid: boolean, cost: number, advance: number): number {
  return isPaid ? cost : advance;
}

function calculateNetProfit(totalValue: number, totalExpense: number): number {
  return totalValue - totalExpense;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function FinanceScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isOwner } = useAuth();
  const { repairs, loading, refresh } = useRepairs();

  const [subTab, setSubTab] = useState<'dues' | 'paid'>('dues');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Edit payment states
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editAdvance, setEditAdvance] = useState('');
  const [editPaid, setEditPaid] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Synchronous guards
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isOwner) {
        void refresh();
      }
    }, [refresh, isOwner])
  );

  // ------------------------------------------------------------------
  // MODAL & STATE RESET HELPER
  // ------------------------------------------------------------------

  const closePaymentModal = useCallback(() => {
    setEditingRepair(null);
    setEditCost('');
    setEditAdvance('');
    setEditPaid(false);
    setSavingEdit(false);
    savingRef.current = false;
  }, []);

  // ------------------------------------------------------------------
  // SHARED PAYMENT UPDATE SERVICE
  // ------------------------------------------------------------------

  const updatePaymentStatus = useCallback(
    async (
      repair: Repair,
      paymentType: 'cash' | 'online',
      overrides?: { cost?: number; advance?: number; isPaid?: boolean }
    ) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSavingEdit(true);

      try {
        const { id, createdAt, updatedAt, createdByName, ...baseInput } = repair;
        const cost = overrides?.cost ?? repair.repairCost;
        const advance = overrides?.advance ?? repair.advanceAmount;
        const isPaid = overrides?.isPaid ?? true;

        await updateRepair({
          ...baseInput,
          id,
          repairCost: cost,
          advanceAmount: advance,
          isPaid,
          paymentType,
        });

        if (mountedRef.current) {
          closePaymentModal();
          await refresh();
        }
      } catch {
        Alert.alert('Error', 'Failed to update payment details.');
      } finally {
        if (mountedRef.current) {
          setSavingEdit(false);
        }
        savingRef.current = false;
      }
    },
    [refresh, closePaymentModal]
  );

  // ------------------------------------------------------------------
  // SINGLE PASS CALCULATION (FILTER + STATS + DUES/PAID LISTS)
  // ------------------------------------------------------------------

  const { stats, duesList, paidList } = useMemo(() => {
    let totalPaid = 0;
    let totalDues = 0;
    let totalValue = 0;
    let totalExpense = 0;
    let cashPaid = 0;
    let onlinePaid = 0;

    const dues: Repair[] = [];
    const paid: Repair[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDay = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isCustomValid = period !== 'custom' || customEndDate >= customStartDate;

    repairs.forEach((r) => {
      if (!r.dateReceived) return;
      const rDate = new Date(r.dateReceived + (r.dateReceived.includes('T') ? '' : 'T12:00:00'));
      if (Number.isNaN(rDate.getTime())) return;

      const rDateStart = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());

      let matchesPeriod = true;
      if (period === 'today') {
        matchesPeriod = rDateStart >= startOfToday;
      } else if (period === 'week') {
        matchesPeriod = rDateStart >= startOfWeek;
      } else if (period === 'month') {
        matchesPeriod = rDateStart >= startOfMonth;
      } else if (period === 'custom' && isCustomValid) {
        const start = new Date(customStartDate.getFullYear(), customStartDate.getMonth(), customStartDate.getDate());
        const end = new Date(customEndDate.getFullYear(), customEndDate.getMonth(), customEndDate.getDate());
        matchesPeriod = rDateStart >= start && rDateStart <= end;
      }

      if (!matchesPeriod) return;

      if (r.status === 'cancelled') return;

      const cost = Number(r.repairCost || 0);
      const exp = Number(r.expense || 0);
      const adv = Number(r.advanceAmount || 0);

      totalValue += cost;
      totalExpense += exp;

      const paidAmt = calculatePaidAmount(r.isPaid, cost, adv);
      if (!r.isPaid) {
        totalDues += calculateDue(cost, adv);
      }
      totalPaid += paidAmt;

      if (r.paymentType === 'online') {
        onlinePaid += paidAmt;
      } else {
        cashPaid += paidAmt;
      }

      if (!r.isPaid && cost > adv) {
        dues.push(r);
      } else if (r.isPaid) {
        paid.push(r);
      }
    });

    const netProfit = calculateNetProfit(totalValue, totalExpense);

    return {
      stats: { totalPaid, totalDues, totalValue, totalExpense, netProfit, cashPaid, onlinePaid },
      duesList: dues,
      paidList: paid,
    };
  }, [repairs, period, customStartDate, customEndDate]);

  const activeList = subTab === 'dues' ? duesList : paidList;

  // ------------------------------------------------------------------
  // ACTION HANDLERS
  // ------------------------------------------------------------------

  const handleCall = useCallback(async (phone: string) => {
    const raw = phone.trim();
    if (!raw) return;
    const dial = raw.replace(/[^\d+]/g, '');
    const url = `tel:${dial}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Call Error', 'Phone calls are not supported on this device.');
      }
    } catch {
      Alert.alert('Call Error', 'Could not place phone call.');
    }
  }, []);

  const handleMarkPaid = useCallback(
    (item: Repair) => {
      if (savingRef.current) return;
      Alert.alert(
        'Payment Type',
        `Choose payment method to mark ${item.customerName}'s job as fully paid:`,
        [
          {
            text: '💵 Cash',
            onPress: () => void updatePaymentStatus(item, 'cash', { isPaid: true }),
          },
          {
            text: '📱 Online',
            onPress: () => void updatePaymentStatus(item, 'online', { isPaid: true }),
          },
        ],
        { cancelable: true }
      );
    },
    [updatePaymentStatus]
  );

  const handleSendWhatsAppReminder = useCallback(async (item: Repair) => {
    const rawPhone = item.phone?.trim() || '';
    if (!rawPhone) return;

    const digits = rawPhone.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;

    const dueAmount = calculateDue(item.repairCost, item.advanceAmount);
    const msg = `Dear ${item.customerName},\n\nThis is a friendly reminder that a payment of ${formatCurrency(dueAmount)} is outstanding for your repair order (${item.deviceModel}).\n\nPlease clear the balance at your earliest convenience.\n\nThank you!\nMCA Phone Wala`;

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('WhatsApp Error', 'Could not launch WhatsApp.');
    }
  }, []);

  const startEditPayment = useCallback((item: Repair) => {
    setEditingRepair(item);
    setEditCost(String(item.repairCost));
    setEditAdvance(String(item.advanceAmount));
    setEditPaid(item.isPaid);
  }, []);

  const onSavePayment = useCallback(
    async (type: 'cash' | 'online') => {
      if (!editingRepair || savingRef.current) return;
      const cost = parseMoney(editCost);
      const advance = parseMoney(editAdvance);

      if (advance > cost) {
        Alert.alert('Invalid amounts', 'Advance cannot be higher than total cost.');
        return;
      }

      const isPaid = editPaid || (advance === cost && cost > 0);
      await updatePaymentStatus(editingRepair, type, { cost, advance, isPaid });
    },
    [editingRepair, editCost, editAdvance, editPaid, updatePaymentStatus]
  );

  const handleStartDateChange = useCallback((event: any, date?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (date) {
      if (date > customEndDate) {
        Alert.alert('Invalid Date Range', 'Start date cannot be after end date.');
        return;
      }
      setCustomStartDate(date);
    }
  }, [customEndDate]);

  const handleEndDateChange = useCallback((event: any, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) {
      if (date < customStartDate) {
        Alert.alert('Invalid Date Range', 'End date cannot be before start date.');
        return;
      }
      setCustomEndDate(date);
    }
  }, [customStartDate]);

  // ------------------------------------------------------------------
  // LIST RENDER ITEM
  // ------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: Repair }) => {
      const cost = Number(item.repairCost || 0);
      const adv = Number(item.advanceAmount || 0);
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
                Total: {formatCurrency(cost)} (Adv: {formatCurrency(adv)})
              </Text>
              {subTab === 'dues' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.unpaidBadge}>
                    <Text style={[styles.unpaidText, { color: colors.danger }]}>Unpaid</Text>
                  </View>
                  {item.phone ? (
                    <Pressable
                      onPress={() => void handleSendWhatsAppReminder(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        gap: 4,
                        borderWidth: 1,
                        borderColor: 'rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      <MessageSquare size={10} color="#22C55E" fill="#22C55E" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E' }}>
                        Remind
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
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
                  onPress={() => void handleCall(item.phone)}
                  style={[styles.actionIconBtn, { backgroundColor: colors.surface2 }]}
                >
                  <Phone size={15} color={colors.accent} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      );
    },
    [colors, navigation, subTab, handleSendWhatsAppReminder, handleMarkPaid, startEditPayment, handleCall]
  );

  const keyExtractor = useCallback((item: Repair) => String(item.id), []);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <LinearGradient colors={colors.bgGradient} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        {navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack() && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        )}
        <Text style={[styles.title, { color: colors.text }]}>Earnings & Dues</Text>
      </View>

      {/* Time Period Filter Row */}
      <View style={styles.periodContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodScrollContent}
          style={styles.periodScroll}
        >
          {([
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'all', label: 'All Time' },
            { key: 'custom', label: 'Custom' },
          ] as const).map((p) => {
            const active = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.periodBtn,
                  { borderColor: colors.border },
                  active && { backgroundColor: colors.accent, borderColor: colors.accent }
                ]}
              >
                <Text style={[
                  styles.periodText,
                  { color: active ? '#FFFFFF' : colors.textMuted }
                ]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Custom Date Pickers */}
      {period === 'custom' && (
        <View style={styles.customDateContainer}>
          <Pressable
            onPress={() => setShowStartDatePicker(true)}
            style={[styles.customDateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>FROM DATE</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
              {customStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowEndDatePicker(true)}
            style={[styles.customDateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>TO DATE</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
              {customEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>
        </View>
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={customStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={customEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}

      {/* KPI Stats Cards */}
      <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
        <View style={styles.fullStatHeader}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Received</Text>
          <CheckCircle size={16} color={colors.success} />
        </View>
        <Text style={[styles.fullStatValue, { color: colors.success }]}>
          {formatCurrency(stats.totalPaid)}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            💵 Cash: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(stats.cashPaid)}</Text>
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            📱 Online: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(stats.onlinePaid)}</Text>
          </Text>
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
            Unpaid Jobs ({duesList.length})
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
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {subTab === 'dues' ? 'No unpaid jobs! All paid up.' : 'No paid jobs yet.'}
            </Text>
          }
          renderItem={renderItem}
        />
      )}

      {/* Edit Payment Modal */}
      {editingRepair && (
        <Modal
          visible={!!editingRepair}
          transparent
          animationType="fade"
          onRequestClose={closePaymentModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePaymentModal} />
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
                  onPress={() => void onSavePayment('cash')}
                  disabled={savingEdit}
                  style={[styles.modalBtn, { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text, fontWeight: '700' }]}>💵 Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => void onSavePayment('online')}
                  disabled={savingEdit}
                  style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>📱 Online</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  periodContainer: {
    marginHorizontal: 18,
    marginBottom: 14,
    height: 38,
  },
  periodScroll: {
    flex: 1,
  },
  periodScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 18,
    alignItems: 'center',
  },
  periodBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    backgroundColor: 'transparent',
    height: 32,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 12,
  },
  customDateBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  fullStatCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  fullStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  fullStatValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  statSubText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    padding: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  device: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  costBreakdown: {
    fontSize: 11,
    fontWeight: '600',
  },
  unpaidBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unpaidText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 16,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
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

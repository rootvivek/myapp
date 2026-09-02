import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { repairService } from '../services/repairService';
import type { Repair } from '../types/repair';
import { formatCurrency } from '../utils/format';

import { EditPaymentModal } from './Finance/EditPaymentModal';
import { calculateDue, calculateNetProfit, calculatePaidAmount, parseMoney } from './Finance/financeHelpers';
import { FinanceListItem } from './Finance/FinanceListItem';
import { FinanceStats } from './Finance/FinanceStats';
import { FinanceTabBar } from './Finance/FinanceTabBar';
import { FinancePeriod, PeriodFilter } from './Finance/PeriodFilter';
import { styles } from './Finance/styles';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function FinanceScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { isOwner } = useAuth();
  const { repairs, loading, updateRepairInState } = useRepairs();

  const [subTab, setSubTab] = useState<'dues' | 'paid'>('dues');
  const [period, setPeriod] = useState<FinancePeriod>('all');
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
  const [savingTarget, setSavingTarget] = useState<'cash' | 'online' | null>(null);

  // Synchronous guards
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);



  const closePaymentModal = useCallback(() => {
    setEditingRepair(null);
    setEditCost('');
    setEditAdvance('');
    setEditPaid(false);
    setSavingEdit(false);
    setSavingTarget(null);
    savingRef.current = false;
  }, []);

  const updatePaymentStatus = useCallback(
    async (
      repair: Repair,
      paymentType: 'cash' | 'online',
      overrides?: { cost?: number; advance?: number; isPaid?: boolean }
    ) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSavingEdit(true);
      setSavingTarget(paymentType);

      const previousState: Partial<Repair> = {
        repairCost: repair.repairCost,
        advanceAmount: repair.advanceAmount,
        isPaid: repair.isPaid,
        paymentType: repair.paymentType,
      };

      try {
        const { id, createdAt, updatedAt, createdByName: _cbn, ...baseInput } = repair;
        const cost = overrides?.cost ?? repair.repairCost;
        const advance = overrides?.advance ?? repair.advanceAmount;
        const isPaid = overrides?.isPaid ?? true;

        // Optimistic local update
        updateRepairInState(id, {
          repairCost: cost,
          advanceAmount: advance,
          isPaid,
          paymentType,
        });

        await repairService.update({
          ...baseInput,
          id,
          repairCost: cost,
          advanceAmount: advance,
          isPaid,
          paymentType,
        });

        if (mountedRef.current) {
          closePaymentModal();
        }
      } catch {
        if (mountedRef.current) {
          updateRepairInState(repair.id, previousState);
        }
        Alert.alert('Error', 'Failed to update payment details.');
      } finally {
        if (mountedRef.current) {
          setSavingEdit(false);
          setSavingTarget(null);
        }
        savingRef.current = false;
      }
    },
    [closePaymentModal, updateRepairInState]
  );

  // Filter & calculation pass
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

  // Handlers
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

  const handleStartDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (date) {
      if (date > customEndDate) {
        Alert.alert('Invalid Date Range', 'Start date cannot be after end date.');
        return;
      }
      setCustomStartDate(date);
    }
  }, [customEndDate]);

  const handleEndDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) {
      if (date < customStartDate) {
        Alert.alert('Invalid Date Range', 'End date cannot be before start date.');
        return;
      }
      setCustomEndDate(date);
    }
  }, [customStartDate]);

  const handleNavigateDetail = useCallback(
    (repairId: number) => {
      navigation.navigate('RepairDetail', { repairId });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Repair }) => (
      <FinanceListItem
        item={item}
        subTab={subTab}
        colors={colors}
        onNavigateDetail={handleNavigateDetail}
        onSendWhatsAppReminder={handleSendWhatsAppReminder}
        onMarkPaid={handleMarkPaid}
        onStartEdit={startEditPayment}
        onCall={handleCall}
      />
    ),
    [colors, subTab, handleNavigateDetail, handleSendWhatsAppReminder, handleMarkPaid, startEditPayment, handleCall]
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
      <LinearGradient colors={colors.bgGradient} style={{ position: 'absolute', width: '100%', height: '100%' }} />

      {/* Header */}
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

      {/* Period Filter */}
      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        setShowStartDatePicker={setShowStartDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        colors={colors}
      />

      {/* KPI Stats */}
      <FinanceStats stats={stats} colors={colors} />

      {/* Tabs */}
      <FinanceTabBar
        subTab={subTab}
        onSubTabChange={setSubTab}
        duesCount={duesList.length}
        paidCount={paidList.length}
        colors={colors}
      />

      {/* List */}
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
      <EditPaymentModal
        editingRepair={editingRepair}
        editCost={editCost}
        setEditCost={setEditCost}
        editAdvance={editAdvance}
        setEditAdvance={setEditAdvance}
        editPaid={editPaid}
        setEditPaid={setEditPaid}
        savingEdit={savingEdit}
        savingTarget={savingTarget}
        onClose={closePaymentModal}
        onSavePayment={onSavePayment}
        colors={colors}
      />
    </SafeAreaView>
  );
}

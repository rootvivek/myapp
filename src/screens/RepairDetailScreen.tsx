import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy } from 'lucide-react-native';

import { AccessoryRow } from '../components/AccessoryRow';
import { PhotoGrid } from '../components/PhotoGrid';
import { useAuth } from '../context/AuthContext';
import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { Repair } from '../types/repair';
import { ACCESSORY_ITEMS, REPAIR_STATUSES } from '../types/repair';
import { shareReceiptPdf } from '../utils/receipt';

import { ActionButtons } from './RepairDetail/ActionButtons';
import { PaymentCard } from './RepairDetail/PaymentCard';
import { RepairInfoCard } from './RepairDetail/RepairInfoCard';
import { CustomerHistoryModal } from '../components/CustomerHistoryModal';
import { createStyles } from './RepairDetail/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'RepairDetail'>;

export function RepairDetailScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const { repairs, deleteRepair, updateRepairInState } = useRepairs();
  const { isOwner, user } = useAuth();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const { repairId } = route.params;

  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealLock, setRevealLock] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canModify = useMemo(() => {
    if (isOwner) return true;
    if (!repair || !user) return false;
    return repair.createdBy === user.id;
  }, [isOwner, repair, user]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const r = await repairService.getById(repairId);
      if (mountedRef.current) {
        setRepair(r);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [repairId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handlePdf(): Promise<void> {
    if (!repair) return;
    try {
      await shareReceiptPdf(repair);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Invoice PDF', msg);
    }
  }

  function handleCall(): void {
    if (!repair) return;
    const url = `tel:${repair.phone}`;
    Linking.canOpenURL(url)
      .then((ok) => {
        if (ok) Linking.openURL(url);
        else Alert.alert('Error', 'Cannot make calls on this device.');
      })
      .catch(() => Alert.alert('Error', 'Failed to initiate call.'));
  }

  function handleNotifyWhatsApp(): void {
    if (!repair || !repair.phone) return;
    const digits = repair.phone.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const statusTxt = repair.status === 'completed' ? 'ready for pickup' : repair.status;
    const msg = `Hello ${repair.customerName}, your repair order (${repair.deviceModel}) is currently ${statusTxt}.\nThank you!\nMCA Phone Wala`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  }

  function handleCopy(): void {
    if (!repair?.orderCode) return;
    Clipboard.setString(repair.orderCode);
    Alert.alert('Copied', `Order code "${repair.orderCode}" copied to clipboard.`);
  }

  async function handleMarkAsPaid(): Promise<void> {
    if (!repair) return;
    Alert.alert(
      'Mark as Paid',
      `Mark this job for ${repair.customerName} as fully paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          style: 'default',
          onPress: async () => {
            try {
              const { id, createdAt, updatedAt, createdByName: _cbn, ...baseInput } = repair;
              updateRepairInState(id, { isPaid: true });
              setRepair((prev) => (prev ? { ...prev, isPaid: true } : prev));
              await repairService.update({
                ...baseInput,
                id,
                isPaid: true,
              });
            } catch {
              updateRepairInState(repair.id, { isPaid: false });
              setRepair((prev) => (prev ? { ...prev, isPaid: false } : prev));
              Alert.alert('Error', 'Failed to update payment status.');
            }
          },
        },
      ]
    );
  }

  async function handleDelete(): Promise<void> {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this repair job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRepair(repairId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete repair.');
            }
          },
        },
      ]
    );
  }

  if (loading || !repair) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <Text style={styles.muted}>Job not found.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);
  const cardColors = mode === 'dark' ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] : [colors.surface, colors.surface];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={colors.bgGradient} style={{ position: 'absolute', width: '100%', height: '100%' }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Job details</Text>
        <Pressable
          onPress={handleCopy}
          style={styles.headerBtn}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <Copy size={16} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Customer & Device Info */}
        <RepairInfoCard
          repair={repair}
          statusLabel={statusLabel}
          revealLock={revealLock}
          setRevealLock={setRevealLock}
          onCall={handleCall}
          onViewHistory={() => setHistoryVisible(true)}
          mode={mode}
          colors={colors}
          cardColors={cardColors}
        />

        {/* Accessories Received */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Accessories received</Text>
        </View>
        <View style={styles.accessoryCard}>
          <View style={styles.accessoryCardInner}>
            {ACCESSORY_ITEMS.map(({ key, label }) => (
              <AccessoryRow key={key} label={label} value={repair[key]} styles={styles} />
            ))}
          </View>
        </View>

        {/* Device Photos */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Device photos</Text>
        </View>
        <View style={styles.photoCard}>
          <View style={styles.photoCardInner}>
            <PhotoGrid repair={repair} styles={styles} />
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Payment Breakdown</Text>
        </View>
        <PaymentCard
          repair={repair}
          balance={balance}
          onMarkAsPaid={() => void handleMarkAsPaid()}
          mode={mode}
          colors={colors}
        />

<<<<<<< HEAD
        {/* Action Buttons */}
        <ActionButtons
          canModify={canModify}
          onPdf={() => void handlePdf()}
          onEdit={() => navigation.navigate('AddRepair', { repairId: repair.id })}
          onDelete={() => void handleDelete()}
          mode={mode}
          colors={colors}
        />
=======
        {/* Actions */}
        <View style={styles.actions}>
          {/* Invoice */}
          <Pressable onPress={() => void handlePdf()} style={styles.actionBtn}>
            <LinearGradient colors={['#7C3AED', '#4F46E5']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}>
              <View style={styles.actionBtnInner}>
                <FileText size={18} color="#fff" strokeWidth={1.8} />
                <Text style={styles.actionBtnText}>Generate Invoice</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* WhatsApp Status Notification */}
          <Pressable onPress={handleNotifyWhatsApp} style={[styles.actionBtnSecondary, { borderColor: 'rgba(34, 197, 94, 0.4)', backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}>
            <Text style={[styles.actionBtnSecondaryText, { color: '#22C55E', fontWeight: '700' }]}>
              💬 Send Status Update on WhatsApp
            </Text>
          </Pressable>

          {/* Edit & Delete */}
          {canModify && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('AddRepair', { repairId: repair.id })}
                style={[styles.actionBtnSecondary, { flex: 1 }]}
              >
                <Text style={styles.actionBtnSecondaryText}>Edit job</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert('Delete Repair', 'Are you sure? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: handleDelete },
                  ]);
                }}
                style={[styles.actionBtnSecondary, { flex: 1, borderColor: 'rgba(239,68,68,0.2)' }]}
              >
                <Text style={[styles.actionBtnSecondaryText, { color: '#EF4444' }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
      </ScrollView>

      <CustomerHistoryModal
        visible={historyVisible}
        customer={{
          customerName: repair.customerName,
          phone: repair.phone,
          deviceModel: repair.deviceModel,
        }}
        repairs={repairs}
        onClose={() => setHistoryVisible(false)}
        onSelectRepair={(id) => {
          setHistoryVisible(false);
          navigation.navigate('RepairDetail', { repairId: id });
        }}
        onNewRepair={(prefillCustomer) => {
          setHistoryVisible(false);
          navigation.navigate('AddRepair', { prefillCustomer });
        }}
      />
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar } from 'react-native-paper';
import { ArrowLeft, Copy } from 'lucide-react-native';

import { AccessoryRow } from '../components/AccessoryRow';
import { PhotoGrid } from '../components/PhotoGrid';
import { AppActivityIndicator } from '../components/ui/AppActivityIndicator';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { useAuth } from '../context/AuthContext';
import { useRepairs } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import { repairService } from '../services/repairService';
import type { RootStackParamList } from '../navigation/types';
import type { Repair } from '../types/repair';
import { ACCESSORY_ITEMS, REPAIR_STATUSES } from '../types/repair';
import { accentAlpha, spacing } from '../theme';
import { shareReceiptPdf } from '../utils/receipt';
import { dialPhone } from '../utils/phone';

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
  const { setActiveTab } = useTab();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairId } = route.params;

  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
        setLoadError(false);
      }
    } catch (err) {
      // Keep a distinct error state: previously a network failure fell through
      // to "Job not found" and rejected the promise with no handler.
      console.warn('[RepairDetail] Failed to load repair:', err);
      if (mountedRef.current) {
        setLoadError(true);
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
    if (!repair?.phone) return;
    void dialPhone(repair.phone);
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

  function handleBack(): void {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // The dashboard is the fallback only when this screen has no prior route.
    setActiveTab('jobs');
    navigation.navigate('Home');
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {/* Header is shown here too: this screen has headerShown:false, so
            without it the user would have no way back on a load failure. */}
        <Appbar.Header
          mode="center-aligned"
          style={{ backgroundColor: colors.surface, elevation: 0 }}
        >
          <Appbar.Action
            icon={() => <ArrowLeft size={22} color={colors.text} />}
            onPress={handleBack}
            accessibilityLabel="Back to home"
          />
          <Appbar.Content
            title="Job details"
            titleStyle={{ fontSize: 17, fontWeight: '700', color: colors.text }}
          />
        </Appbar.Header>

        <View style={styles.centered}>
          {loading ? (
            <AppActivityIndicator size="large" color={colors.accent} />
          ) : loadError ? (
            <>
              <Text style={styles.muted}>Could not load this job. Check your connection.</Text>
              <AppButton
                variant="outline"
                onPress={() => void load()}
                accessibilityLabel="Retry loading job"
                containerStyle={{ marginTop: spacing.sm }}
              >
                Retry
              </AppButton>
            </>
          ) : (
            <Text style={styles.muted}>Job not found.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);
  const cardColors = mode === 'dark' ? [accentAlpha(colors.text, 0.06), accentAlpha(colors.text, 0.02)] : [colors.surface, colors.surface];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* Header */}
      <Appbar.Header
        mode="center-aligned"
        style={{ backgroundColor: colors.surface, elevation: 0 }}
      >
        <Appbar.Action
          icon={() => <ArrowLeft size={22} color={colors.text} />}
          onPress={handleBack}
          accessibilityLabel="Back to home"
        />
        <Appbar.Content
          title="Job details"
          titleStyle={{ fontSize: 17, fontWeight: '700', color: colors.text }}
        />
        <Appbar.Action
          icon={() => <Copy size={22} color={colors.text} />}
          onPress={handleCopy}
          accessibilityLabel="Copy order code"
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Customer & Device Info */}
        <RepairInfoCard
          repair={repair}
          statusLabel={statusLabel}
          revealLock={revealLock}
          setRevealLock={setRevealLock}
          onCall={handleCall}
          onViewHistory={() => setHistoryVisible(true)}
          colors={colors}
          cardColors={cardColors}
        />

        {/* Accessories Received */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Accessories received</Text>
        </View>
        <AppCard variant="outlined" containerStyle={styles.sectionCard}>
          <View style={styles.listCardBody}>
            {ACCESSORY_ITEMS.map(({ key, label }) => (
              <AccessoryRow key={key} label={label} value={repair[key]} styles={styles} />
            ))}
          </View>
        </AppCard>

        {/* Device Photos */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Device photos</Text>
        </View>
        <AppCard variant="outlined" containerStyle={styles.sectionCard}>
          <View style={styles.photoCardBody}>
            <PhotoGrid repair={repair} styles={styles} />
          </View>
        </AppCard>

        {/* Payment Details */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Payment Breakdown</Text>
        </View>
        <PaymentCard
          repair={repair}
          balance={balance}
          onMarkAsPaid={() => void handleMarkAsPaid()}
          colors={colors}
        />

        {/* Action Buttons */}
        <ActionButtons
          canModify={canModify}
          onPdf={() => void handlePdf()}
          onEdit={() => navigation.navigate('AddRepair', { repairId: repair.id })}
          onDelete={() => void handleDelete()}
          colors={colors}
        />

        {/* WhatsApp Status Notification */}
        <View style={{ marginHorizontal: spacing.gutter, marginTop: spacing.sm + 2 }}>
          <AppButton
            variant="secondary"
            fullWidth
            leftIcon={<WhatsAppIcon size={16} />}
            onPress={handleNotifyWhatsApp}
            accessibilityLabel="Send status update on WhatsApp"
          >
            Send Status Update on WhatsApp
          </AppButton>
        </View>
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

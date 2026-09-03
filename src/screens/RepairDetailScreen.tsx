import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Copy,
  FileText,
  Lock,
  Phone,
  QrCode,
  Smartphone,
  TriangleAlert,
  User,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessoryRow } from '../components/AccessoryRow';
import { InfoRow } from '../components/InfoRow';
import { PatternPreview } from '../components/PatternDrawingModal';
import { PhotoGrid } from '../components/PhotoGrid';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useRepairs } from '../context/RepairsContext';
import { useAuth } from '../context/AuthContext';
import { getRepairById, updateRepair } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair } from '../types/repair';
import { ACCESSORY_ITEMS, REPAIR_STATUSES } from '../types/repair';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import { shareReceiptPdf } from '../utils/receipt';

type Props = NativeStackScreenProps<RootStackParamList, 'RepairDetail'>;

function createStyles(colors: AppColors, mode: 'light' | 'dark') {
  const isLight = mode === 'light';
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgGradient[0] || colors.bg },
    scroll: { paddingBottom: spacing.xl },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isLight ? colors.surface2 : 'rgba(246, 234, 234, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },

    /* Order code card */
    orderCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
    },
    orderCardInner: { padding: spacing.md, gap: spacing.xs },
    orderCodeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderCode: {
      color: '#fff',
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    orderId: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },

    /* Info rows */
    infoCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    infoCardInner: { padding: spacing.md, gap: spacing.md },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContent: { flex: 1, minWidth: 0 },
    infoLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 2,
    },
    infoValueHighlight: { color: colors.accent },
    chip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: isLight ? colors.surface2 : 'rgba(167,139,250,0.12)',
    },
    chipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
    patternDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 48,
      marginTop: -4,
      marginBottom: 8,
      gap: spacing.md,
    },
    patternDetailContainer: {
      padding: 6,
      backgroundColor: isLight ? colors.surface2 : 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    patternTextContainer: {
      flex: 1,
    },
    patternLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    patternValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },

    /* Section title */
    sectionTitle: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    sectionTitleText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    /* Accessory rows */
    accessoryCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    accessoryCardInner: { padding: spacing.md, gap: spacing.md },
    accessoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accessoryLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    accessoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 99,
    },
    accessoryBadgeText: { fontSize: 12, fontWeight: '700' },

    /* Photos */
    photoCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    photoCardInner: { padding: spacing.md, gap: spacing.sm },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    photoItem: {
      width: '47%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isLight ? colors.surface2 : 'rgba(255,255,255,0.04)',
    },
    photoImg: { width: '100%', height: '100%' },
    photoLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    photoLabelText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    noPhotos: {
      color: colors.textMuted,
      fontSize: 13,
      fontStyle: 'italic',
    },

    /* Payment card */
    paymentCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    paymentCardInner: { padding: spacing.md, gap: spacing.sm },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    paymentValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    paymentValueAccent: { color: colors.accent },
    paymentValueGreen: { color: colors.success },
    paymentDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },

    /* Action buttons */
    actions: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    actionBtn: { borderRadius: 14, overflow: 'hidden' },
    actionBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 16,
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    actionBtnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      backgroundColor: isLight ? colors.surface : 'rgba(255,255,255,0.04)',
    },
    actionBtnSecondaryText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },

    /* Loading / error */
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    muted: { color: colors.textMuted },
  });
}

/* Main Screen */

export function RepairDetailScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const { deleteRepair } = useRepairs();
  const { isOwner, user } = useAuth();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const { repairId } = route.params;
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealLock, setRevealLock] = useState(false);

  const canModify = useMemo(() => {
    if (isOwner) return true;
    if (!repair || !user) return false;
    return repair.createdBy === user.id;
  }, [isOwner, repair, user]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const r = await getRepairById(repairId);
    setRepair(r);
    setLoading(false);
  }, [repairId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  /* Handlers */

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
              const { id, createdAt, updatedAt, ...baseInput } = repair;
              await updateRepair({
                ...baseInput,
                id,
                isPaid: true,
              });
              await load();
            } catch {
              Alert.alert('Error', 'Failed to update payment status.');
            }
          },
        },
      ]
    );
  }

  async function handleDelete(): Promise<void> {
    try {
      await deleteRepair(repairId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to delete repair.');
    }
  }

  /* Loading / Not found */

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
  const isLight = mode === 'light';
  const cardColors = mode === 'dark' ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] : [colors.surface, colors.surface];

  /* Render */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={colors.bgGradient}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order code card */}
        <LinearGradient
          colors={mode === 'dark' ? ['#1E1B4B', '#0F172A'] : ['#EA580C', '#C2410C']}
          style={styles.orderCard}
        >
          <View style={styles.orderCardInner}>
            <View style={styles.orderCodeRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.orderCode}>{repair.orderCode}</Text>
                <Text style={styles.orderId}>Record #{repair.id}</Text>
              </View>
              <StatusBadge status={repair.status} label={statusLabel} />
            </View>
          </View>
        </LinearGradient>

        {/* Customer info */}
        <LinearGradient
          colors={cardColors}
          style={styles.infoCard}
        >
          <View style={styles.infoCardInner}>
            <InfoRow
              icon={User}
              iconBg="rgba(167,139,250,0.25)"
              label="Customer"
              value={repair.customerName}
              styles={styles}
              iconColor={mode === 'dark' ? '#C084FC' : '#7C3AED'}
            />
            <InfoRow
              icon={Phone}
              iconBg="rgba(52,211,153,0.2)"
              label="Phone"
              value={repair.phone}
              highlight
              chip=" "
              chipIcon={Phone}
              chipColor="#22C55E"
              onChipPress={handleCall}
              styles={styles}
              iconColor={mode === 'dark' ? '#34D399' : '#16A34A'}
            />
            <InfoRow
              icon={Smartphone}
              iconBg="rgba(96,165,250,0.2)"
              label="Device"
              value={repair.deviceModel || '\u2014'}
              styles={styles}
              iconColor={mode === 'dark' ? '#60A5FA' : '#2563EB'}
            />
            <InfoRow
              icon={TriangleAlert}
              iconBg="rgba(251,146,60,0.2)"
              label="Issue"
              value={repair.problem || '\u2014'}
              styles={styles}
              iconColor={mode === 'dark' ? '#FDBA74' : '#EA580C'}
            />
            <InfoRow
              icon={QrCode}
              iconBg="rgba(167,139,250,0.25)"
              label="IMEI"
              value={repair.imei || '\u2014'}
              chip=" "
              onChipPress={() => {
                if (repair.imei) {
                  Clipboard.setString(repair.imei);
                  Alert.alert('Copied', 'IMEI copied to clipboard');
                }
              }}
              styles={styles}
              iconColor={mode === 'dark' ? '#C084FC' : '#7C3AED'}
            />
            {repair.lockType ? (
              <>
                <InfoRow
                  icon={Lock}
                  iconBg="rgba(251,191,36,0.2)"
                  label="Device lock"
                  value={
                    repair.lockType === 'pattern'
                      ? 'Pattern'
                      : repair.lockType === 'pin'
                        ? `PIN: ${revealLock ? repair.lockValue : '••••'}`
                        : `Password: ${revealLock ? repair.lockValue : '••••••••'}`
                  }
                  chip={revealLock ? 'Hide' : 'Show'}
                  chipIcon={revealLock ? EyeOff : Eye}
                  onChipPress={() => setRevealLock(!revealLock)}
                  styles={styles}
                  iconColor={mode === 'dark' ? '#FBBF24' : '#D97706'}
                />
                {repair.lockType === 'pattern' && repair.lockValue ? (
                  revealLock ? (
                    <View style={styles.patternDetailRow}>
                      <View style={styles.patternDetailContainer}>
                        <PatternPreview path={repair.lockValue} size={80} />
                      </View>
                      <View style={styles.patternTextContainer}>
                        <Text style={styles.patternLabel}>Swipe pattern</Text>
                        <Text style={styles.patternValue}>{repair.lockValue}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.patternDetailRow, { justifyContent: 'center', paddingVertical: 12 }]}>
                      <Text style={{ fontStyle: 'italic', fontSize: 12, color: colors.textMuted }}>
                        Pattern hidden. Click Show to reveal.
                      </Text>
                    </View>
                  )
                ) : null}
              </>
            ) : null}
             <InfoRow
              icon={Calendar}
              iconBg="rgba(232,121,249,0.2)"
              label="Received"
              value={formatDateDisplay(repair.dateReceived)}
              styles={styles}
              iconColor={mode === 'dark' ? '#F472B6' : '#DB2777'}
            />
            {repair.createdByName ? (
              <InfoRow
                icon={User}
                iconBg="rgba(99,102,241,0.2)"
                label="Added By"
                value={repair.createdByName}
                styles={styles}
                iconColor={mode === 'dark' ? '#818CF8' : '#4F46E5'}
              />
            ) : null}
            {repair.warranty ? (
              <InfoRow
                icon={Shield}
                iconBg="rgba(34,197,94,0.2)"
                label="Warranty"
                value={repair.warranty}
                styles={styles}
                iconColor={mode === 'dark' ? '#34D399' : '#16A34A'}
              />
            ) : null}
          </View>
        </LinearGradient>

        {/* Accessories */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Accessories received</Text>
        </View>
        <LinearGradient
          colors={cardColors}
          style={styles.accessoryCard}
        >
          <View style={styles.accessoryCardInner}>
            {ACCESSORY_ITEMS.map(({ key, label }) => (
              <AccessoryRow key={key} label={label} value={repair[key]} styles={styles} />
            ))}
          </View>
        </LinearGradient>

        {/* Photos */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Device photos</Text>
        </View>
        <LinearGradient
          colors={cardColors}
          style={styles.photoCard}
        >
          <View style={styles.photoCardInner}>
            <PhotoGrid repair={repair} styles={styles} />
          </View>
        </LinearGradient>

        {/* Payment */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Payment</Text>
        </View>
        <LinearGradient
          colors={cardColors}
          style={styles.paymentCard}
        >
          <View style={styles.paymentCardInner}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Repair cost</Text>
              <Text style={styles.paymentValue}>{formatCurrency(repair.repairCost)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Advance paid</Text>
              <Text style={[styles.paymentValue, styles.paymentValueGreen]}>
                {formatCurrency(repair.advanceAmount)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment method</Text>
              <Text style={styles.paymentValue}>
                {repair.paymentType === 'online' ? 'Online' : 'Cash'}
              </Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Balance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={[
                    styles.paymentValue,
                    repair.isPaid ? styles.paymentValueGreen : styles.paymentValueAccent,
                  ]}
                >
                  {repair.isPaid ? 'Paid \u2713' : formatCurrency(balance)}
                </Text>
                {!repair.isPaid && (
                  <Pressable
                    onPress={() => void handleMarkAsPaid()}
                    style={({ pressed }) => [
                      {
                        padding: 4,
                        marginLeft: 4,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <CheckCircle size={18} color={colors.success} strokeWidth={2.5} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

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
      </ScrollView>
    </SafeAreaView>
  );
}

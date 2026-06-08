import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { accentAlpha } from '../theme';
import type { AppColors } from '../theme';
import { spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';
import { REPAIR_STATUSES } from '../types/repair';
import { formatDateDisplay } from '../utils/format';
import { shareReceiptPdf } from '../utils/receipt';
import { StatusChip } from './StatusChip';

type Props = {
  repair: Repair;
  onPress: () => void;
  onStatusChange?: (repairId: number, status: RepairStatus) => void | Promise<void>;
};

// Status pill icons (colors are resolved dynamically from context colors)
const STATUS_ICONS: Record<RepairStatus, string> = {
  pending: '⏳',
  in_progress: '🔄',
  completed: '✅',
  delivered: '📦',
  cancelled: '❌',
};

function createStyles(colors: AppColors) {
  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 6,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 0,
      padding: 8,
    },
    body: { flexDirection: 'row', alignItems: 'stretch' },
    /* ── Left image ─────────────────── */
    imgWrap: { width: 100, justifyContent: 'center', position: 'relative' },
    img: { width: 100, height: 100, borderRadius: 8, backgroundColor: colors.surface2 },
    badge: {
      position: 'absolute', bottom: 6, left: 6,
      backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    /* ── Center content ─────────────── */
    content: { flex: 1, paddingHorizontal: 8, justifyContent: 'center', gap: 3 },
    custTexts: { flex: 1, minWidth: 0 },
    custLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '500' },
    custName: { color: colors.text, fontSize: 13, fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', width: 56 },
    infoValue: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '500' },
    /* ── Right actions ──────────────── */
    actions: { justifyContent: 'center', alignItems: 'center', gap: 8 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 5,
      width: 90,
      height: 28,
      backgroundColor: colors.surface2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    actionIcon: { fontSize: 12 },
    callText: { color: colors.success, fontSize: 11, fontWeight: '700' },
    invoiceText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
    /* ── Modal ──────────────────────── */
    modalWrap: { flex: 1, backgroundColor: colors.text === '#FFFFFF' ? 'rgba(5,8,22,0.85)' : 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: spacing.lg },
    modalOuter: { zIndex: 1, width: '100%' },
    modalSheet: {
      backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1,
      borderColor: 'rgba(124,58,237,0.2)', overflow: 'hidden',
      shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
    },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, letterSpacing: -0.3 },
    modalSub: { color: colors.textMuted, fontSize: 14, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    modalRow: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    modalRowCur: { backgroundColor: accentAlpha(colors.accent, 0.12) },
    modalRowText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    modalRowTextCur: { color: colors.accent, fontWeight: '700' },
    modalCancel: { paddingVertical: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface2 },
    modalCancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 16 },
    disabled: { opacity: 0.5 },
  });
  return s as typeof s & { img: import('react-native').ImageStyle };
}

export const RepairCard = React.memo(function RepairCard({ repair, onPress, onStatusChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusModal, setStatusModal] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const statusLabel = REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;

  const pill = useMemo(() => {
    const icon = STATUS_ICONS[repair.status] ?? '⏳';
    switch (repair.status) {
      case 'pending':
        return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder, icon };
      case 'in_progress':
        return { bg: colors.statusInProgressBg, text: colors.statusInProgressText, border: colors.statusInProgressBorder, icon };
      case 'completed':
        return { bg: colors.statusCompletedBg, text: colors.statusCompletedText, border: colors.statusCompletedBorder, icon };
      case 'delivered':
        return { bg: colors.statusDeliveredBg, text: colors.statusDeliveredText, border: colors.statusDeliveredBorder, icon };
      case 'cancelled':
        return { bg: colors.statusCancelledBg, text: colors.statusCancelledText, border: colors.statusCancelledBorder, icon };
      default:
        return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder, icon };
    }
  }, [repair.status, colors]);

  function pickStatus(s: RepairStatus) {
    setStatusModal(false);
    if (onStatusChange && s !== repair.status) void onStatusChange(repair.id, s);
  }

  async function handleCall() {
    const raw = repair.phone.trim();
    if (!raw) { Alert.alert('No phone number', 'Add a phone number on this job to call.'); return; }
    const dial = raw.replace(/[^\d+]/g, '');
    if (!dial) { Alert.alert('Invalid number', 'Could not dial this phone entry.'); return; }
    try {
      const ok = await Linking.canOpenURL(`tel:${dial}`);
      if (ok) await Linking.openURL(`tel:${dial}`);
      else Alert.alert('Cannot call', 'No app can handle phone calls on this device.');
    } catch { Alert.alert('Cannot call', 'Try again or dial manually.'); }
  }

  async function handlePdf() {
    setPdfBusy(true);
    try {
      await shareReceiptPdf(repair);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Invoice PDF', msg);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.body}>
        {/* ── Image ── */}
        <Pressable onPress={onPress} style={styles.imgWrap}>
          <Image
            source={(repair.imagePhoneFront || repair.imageThumbnail) ? { uri: repair.imagePhoneFront || repair.imageThumbnail } : require('../../assets/app-logo.jpg')}
            style={styles.img} resizeMode="cover"
          />
        </Pressable>

        {/* ── Content ── */}
        <Pressable onPress={onPress} style={styles.content}>
          <View style={styles.custTexts}>
            <Text style={styles.custLabel}>Customer name</Text>
            <Text style={styles.custName} numberOfLines={1}>{repair.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{repair.deviceModel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Problem</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{repair.problem || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{formatDateDisplay(repair.dateReceived)}</Text>
          </View>
          {repair.createdByName ? (
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 2 }}>
              Added by {repair.createdByName}
            </Text>
          ) : null}

        </Pressable>

        {/* ── Right actions ── */}
        <View style={styles.actions}>
          <StatusChip
            status={repair.status}
            label={statusLabel}
            icon={pill.icon}
            bg={pill.bg}
            border={pill.border}
            text={pill.text}
            onPress={onStatusChange ? () => setStatusModal(true) : undefined}
          />
          <Pressable onPress={() => void handleCall()} style={styles.actionBtn}
            android_ripple={{ color: 'rgba(34,197,94,0.2)' }}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.callText}>Call</Text>
          </Pressable>
          <Pressable onPress={() => void handlePdf()} disabled={pdfBusy}
            style={[styles.actionBtn, pdfBusy && styles.disabled]}
            android_ripple={{ color: 'rgba(96,165,250,0.2)' }}>
            {pdfBusy ? <ActivityIndicator size="small" color="#60A5FA" /> : (
              <><Text style={styles.actionIcon}>📋</Text><Text style={styles.invoiceText}>Invoice</Text></>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Status modal ── */}
      {onStatusChange && (
        <Modal visible={statusModal} transparent animationType="fade" onRequestClose={() => setStatusModal(false)}>
          <View style={styles.modalWrap}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setStatusModal(false)} />
            <View style={styles.modalOuter}><View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Set status</Text>
              <Text style={styles.modalSub}>{repair.deviceModel}</Text>
              {REPAIR_STATUSES.map((s) => (
                <Pressable key={s.value} onPress={() => pickStatus(s.value)}
                  style={[styles.modalRow, s.value === repair.status && styles.modalRowCur]}
                  android_ripple={{ color: 'rgba(124,58,237,0.12)' }}>
                  <Text style={[styles.modalRowText, s.value === repair.status && styles.modalRowTextCur]}>
                    {s.label}{s.value === repair.status ? '  ✓' : ''}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setStatusModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View></View>
          </View>
        </Modal>
      )}
    </View>
  );
});

import { useMemo, useState } from 'react';
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
import { radius, spacing } from '../theme';
import type { Repair, RepairStatus } from '../types/repair';
import { REPAIR_STATUSES } from '../types/repair';
import { formatDateDisplay } from '../utils/format';
import { shareReceiptPdf } from '../utils/receipt';

type Props = {
  repair: Repair;
  onPress: () => void;
  /** When set, shows a quick action to change status without opening edit. */
  onStatusChange?: (repairId: number, status: RepairStatus) => void | Promise<void>;
};

function createStyles(colors: AppColors) {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    cardMain: {
      padding: spacing.sm,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    quickRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface2,
    },
    quickBtn: {
      flex: 1,
      minWidth: 0,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    quickBtnDisabled: {
      opacity: 0.5,
    },
    quickBtnIcon: {
      color: colors.accent,
      fontSize: 18,
      lineHeight: 18,
      fontWeight: '700',
    },
    quickBtnText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '800',
    },
    quickStatusText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    quickDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalSheetOuter: {
      zIndex: 1,
      width: '100%',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      letterSpacing: -0.3,
    },
    modalSub: {
      color: colors.textMuted,
      fontSize: 14,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    modalRow: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    modalRowCurrent: {
      backgroundColor: accentAlpha(colors.accent, 0.1),
    },
    modalRowText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalRowTextCurrent: {
      color: colors.accent,
      fontWeight: '700',
    },
    modalCancel: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface2,
    },
    modalCancelText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 16,
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm + 2,
    },
    thumbWrap: {
      width: 88,
      height: 88,
    },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: 4,
      backgroundColor: colors.surface2,
    },

    mainText: {
      flex: 1,
      minWidth: 0,
    },
    detailLine: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 0,
    },
    detailLabel: {
      color: colors.textMuted,
      fontWeight: '700',
      marginRight: 6,
      fontSize: 13,
    },
    detailValue: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
  });

  return styles as typeof styles & {
    thumb: import('react-native').ImageStyle;
  };
}

export function RepairCard({ repair, onPress, onStatusChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [statusModal, setStatusModal] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const statusLabel = REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;

  function pickStatus(s: RepairStatus): void {
    setStatusModal(false);
    if (onStatusChange && s !== repair.status) void onStatusChange(repair.id, s);
  }

  async function handleCall(): Promise<void> {
    const raw = repair.phone.trim();
    if (!raw) {
      Alert.alert('No phone number', 'Add a phone number on this job to call.');
      return;
    }
    const dial = raw.replace(/[^\d+]/g, '');
    if (!dial) {
      Alert.alert('Invalid number', 'Could not dial this phone entry.');
      return;
    }
    const url = `tel:${dial}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Cannot call', 'No app can handle phone calls on this device.');
    } catch {
      Alert.alert('Cannot call', 'Try again or dial manually.');
    }
  }

  async function handleSharePdf(): Promise<void> {
    setPdfBusy(true);
    try {
      await shareReceiptPdf(repair);
    } catch {
      Alert.alert('Receipt PDF', 'Could not create or share the PDF. Try again.');
    } finally {
      setPdfBusy(false);
    }
  }


  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}
        android_ripple={{ color: colors.border }}
      >
        <View style={styles.rowMain}>
          <View style={styles.thumbWrap}>
            {repair.imageThumbnail ? (
              <Image source={{ uri: repair.imageThumbnail }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <Image
                source={require('../../assets/app-logo.jpg')}
                style={styles.thumb}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={styles.mainText}>
            <Text style={styles.detailLine} numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.detailLabel}>Customer name :</Text>
              <Text style={styles.detailValue}>{repair.customerName}</Text>
            </Text>

            <Text style={styles.detailLine} numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.detailLabel}>Device :</Text>
              <Text style={styles.detailValue}>{repair.deviceModel}</Text>
            </Text>

            <Text style={styles.detailLine} numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.detailLabel}>Device Problem :</Text>
              <Text style={styles.detailValue}>{repair.problem || '—'}</Text>
            </Text>

            <Text style={styles.detailLine} numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.detailLabel}>Date of register :</Text>
              <Text style={styles.detailValue}>{formatDateDisplay(repair.dateReceived)}</Text>
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.quickRow}>
        <Pressable
          onPress={() => void handleCall()}
          style={styles.quickBtn}
          android_ripple={{ color: colors.border }}
        >
          <View style={styles.quickBtnInner}>
            <Text style={styles.quickBtnIcon}>☎</Text>
            <Text style={styles.quickBtnText}>Call</Text>
          </View>
        </Pressable>
        <View style={styles.quickDivider} />
        <Pressable
          onPress={() => void handleSharePdf()}
          disabled={pdfBusy}
          style={[styles.quickBtn, pdfBusy && styles.quickBtnDisabled]}
          android_ripple={{ color: colors.border }}
        >
          {pdfBusy ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <View style={styles.quickBtnInner}>
              <Text style={styles.quickBtnIcon}>📄</Text>
              <Text style={styles.quickBtnText}>Invoice</Text>
            </View>
          )}
        </Pressable>
        {onStatusChange ? (
          <>
            <View style={styles.quickDivider} />
            <Pressable
              onPress={() => setStatusModal(true)}
              style={styles.quickBtn}
              hitSlop={6}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.quickStatusText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
      {onStatusChange ? (
        <Modal
          visible={statusModal}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModal(false)}
        >
          <View style={styles.modalWrap}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setStatusModal(false)} />
            <View style={styles.modalSheetOuter}>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Set status</Text>
                <Text style={styles.modalSub}>{repair.deviceModel}</Text>
                {REPAIR_STATUSES.map((s) => (
                  <Pressable
                    key={s.value}
                    onPress={() => pickStatus(s.value)}
                    style={[styles.modalRow, s.value === repair.status && styles.modalRowCurrent]}
                    android_ripple={{ color: colors.border }}
                  >
                    <Text
                      style={[
                        styles.modalRowText,
                        s.value === repair.status && styles.modalRowTextCurrent,
                      ]}
                    >
                      {s.label}
                      {s.value === repair.status ? '  ✓' : ''}
                    </Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setStatusModal(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

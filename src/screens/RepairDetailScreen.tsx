import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRepairs } from '../context/RepairsContext';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { getRepairById } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import type { Repair } from '../types/repair';
import { ACCESSORY_ITEMS, REPAIR_STATUSES } from '../types/repair';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import { receiptSummaryText, shareReceiptPdf } from '../utils/receipt';

type Props = NativeStackScreenProps<RootStackParamList, 'RepairDetail'>;

type DetailStyles = ReturnType<typeof createStyles>;

function createStyles(colors: AppColors) {
  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    muted: {
      color: colors.textMuted,
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      opacity: 0.5,
    },
    deleteButton: {
      backgroundColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    deleteButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    headRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    headTitles: {
      flex: 1,
      minWidth: 0,
    },
    orderCode: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    jobId: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
    },
    blockTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    row: {
      marginBottom: spacing.md,
    },
    rowLabel: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 4,
    },
    rowValue: {
      color: colors.text,
      fontSize: 16,
    },
    rowValueHi: {
      color: colors.accent,
      fontWeight: '600',
    },
    rowValueMulti: {
      lineHeight: 22,
    },
    actions: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    primary: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    noPhotos: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: spacing.sm,
    },
    photoLayout: {
      gap: 0,
      marginBottom: spacing.sm,
    },
    photoPairRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    photoPairSpacer: {
      flex: 1,
      minWidth: 0,
    },
    photoCell: {
      flex: 1,
      minWidth: 0,
    },
    photoThumb: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
    },
    photoCaption: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
  });

  return styles as typeof styles & {
    photoThumb: import('react-native').ImageStyle;
  };
}

function PhotoGrid({ repair, styles }: { repair: Repair; styles: DetailStyles }) {
  const front = repair.imagePhoneFront.trim();
  const back = repair.imagePhoneBack.trim();
  const thumb = repair.imageThumbnail.trim();
  const id1 = repair.imageId1.trim();
  const id2 = repair.imageId2.trim();

  const hasAny = front || back || thumb || id1 || id2;
  if (!hasAny) {
    return <Text style={styles.noPhotos}>No photos attached.</Text>;
  }

  return (
    <View style={styles.photoLayout}>
      {front || back ? (
        <View style={styles.photoPairRow}>
          {front ? (
            <View style={styles.photoCell}>
              <Text style={styles.photoCaption}>Phone — front</Text>
              <Image source={{ uri: front }} style={styles.photoThumb} resizeMode="cover" />
            </View>
          ) : null}
          {back ? (
            <View style={styles.photoCell}>
              <Text style={styles.photoCaption}>Phone — back</Text>
              <Image source={{ uri: back }} style={styles.photoThumb} resizeMode="cover" />
            </View>
          ) : null}
        </View>
      ) : null}
      {thumb ? (
        <View style={styles.photoPairRow}>
          <View style={styles.photoCell}>
            <Text style={styles.photoCaption}>Thumbnail</Text>
            <Image source={{ uri: thumb }} style={styles.photoThumb} resizeMode="cover" />
          </View>
          <View style={styles.photoPairSpacer} />
        </View>
      ) : null}
      {id1 || id2 ? (
        <View style={styles.photoPairRow}>
          {id1 ? (
            <View style={styles.photoCell}>
              <Text style={styles.photoCaption}>ID / proof 1</Text>
              <Image source={{ uri: id1 }} style={styles.photoThumb} resizeMode="cover" />
            </View>
          ) : null}
          {id2 ? (
            <View style={styles.photoCell}>
              <Text style={styles.photoCaption}>ID / proof 2</Text>
              <Image source={{ uri: id2 }} style={styles.photoThumb} resizeMode="cover" />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
  multiline,
  styles,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  multiline?: boolean;
  styles: DetailStyles;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHi, multiline && styles.rowValueMulti]}>{value}</Text>
    </View>
  );
}

export function RepairDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { deleteRepair } = useRepairs();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { repairId } = route.params;
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function onSharePdf(): Promise<void> {
    if (!repair) return;
    try {
      await shareReceiptPdf(repair);
    } catch {
      // Sharing cancelled or failed silently
    }
  }

  async function onShareText(): Promise<void> {
    if (!repair) return;
    try {
      const message = await receiptSummaryText(repair);
      await Share.share({ message });
    } catch {
      // ignore
    }
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    try {
      await deleteRepair(repairId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to delete repair. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading || !repair) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          {loading ? <ActivityIndicator size="large" color={colors.accent} /> : <Text style={styles.muted}>Job not found.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = REPAIR_STATUSES.find((s) => s.value === repair.status)?.label ?? repair.status;
  const balance = Math.max(0, repair.repairCost - repair.advanceAmount);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.headTitles}>
            <Text style={styles.orderCode}>{repair.orderCode}</Text>
            <Text style={styles.jobId}>Record #{repair.id}</Text>
          </View>
          <StatusBadge status={repair.status} label={statusLabel} />
        </View>

        <Row label="Customer" value={repair.customerName} styles={styles} />
        <Row label="Phone" value={repair.phone} highlight styles={styles} />
        <Row label="Device" value={repair.deviceModel || '—'} styles={styles} />
        <Row label="IMEI" value={repair.imei || '—'} styles={styles} />
        <Row label="Received" value={formatDateDisplay(repair.dateReceived)} styles={styles} />
        <Row label="Problem" value={repair.problem || '—'} multiline styles={styles} />

        <Text style={styles.blockTitle}>Accessories (with device)</Text>
        {ACCESSORY_ITEMS.map(({ key, label }) => (
          <Row key={key} label={label} value={repair[key] ? 'Yes' : 'No'} styles={styles} />
        ))}

        <Text style={styles.blockTitle}>Device photos</Text>
        <PhotoGrid repair={repair} styles={styles} />

        <Text style={styles.blockTitle}>Payment</Text>
        <Row label="Repair cost" value={formatCurrency(repair.repairCost)} styles={styles} />
        <Row label="Advance" value={formatCurrency(repair.advanceAmount)} styles={styles} />
        <Row label="Balance" value={repair.isPaid ? '—' : formatCurrency(balance)} styles={styles} />
        <Row label="Payment" value={repair.isPaid ? 'Paid' : 'Unpaid'} styles={styles} />

        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Repair',
              'Are you sure you want to delete this repair? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: handleDelete },
              ]
            );
          }}
          disabled={isDeleting}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
            isDeleting && styles.disabled,
          ]}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Repair</Text>
          )}
        </Pressable>

        <View style={styles.actions}>
          <Pressable onPress={() => navigation.navigate('AddRepair', { repairId: repair.id })} style={styles.primary}>
            <Text style={styles.primaryText}>Edit job</Text>
          </Pressable>
          <Pressable onPress={() => void onSharePdf()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Share PDF receipt</Text>
          </Pressable>
          <Pressable onPress={() => void onShareText()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Share summary (WhatsApp, etc.)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

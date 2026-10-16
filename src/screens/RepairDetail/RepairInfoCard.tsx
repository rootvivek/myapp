import React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Calendar,
  Eye,
  EyeOff,
  History,
  Lock,
  Phone,
  QrCode,
  Shield,
  Smartphone,
  Store,
  TriangleAlert,
} from 'lucide-react-native';
import { Package } from 'lucide-react-native';
import { InfoRow } from '../../components/InfoRow';
import { PatternPreview } from '../../components/PatternDrawingModal';
import { StatusBadge } from '../../components/StatusBadge';
import { getWarrantyInfo } from '../../utils/customerHistory';
import { AppCard } from '../../components/ui/AppCard';
import { AppChip } from '../../components/ui/AppChip';
import { AppIconButton } from '../../components/ui/AppIconButton';
import { accentAlpha, radius, sizes, spacing, type AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatDateDisplay } from '../../utils/format';
import { createStyles } from './styles';

type Props = {
  repair: Repair;
  statusLabel: string;
  revealLock: boolean;
  setRevealLock: (reveal: boolean) => void;
  onCall: () => void;
  onViewHistory?: () => void;
  colors: AppColors;
  cardColors: string[];
};

export const RepairInfoCard = React.memo(function RepairInfoCard({
  repair,
  statusLabel,
  revealLock,
  setRevealLock,
  onCall,
  onViewHistory,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <AppCard variant="outlined" containerStyle={styles.sectionCard}>
      <View style={styles.sectionCardBody}>
        {/* ── Order ID & Status Header ── */}
        <View style={styles.heroHeader}>
          <AppChip
            variant="default"
            containerStyle={{ backgroundColor: colors.surface2, borderColor: colors.border }}
            labelStyle={{ color: colors.accent, fontWeight: '800', letterSpacing: 0.3 }}
          >
            {repair.orderCode || `#${repair.id}`}
          </AppChip>
          <StatusBadge status={repair.status} label={statusLabel} />
        </View>

        {/* ── Customer Info & Quick Actions ── */}
        <View style={styles.customerHeaderRow}>
          <View style={styles.customerInfoContainer}>
            <Text style={styles.customerName}>{repair.customerName}</Text>
            <Text style={styles.customerPhone}>
              {repair.phone}
              {repair.createdByName && repair.createdByRole === 'labour' ? ` · Added by ${repair.createdByName}` : ''}
            </Text>
          </View>

          <View style={styles.quickActionsRow}>
            <AppIconButton
              variant="secondary"
              size={36}
              icon={<Phone size={16} color={colors.success} strokeWidth={2.4} />}
              onPress={onCall}
              accessibilityLabel="Call customer"
              containerStyle={{
                backgroundColor: accentAlpha(colors.success, 0.12),
                borderColor: accentAlpha(colors.success, 0.25),
              }}
            />

            {onViewHistory && (
              <AppIconButton
                variant="secondary"
                size={36}
                icon={<History size={16} color={colors.accent} strokeWidth={2.4} />}
                onPress={onViewHistory}
                accessibilityLabel="Customer history"
                containerStyle={{
                  backgroundColor: accentAlpha(colors.accent, 0.12),
                  borderColor: accentAlpha(colors.accent, 0.25),
                }}
              />
            )}
          </View>
        </View>

        {/* ── Details Rows ── */}
        <InfoRow
          icon={Smartphone}
          iconBg={accentAlpha(colors.accent, 0.14)}
          label="Device"
          value={repair.deviceModel || '\u2014'}
          styles={styles}
          iconColor={colors.accent}
        />

        {repair.sellerId !== null && (
          <InfoRow
            icon={Store}
            iconBg={accentAlpha(colors.accent, 0.14)}
            label="Item buyer"
            value={repair.sellerName || 'Unavailable'}
            styles={styles}
            iconColor={colors.accent}
          />
        )}

        <InfoRow
          icon={TriangleAlert}
          iconBg={accentAlpha(colors.warning, 0.14)}
          label="Issue / Problem"
          value={repair.problem || '\u2014'}
          styles={styles}
          iconColor={colors.warning}
        />

        <InfoRow
          icon={Calendar}
          iconBg={accentAlpha(colors.textMuted, 0.14)}
          label="Received Date"
          value={formatDateDisplay(repair.dateReceived)}
          styles={styles}
          iconColor={colors.textMuted}
        />

        <InfoRow
          icon={QrCode}
          iconBg={accentAlpha(colors.accent, 0.14)}
          label="IMEI Number"
          value={repair.imei || '\u2014'}
          chip={repair.imei ? 'Copy' : undefined}
          onChipPress={() => {
            if (repair.imei) {
              Clipboard.setString(repair.imei);
              Alert.alert('Copied', 'IMEI copied to clipboard');
            }
          }}
          styles={styles}
          iconColor={colors.accent}
        />

        <InfoRow
          icon={Package}
          iconBg={accentAlpha(colors.accent, 0.14)}
          label="Accessories Received"
          value={`SIM Tray: ${repair.accSimTray ? 'Yes' : 'No'}  ·  Back Cover: ${repair.accBackCover ? 'Yes' : 'No'}`}
          styles={styles}
          iconColor={colors.accent}
        />

        {repair.warranty ? (() => {
          const wInfo = getWarrantyInfo(repair.dateReceived, repair.warranty);
          return (
            <InfoRow
              icon={Shield}
              iconBg={
                wInfo.active
                  ? accentAlpha(colors.success, 0.14)
                  : accentAlpha(colors.textMuted, 0.14)
              }
              label="Warranty"
              value={`${repair.warranty}${wInfo.isWarranted ? ` (${wInfo.label})` : ''}`}
              styles={styles}
              iconColor={wInfo.active ? colors.success : colors.textMuted}
            />
          );
        })() : null}

        {/* ── Device Lock Section ── */}
        {repair.lockType ? (
          <>
            <InfoRow
              icon={Lock}
              iconBg={accentAlpha(colors.warning, 0.14)}
              label="Device Lock"
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
              iconColor={colors.warning}
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
                <View style={[styles.patternDetailRow, { justifyContent: 'center', paddingVertical: 10 }]}>
                  <Text style={{ fontStyle: 'italic', fontSize: 12, color: colors.textMuted }}>
                    Pattern hidden. Tap Show to reveal.
                  </Text>
                </View>
              )
            ) : null}
          </>
        ) : null}

        {/* ── Order Barcode ── */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 12,
          borderTopWidth: sizes.hairline,
          borderTopColor: colors.border,
          marginTop: 4,
        }}>
          <Text style={{
            color: colors.textMuted,
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}>Order Barcode</Text>
          <Image
            source={{ uri: `https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(repair.orderCode || String(repair.id))}` }}
            style={{ width: 240, height: 70, backgroundColor: '#fff', padding: spacing.xs, borderRadius: radius.sm }}
            resizeMode="contain"
          />
        </View>
      </View>
    </AppCard>
  );
});


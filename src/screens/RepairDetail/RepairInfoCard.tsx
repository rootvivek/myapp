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
  TriangleAlert,
  User,
} from 'lucide-react-native';
import { InfoRow } from '../../components/InfoRow';
import { PatternPreview } from '../../components/PatternDrawingModal';
import { StatusBadge } from '../../components/StatusBadge';
import { getWarrantyInfo } from '../../components/CustomerHistoryModal';
import type { AppColors } from '../../theme';
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
  mode: 'light' | 'dark';
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
  mode,
  colors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        {/* ── Order ID & Status Header ── */}
        <View style={styles.heroHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>{repair.orderCode || `#${repair.id}`}</Text>
          </View>
          <StatusBadge status={repair.status} label={statusLabel} />
        </View>

        {/* ── Customer Info & Quick Actions ── */}
        <View>
          <Text style={styles.customerName}>{repair.customerName}</Text>
          <Text style={styles.customerPhone}>
            {repair.phone}
            {repair.createdByName ? ` · Added by ${repair.createdByName}` : ''}
          </Text>
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable
            onPress={onCall}
            style={[styles.quickBtn, styles.quickBtnCall]}
            android_ripple={{ color: 'rgba(34, 197, 94, 0.2)' }}
          >
            <Phone size={14} color={colors.success} strokeWidth={2.4} />
            <Text style={[styles.quickBtnText, { color: colors.success }]}>Call</Text>
          </Pressable>

          {onViewHistory && (
            <Pressable
              onPress={onViewHistory}
              style={[styles.quickBtn, styles.quickBtnHistory]}
              android_ripple={{ color: 'rgba(124, 58, 237, 0.2)' }}
            >
              <History size={14} color={colors.accent} strokeWidth={2.4} />
              <Text style={[styles.quickBtnText, { color: colors.accent }]}>History</Text>
            </Pressable>
          )}
        </View>

        {/* ── Details Rows ── */}
        <InfoRow
          icon={Smartphone}
          iconBg="rgba(96,165,250,0.18)"
          label="Device"
          value={repair.deviceModel || '\u2014'}
          styles={styles}
          iconColor={mode === 'dark' ? '#60A5FA' : '#2563EB'}
        />

        <InfoRow
          icon={TriangleAlert}
          iconBg="rgba(251,146,60,0.18)"
          label="Issue / Problem"
          value={repair.problem || '\u2014'}
          styles={styles}
          iconColor={mode === 'dark' ? '#FDBA74' : '#EA580C'}
        />

        <InfoRow
          icon={Calendar}
          iconBg="rgba(232,121,249,0.18)"
          label="Received Date"
          value={formatDateDisplay(repair.dateReceived)}
          styles={styles}
          iconColor={mode === 'dark' ? '#F472B6' : '#DB2777'}
        />

        <InfoRow
          icon={QrCode}
          iconBg="rgba(167,139,250,0.18)"
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
          iconColor={mode === 'dark' ? '#C084FC' : '#7C3AED'}
        />

        {repair.warranty ? (() => {
          const wInfo = getWarrantyInfo(repair.dateReceived, repair.warranty);
          return (
            <InfoRow
              icon={Shield}
              iconBg={wInfo.active ? 'rgba(34,197,94,0.18)' : 'rgba(156,163,175,0.18)'}
              label="Warranty"
              value={`${repair.warranty}${wInfo.isWarranted ? ` (${wInfo.label})` : ''}`}
              styles={styles}
              iconColor={wInfo.active ? (mode === 'dark' ? '#34D399' : '#16A34A') : colors.textMuted}
            />
          );
        })() : null}

        {/* ── Device Lock Section ── */}
        {repair.lockType ? (
          <>
            <InfoRow
              icon={Lock}
              iconBg="rgba(251,191,36,0.18)"
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
          borderTopWidth: 1,
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
            style={{ width: 240, height: 70, backgroundColor: '#fff', padding: 4, borderRadius: 8 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
});


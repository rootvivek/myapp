import React from 'react';
import { Alert, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import {
  Calendar,
  Eye,
  EyeOff,
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
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatDateDisplay } from '../../utils/format';
import { createStyles } from './styles';

type Props = {
  repair: Repair;
  revealLock: boolean;
  setRevealLock: (reveal: boolean) => void;
  onCall: () => void;
  mode: 'light' | 'dark';
  colors: AppColors;
  cardColors: string[];
};

export const RepairInfoCard = React.memo(function RepairInfoCard({
  repair,
  revealLock,
  setRevealLock,
  onCall,
  mode,
  colors,
  cardColors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <LinearGradient colors={cardColors} style={styles.infoCard}>
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
          onChipPress={onCall}
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
  );
});

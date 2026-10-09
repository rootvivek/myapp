import React from 'react';
import { Text, View } from 'react-native';
import { Phone, Printer, ChevronDown } from 'lucide-react-native';

import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { useRepairActions } from './hooks';
import type { PillConfig } from './constants';
import type { CardStyles } from './styles';
import { AppActivityIndicator } from '../../components/ui/AppActivityIndicator';
import { AppChip } from '../../components/ui/AppChip';
import { AppIconButton } from '../../components/ui/AppIconButton';

type Props = {
  repair: Repair;
  pill: PillConfig;
  statusLabel: string;
  onStatusChipPress: (() => void) | undefined;
  styles: CardStyles;
  colors: AppColors;
};

export const RepairActions = React.memo(function RepairActions({
  repair,
  pill,
  statusLabel,
  onStatusChipPress,
  styles,
  colors,
}: Props) {
  const { handleCall, handleWhatsApp, handleShare, pdfBusy, shareBusy } =
    useRepairActions(repair);

  return (
    <View style={styles.cardFooter}>
      {/* ── Status Pill (set-status dropdown) ── */}
      <AppChip
        variant="default"
        showSelectedCheck={false}
        onPress={onStatusChipPress}
        disabled={!onStatusChipPress}
        accessibilityLabel={`Status: ${statusLabel}. Tap to change.`}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        containerStyle={{
          backgroundColor: pill.bg,
          borderColor: pill.border,
          flexShrink: 1,
          minHeight: 28,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
        labelStyle={{
          color: pill.text,
          fontWeight: '700',
          fontSize: 11,
          lineHeight: 14,
          marginVertical: 0,
          marginLeft: 0,
          marginRight: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.statusIcon}>{pill.icon}</Text>
          <Text style={{ color: pill.text, fontWeight: '700', fontSize: 11, lineHeight: 14 }}>{statusLabel}</Text>
          <ChevronDown size={11} color={pill.text} strokeWidth={2.5} />
        </View>
      </AppChip>

      {/* ── Action Buttons ── */}
      <View style={styles.actionIconsGroup}>
        {/* Call Button */}
        <AppIconButton
          variant="secondary"
          size={28}
          icon={<Phone size={12} color={colors.success} strokeWidth={2.2} />}
          onPress={handleCall}
          accessibilityLabel="Call Customer"
          containerStyle={styles.callBtn}
        />

        {/* WhatsApp Button */}
        <AppIconButton
          variant="secondary"
          size={28}
          icon={pdfBusy ? (
            <AppActivityIndicator size="small" color="#25D366" />
          ) : (
            <WhatsAppIcon size={12} />
          )}
          onPress={handleWhatsApp}
          disabled={pdfBusy}
          accessibilityLabel="Send WhatsApp invoice"
          containerStyle={styles.whatsappBtn}
        />

        {/* Invoice / Share Button */}
        <AppIconButton
          variant="secondary"
          size={28}
          icon={shareBusy ? (
            <AppActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Printer size={12} color={colors.accent} strokeWidth={2.2} />
          )}
          onPress={handleShare}
          disabled={shareBusy}
          accessibilityLabel="Share Invoice PDF"
          containerStyle={styles.invoiceBtn}
        />
      </View>
    </View>
  );
});

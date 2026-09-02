import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ChevronDown, Phone, Printer } from 'lucide-react-native';

import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { useRepairActions } from './hooks';
import type { PillConfig } from './constants';
import type { CardStyles } from './styles';

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
      {/* ── Status Pill ── */}
      <Pressable
        onPress={onStatusChipPress}
        disabled={!onStatusChipPress}
        style={[
          styles.statusChip,
          {
            backgroundColor: pill.bg,
            borderColor: pill.border,
          },
        ]}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
        accessibilityRole="button"
        accessibilityLabel={`Status: ${statusLabel}. Tap to change.`}
      >
        <Text style={styles.statusIcon}>{pill.icon}</Text>
        <Text style={[styles.statusText, { color: pill.text }]} numberOfLines={1}>
          {statusLabel}
        </Text>
        {onStatusChipPress && (
          <ChevronDown size={13} color={pill.text} strokeWidth={2.4} />
        )}
      </Pressable>

      {/* ── Action Buttons ── */}
      <View style={styles.actionIconsGroup}>
        {/* Call Button */}
        <Pressable
          onPress={handleCall}
          style={[styles.iconBtn, styles.callBtn]}
          android_ripple={{ color: 'rgba(34, 197, 94, 0.2)' }}
          accessibilityRole="button"
          accessibilityLabel="Call Customer"
        >
          <Phone size={14} color={colors.success} strokeWidth={2.2} />
        </Pressable>

        {/* WhatsApp Button */}
        <Pressable
          onPress={handleWhatsApp}
          disabled={pdfBusy}
          style={[styles.iconBtn, styles.whatsappBtn, pdfBusy && styles.disabled]}
          android_ripple={{ color: 'rgba(37, 211, 102, 0.2)' }}
          accessibilityRole="button"
          accessibilityLabel="Send WhatsApp invoice"
        >
          {pdfBusy ? (
            <ActivityIndicator size="small" color="#25D366" />
          ) : (
            <WhatsAppIcon size={14} />
          )}
        </Pressable>

        {/* Invoice / Share Button */}
        <Pressable
          onPress={handleShare}
          disabled={shareBusy}
          style={[styles.iconBtn, styles.invoiceBtn, shareBusy && styles.disabled]}
          android_ripple={{ color: 'rgba(124, 58, 237, 0.2)' }}
          accessibilityRole="button"
          accessibilityLabel="Share Invoice PDF"
        >
          {shareBusy ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Printer size={14} color={colors.accent} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>
    </View>
  );
});


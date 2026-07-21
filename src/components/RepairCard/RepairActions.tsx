import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Printer } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { Repair, RepairStatus } from '../../types/repair';
import { REPAIR_STATUSES } from '../../types/repair';
import { StatusChip } from '../StatusChip';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { ActionButton } from './ActionButton';
import { LABELS } from './constants';
import type { PillConfig } from './constants';
import { useRepairActions } from './hooks';
import { PaymentBadges } from './PaymentBadges';
import type { CardStyles } from './styles';

type Props = {
  repair: Repair;
  pill: PillConfig;
  statusLabel: string;
  onStatusChipPress: (() => void) | undefined;
  styles: CardStyles;
  colors: AppColors;
};

const CALL_ICON = <Text style={{ fontSize: 12 }}>📞</Text>;

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
    <View style={styles.badgesRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScrollContent}
      >
        <StatusChip
          status={repair.status}
          label={statusLabel}
          icon={pill.icon}
          bg={pill.bg}
          border={pill.border}
          text={pill.text}
          onPress={onStatusChipPress}
        />

        <ActionButton
          icon={CALL_ICON}
          title={LABELS.CALL}
          titleStyle={styles.callText}
          onPress={handleCall}
          loading={false}
          loadingColor={colors.success}
          rippleColor="rgba(34,197,94,0.2)"
          accessibilityLabel="Call customer"
          accessibilityHint="Calls the customer phone number"
          styles={styles}
        />

        <ActionButton
          icon={<WhatsAppIcon size={14} />}
          title={LABELS.WHATSAPP}
          titleStyle={styles.whatsappText}
          onPress={handleWhatsApp}
          loading={pdfBusy}
          loadingColor="#25D366"
          rippleColor="rgba(37,211,102,0.2)"
          accessibilityLabel="Send WhatsApp invoice"
          accessibilityHint="Generates PDF and sends via WhatsApp"
          styles={styles}
        />

        <ActionButton
          icon={<Printer size={13} color={colors.accent} />}
          title={LABELS.INVOICE}
          titleStyle={styles.shareText}
          onPress={handleShare}
          loading={shareBusy}
          loadingColor={colors.accent}
          rippleColor="rgba(124,58,237,0.2)"
          accessibilityLabel="Share invoice"
          accessibilityHint="Generates and shares PDF invoice"
          styles={styles}
        />

        <PaymentBadges
          repair={repair}
          styles={styles}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
});

import React from 'react';
import { Text, View } from 'react-native';

import type { AppColors } from '../../theme';
import { accentAlpha } from '../../theme';
import type { Repair } from '../../types/repair';
import { LABELS } from './constants';
import type { CardStyles } from './styles';

type Props = {
  repair: Repair;
  styles: CardStyles;
  colors: AppColors;
};

export const PaymentBadges = React.memo(function PaymentBadges({
  repair,
  styles,
  colors,
}: Props) {
  if (!repair.isPaid) return null;

  const isOnline = repair.paymentType === 'online';

  return (
    <>
      {/* Paid badge */}
      <View
        style={[
          styles.badgePill,
          {
            backgroundColor: accentAlpha(colors.success, 0.12),
            borderColor: accentAlpha(colors.success, 0.24),
          },
        ]}
        accessibilityLabel={LABELS.PAID}
      >
        <Text style={styles.badgePillIcon}>💰</Text>
        <Text style={[styles.badgePillText, { color: colors.success }]}>
          {LABELS.PAID}
        </Text>
      </View>

      {/* Payment type badge */}
      {repair.paymentType ? (
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: accentAlpha(isOnline ? colors.accent : colors.success, 0.12),
              borderColor: accentAlpha(isOnline ? colors.accent : colors.success, 0.24),
            },
          ]}
          accessibilityLabel={isOnline ? LABELS.ONLINE : LABELS.CASH}
        >
          <Text style={styles.badgePillIcon}>{isOnline ? '🌐' : '💵'}</Text>
          <Text
            style={[
              styles.badgePillText,
              { color: isOnline ? colors.accent : colors.success },
            ]}
          >
            {isOnline ? LABELS.ONLINE : LABELS.CASH}
          </Text>
        </View>
      ) : null}
    </>
  );
});

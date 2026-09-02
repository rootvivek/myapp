import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckCircle2, Clock } from 'lucide-react-native';

import { SecureImage } from '../SecureImage';
import type { AppColors } from '../../theme';
import { accentAlpha } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatDateDisplay } from '../../utils/format';
import { getImageSource, LABELS } from './constants';
import type { CardStyles } from './styles';

type Props = {
  repair: Repair;
  onPress: () => void;
  onPaymentPress?: () => void;
  styles: CardStyles;
  colors: AppColors;
};

export const RepairInfo = React.memo(function RepairInfo({
  repair,
  onPress,
  onPaymentPress,
  styles,
  colors,
}: Props) {
  const imageSource = getImageSource(repair);
  const displayCode = repair.orderCode ? `#${repair.orderCode}` : `#${repair.id}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View repair for ${repair.customerName}`}
      accessibilityHint="Opens repair details"
    >
      {/* ── Top Header Row ── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.orderCodeBadge}>
            <Text style={styles.orderCodeText}>{displayCode}</Text>
          </View>
          <Text style={styles.customerName} numberOfLines={1}>
            {repair.customerName}
          </Text>
        </View>

        {/* Payment Status Badge (without repeating price) */}
        <Pressable
          onPress={onPaymentPress || onPress}
          style={[
            styles.paymentBadge,
            {
              backgroundColor: repair.isPaid
                ? accentAlpha(colors.success, 0.12)
                : accentAlpha(colors.warning, 0.12),
              borderColor: repair.isPaid
                ? accentAlpha(colors.success, 0.25)
                : accentAlpha(colors.warning, 0.25),
            },
          ]}
        >
          {repair.isPaid ? (
            <>
              <CheckCircle2 size={11} color={colors.success} strokeWidth={2.4} />
              <Text style={[styles.paymentBadgeText, { color: colors.success }]}>
                {repair.paymentType === 'online' ? 'Paid · Online' : 'Paid · Cash'}
              </Text>
            </>
          ) : (
            <>
              <Clock size={11} color={colors.warning} strokeWidth={2.4} />
              <Text style={[styles.paymentBadgeText, { color: colors.warning }]}>
                {LABELS.UNPAID}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ── Body (Thumbnail + Labeled Details) ── */}
      <View style={styles.body}>
        {/* Left Thumbnail */}
        <View style={styles.imgWrap}>
          <SecureImage
            source={imageSource}
            style={styles.img as import('react-native').ImageStyle}
            resizeMode="cover"
          />
        </View>

        {/* Right Info with Labels */}
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{LABELS.DEVICE}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {repair.deviceModel}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{LABELS.PROBLEM}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {repair.problem || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{LABELS.DATE}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {formatDateDisplay(repair.dateReceived)}
            </Text>
          </View>

          {repair.createdByName ? (
            <Text style={styles.addedBy}>
              {LABELS.ADDED_BY} {repair.createdByName}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});



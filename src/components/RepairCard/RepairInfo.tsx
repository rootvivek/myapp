import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { SecureImage } from '../SecureImage';
import type { AppColors } from '../../theme';
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
            <Text style={styles.infoLabel}>{LABELS.CUSTOMER}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
              <Text style={styles.infoValue} numberOfLines={1}>
                {repair.customerName}
              </Text>
              <Text style={[styles.infoValue, { textAlign: 'right', color: colors.accent }]} numberOfLines={1}>
                {displayCode}
              </Text>
            </View>
          </View>

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

          {repair.createdByName && repair.createdByRole === 'labour' ? (
            <Text style={styles.addedBy}>
              {LABELS.ADDED_BY} {repair.createdByName}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});



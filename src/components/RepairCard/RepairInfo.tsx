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
  styles: CardStyles;
  colors: AppColors;
};

export const RepairInfo = React.memo(function RepairInfo({
  repair,
  onPress,
  styles,
  colors,
}: Props) {
  const imageSource = getImageSource(repair);

  return (
    <View style={styles.body}>
      {/* ── Image ── */}
      <Pressable
        onPress={onPress}
        style={styles.imgWrap}
        accessibilityRole="button"
        accessibilityLabel={`View repair for ${repair.customerName}`}
        accessibilityHint="Opens repair details"
      >
        <SecureImage
          source={imageSource}
          style={styles.img as import('react-native').ImageStyle}
          resizeMode="cover"
        />
      </Pressable>

      {/* ── Content ── */}
      <Pressable
        onPress={onPress}
        style={styles.content}
        accessibilityRole="button"
        accessibilityLabel={`${repair.customerName}, ${repair.deviceModel}`}
        accessibilityHint="Opens repair details"
      >
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{LABELS.CUSTOMER}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{repair.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{LABELS.DEVICE}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{repair.deviceModel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{LABELS.PROBLEM}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{repair.problem || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{LABELS.DATE}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{formatDateDisplay(repair.dateReceived)}</Text>
        </View>
        {repair.createdByName ? (
          <Text style={styles.addedBy}>
            {LABELS.ADDED_BY} {repair.createdByName}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
});

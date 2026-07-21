import React from 'react';
import { Text, View } from 'react-native';
import { RepairImagePairRow, RepairImageSlotCell } from '../../../components/RepairImageSlotRow';
import type { RepairImageSlot } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';

type Props = {
  images: Record<RepairImageSlot, string>;
  onChangeImageSlot: (slot: RepairImageSlot, uri: string) => void;
  styles: AddRepairStyles;
};

export const PhotosSection = React.memo(function PhotosSection({
  images,
  onChangeImageSlot,
  styles,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>DEVICE PHOTOS</Text>
      <View style={styles.photosCard}>
        <RepairImagePairRow>
          <RepairImageSlotCell
            label="Front *"
            uri={images.front}
            onChange={(uri) => onChangeImageSlot('front', uri)}
          />
          <RepairImageSlotCell
            label="Back *"
            uri={images.back}
            onChange={(uri) => onChangeImageSlot('back', uri)}
          />
          <RepairImageSlotCell
            label="ID 1"
            uri={images.id1}
            onChange={(uri) => onChangeImageSlot('id1', uri)}
          />
          <RepairImageSlotCell
            label="ID 2"
            uri={images.id2}
            onChange={(uri) => onChangeImageSlot('id2', uri)}
          />
        </RepairImagePairRow>
      </View>
    </>
  );
});

import React from 'react';
import { Text } from 'react-native';
import { RepairImagePairRow, RepairImageSlotCell } from '../../../components/RepairImageSlotRow';
import type { RepairImageSlot } from '../../../types/repair';
import type { RepairFormErrors } from '../../../utils/repairValidation';
import type { AddRepairStyles } from '../styles';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  images: Record<RepairImageSlot, string>;
  errors?: RepairFormErrors;
  onChangeImageSlot: (slot: RepairImageSlot, uri: string) => void;
  styles: AddRepairStyles;
};

export const PhotosSection = React.memo(function PhotosSection({
  images,
  errors,
  onChangeImageSlot,
  styles,
}: Props) {
  return (
    <AppCard>
      <Text style={styles.fieldLabel}>Device Photos</Text>

      <RepairImagePairRow>
        <RepairImageSlotCell
          label="Front *"
          uri={images.front}
          error={errors?.imageFront}
          onChange={(uri) => onChangeImageSlot('front', uri)}
        />
        <RepairImageSlotCell
          label="Back *"
          uri={images.back}
          error={errors?.imageBack}
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
    </AppCard>
  );
});

import React from 'react';
import { Image, Text, View, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { Repair } from '../types/repair';

type PhotoGridStyles = {
  photoGrid: ViewStyle;
  photoItem: ViewStyle;
  photoImg: ImageStyle;
  photoLabel: ViewStyle;
  photoLabelText: TextStyle;
  noPhotos: TextStyle;
};

type Props = {
  repair: Repair;
  styles: PhotoGridStyles;
};

export const PhotoGrid = React.memo(function PhotoGrid({ repair, styles }: Props) {
  const photos: { uri: string; label: string }[] = [];
  if (repair.imagePhoneFront) photos.push({ uri: repair.imagePhoneFront, label: 'Front' });
  if (repair.imagePhoneBack) photos.push({ uri: repair.imagePhoneBack, label: 'Back' });
  if (repair.imageId1) photos.push({ uri: repair.imageId1, label: 'ID 1' });
  if (repair.imageId2) photos.push({ uri: repair.imageId2, label: 'ID 2' });

  if (photos.length === 0) {
    return <Text style={styles.noPhotos}>No photos attached.</Text>;
  }

  return (
    <View style={styles.photoGrid}>
      {photos.map((p) => (
        <View key={p.uri} style={styles.photoItem}>
          <Image source={{ uri: p.uri }} style={styles.photoImg} resizeMode="cover" />
          <View style={styles.photoLabel}>
            <Text style={styles.photoLabelText}>{p.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
});

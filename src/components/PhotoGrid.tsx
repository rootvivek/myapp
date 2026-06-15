import React, { useState } from 'react';
import {
  Text,
  View,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { SecureImage } from './SecureImage';

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
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  const photos: { uri: string; label: string }[] = [];
  if (repair.imagePhoneFront) photos.push({ uri: repair.imagePhoneFront, label: 'Front View' });
  if (repair.imagePhoneBack) photos.push({ uri: repair.imagePhoneBack, label: 'Back View' });
  if (repair.imageId1) photos.push({ uri: repair.imageId1, label: 'ID Document 1' });
  if (repair.imageId2) photos.push({ uri: repair.imageId2, label: 'ID Document 2' });

  if (photos.length === 0) {
    return <Text style={styles.noPhotos}>No photos attached.</Text>;
  }

  const handleOpen = (index: number) => {
    setActiveIndex(index);
    setImageLoading(true);
    setViewerVisible(true);
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setImageLoading(true);
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < photos.length - 1) {
      setImageLoading(true);
      setActiveIndex(activeIndex + 1);
    }
  };

  return (
    <View style={styles.photoGrid}>
      {photos.map((p, idx) => (
        <Pressable
          key={p.uri}
          style={styles.photoItem}
          onPress={() => handleOpen(idx)}
        >
          <SecureImage source={{ uri: p.uri }} style={styles.photoImg} resizeMode="cover" />
          <View style={styles.photoLabel}>
            <Text style={styles.photoLabelText}>{p.label}</Text>
          </View>
        </Pressable>
      ))}

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={viewerStyles.overlay}>
          {/* Close Button */}
          <Pressable
            style={viewerStyles.closeButton}
            onPress={() => setViewerVisible(false)}
          >
            <X size={24} color="#fff" />
          </Pressable>

          {/* Navigation - Left Arrow */}
          {photos.length > 1 && activeIndex > 0 && (
            <Pressable
              style={[viewerStyles.navButton, viewerStyles.leftButton]}
              onPress={handlePrev}
            >
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
          )}

          {/* Image Container */}
          <View style={viewerStyles.imageContainer}>
            {imageLoading && (
              <ActivityIndicator
                size="large"
                color="#7C3AED"
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <SecureImage
              source={{ uri: photos[activeIndex]?.uri }}
              style={viewerStyles.fullImage}
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </View>

          {/* Navigation - Right Arrow */}
          {photos.length > 1 && activeIndex < photos.length - 1 && (
            <Pressable
              style={[viewerStyles.navButton, viewerStyles.rightButton]}
              onPress={handleNext}
            >
              <ChevronRight size={28} color="#fff" />
            </Pressable>
          )}

          {/* Footer Text */}
          <View style={viewerStyles.footer}>
            <Text style={viewerStyles.title}>{photos[activeIndex]?.label}</Text>
            <Text style={viewerStyles.subtitle}>
              {activeIndex + 1} of {photos.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const viewerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftButton: {
    left: 16,
  },
  rightButton: {
    right: 16,
  },
  imageContainer: {
    width: '100%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '95%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
});

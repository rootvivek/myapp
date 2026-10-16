import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';

/** The viewer is intentionally a black, high-contrast surface over the photo. */
export const photoViewerIconColor = '#FFFFFF';

export function createPhotoViewerStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#000000',
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
    loading: {
      ...StyleSheet.absoluteFillObject,
    },
    footer: {
      position: 'absolute',
      bottom: 50,
      alignItems: 'center',
    },
    title: {
      color: photoViewerIconColor,
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
    activity: {
      color: colors.accent,
    },
  });
}

export type PhotoViewerStyles = ReturnType<typeof createPhotoViewerStyles>;
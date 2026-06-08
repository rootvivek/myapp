import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/** Max dimension (px) for picked images — keeps file sizes manageable. */
const MAX_IMAGE_DIMENSION = 1200;

/** JPEG quality for the picker (0–1). */
const PICKER_QUALITY = 0.7;

export async function launchCameraForImage(): Promise<string | null> {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: PICKER_QUALITY,
    maxWidth: MAX_IMAGE_DIMENSION,
    maxHeight: MAX_IMAGE_DIMENSION,
  });
  if (result.didCancel || !result.assets?.[0]?.uri) return null;
  return result.assets[0].uri;
}

export async function launchLibraryForImage(): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: PICKER_QUALITY,
    maxWidth: MAX_IMAGE_DIMENSION,
    maxHeight: MAX_IMAGE_DIMENSION,
  });
  if (result.didCancel || !result.assets?.[0]?.uri) return null;
  return result.assets[0].uri;
}

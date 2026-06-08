import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export async function launchCameraForImage(): Promise<string | null> {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
  });
  if (result.didCancel || !result.assets?.[0]?.uri) return null;
  return result.assets[0].uri;
}

export async function launchLibraryForImage(): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
  });
  if (result.didCancel || !result.assets?.[0]?.uri) return null;
  return result.assets[0].uri;
}

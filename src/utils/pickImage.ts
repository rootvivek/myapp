import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/** Max dimension (px) for picked images — keeps file sizes manageable. */
const MAX_IMAGE_DIMENSION = 1200;

/** JPEG quality for the picker (0–1). */
const PICKER_QUALITY = 0.7;

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  const current = await PermissionsAndroid.check(permission);
  if (current) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Camera permission required',
    message: 'Allow camera access to take front and back repair photos.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Camera permission blocked',
      'Enable camera access in Settings to take repair photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]
    );
  } else {
    Alert.alert('Camera permission denied', 'Allow camera access to take repair photos.');
  }

  return false;
}

export async function launchCameraForImage(): Promise<string | null> {
  if (!(await requestCameraPermission())) return null;

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

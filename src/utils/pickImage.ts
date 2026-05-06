import * as ImagePicker from 'expo-image-picker';

export async function launchCameraForImage(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export async function launchLibraryForImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

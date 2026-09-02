import { Alert, Linking } from 'react-native';

export async function dialPhone(phone: string): Promise<void> {
  const raw = phone.trim();
  if (!raw) {
    Alert.alert('No phone number', 'Add a phone number to place a call.');
    return;
  }

  const dial = raw.replace(/[^\d+]/g, '');
  const url = `tel:${dial}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Call Error', 'Phone calls are not supported on this device.');
    }
  } catch {
    Alert.alert('Call Error', 'Could not place phone call.');
  }
}

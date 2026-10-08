import { Alert } from 'react-native';

/** Global helper: show a lightweight "Coming Soon" alert for any feature. */
export function showComingSoon(feature: string): void {
  Alert.alert('🚧 Coming Soon', `${feature} is coming soon. Stay tuned!`);
}

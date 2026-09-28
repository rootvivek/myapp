import { Alert } from 'react-native';

export { parseMoney } from '../../utils/format';

export function showDatabaseError(error: unknown): void {
  const msg = error instanceof Error ? error.message : 'Something went wrong';
  Alert.alert('Error saving', msg);
}

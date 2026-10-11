import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { KhataParamList } from '../navigation/types';

export function useKhataRouter() {
  const navigation = useNavigation<NativeStackNavigationProp<KhataParamList>>();
  return {
    navigate: navigation.navigate,
    goBack: () => navigation.goBack(),
  };
}

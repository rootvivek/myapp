import React from 'react';
import { Text, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { Moon, Sun } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { AppCard } from '../../components/ui/AppCard';
import { createStyles } from './styles';

type Props = {
  mode: 'light' | 'dark';
  onThemeChange: (dark: boolean) => void;
  colors: AppColors;
};

export const AppearanceCard = React.memo(function AppearanceCard({
  mode,
  onThemeChange,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.iconBox}>
            {mode === 'dark' ? (
              <Moon size={18} color={colors.accent} />
            ) : (
              <Sun size={18} color={colors.accent} />
            )}
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSubtitle}>Keep the app easy on your eyes</Text>
          </View>
        </View>
        <Switch
          value={mode === 'dark'}
          onValueChange={onThemeChange}
          color={colors.accent}
        />
      </View>
    </AppCard>
  );
});

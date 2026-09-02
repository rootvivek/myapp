import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import type { AppColors } from '../../theme';
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
    <View style={styles.card}>
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
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={mode === 'dark' ? colors.accent : '#f4f3f4'}
        />
      </View>
    </View>
  );
});

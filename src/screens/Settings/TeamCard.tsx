import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  onManageLabour: () => void;
  colors: AppColors;
};

export const TeamCard = React.memo(function TeamCard({ onManageLabour, colors }: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onManageLabour}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.rowLeft}>
          <View style={styles.iconBox}>
            <Users size={18} color={colors.accent} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Manage Staff / Labour</Text>
            <Text style={styles.rowSubtitle}>Add team members or change staff passwords</Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
});

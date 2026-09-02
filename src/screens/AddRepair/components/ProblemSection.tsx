import React from 'react';
import { Text, View } from 'react-native';
import { Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
import { AlertCircle } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { COMMON_PROBLEMS } from '../constants';
import type { AddRepairStyles } from '../styles';

type Props = {
  problem: string;
  onChangeProblem: (text: string) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const ProblemSection = React.memo(function ProblemSection({
  problem,
  onChangeProblem,
  styles,
  colors,
}: Props) {
  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <AlertCircle size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Issue & Problem Description</Text>
        </View>
      </View>

      <PaperInput
        label="Problem description"
        placeholder="e.g. Broken display glass, touch not working..."
        value={problem}
        onChangeText={onChangeProblem}
        multiline
        numberOfLines={3}
        mode="outlined"
        outlineColor={colors.border}
        activeOutlineColor={colors.accent}
        textColor={colors.text}
        placeholderTextColor={colors.textMuted}
        theme={{
          colors: {
            background: colors.surface2,
            placeholder: colors.textMuted,
          },
        }}
        style={[styles.paperInput, { marginBottom: 4 }]}
        accessibilityLabel="Problem description"
      />

      <View style={styles.problemSuggestions}>
        {COMMON_PROBLEMS.map((item) => (
          <PaperChip
            key={item}
            mode="outlined"
            onPress={() => {
              const trimmed = problem.trim();
              if (!trimmed) {
                onChangeProblem(item);
              } else if (!trimmed.toLowerCase().includes(item.toLowerCase())) {
                onChangeProblem(`${trimmed}, ${item}`);
              }
            }}
            style={{
              backgroundColor: colors.surface2,
              borderColor: colors.border,
              borderRadius: 8,
              height: 30,
            }}
            textStyle={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: '600',
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add problem shortcut ${item}`}
          >
            {item}
          </PaperChip>
        ))}
      </View>
    </View>
  );
});



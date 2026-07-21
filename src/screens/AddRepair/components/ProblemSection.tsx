import React from 'react';
import { Text, View } from 'react-native';
import { Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
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
    <>
      <Text style={styles.sectionTitle}>PROBLEM / NOTES</Text>

      <View style={styles.problemCard}>
        <PaperInput
          label="Describe the issue..."
          placeholder="Describe the issue..."
          value={problem}
          onChangeText={onChangeProblem}
          multiline
          numberOfLines={4}
          mode="outlined"
          outlineColor={colors.border}
          activeOutlineColor={colors.accent}
          textColor={colors.text}
          placeholderTextColor={colors.textMuted}
          theme={{
            colors: {
              background: colors.surface,
              placeholder: colors.textMuted,
            },
          }}
          style={styles.problemPaperInput}
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
                marginRight: 2,
                marginBottom: 2,
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
    </>
  );
});

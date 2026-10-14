import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FormTextInput } from '../../../components/FormTextInput';
import { COMMON_PROBLEMS } from '../constants';
import type { AddRepairStyles } from '../styles';
import type { RepairFormErrors } from '../../../utils/repairValidation';
import { AppChip } from '../../../components/ui/AppChip';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  problem: string;
  errors?: RepairFormErrors;
  onChangeProblem: (text: string) => void;
  styles: AddRepairStyles;
};

// Exclude 'Folder replace' from general chips since it's a dedicated secondary action
const PROBLEM_CHIPS = COMMON_PROBLEMS.filter((p) => p !== 'Folder replace');

export const ProblemSection = React.memo(function ProblemSection({
  problem,
  errors,
  onChangeProblem,
  styles,
}: Props) {
  const handleAddProblemShortcut = (itemText: string) => {
    const trimmed = problem.trim();
    if (!trimmed) {
      onChangeProblem(itemText);
    } else if (!trimmed.toLowerCase().includes(itemText.toLowerCase())) {
      onChangeProblem(`${trimmed}, ${itemText}`);
    }
  };

  return (
    <AppCard>
      <FormTextInput
        label="Problem description"
        placeholder="e.g. Broken display glass, touch not working..."
        value={problem}
        onChangeText={onChangeProblem}
        error={errors?.problem}
        multiline
        numberOfLines={3}
        containerStyle={styles.inputTight}
        accessibilityLabel="Problem description"
      />

      {/* Problem shortcuts chips */}
      <View style={localStyles.chipsWrap}>
        {PROBLEM_CHIPS.map((item) => {
          const isActive = problem.toLowerCase().includes(item.toLowerCase());
          return (
            <AppChip
              key={item}
              variant={isActive ? 'primary' : 'default'}
              selected={isActive}
              showSelectedCheck={false}
              onPress={() => handleAddProblemShortcut(item)}
              accessibilityRole="button"
              accessibilityLabel={`Add problem shortcut ${item}`}
            >
              {item}
            </AppChip>
          );
        })}
      </View>
    </AppCard>
  );
});

const localStyles = StyleSheet.create({
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
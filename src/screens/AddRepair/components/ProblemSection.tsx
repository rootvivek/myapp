import React, { useState, useEffect } from 'react';
import { Text, View, Pressable, Modal, FlatList } from 'react-native';
import { Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
import { AlertCircle } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { COMMON_PROBLEMS } from '../constants';
import type { AddRepairStyles } from '../styles';
import { getAllInventory } from '../../../db/database';
import type { InventoryItem } from '../../../types/inventory';
import { formatCurrency } from '../../../utils/format';

type Props = {
  problem: string;
  onChangeProblem: (text: string) => void;
  currentExpense?: string;
  onChangeExpense?: (expense: string) => void;
  selectedInventoryItemIds?: number[];
  onAddInventoryItemId?: (id: number) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const ProblemSection = React.memo(function ProblemSection({
  problem,
  onChangeProblem,
  currentExpense,
  onChangeExpense,
  selectedInventoryItemIds,
  onAddInventoryItemId,
  styles,
  colors,
}: Props) {
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (inventoryModalVisible) {
      void getAllInventory().then((items) => setInventoryItems(items)).catch(() => {});
    }
  }, [inventoryModalVisible]);

  const handleSelectInventoryPart = (item: InventoryItem) => {
    // Append part name to problem notes
    const trimmed = problem.trim();
    const partNote = `Part: ${item.name} (${formatCurrency(item.price)})`;
    if (!trimmed) {
      onChangeProblem(partNote);
    } else {
      onChangeProblem(`${trimmed}\n${partNote}`);
    }

    // Auto update repair expense input if available
    if (onChangeExpense) {
      const prevExpense = parseFloat(currentExpense || '0') || 0;
      const newExpense = prevExpense + item.price;
      onChangeExpense(String(newExpense));
    }

    // Track inventory item ID for deferred stock deduction on repair save
    if (onAddInventoryItemId) {
      onAddInventoryItemId(item.id);
    }

    setInventoryModalVisible(false);
  };

  return (
<<<<<<< HEAD
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
=======
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
          <PaperChip
            mode="outlined"
            onPress={() => setInventoryModalVisible(true)}
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.accent,
              marginRight: 4,
              marginBottom: 4,
            }}
            textStyle={{
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: '700',
            }}
            accessibilityRole="button"
            accessibilityLabel="Attach Inventory Part"
          >
            📦 Attach Inventory Part
          </PaperChip>
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

      <Modal
        visible={inventoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInventoryModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
              Select Inventory Part
            </Text>
            <FlatList
              data={inventoryItems}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginVertical: 20 }}>
                  No inventory parts available.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectInventoryPart(item)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      Stock: {item.stockCount} left
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.accent }}>
                    {formatCurrency(item.price)}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setInventoryModalVisible(false)}
              style={{
                marginTop: 14,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.surface2,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
  );
});



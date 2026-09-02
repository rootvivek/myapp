import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import type { InventoryItem, InventoryInput } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgGradient[0] || colors.bg },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    searchbar: {
      marginHorizontal: 16,
      marginBottom: spacing.md,
      backgroundColor: colors.surface2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    list: { paddingHorizontal: 16, paddingBottom: 120 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardContent: { flex: 1 },
    itemName: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
    itemSku: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
    cardStats: { alignItems: 'flex-end', marginLeft: 8 },
    itemPrice: { color: colors.accent, fontSize: 16, fontWeight: '800' },
    itemStock: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xxl,
      fontSize: 15,
    },
    
    // Modal
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
    inputLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    flex1: { flex: 1 },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    btnPrimary: {
      flex: 1,
      backgroundColor: colors.accent,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 8,
    },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnSecondary: {
      flex: 1,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnSecondaryText: { color: colors.textMuted, fontWeight: '700', fontSize: 16 },
    btnDelete: {
      backgroundColor: accentAlpha(colors.danger, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.danger,
    }
  });
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>; // or a specific prop type if needed

export function InventoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { inventory, loading, refresh, deleteItem, addInventoryToState, updateInventoryInState } = useInventory();
  const { isOwner } = useAuth();

  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.sku.toLowerCase().includes(q)
    );
  }, [inventory, query]);

  function openAddModal() {
    setEditingId(null);
    setName('');
    setSku('');
    setStock('');
    setPrice('');
    setModalVisible(true);
  }

  function openEditModal(item: InventoryItem) {
    setEditingId(item.id);
    setName(item.name);
    setSku(item.sku);
    setStock(String(item.stockCount));
    setPrice(String(item.price));
    setModalVisible(true);
  }

  const savingRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Item name is required.');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const input: InventoryInput = {
        name: name.trim(),
        sku: sku.trim(),
        stockCount: Math.max(0, parseInt(stock.trim()) || 0),
        price: Math.max(0, parseFloat(price.trim()) || 0),
      };

      const now = new Date().toISOString();

      if (editingId) {
        // Local cache update + remote database update
        updateInventoryInState(editingId, input);
        await inventoryService.update({ ...input, id: editingId });
      } else {
        const newId = await inventoryService.create(input);
        addInventoryToState({
          ...input,
          id: newId,
          createdAt: now,
          updatedAt: now,
        });
      }
      if (mountedRef.current) {
        setModalVisible(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to save item.');
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
      savingRef.current = false;
    }
  }

  async function handleDelete() {
    if (!editingId || savingRef.current) return;
    Alert.alert('Delete Item', 'Are you sure you want to delete this accessory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (savingRef.current) return;
          savingRef.current = true;
          setSaving(true);
          try {
            await deleteItem(editingId);
            if (mountedRef.current) {
              setModalVisible(false);
            }
          } catch (err) {
            if (mountedRef.current) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          } finally {
            if (mountedRef.current) {
              setSaving(false);
            }
            savingRef.current = false;
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={colors.bgGradient}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        {isOwner && (
          <Pressable onPress={openAddModal} style={styles.addButton}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
        )}
      </View>

      <Searchbar
        placeholder="Search accessories or SKU"
        placeholderTextColor={colors.textMuted}
        onChangeText={setQuery}
        value={query}
        style={styles.searchbar}
        iconColor={colors.accent}
        inputStyle={{ color: colors.text }}
        theme={{ colors: { elevation: { level3: colors.surface } } }}
      />

      {loading && inventory.length === 0 ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {inventory.length === 0 ? 'No inventory items yet. Add one!' : 'No matches found.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable 
              style={styles.card} 
              onPress={isOwner ? () => openEditModal(item) : undefined}
              android_ripple={{ color: colors.border }}
            >
              <View style={styles.cardIcon}>
                <Package size={36} color={colors.accent} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSku}>SKU: {item.sku || 'N/A'}</Text>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                <Text style={[styles.itemStock, item.stockCount <= 0 && { color: colors.danger }]}>
                  Stock: {item.stockCount}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Add/Edit Modal - only for owners */}
      {isOwner && (
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalWrap}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Item' : 'Add Accessory'}</Text>
              
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., iPhone 13 Screen Protector"
                placeholderTextColor={colors.textMuted}
              />
              
              <Text style={styles.inputLabel}>SKU / Barcode (Optional)</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="e.g., SP-IP13-001"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>Stock Count</Text>
                  <TextInput
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                {editingId && (
                  <Pressable onPress={handleDelete} style={styles.btnDelete} disabled={saving}>
                    <Trash2 size={20} color={colors.danger} />
                  </Pressable>
                )}
                <Pressable onPress={() => setModalVisible(false)} style={styles.btnSecondary} disabled={saving}>
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => void handleSave()} style={styles.btnPrimary} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Save</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

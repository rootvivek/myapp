import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar } from 'react-native-paper';
import { Plus, Package, Trash2, Search, X } from 'lucide-react-native';

import { AppActivityIndicator } from '../components/ui/AppActivityIndicator';
import { AppButton } from '../components/ui/AppButton';
import { EmptyState } from '../components/EmptyState';
import { AppIconButton } from '../components/ui/AppIconButton';
import { AppInput } from '../components/ui/AppInput';
import { AppModal } from '../components/ui/AppModal';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import type { InventoryItem, InventoryInput } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    searchbar: {
      marginHorizontal: spacing.gutter,
      marginBottom: spacing.md,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    list: { paddingHorizontal: spacing.gutter, paddingBottom: 120 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
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
    row: { flexDirection: 'row', gap: spacing.md },
    flex1: { flex: 1 },
    modalActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  });
}

export function InventoryScreen() {
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
      
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        {isOwner && (
          <AppButton
            variant="primary"
            leftIcon={<Plus size={15} color="#FFFFFF" strokeWidth={2.4} />}
            onPress={openAddModal}
            style={{ minHeight: sizes.buttonHeightCompact }}
            contentStyle={{ minHeight: sizes.buttonHeightCompact }}
            labelStyle={{ fontSize: 13, fontWeight: '600' }}
          >
            Add Item
          </AppButton>
        )}
      </View>

      <Searchbar
        placeholder="Search accessories or SKU"
        placeholderTextColor={colors.textMuted}
        onChangeText={setQuery}
        value={query}
        style={[styles.searchbar, { height: 46, justifyContent: 'center' }]}
        icon={() => <Search size={18} color={colors.accent} />}
        clearIcon={() => <X size={18} color={colors.textMuted} />}
        inputStyle={{ color: colors.text, fontSize: 14, minHeight: 0, paddingVertical: 0, alignSelf: 'center' }}
        theme={{ colors: { elevation: { level3: colors.surface } } }}
      />

      {loading && inventory.length === 0 ? (
        <AppActivityIndicator size="large" color={colors.accent} containerStyle={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <EmptyState
              title={inventory.length === 0 ? 'No inventory items yet.' : 'No matches found.'}
              description={inventory.length === 0 ? 'Add one!' : undefined}
            />
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
        <AppModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingId ? 'Edit Item' : 'Add Accessory'}
          size="medium"
          footer={
            <View style={styles.modalActions}>
              {editingId && (
                <AppIconButton
                  variant="danger"
                  icon={<Trash2 size={20} color="#FFFFFF" />}
                  onPress={handleDelete}
                  disabled={saving}
                  accessibilityLabel="Delete item"
                />
              )}
              <AppButton
                variant="secondary"
                containerStyle={{ flex: 1 }}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                containerStyle={{ flex: 1 }}
                loading={saving}
                onPress={() => void handleSave()}
              >
                Save
              </AppButton>
            </View>
          }
        >
          <AppInput
            label="Item Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., iPhone 13 Screen Protector"
          />

          <AppInput
            label="SKU / Barcode (Optional)"
            value={sku}
            onChangeText={setSku}
            placeholder="e.g., SP-IP13-001"
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <AppInput
                label="Stock Count"
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <AppInput
                label="Price (₹)"
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
        </AppModal>
      )}
    </SafeAreaView>
  );
}

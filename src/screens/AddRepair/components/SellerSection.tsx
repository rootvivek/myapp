import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { sellerService } from '../../../services/sellerService';
import { AddSellerModal } from './AddSellerModal';
import type { AppColors } from '../../../theme';
import type { Seller } from '../../../types/seller';
import { AppSelect } from '../../../components/ui/AppSelect';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  selectedSellerId: number | null;
  onSelectSeller: (seller: Seller | null) => void;
  colors: AppColors;
};

export const SellerSection = React.memo(function SellerSection({
  selectedSellerId,
  onSelectSeller,
  colors,
}: Props) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const selectedSeller = useMemo(
    () => sellers.find((s) => s.id === selectedSellerId) ?? null,
    [sellers, selectedSellerId]
  );

  const loadSellers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const list = await sellerService.getAll();
      if (mountedRef.current) setSellers(list);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load sellers.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSellers();
  }, [loadSellers]);

  const options = useMemo(
    () =>
      sellers.map((s) => ({
        value: String(s.id),
        label: s.sellerName,
        phone: s.phone,
      })),
    [sellers]
  );

  const handleSelect = useCallback(
    (value: string) => {
      const seller = sellers.find((s) => String(s.id) === value);
      onSelectSeller(seller || null);
    },
    [sellers, onSelectSeller]
  );

  const handleClear = useCallback(() => {
    onSelectSeller(null);
  }, [onSelectSeller]);

  const handleSellerAdded = useCallback(
    (seller: Seller) => {
      setSellers((prev) => {
        if (prev.some((s) => s.id === seller.id)) return prev;
        const next = [...prev, seller].sort((a, b) =>
          a.sellerName.localeCompare(b.sellerName)
        );
        return next;
      });
      onSelectSeller(seller);
      setAddModalVisible(false);
    },
    [onSelectSeller]
  );

  return (
    <AppCard>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <AppSelect
          label="Seller"
          placeholder="Select seller…"
          value={selectedSellerId ? String(selectedSellerId) : ''}
          onChange={handleSelect}
          options={options}
          error={loadError || undefined}
          disabled={loading}
          searchable={true}
          accessibilityLabel={selectedSeller ? `Selected seller: ${selectedSeller.sellerName}` : 'Select seller'}
          containerStyle={{ flex: 1, marginBottom: 8 }}
        />

        <AppButton
          variant="outline"
          leftIcon={<Plus size={13} color={colors.accent} strokeWidth={2.2} />}
          onPress={() => setAddModalVisible(true)}
          accessibilityLabel="Add new seller"
          style={{ marginLeft: 8, marginBottom: 8, paddingHorizontal: 6, flexShrink: 1 }}
        >
          Add New Seller
        </AppButton>
      </View>

      {selectedSeller && (
        <AppButton
          variant="tertiary"
          fullWidth
          onPress={handleClear}
          accessibilityLabel="Clear seller"
          style={{ marginTop: 4 }}
        >
          Clear seller
        </AppButton>
      )}

      {/* Add Seller Modal */}
      <AddSellerModal
        visible={addModalVisible}
        colors={colors}
        onClose={() => setAddModalVisible(false)}
        onSaved={handleSellerAdded}
      />
    </AppCard>
  );
});
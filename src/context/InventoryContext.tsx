import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deleteInventoryItem, getAllInventory } from '../db/database';
import type { InventoryItem } from '../types/inventory';

type InventoryContextValue = {
  inventory: InventoryItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllInventory();
      setInventory(list);
    } catch (err) {
      console.warn('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (id: number) => {
    await deleteInventoryItem(id);
    setInventory((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ inventory, loading, refresh, deleteItem }),
    [inventory, loading, refresh, deleteItem]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

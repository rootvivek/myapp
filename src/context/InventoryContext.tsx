import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { inventoryService } from '../services/inventoryService';
import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';
import { appendItem, removeItem, updateItem, upsertItem } from '../utils/cacheHelpers';
import { logger } from '../utils/logger';

type InventoryStateContextValue = {
  inventory: InventoryItem[];
  loading: boolean;
};

type InventoryActionsContextValue = {
  refresh: () => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  addInventoryToState: (item: InventoryItem) => void;
  updateInventoryInState: (id: number, updates: Partial<InventoryItem>) => void;
  upsertInventoryInState: (item: InventoryItem) => void;
  deleteInventoryFromState: (id: number) => void;
};

type InventoryContextValue = InventoryStateContextValue & InventoryActionsContextValue;

const InventoryStateContext = createContext<InventoryStateContextValue | null>(null);
const InventoryActionsContext = createContext<InventoryActionsContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const list = await inventoryService.getAll();
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setInventory(list);
      }
    } catch (err) {
      logger.warn('[InventoryContext] Error fetching inventory:', err);
    } finally {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:inventory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload: any) => {
          if (!mountedRef.current) return;
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT' && newRow) {
            const item: InventoryItem = {
              id: Number(newRow.id),
              name: String(newRow.name ?? ''),
              sku: String(newRow.sku ?? ''),
              stockCount: Number(newRow.stock_count ?? 0),
              price: Number(newRow.price ?? 0),
              createdAt: String(newRow.created_at ?? ''),
              updatedAt: String(newRow.updated_at ?? ''),
            };
            setInventory((current) => upsertItem(current, item, 'id'));
          } else if (eventType === 'UPDATE' && newRow) {
            const item: InventoryItem = {
              id: Number(newRow.id),
              name: String(newRow.name ?? ''),
              sku: String(newRow.sku ?? ''),
              stockCount: Number(newRow.stock_count ?? 0),
              price: Number(newRow.price ?? 0),
              createdAt: String(newRow.created_at ?? ''),
              updatedAt: String(newRow.updated_at ?? ''),
            };
            setInventory((current) => updateItem(current, item.id, item, 'id'));
          } else if (eventType === 'DELETE' && oldRow?.id) {
            const id = Number(oldRow.id);
            setInventory((current) => removeItem(current, id, 'id'));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Reusable Cache Actions
  const addInventoryToState = useCallback((item: InventoryItem) => {
    setInventory((current) => appendItem(current, item, 'id'));
  }, []);

  const updateInventoryInState = useCallback((id: number, updates: Partial<InventoryItem>) => {
    setInventory((current) => updateItem(current, id, updates, 'id'));
  }, []);

  const upsertInventoryInState = useCallback((item: InventoryItem) => {
    setInventory((current) => upsertItem(current, item, 'id'));
  }, []);

  const deleteInventoryFromState = useCallback((id: number) => {
    setInventory((current) => removeItem(current, id, 'id'));
  }, []);

  // Optimistic Delete
  const deleteItem = useCallback(async (id: number) => {
    let backup: InventoryItem[] = [];
    setInventory((current) => {
      backup = current;
      return removeItem(current, id, 'id');
    });

    try {
      await inventoryService.remove(id);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setInventory(backup);
        const msg = err instanceof Error ? err.message : 'Could not delete item';
        Alert.alert('Delete Failed', msg);
      }
    }
  }, []);

  const stateValue = useMemo(() => ({ inventory, loading }), [inventory, loading]);
  const actionsValue = useMemo(
    () => ({
      refresh,
      deleteItem,
      addInventoryToState,
      updateInventoryInState,
      upsertInventoryInState,
      deleteInventoryFromState,
    }),
    [
      refresh,
      deleteItem,
      addInventoryToState,
      updateInventoryInState,
      upsertInventoryInState,
      deleteInventoryFromState,
    ]
  );

  return (
    <InventoryStateContext.Provider value={stateValue}>
      <InventoryActionsContext.Provider value={actionsValue}>
        {children}
      </InventoryActionsContext.Provider>
    </InventoryStateContext.Provider>
  );
}

export function useInventoryState(): InventoryStateContextValue {
  const ctx = useContext(InventoryStateContext);
  if (!ctx) throw new Error('useInventoryState must be used within InventoryProvider');
  return ctx;
}

export function useInventoryActions(): InventoryActionsContextValue {
  const ctx = useContext(InventoryActionsContext);
  if (!ctx) throw new Error('useInventoryActions must be used within InventoryProvider');
  return ctx;
}

export function useInventory(): InventoryContextValue {
  const state = useInventoryState();
  const actions = useInventoryActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

/**
 * Finer-grained selector hooks to minimize re-render scope
 */
export function useInventoryItemById(id: number): InventoryItem | undefined {
  const { inventory } = useInventoryState();
  return useMemo(() => inventory.find((i) => i.id === id), [inventory, id]);
}

export function useInventoryCount(): number {
  const { inventory } = useInventoryState();
  return inventory.length;
}

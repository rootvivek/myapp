import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { deleteInventoryItem, getAllInventory } from '../db/database';
import type { InventoryItem } from '../types/inventory';

type InventoryStateContextValue = {
  inventory: InventoryItem[];
  loading: boolean;
};

type InventoryActionsContextValue = {
  refresh: () => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
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
      const list = await getAllInventory();
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setInventory(list);
      }
    } catch (err) {
      console.warn('Error fetching inventory:', err);
    } finally {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (id: number) => {
    let backup: InventoryItem[] = [];
    setInventory((current) => {
      backup = current;
      return current.filter((item) => item.id !== id);
    });

    try {
      await deleteInventoryItem(id);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setInventory(backup);
        const msg = err instanceof Error ? err.message : 'Could not delete item';
        Alert.alert('Delete Failed', msg);
      }
    }
  }, []);

  const stateValue = useMemo(() => ({ inventory, loading }), [inventory, loading]);
  const actionsValue = useMemo(() => ({ refresh, deleteItem }), [refresh, deleteItem]);

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

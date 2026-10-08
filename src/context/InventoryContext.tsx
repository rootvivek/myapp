import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from './AuthContext';
import { inventoryService } from '../services/inventoryService';
import { rowToInventory } from '../db/inventoryRepository';
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
};

type InventoryContextValue = InventoryStateContextValue & InventoryActionsContextValue;

const InventoryStateContext = createContext<InventoryStateContextValue | null>(null);
const InventoryActionsContext = createContext<InventoryActionsContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { session } = useAuth();
  const userId = session?.user?.id;

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef(0);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle automatic refetches to once every 10 seconds unless forced
    if (!force && lastFetchTimeRef.current > 0 && now - lastFetchTimeRef.current < 10000) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const list = await inventoryService.getAll();
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setInventory(list);
        lastFetchTimeRef.current = Date.now();
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
    const prevUserId = lastUserIdRef.current;
    lastUserIdRef.current = userId;

    if (userId && userId !== prevUserId) {
      // New sign-in — bypass the throttle and load immediately.
      lastFetchTimeRef.current = 0;
      void refresh(true);
    } else if (!userId && prevUserId) {
      // Signed out — drop the previous user's inventory so it can't be shown
      // to (or edited by) the next account on this device.
      setInventory([]);
      setLoading(false);
    }
  }, [userId, refresh]);

  // Realtime Subscription
  //
  // Re-subscribe on user change: a channel binds the JWT it was created with,
  // so keeping the old channel across a user switch would leave it authorized
  // as the previous user.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`public:inventory:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload: any) => {
          if (!mountedRef.current) return;
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT' && newRow) {
            const item = rowToInventory(newRow as Record<string, unknown>);
            setInventory((current) => upsertItem(current, item, 'id'));
          } else if (eventType === 'UPDATE' && newRow) {
            const item = rowToInventory(newRow as Record<string, unknown>);
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
  }, [userId]);

  // Reusable Cache Actions
  const addInventoryToState = useCallback((item: InventoryItem) => {
    setInventory((current) => appendItem(current, item, 'id'));
  }, []);

  const updateInventoryInState = useCallback((id: number, updates: Partial<InventoryItem>) => {
    setInventory((current) => updateItem(current, id, updates, 'id'));
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
    }),
    [refresh, deleteItem, addInventoryToState, updateInventoryInState]
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

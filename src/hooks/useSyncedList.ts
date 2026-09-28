import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { supabase } from '../lib/supabase';
import { appendItem, removeItem, updateItem, upsertItem } from '../utils/cacheHelpers';
import { logger } from '../utils/logger';

type RowMapper<T> = (row: Record<string, unknown>) => T;

interface SyncedListOptions<T> {
  tableName: string;
  rowToItem: RowMapper<T>;
  keyExtractor: keyof T;
  fetchAll: () => Promise<T[]>;
  /** Whether to require auth before fetching. */
  requiresAuth?: boolean;
}

function createSyncedList<T>(options: SyncedListOptions<T>) {
  const { tableName, rowToItem, keyExtractor, fetchAll, requiresAuth } = options;

  const StateContext = createContext<{ items: T[]; loading: boolean } | null>(null);
  const ActionsContext = createContext<{
    refresh: (force?: boolean) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
    addItemToState: (item: T) => void;
    updateItemInState: (id: number, updates: Partial<T>) => void;
    upsertItemInState: (item: T) => void;
    deleteItemFromState: (id: number) => void;
  } | null>(null);

  function SyncedListProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const requestIdRef = useRef(0);
    const mountedRef = useRef(true);
    const lastFetchTimeRef = useRef(0);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const refresh = useCallback(async (force = false) => {
      const now = Date.now();
      if (!force && lastFetchTimeRef.current > 0 && now - lastFetchTimeRef.current < 10000) {
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const list = await fetchAll();
        if (currentRequestId === requestIdRef.current && mountedRef.current) {
          setItems(list);
          lastFetchTimeRef.current = Date.now();
        }
      } catch (err) {
        logger.warn(`[${tableName}] Error fetching:`, err);
      } finally {
        if (currentRequestId === requestIdRef.current && mountedRef.current) {
          setLoading(false);
        }
      }
    }, [fetchAll]);

    // Initial load
    useEffect(() => {
      if (!requiresAuth) {
        void refresh(true);
      }
    }, [refresh, requiresAuth]);

    // Realtime subscription
    useEffect(() => {
      const channel = supabase
        .channel(`public:${tableName}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload: any) => {
            if (!mountedRef.current) return;
            const { eventType, new: newRow, old: oldRow } = payload;

            if (eventType === 'INSERT' && newRow) {
              const item = rowToItem(newRow as Record<string, unknown>);
              setItems((current) => upsertItem(current, item, keyExtractor));
            } else if (eventType === 'UPDATE' && newRow) {
              const item = rowToItem(newRow as Record<string, unknown>);
              setItems((current) => updateItem(current, item.id, item, keyExtractor));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              const id = Number(oldRow.id);
              setItems((current) => removeItem(current, id, keyExtractor));
            }
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }, [tableName, rowToItem, keyExtractor]);

    const addItemToState = useCallback((item: T) => {
      setItems((current) => appendItem(current, item, keyExtractor));
    }, [keyExtractor]);

    const updateItemInState = useCallback((id: number, updates: Partial<T>) => {
      setItems((current) => updateItem(current, id, updates, keyExtractor));
    }, [keyExtractor]);

    const upsertItemInState = useCallback((item: T) => {
      setItems((current) => upsertItem(current, item, keyExtractor));
    }, [keyExtractor]);

    const deleteItemFromState = useCallback((id: number) => {
      setItems((current) => removeItem(current, id, keyExtractor));
    }, [keyExtractor]);

    const deleteItem = useCallback(async (id: number) => {
      let backup: T[] = [];
      setItems((current) => {
        backup = current;
        return removeItem(current, id, keyExtractor);
      });

      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        if (mountedRef.current) {
          setItems(backup);
          const msg = err instanceof Error ? err.message : `Could not delete item`;
          Alert.alert('Delete Failed', msg);
        }
      }
    }, [tableName, keyExtractor]);

    const stateValue = useMemo(() => ({ items, loading }), [items, loading]);
    const actionsValue = useMemo(
      () => ({
        refresh,
        deleteItem,
        addItemToState,
        updateItemInState,
        upsertItemInState,
        deleteItemFromState,
      }),
      [refresh, deleteItem, addItemToState, updateItemInState, upsertItemInState, deleteItemFromState]
    );

    return (
      <StateContext.Provider value={stateValue}>
        <ActionsContext.Provider value={actionsValue}>
          {children}
        </ActionsContext.Provider>
      </StateContext.Provider>
    );
  }

  function useSyncedListState() {
    const ctx = useContext(StateContext);
    if (!ctx) throw new Error(`useSyncedListState must be within ${tableName}Provider`);
    return ctx;
  }

  function useSyncedListActions() {
    const ctx = useContext(ActionsContext);
    if (!ctx) throw new Error(`useSyncedListActions must be within ${tableName}Provider`);
    return ctx;
  }

  return { SyncedListProvider, useSyncedListState, useSyncedListActions };
}

export { createSyncedList };

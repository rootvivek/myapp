import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { repairService } from '../services/repairService';
import { rowToRepair } from '../db/database';
import { supabase } from '../lib/supabase';
import type { Repair } from '../types/repair';
import { appendItem, removeItem, updateItem, upsertItem } from '../utils/cacheHelpers';
import { logger } from '../utils/logger';

type RepairsStateContextValue = {
  repairs: Repair[];
  loading: boolean;
  ready: boolean;
};

type RepairsActionsContextValue = {
  refresh: (force?: boolean) => Promise<void>;
  deleteRepair: (repairId: number) => Promise<void>;
  addRepairToState: (repair: Repair) => void;
  updateRepairInState: (repairId: number, updates: Partial<Repair>) => void;
  upsertRepairInState: (repair: Repair) => void;
  deleteRepairFromState: (repairId: number) => void;
};

type RepairsContextValue = RepairsStateContextValue & RepairsActionsContextValue;

const RepairsStateContext = createContext<RepairsStateContextValue | null>(null);
const RepairsActionsContext = createContext<RepairsActionsContextValue | null>(null);

export function RepairsProvider({ children }: { children: React.ReactNode }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const requestIdRef = useRef(0);
  const lastFetchTimeRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

<<<<<<< HEAD
  // Initial fetch / manual pull-to-refresh
  const refresh = useCallback(async () => {
=======
  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle automatic focus refetches to once every 10 seconds unless forced
    if (!force && lastFetchTimeRef.current > 0 && now - lastFetchTimeRef.current < 10000) {
      return;
    }

>>>>>>> 59d5b3f0e76670e4b0b8d54687271a6ec0dd3ad9
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const list = await repairService.getAll();
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setRepairs(list);
        setReady(true);
        lastFetchTimeRef.current = Date.now();
      }
    } catch (err) {
      logger.warn('[RepairsContext] Error fetching repairs:', err);
    } finally {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime Subscription (Syncs INSERT, UPDATE, DELETE across devices without full table refetch)
  useEffect(() => {
    const channel = supabase
      .channel('public:repairs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repairs' },
        (payload: any) => {
          if (!mountedRef.current) return;
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT' && newRow) {
            const repair = rowToRepair(newRow as Record<string, unknown>);
            setRepairs((current) => upsertItem(current, repair, 'id'));
          } else if (eventType === 'UPDATE' && newRow) {
            const repair = rowToRepair(newRow as Record<string, unknown>);
            setRepairs((current) => updateItem(current, repair.id, repair, 'id'));
          } else if (eventType === 'DELETE' && oldRow?.id) {
            const id = Number(oldRow.id);
            setRepairs((current) => removeItem(current, id, 'id'));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Reusable Cache Actions
  const addRepairToState = useCallback((newRepair: Repair) => {
    setRepairs((current) => appendItem(current, newRepair, 'id'));
  }, []);

  const updateRepairInState = useCallback((repairId: number, updates: Partial<Repair>) => {
    setRepairs((current) => updateItem(current, repairId, updates, 'id'));
  }, []);

  const upsertRepairInState = useCallback((repair: Repair) => {
    setRepairs((current) => upsertItem(current, repair, 'id'));
  }, []);

  const deleteRepairFromState = useCallback((repairId: number) => {
    setRepairs((current) => removeItem(current, repairId, 'id'));
  }, []);

  // Optimistic Delete with automatic rollback on error
  const deleteRepair = useCallback(async (repairId: number) => {
    let backup: Repair[] = [];
    setRepairs((current) => {
      backup = current;
      return removeItem(current, repairId, 'id');
    });

    try {
      await repairService.remove(repairId);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setRepairs(backup);
        const msg = err instanceof Error ? err.message : 'Could not delete repair';
        Alert.alert('Delete Failed', msg);
      }
    }
  }, []);

  const stateValue = useMemo(
    () => ({ repairs, loading, ready }),
    [repairs, loading, ready]
  );

  const actionsValue = useMemo(
    () => ({
      refresh,
      deleteRepair,
      addRepairToState,
      updateRepairInState,
      upsertRepairInState,
      deleteRepairFromState,
    }),
    [
      refresh,
      deleteRepair,
      addRepairToState,
      updateRepairInState,
      upsertRepairInState,
      deleteRepairFromState,
    ]
  );

  return (
    <RepairsStateContext.Provider value={stateValue}>
      <RepairsActionsContext.Provider value={actionsValue}>
        {children}
      </RepairsActionsContext.Provider>
    </RepairsStateContext.Provider>
  );
}

export function useRepairsState(): RepairsStateContextValue {
  const ctx = useContext(RepairsStateContext);
  if (!ctx) throw new Error('useRepairsState must be used within RepairsProvider');
  return ctx;
}

export function useRepairActions(): RepairsActionsContextValue {
  const ctx = useContext(RepairsActionsContext);
  if (!ctx) throw new Error('useRepairActions must be used within RepairsProvider');
  return ctx;
}

export function useRepairs(): RepairsContextValue {
  const state = useRepairsState();
  const actions = useRepairActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

/**
 * Finer-grained selector hooks to minimize re-render scope
 */
export function useRepairById(repairId: number): Repair | undefined {
  const { repairs } = useRepairsState();
  return useMemo(() => repairs.find((r) => r.id === repairId), [repairs, repairId]);
}

export function useFilteredRepairs(statusFilter: string): Repair[] {
  const { repairs } = useRepairsState();
  return useMemo(() => {
    if (statusFilter === 'all') return repairs;
    return repairs.filter((r) => r.status === statusFilter);
  }, [repairs, statusFilter]);
}

export function useRepairsCount(): number {
  const { repairs } = useRepairsState();
  return repairs.length;
}

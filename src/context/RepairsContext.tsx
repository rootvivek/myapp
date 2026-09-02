import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { deleteRepair as deleteDbRepair, getAllRepairs } from '../db/database';
import type { Repair } from '../types/repair';

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

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle automatic focus refetches to once every 10 seconds unless forced
    if (!force && lastFetchTimeRef.current > 0 && now - lastFetchTimeRef.current < 10000) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const list = await getAllRepairs();
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setRepairs(list);
        setReady(true);
        lastFetchTimeRef.current = Date.now();
      }
    } catch (err) {
      console.warn('Error fetching repairs:', err);
    } finally {
      if (currentRequestId === requestIdRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addRepairToState = useCallback((newRepair: Repair) => {
    setRepairs((current) => [newRepair, ...current.filter((r) => r.id !== newRepair.id)]);
  }, []);

  const updateRepairInState = useCallback((repairId: number, updates: Partial<Repair>) => {
    setRepairs((current) =>
      current.map((r) => (r.id === repairId ? { ...r, ...updates } : r))
    );
  }, []);

  const deleteRepair = useCallback(async (repairId: number) => {
    let backup: Repair[] = [];
    setRepairs((current) => {
      backup = current;
      return current.filter((r) => r.id !== repairId);
    });

    try {
      await deleteDbRepair(repairId);
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
    () => ({ refresh, deleteRepair, addRepairToState, updateRepairInState }),
    [refresh, deleteRepair, addRepairToState, updateRepairInState]
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

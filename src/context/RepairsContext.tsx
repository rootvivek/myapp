import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deleteRepair as deleteDbRepair, getAllRepairs } from '../db/database';
import type { Repair } from '../types/repair';

type RepairsContextValue = {
  repairs: Repair[];
  loading: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
  deleteRepair: (repairId: number) => Promise<void>;
};

const RepairsContext = createContext<RepairsContextValue | null>(null);

export function RepairsProvider({ children }: { children: React.ReactNode }) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllRepairs();
      setRepairs(list);
      setReady(true);
    } catch (err) {
      console.warn('Error fetching repairs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteRepair = useCallback(async (repairId: number) => {
    await deleteDbRepair(repairId);
    setRepairs(current => current.filter(r => r.id !== repairId));
  }, []);

  const value = useMemo(
    () => ({ repairs, loading, ready, refresh, deleteRepair }),
    [repairs, loading, ready, refresh, deleteRepair]
  );

  return <RepairsContext.Provider value={value}>{children}</RepairsContext.Provider>;
}

export function useRepairs(): RepairsContextValue {
  const ctx = useContext(RepairsContext);
  if (!ctx) throw new Error('useRepairs must be used within RepairsProvider');
  return ctx;
}

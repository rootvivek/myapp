import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as khataService from '../services/khataService';
import type { KhataParty } from '../types';

type KhataSnapshot = { parties: KhataParty[]; updatedAt: number };
const khataCache = new Map<string, KhataSnapshot>();

export function useKhata() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const shopId = profile?.shopId ?? '';
  const cacheKey = userId ? `${userId}:${shopId}` : null;
  const cached = cacheKey ? khataCache.get(cacheKey) : undefined;
  const [parties, setParties] = useState<KhataParty[]>(() => cached?.parties ?? []);
  const [loading, setLoading] = useState(() => Boolean(cacheKey && !cached));
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => cached?.updatedAt ?? null);
  const requestRef = useRef(0);
  const activeKeyRef = useRef(cacheKey);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (!cacheKey) {
      setParties([]);
      setLoading(false);
      setLastUpdated(null);
      setError('Sign in to load Khata data.');
      return;
    }
    const cachedValue = khataCache.get(cacheKey);
    if (!force && cachedValue && Date.now() - cachedValue.updatedAt < 10000) return;
    const id = ++requestRef.current;
    activeKeyRef.current = cacheKey;
    if (!cachedValue) setLoading(true);
    setError(null);
    try {
      const list = await khataService.listPartySummaries({ archived: false });
      if (id !== requestRef.current || !mountedRef.current || activeKeyRef.current !== cacheKey) return;
      const updatedAt = Date.now();
      khataCache.set(cacheKey, { parties: list, updatedAt });
      setParties(list);
      setLastUpdated(updatedAt);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error && /khata_parties|khata_transactions|relation .* does not exist|schema cache/i.test(err.message)
        ? 'Khata database setup is incomplete. Ask the project administrator to apply the Khata migration.'
        : err instanceof Error ? err.message : 'Failed to load parties';
      if (id === requestRef.current && mountedRef.current && activeKeyRef.current === cacheKey) setError(msg);
    } finally {
      if (id === requestRef.current && mountedRef.current && activeKeyRef.current === cacheKey) setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    requestRef.current += 1;
    activeKeyRef.current = cacheKey;
    const snapshot = cacheKey ? khataCache.get(cacheKey) : undefined;
    setParties(snapshot?.parties ?? []);
    setLastUpdated(snapshot?.updatedAt ?? null);
    setLoading(Boolean(cacheKey && !snapshot));
    setError(null);
    if (cacheKey) void refresh();
  }, [cacheKey, refresh]);

  return { parties, loading, error, lastUpdated, refresh };
}

export function invalidateKhataCache(userId?: string, shopId?: string): void {
  if (!userId) return;
  if (shopId !== undefined) khataCache.delete(`${userId}:${shopId}`);
  else for (const key of khataCache.keys()) if (key.startsWith(`${userId}:`)) khataCache.delete(key);
}
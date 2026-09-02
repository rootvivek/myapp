import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { saveShopBranding } from '../utils/shopSettings';
import { signInUser, signUpUser } from './AuthService';
import { authReducer, initialAuthState } from './AuthReducer';
import { TIMEOUTS } from './constants';
import { withTimeout } from './helpers';
import { createLabourAccount, resetLabourPassword } from './LabourService';
import {
  loadProfileWithRetry,
  updateProfileName as svcUpdateProfileName,
  updateShopName as svcUpdateShopName,
} from './ProfileService';
import type { AuthContextValue } from './types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [state, dispatch] = useReducer(authReducer, {
    ...initialAuthState,
    configured,
  });

  const mountedRef = useRef(true);
  const initializingRef = useRef(true);
  const validatingLoginRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const p = await loadProfileWithRetry(userId);
      if (!mountedRef.current) return;

      dispatch({ type: 'SET_PROFILE', payload: p });
      if (p?.shopName) {
        void saveShopBranding({ shopName: p.shopName });
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (state.session?.user?.id) {
      await loadProfile(state.session.user.id);
    }
  }, [state.session, loadProfile]);

  useEffect(() => {
    if (!configured) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    let cancelled = false;
    initializingRef.current = true;

    const initAuth = async () => {
      try {
        const {
          data: { session: s },
        } = await withTimeout(
          supabase.auth.getSession() as unknown as Promise<any>,
          TIMEOUTS.QUERY_MS,
          'getSession timed out'
        );

        if (cancelled || !mountedRef.current) return;
        dispatch({ type: 'SET_SESSION', payload: s });

        if (s?.user?.id) {
          await loadProfile(s.user.id);
        }
      } catch (err) {
        logger.warn('[AuthProvider] Error initializing auth:', err);
      } finally {
        if (!cancelled && mountedRef.current) {
          initializingRef.current = false;
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, s: any) => {
      if (initializingRef.current || validatingLoginRef.current || !mountedRef.current) return;

      dispatch({ type: 'SET_SESSION', payload: s });
      if (s?.user?.id) {
        await loadProfile(s.user.id);
      } else {
        dispatch({ type: 'RESET' });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      validatingLoginRef.current = true;
      try {
        const result = await signInUser(email, password);
        if (mountedRef.current) {
          dispatch({
            type: 'SET_AUTH_DATA',
            payload: {
              session: result.session,
              profile: result.profile,
            },
          });
        }
      } finally {
        validatingLoginRef.current = false;
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      validatingLoginRef.current = true;
      try {
        const result = await signUpUser(email, password, name);
        if (mountedRef.current && result.session) {
          dispatch({
            type: 'SET_AUTH_DATA',
            payload: {
              session: result.session,
              profile: result.profile,
            },
          });
        }
        return { needsEmailConfirm: result.needsEmailConfirm };
      } finally {
        validatingLoginRef.current = false;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    dispatch({ type: 'RESET' });
    await supabase.auth.signOut();
  }, []);

  const isOwner = state.profile?.role === 'owner';
  const isLabour = state.profile?.role === 'labour';

  const handleCreateLabourAccount = useCallback(
    async (username: string, password: string, phone: string) => {
      await createLabourAccount(state.profile, username, password, phone);
    },
    [state.profile]
  );

  const handleResetLabourPassword = useCallback(
    async (labourUserId: string, newPassword: string) => {
      await resetLabourPassword(isOwner, labourUserId, newPassword);
    },
    [isOwner]
  );

  const handleUpdateProfileName = useCallback(
    async (newName: string) => {
      if (!state.session?.user?.id) {
        throw new Error('Not authenticated.');
      }
      await svcUpdateProfileName(state.session.user.id, newName);
      await refreshProfile();
    },
    [state.session, refreshProfile]
  );

  const handleUpdateShopName = useCallback(
    async (newShopName: string) => {
      if (!state.profile?.shopId || !isOwner) {
        throw new Error('Only the shop owner can update the shop name.');
      }
      await svcUpdateShopName(state.profile.shopId, newShopName);
      await refreshProfile();
    },
    [state.profile, isOwner, refreshProfile]
  );

  const value = useMemo(
    () => ({
      configured: state.configured,
      loading: state.loading,
      session: state.session,
      user: state.session?.user ?? null,
      profile: state.profile,
      isOwner,
      isLabour,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      createLabourAccount: handleCreateLabourAccount,
      resetLabourPassword: handleResetLabourPassword,
      updateProfileName: handleUpdateProfileName,
      updateShopName: handleUpdateShopName,
    }),
    [
      state.configured,
      state.loading,
      state.session,
      state.profile,
      isOwner,
      isLabour,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      handleCreateLabourAccount,
      handleResetLabourPassword,
      handleUpdateProfileName,
      handleUpdateShopName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

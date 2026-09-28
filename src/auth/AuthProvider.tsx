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
  updateProfileDetails as svcUpdateProfileDetails,
  updateProfileLogo as svcUpdateProfileLogo,
} from './ProfileService';
import type { AuthContextValue, UserProfile } from './types';

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
      let p: UserProfile | null = null;
      try {
        p = await loadProfileWithRetry(userId);
      } catch (err) {
        // Never let a transient profile/propagation failure drop the session or
        // leave the account without a profile: retry once more before giving up.
        logger.warn('[AuthProvider] profile load failed, retrying once:', err);
        try {
          p = await loadProfileWithRetry(userId, 3);
        } catch (retryErr) {
          logger.warn('[AuthProvider] profile load failed after retry:', retryErr);
        }
      }
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
  }, [state.session?.user?.id, loadProfile]);

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
    async (identifier: string, password: string) => {
      validatingLoginRef.current = true;
      try {
        const result = await signInUser(identifier, password);
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
    async (phone: string, password: string, name: string, shopName?: string) => {
      validatingLoginRef.current = true;
      try {
        const result = await signUpUser(phone, password, name, shopName);
        if (mountedRef.current && result.session) {
          dispatch({
            type: 'SET_AUTH_DATA',
            payload: {
              session: result.session,
              profile: result.profile,
            },
          });
          if (result.session.user?.id) {
            await loadProfile(result.session.user.id);
          }
        }
        return { needsPhoneConfirm: result.needsPhoneConfirm };
      } finally {
        validatingLoginRef.current = false;
      }
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    dispatch({ type: 'RESET' });
    await supabase.auth.signOut();
  }, []);

  const isOwner = state.profile?.role ? state.profile.role === 'owner' : true;
  const isLabour = state.profile?.role === 'labour';
  const isAdmin = state.profile?.role === 'admin';

  // Use refs for values needed inside callbacks to avoid recreating callbacks on every state change.
  const profileRef = useRef(state.profile);
  profileRef.current = state.profile;
  const sessionRef = useRef(state.session);
  sessionRef.current = state.session;

  const handleCreateLabourAccount = useCallback(
    async (username: string, password: string, phone: string) => {
      await createLabourAccount(profileRef.current, username, password, phone);
    },
    []
  );

  const handleResetLabourPassword = useCallback(
    async (labourUserId: string, newPassword: string) => {
      await resetLabourPassword(isOwner, labourUserId, newPassword);
    },
    [isOwner]
  );

  const handleUpdateProfileLogo = useCallback(
    async (logoUrl: string | null) => {
      const userId = sessionRef.current?.user?.id;
      if (userId) {
        await svcUpdateProfileLogo(userId, logoUrl);
        await refreshProfile().catch(() => {});
      }
    },
    [refreshProfile]
  );

  const handleUpdateProfileDetails = useCallback(
    async (name: string, shopName: string) => {
      const userId = sessionRef.current?.user?.id;
      if (userId) {
        await svcUpdateProfileDetails(
          userId,
          name,
          profileRef.current?.shopId || '',
          shopName,
          isOwner
        );
        await refreshProfile();
      }
    },
    [isOwner, refreshProfile]
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
      isAdmin,
      signIn,
      signUp,
      signOut,
      createLabourAccount: handleCreateLabourAccount,
      resetLabourPassword: handleResetLabourPassword,
      updateProfileLogo: handleUpdateProfileLogo,
      updateProfileDetails: handleUpdateProfileDetails,
    }),
    [
      state.configured,
      state.loading,
      state.session,
      state.profile,
      isOwner,
      isLabour,
      isAdmin,
      signIn,
      signUp,
      signOut,
      handleCreateLabourAccount,
      handleResetLabourPassword,
      handleUpdateProfileLogo,
      handleUpdateProfileDetails,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

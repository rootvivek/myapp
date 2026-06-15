import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase, createTempClient } from '../lib/supabase';
import { isValidEmail, normalizeEmail } from '../utils/email';
import type { UserProfile, UserRole } from '../types/profile';
import { saveShopBranding } from '../utils/shopSettings';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isOwner: boolean;
  isLabour: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createLabourAccount: (name: string, password: string, phone: string) => Promise<void>;
  resetLabourPassword: (labourUserId: string, newPassword: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateShopName: (shopName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 5000, errorMsg = 'Operation timed out'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))
  ]);
};

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    let queryResult = await withTimeout(
      supabase
        .from('profiles')
        .select('id, name, username, phone, role, shop_id, shops!profiles_shop_id_fkey(shop_name)')
        .eq('id', userId)
        .maybeSingle() as Promise<any>,
      10000,
      'profiles table select timed out'
    );

    let data = queryResult.data;
    let error = queryResult.error;

    // Fallback if username column doesn't exist yet in the database
    if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
      console.warn('[AuthContext] Retrying profile fetch without username column...');
      const retryResult = await withTimeout(
        supabase
          .from('profiles')
          .select('id, name, phone, role, shop_id, shops!profiles_shop_id_fkey(shop_name)')
          .eq('id', userId)
          .maybeSingle() as Promise<any>,
        10000,
        'profiles table fallback select timed out'
      );
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.warn('[AuthContext] fetchProfile error:', error);
      return null;
    }
    if (!data) return null;

    const shopsVal = data.shops;
    let dbShopName = '';
    if (shopsVal) {
      if (Array.isArray(shopsVal)) {
        dbShopName = shopsVal[0]?.shop_name || '';
      } else {
        dbShopName = (shopsVal as any).shop_name || '';
      }
    }

    return {
      id: data.id,
      name: data.name ?? '',
      username: data.username ?? '',
      phone: data.phone ?? '',
      role: (data.role as UserRole) || 'owner',
      shopId: data.shop_id ?? '',
      shopName: dbShopName,
    };
  } catch (err) {
    console.warn('[AuthContext] fetchProfile failed:', err);
    return null;
  }
}

async function ensureOwnerProfile(userId: string): Promise<UserProfile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  // Let's get the auth user metadata to see if they provided a name
  let name = '';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && user.user_metadata?.name) {
      name = user.user_metadata.name;
    }
  } catch (e) {
    console.warn('[AuthContext] error getting user metadata:', e);
  }

  // Create a shop for this new owner
  const { data: shop, error: shopErr } = await supabase
    .from('shops')
    .insert({ shop_name: 'MCA Phone Wala', owner_id: userId })
    .select('id, shop_name')
    .single();
  if (shopErr || !shop) {
    throw new Error('Could not create shop: ' + (shopErr?.message ?? 'unknown'));
  }

  // Create owner profile
  const { error: profErr } = await supabase
    .from('profiles')
    .insert({ id: userId, name: name, phone: '', role: 'owner', shop_id: shop.id });
  if (profErr) {
    throw new Error('Could not create profile: ' + profErr.message);
  }

  // Backfill any existing repairs/inventory that have no shop_id
  await supabase.from('repairs').update({ shop_id: shop.id, created_by: userId }).eq('user_id', userId).is('shop_id', null);
  await supabase.from('inventory').update({ shop_id: shop.id }).eq('user_id', userId).is('shop_id', null);

  return {
    id: userId,
    name: name,
    username: '',
    phone: '',
    role: 'owner',
    shopId: shop.id,
    shopName: shop.shop_name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether initial auth is still running to avoid race with onAuthStateChange
  const initializingRef = useRef(true);

  const loadProfileWithRetry = useCallback(async (userId: string, retries = 2): Promise<UserProfile | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const p = await withTimeout(ensureOwnerProfile(userId), 12000, 'ensureOwnerProfile timed out');
        return p;
      } catch (err) {
        console.warn('[AuthContext] loadProfile attempt', attempt, 'failed:', err);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    return null;
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const p = await loadProfileWithRetry(userId);
    setProfile(p);
    if (p?.shopName) {
      void saveShopBranding({ shopName: p.shopName });
    }
  }, [loadProfileWithRetry]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    initializingRef.current = true;

    const initAuth = async () => {
      try {
        // getSession() retrieves the session from storage.
        // onAuthStateChange will also fire INITIAL_SESSION, but we skip it
        // during init to avoid a race condition.
        const { data: { session: s } } = await withTimeout(
          supabase.auth.getSession() as Promise<any>,
          10000,
          'getSession timed out'
        );
        if (cancelled) return;
        setSession(s);
        if (s?.user?.id) {
          await loadProfile(s.user.id);
        }
      } catch (err) {
        console.warn('[AuthContext] Error initializing auth:', err);
      } finally {
        if (!cancelled) {
          initializingRef.current = false;
          setLoading(false);
        }
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, s: any) => {
      // Skip events while initAuth is running to avoid race condition
      if (initializingRef.current) return;
      setSession(s);
      if (s?.user?.id) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email address (example: you@example.com).');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email address (example: you@example.com).');
    }
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });
    if (error) throw error;
    return { needsEmailConfirm: !data.session };
  };

  const signOut = async () => {
    setProfile(null);
    await supabase.auth.signOut();
  };

  const isOwner = profile?.role === 'owner';
  const isLabour = profile?.role === 'labour';

  const createLabourAccount = async (username: string, password: string, phone: string) => {
    if (!profile || !isOwner) {
      throw new Error('Only the shop owner can create labour accounts.');
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      throw new Error('Username is required for the labour account.');
    }

    // Generate a shop email address from username, scoped by shop ID to avoid collisions
    const shopCode = profile.shopId.substring(0, 8);
    const loginUsername = `${trimmedUsername}.${shopCode}`;
    const generatedEmail = `${loginUsername}@mcaphonewala.internal`;

    const tempClient = createTempClient();
    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: { role: 'labour', shop_id: profile.shopId },
      },
    });
    if (signUpError) throw new Error('Failed to create account: ' + signUpError.message);

    const newUserId = signUpData.user?.id;
    if (!newUserId) throw new Error('Account created but user ID not returned.');

    // Insert the profile for the new labour user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUserId,
        name: username.trim(),
        username: loginUsername,
        phone: phone.trim(),
        role: 'labour',
        shop_id: profile.shopId,
      });

    if (profileError) {
      console.warn('[createLabour] profile insert error:', profileError);
      throw new Error('Account created but profile setup failed.');
    }
  };

  const resetLabourPassword = async (labourUserId: string, newPassword: string) => {
    if (!isOwner) {
      throw new Error('Only the shop owner can reset labour passwords.');
    }
    const { error } = await supabase.rpc('admin_reset_labour_password', {
      p_labour_id: labourUserId,
      p_new_password: newPassword,
    });
    if (error) throw error;
  };

  const updateProfileName = async (newName: string) => {
    if (!session?.user?.id) {
      throw new Error('Not authenticated.');
    }
    const { error } = await supabase
      .from('profiles')
      .update({ name: newName.trim() })
      .eq('id', session.user.id);
    if (error) throw error;
    await refreshProfile();
  };

  const updateShopName = async (newShopName: string) => {
    if (!profile?.shopId || !isOwner) {
      throw new Error('Only the shop owner can update the shop name.');
    }
    const { error } = await supabase
      .from('shops')
      .update({ shop_name: newShopName.trim() })
      .eq('id', profile.shopId);
    if (error) throw error;
    
    // Cache it locally in AsyncStorage
    await saveShopBranding({ shopName: newShopName.trim() });
    
    // Refresh the profile to update Context state
    await refreshProfile();
  };

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isOwner,
      isLabour,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      createLabourAccount,
      resetLabourPassword,
      updateProfileName,
      updateShopName,
    }),
    [configured, loading, session, profile, isOwner, isLabour, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

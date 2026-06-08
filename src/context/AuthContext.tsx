import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isValidEmail, normalizeEmail } from '../utils/email';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session: s } }: any) => {
      if (!cancelled) {
        setSession(s);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, s: any) => {
      setSession(s);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

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

  const signUp = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error('Enter a valid email address (example: you@example.com).');
    }
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
    });
    if (error) throw error;
    return { needsEmailConfirm: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [configured, loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

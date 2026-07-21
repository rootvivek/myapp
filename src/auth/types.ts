import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../types/profile';

export type { UserProfile, UserRole };

export interface AuthState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  profile: UserProfile | null;
}

export type AuthAction =
  | { type: 'SET_CONFIGURED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_PROFILE'; payload: UserProfile | null }
  | {
      type: 'SET_AUTH_DATA';
      payload: {
        session: Session | null;
        profile: UserProfile | null;
      };
    }
  | { type: 'RESET' };

export interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isOwner: boolean;
  isLabour: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createLabourAccount: (name: string, password: string, phone: string) => Promise<void>;
  resetLabourPassword: (labourUserId: string, newPassword: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateShopName: (shopName: string) => Promise<void>;
}

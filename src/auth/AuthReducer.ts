import type { AuthAction, AuthState } from './types';

export const initialAuthState: AuthState = {
  configured: true,
  loading: true,
  session: null,
  profile: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_CONFIGURED':
      return { ...state, configured: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_SESSION':
      return { ...state, session: action.payload };

    case 'SET_PROFILE':
      return { ...state, profile: action.payload };

    case 'SET_AUTH_DATA':
      return {
        ...state,
        session: action.payload.session,
        profile: action.payload.profile,
      };

    case 'RESET':
      return {
        ...state,
        session: null,
        profile: null,
      };

    default:
      return state;
  }
}

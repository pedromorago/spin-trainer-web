import { createContext } from 'react';

/**
 * Shared session state: { user, loading, demo, signInWithGoogle, signInWithIdToken, signOut } (ADR-0023), plus
 * signIn(email) in mock mode only. Provided by AuthProvider.
 */
export const AuthContext = createContext(null);

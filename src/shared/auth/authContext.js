import { createContext } from 'react';

/**
 * Shared session state: { user, loading, signInWithGoogle, completeOAuth, signOut }, plus signIn(email) in mock mode
 * only. Provided by AuthProvider.
 */
export const AuthContext = createContext(null);

import { createContext } from 'react';

/** Shared session state: { user, loading, signIn, signInWithGoogle, completeOAuth, signOut }. Provided by AuthProvider. */
export const AuthContext = createContext(null);

import { createContext } from 'react';

/** Shared session state: { user, loading, signIn, signUp, signOut }. Provided by AuthProvider. */
export const AuthContext = createContext(null);

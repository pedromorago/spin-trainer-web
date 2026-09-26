import { createContext } from 'react';

/** Estado de sesión compartido: { user, loading, signIn, signUp, signOut }. Lo provee AuthProvider. */
export const AuthContext = createContext(null);

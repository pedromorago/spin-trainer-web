import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { supabase } from './supabaseClient';

const MOCK = import.meta.env.VITE_API_MODE === 'mock';
const MOCK_USER = { id: 'mock-user', email: 'mock@local' };

/**
 * Una única fuente de verdad de la sesión para toda la app (una sola suscripción a Supabase).
 * En modo mock no hay Supabase: se arranca con sesión iniciada y el login acepta cualquier credencial.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK ? MOCK_USER : null);
  const [loading, setLoading] = useState(!MOCK);

  useEffect(() => {
    if (MOCK) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn: MOCK
      ? async email => { setUser({ ...MOCK_USER, email: email || MOCK_USER.email }); return { error: null }; }
      : (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: MOCK
      ? async () => ({ error: null })
      : (email, password) => supabase.auth.signUp({ email, password }),
    signOut: MOCK
      ? async () => setUser(null)
      : () => supabase.auth.signOut()
  }), [user, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

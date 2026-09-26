import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { getSupabase } from './supabaseClient';

const MOCK = import.meta.env.VITE_API_MODE === 'mock';
const MOCK_USER = { id: 'mock-user', email: 'mock@local' };

/**
 * A single source of truth for the session across the whole app (a single Supabase subscription).
 * In mock mode there is no Supabase: it starts signed in and the login accepts any credentials.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK ? MOCK_USER : null);
  const [loading, setLoading] = useState(!MOCK);

  useEffect(() => {
    if (MOCK) return;
    let cancelled = false;
    let unsubscribe = null;
    getSupabase().then(async supabase => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn: MOCK
      ? async email => { setUser({ ...MOCK_USER, email: email || MOCK_USER.email }); return { error: null }; }
      : async (email, password) => (await getSupabase()).auth.signInWithPassword({ email, password }),
    signUp: MOCK
      ? async () => ({ error: null })
      : async (email, password) => (await getSupabase()).auth.signUp({ email, password }),
    signOut: MOCK
      ? async () => setUser(null)
      : async () => (await getSupabase()).auth.signOut()
  }), [user, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

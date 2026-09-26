import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { getSupabase } from './supabaseClient';

const MOCK = import.meta.env.VITE_API_MODE === 'mock';
// In mock mode each email is a different user (id from the email): signing in as someone else on the same tab starts
// from that user's own caches, as with Supabase.
const mockUser = (email = 'mock@local') => ({ id: `mock:${email}`, email });

/**
 * A single source of truth for the session across the whole app (a single Supabase subscription).
 * In mock mode there is no Supabase: it starts signed in and the login accepts any credentials.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK ? mockUser() : null);
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
      ? async email => { setUser(mockUser(email || undefined)); return { error: null }; }
      : async (email, password) => (await getSupabase()).auth.signInWithPassword({ email, password }),
    signUp: MOCK
      ? async () => ({ error: null })
      : async (email, password) => (await getSupabase()).auth.signUp({ email, password }),
    // Local scope: signs out this browser only. Supabase's default (global) would also close the sessions on the user's
    // other devices.
    signOut: MOCK
      ? async () => { setUser(null); return { error: null }; }
      : async () => (await getSupabase()).auth.signOut({ scope: 'local' })
  }), [user, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

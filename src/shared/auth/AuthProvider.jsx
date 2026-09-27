import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { OAUTH_ERRORS, parseOAuthCallback, rememberReturnPath } from './oauth';
import { getSupabase } from './supabaseClient';

const MOCK = import.meta.env.VITE_API_MODE === 'mock';
// In mock mode each email is a different user (id from the email): signing in as someone else on the same tab starts
// from that user's own caches, as with Supabase.
const mockUser = (email = 'mock@local') => ({ id: `mock:${email}`, email });

// One exchange per code: the code and its PKCE verifier are single-use, and React runs effects twice in development.
const exchanges = new Map();

/**
 * A single source of truth for the session across the whole app (a single Supabase subscription).
 * Google is the only way in (ADR-0020). In mock mode there is no Supabase: it starts signed in, "Continuar con Google"
 * signs in straight away, and `signIn(email)` plays as another player (the E2E suite's way to have several players on
 * one tab); outside the mock `signIn` does not exist.
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
    signIn: MOCK ? async email => { setUser(mockUser(email || undefined)); return { error: null }; } : undefined,
    // Leaves for Google and comes back to /auth/callback; returnPath is where the user was going.
    signInWithGoogle: MOCK
      ? async () => { setUser(mockUser()); return { error: null }; }
      : async returnPath => {
        rememberReturnPath(returnPath);
        const { error } = await (await getSupabase()).auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` }
        });
        return { error };
      },
    // Finishes Google's round trip from the callback's query string. The error, if any, is a message for the user.
    completeOAuth: async search => {
      const callback = parseOAuthCallback(search);
      if (callback.error) return { error: callback.error };
      if (MOCK) { setUser(mockUser()); return { error: null }; }
      const supabase = await getSupabase();
      if (!exchanges.has(callback.code)) exchanges.set(callback.code, supabase.auth.exchangeCodeForSession(callback.code));
      const { error } = await exchanges.get(callback.code);
      return { error: error ? OAUTH_ERRORS.invalid : null };
    },
    // Local scope: signs out this browser only. Supabase's default (global) would also close the sessions on the user's
    // other devices.
    signOut: MOCK
      ? async () => { setUser(null); return { error: null }; }
      : async () => (await getSupabase()).auth.signOut({ scope: 'local' })
  }), [user, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { savePending, startGoogleSignIn } from './googleSignIn';
import { getSupabase } from './supabaseClient';
import { IS_DEMO, USES_MOCK_DATA } from '../mode';

const MOCK = USES_MOCK_DATA;
// In mock mode each email is a different user (id from the email): signing in as someone else on the same tab starts
// from that user's own caches, as with Supabase.
const mockUser = (email = 'mock@local') => ({ id: `mock:${email}`, email });

/**
 * A single source of truth for the session across the whole app (a single Supabase subscription).
 * Google is the only way in (ADR-0020): the browser goes to Google and comes back to /auth/google with an ID token,
 * which Supabase exchanges for its session (ADR-0023). With the in-browser adapter there is no Supabase: it starts
 * signed in, and "Continue with Google" (or any answer on /auth/google) signs in straight away. In mock mode `signIn(email)` plays as another player (the E2E suite's
 * way to have several players on one tab); in the demo (ADR-0022) there is no sign-in or sign-out, and outside the mock
 * `signIn` does not exist.
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
    // The public demo has no sign-in at all: nobody signs in or out, the player is this browser.
    demo: IS_DEMO,
    signIn: MOCK && !IS_DEMO ? async email => { setUser(mockUser(email || undefined)); return { error: null }; } : undefined,
    // Leaves for Google, which comes back to /auth/google; returnPath is where the user was going.
    signInWithGoogle: MOCK
      ? async () => { setUser(mockUser()); return { error: null }; }
      : async returnPath => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return { error: { message: 'Google sign-in is not configured' } };
        const { pending, url } = await startGoogleSignIn({ clientId, origin: window.location.origin, returnPath });
        // Without storage this tab could not check Google's answer: better not to leave at all.
        if (!savePending(pending)) return { error: { message: 'This browser blocks the storage the sign-in needs' } };
        window.location.assign(url);
        return { error: null };
      },
    // Google's ID token and the raw nonce whose hash it carries, exchanged for Supabase's session; the session change
    // then signs the user in everywhere.
    signInWithIdToken: MOCK
      ? async () => { setUser(mockUser()); return { error: null }; }
      : async (token, nonce) => {
        const { error } = await (await getSupabase()).auth.signInWithIdToken({ provider: 'google', token, nonce });
        return { error };
      },
    // Local scope: signs out this browser only. Supabase's default (global) would also close the sessions on the user's
    // other devices.
    signOut: MOCK
      ? async () => { setUser(null); return { error: null }; }
      : async () => (await getSupabase()).auth.signOut({ scope: 'local' })
  }), [user, loading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

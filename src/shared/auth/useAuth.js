import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const MOCK = import.meta.env.VITE_API_MODE === 'mock';
const MOCK_USER = { id: 'mock-user', email: 'mock@local' };

export function useAuth() {
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

  return {
    user,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signOut: () => (MOCK ? setUser(null) : supabase.auth.signOut())
  };
}

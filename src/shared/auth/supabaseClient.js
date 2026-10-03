let clientPromise = null;

/** Supabase client loaded on demand: outside the initial bundle and never downloaded in mock mode. */
export function getSupabase() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) console.warn('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    // Google comes back to /auth/google, whose page exchanges the ID token itself (ADR-0023): the client must not
    // read that URL on its own.
    return createClient(url ?? 'http://localhost', anonKey ?? 'anon', { auth: { detectSessionInUrl: false } });
  });
  return clientPromise;
}

/** Current JWT token (consumed by the API's HTTP client). */
export async function getAccessToken() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

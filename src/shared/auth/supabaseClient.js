let clientPromise = null;

/** Cliente Supabase cargado bajo demanda: fuera del bundle inicial y nunca descargado en modo mock. */
export function getSupabase() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    return createClient(url ?? 'http://localhost', anonKey ?? 'anon');
  });
  return clientPromise;
}

/** Token JWT actual (lo consume el cliente HTTP de la API). */
export async function getAccessToken() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

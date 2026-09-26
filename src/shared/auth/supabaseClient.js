import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if ((!url || !anonKey) && import.meta.env.VITE_API_MODE !== 'mock') console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'anon');

/** Token JWT actual (lo consume el cliente HTTP de la API). */
export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

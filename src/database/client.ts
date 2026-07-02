/**
 * database/client.ts — cliente Supabase con CARGA DIFERIDA.
 * La librería (~250 KB) se importa dinámicamente solo cuando se necesita
 * (sesión guardada o al iniciar sesión), así el primer render es más ligero.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/supabase";

let sb: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (sb) return Promise.resolve(sb);
  if (!loading) loading = (async () => {
    try { const { createClient } = await import("@supabase/supabase-js"); sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); return sb; }
    catch (e) { console.error("Supabase init falló", e); return null; }
  })();
  return loading;
}

/**
 * database/client.ts — instancia única del cliente Supabase.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/supabase";

let sb: SupabaseClient | null = null;
try {
  sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("Supabase init falló", e);
}
export const supabase = sb;

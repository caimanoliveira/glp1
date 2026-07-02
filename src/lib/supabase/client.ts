// Cliente Supabase para o navegador (opcional). Usado quando as variáveis de
// ambiente estão definidas; caso contrário o app roda em modo local (localStorage).
// Auth single-user + RLS (user_id = auth.uid()) — ver /supabase/migrations.
import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, key);
}

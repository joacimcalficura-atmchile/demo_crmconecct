'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Cliente Supabase para el NAVEGADOR (solo Realtime Broadcast).
// Usa la anon key pública. Si las variables NEXT_PUBLIC no están
// configuradas, devuelve null y la UI degrada con un mensaje claro
// en vez de romper el build/deploy.
// ============================================================

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  _client = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 20 } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export const isCajaRealtimeConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

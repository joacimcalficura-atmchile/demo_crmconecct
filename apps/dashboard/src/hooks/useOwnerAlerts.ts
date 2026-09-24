'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Conversation, Quote } from '@/lib/api';
import { isUnresolvedLid, UNVERIFIED_PHONE_LABEL, formatPhone } from '@/lib/phone-identity';

// ============================================================
// Alertas pendientes del dueño — lógica compartida entre la campanita de
// escritorio (TopNav) y el dock móvil (CapsuleNav). Vive en un hook para no
// terminar con dos derivaciones que se desincronizan, que es el patrón que
// advierte CLAUDE.md (el umbral del LID llegó a estar en 5 lugares).
//
// No hay tabla de notificaciones y no hace falta: las dos cosas que el dueño
// tiene que atender YA son estado en la base y son la fuente de verdad.
//   · cotización en 'draft'            → plata esperando aprobación (invariante #5)
//   · conversación en 'human'/'paused' → un cliente esperando a una persona
// Derivarlas evita una tabla de avisos que se desincroniza del estado real y
// termina mostrando cosas ya resueltas.
// ============================================================

const POLL_MS = 60_000;
const SEEN_KEY = 'atm:alerts:seen';

export type AlertKind = 'quote' | 'human';

export interface OwnerAlert {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  href: string;
  at: string | null;
}

/** Nombre mostrable sin inventar datos (invariante #4). */
function displayName(name: string | null | undefined, phone: string): string {
  const clean = (name ?? '').trim();
  if (clean) return clean;
  return isUnresolvedLid(phone) ? UNVERIFIED_PHONE_LABEL : formatPhone(phone);
}

function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    /* sin storage disponible: el estado vive solo en memoria */
  }
}

/**
 * @param enabled  En falso no consulta nada. Se usa para no poner a sondear al
 *                 bot del cliente desde las pantallas de ATM Core, que no
 *                 tienen ni cotizaciones ni conversaciones.
 */
export function useOwnerAlerts(enabled: boolean = true) {
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => { setSeen(readSeen()); }, []);

  const load = useCallback(async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/proxy/quotes', { cache: 'no-store' }),
        fetch('/api/proxy/conversations', { cache: 'no-store' }),
      ]);
      // Si el bot del VPS no responde se DICE. Mostrar "0 pendientes" es
      // justo la mentira que hace que nadie revise nada.
      if (!qRes.ok || !cRes.ok) { setFailed(true); return; }

      const quotes = (await qRes.json()) as Quote[];
      const convs = (await cRes.json()) as Conversation[];
      const next: OwnerAlert[] = [];

      for (const q of Array.isArray(quotes) ? quotes : []) {
        if (q.status !== 'draft') continue;
        next.push({
          id: `quote:${q.id}`,
          kind: 'quote',
          title: 'Cotización esperando aprobación',
          detail: `${displayName(q.contact_name, q.phone)} · $${(q.total ?? 0).toLocaleString('es-CL')}`,
          href: '/dashboard/quotes',
          at: q.created_at ?? null,
        });
      }

      for (const c of Array.isArray(convs) ? convs : []) {
        if (c.status !== 'human' && c.status !== 'paused') continue;
        // Un LID sin resolver y sin mensajes no es un cliente esperando: es
        // ruido. Mismo criterio que la lista de Conversaciones.
        if (isUnresolvedLid(c.phone) && !c.message_count) continue;
        next.push({
          id: `human:${c.id}`,
          kind: 'human',
          title: c.status === 'human' ? 'Un cliente necesita atención humana' : 'Chat en pausa',
          detail: displayName(c.contact_name, c.phone),
          // Link profundo: abre la conversación exacta, no la lista.
          href: `/dashboard/conversations?phone=${encodeURIComponent(c.phone)}`,
          at: c.updated_at ?? null,
        });
      }

      next.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
      setAlerts(next);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load, enabled]);

  const unread = useMemo(() => alerts.filter(a => !seen.has(a.id)), [alerts, seen]);

  const markAllSeen = useCallback(() => {
    setSeen(prev => {
      const next = new Set(prev);
      // Solo se marcan las que existen ahora: si aparece una nueva mientras el
      // panel está abierto, no queda silenciada sin haberse visto.
      for (const a of alerts) next.add(a.id);
      writeSeen(next);
      return next;
    });
  }, [alerts]);

  const markSeen = useCallback((id: string) => {
    setSeen(prev => {
      const next = new Set(prev).add(id);
      writeSeen(next);
      return next;
    });
  }, []);

  return { alerts, unread, loading, failed, seen, markAllSeen, markSeen };
}

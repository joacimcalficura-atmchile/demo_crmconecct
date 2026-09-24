'use client';

import { FileText, MessageSquareWarning, Check, Loader2, AlertTriangle } from 'lucide-react';
import type { OwnerAlert } from '@/hooks/useOwnerAlerts';

// Cuerpo compartido del panel de alertas: lo usan la campanita de escritorio
// (TopNav) y la hoja del dock móvil (CapsuleNav). Solo pinta — quién las trae y
// cómo se marcan vistas vive en useOwnerAlerts.

export function AlertsList({
  alerts,
  seen,
  loading,
  failed,
  onSelect,
}: {
  alerts: OwnerAlert[];
  seen: Set<string>;
  loading: boolean;
  failed: boolean;
  onSelect: (alert: OwnerAlert) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex items-start gap-2 p-4 text-xs text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>No se pudo consultar el bot. Puede haber pendientes sin mostrar.</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <Check className="w-4 h-4" /> Nada pendiente por ahora.
      </p>
    );
  }

  return (
    <>
      {alerts.map(a => {
        const Icon = a.kind === 'quote' ? FileText : MessageSquareWarning;
        const isNew = !seen.has(a.id);
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isNew ? 'bg-sky-500/[0.04]' : ''}`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${
              a.kind === 'quote'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{a.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{a.detail}</p>
            </div>
            {isNew && <span className="w-2 h-2 mt-1.5 rounded-full bg-sky-500 shrink-0" />}
          </button>
        );
      })}
    </>
  );
}

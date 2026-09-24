'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { useOwnerAlerts, type OwnerAlert } from '@/hooks/useOwnerAlerts';
import { AlertsList } from './AlertsList';

// ============================================================
// Campanita de alertas (escritorio, dentro de TopNav).
// Antes era decorativa: un punto azul FIJO y hardcodeado, sin desplegable y
// sin datos detrás — avisaba siempre, incluso sin nada pendiente, así que no
// significaba nada. Ahora el indicador solo aparece si de verdad hay algo, y
// cada alerta abre su destino exacto.
//
// En móvil el TopNav está oculto (`hidden md:flex`): ahí las mismas alertas
// salen por el dock (CapsuleNav), compartiendo useOwnerAlerts.
// ============================================================

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { alerts, unread, loading, failed, seen, markAllSeen, markSeen } = useOwnerAlerts();

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (alert: OwnerAlert) => {
    markSeen(alert.id);
    setOpen(false);
    router.push(alert.href);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Alertas${unread.length ? ` (${unread.length} sin ver)` : ''}`}
        className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold border-2 border-slate-100 dark:border-slate-900">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[330px] max-h-[420px] overflow-hidden flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pendientes {alerts.length > 0 && `(${alerts.length})`}
            </p>
            {unread.length > 0 && (
              <button onClick={markAllSeen} className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
                <Check className="w-3 h-3" /> Marcar vistas
              </button>
            )}
          </div>
          <div className="overflow-y-auto">
            <AlertsList alerts={alerts} seen={seen} loading={loading} failed={failed} onSelect={go} />
          </div>
        </div>
      )}
    </div>
  );
}

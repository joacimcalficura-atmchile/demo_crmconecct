'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import type { OwnerAlert } from '@/hooks/useOwnerAlerts';
import { AlertsList } from './AlertsList';

// ============================================================
// Hoja de alertas para móvil, abierta desde el dock (CapsuleNav).
//
// Va en un PORTAL a document.body a propósito: el <nav> del dock tiene
// `overflow-x-auto`, que en CSS obliga al eje vertical a recortar también, así
// que un panel dibujado dentro del dock quedaba cortado.
//
// Sin <AnimatePresence>: dentro de createPortal no desmonta al cerrar y la
// ventana queda pegada en pantalla (el bug que tenían los modales de
// Cotizaciones). Se desmonta con `open` y se anima por CSS.
// ============================================================

export function MobileAlertsSheet({
  open,
  onClose,
  alerts,
  seen,
  loading,
  failed,
  unreadCount,
  onMarkAllSeen,
  onMarkSeen,
}: {
  open: boolean;
  onClose: () => void;
  alerts: OwnerAlert[];
  seen: Set<string>;
  loading: boolean;
  failed: boolean;
  unreadCount: number;
  onMarkAllSeen: () => void;
  onMarkSeen: (id: string) => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const go = (alert: OwnerAlert) => {
    onMarkSeen(alert.id);
    onClose();
    router.push(alert.href);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* mb-28 deja libre el dock, que vive en bottom-6 y mide ~60px. */}
      <div className="relative w-full mx-3 mb-28 max-h-[60vh] flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pendientes {alerts.length > 0 && `(${alerts.length})`}
          </p>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={onMarkAllSeen} className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                <Check className="w-3 h-3" /> Marcar vistas
              </button>
            )}
            <button onClick={onClose} aria-label="Cerrar alertas" className="p-1 text-slate-500 dark:text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain">
          <AlertsList alerts={alerts} seen={seen} loading={loading} failed={failed} onSelect={go} />
        </div>
      </div>
    </div>,
    document.body
  );
}

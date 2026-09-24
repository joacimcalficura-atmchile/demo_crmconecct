'use client';
import { useState, useEffect } from 'react';
import { Construction, X } from 'lucide-react';

// Cambia esta versión cada vez que quieras que el aviso vuelva a
// mostrarse (aunque el usuario ya haya cerrado una versión anterior).
const NOTICE_VERSION = '2026-07-fase2';
const STORAGE_KEY = `maintenanceNoticeDismissed_${NOTICE_VERSION}`;

export function MaintenanceBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative z-20 bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <Construction className="w-4 h-4 shrink-0" />
          <span>
            Estamos en etapa de mejora continua en producción para potenciar el trabajo del agente.
            Puede que notes cambios o breves intermitencias mientras desplegamos.
          </span>
        </div>
        <button
          onClick={() => { setVisible(false); localStorage.setItem(STORAGE_KEY, 'true'); }}
          className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

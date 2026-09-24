'use client';

import { useState } from 'react';
import { FileText, Tag } from 'lucide-react';
import { PriceCatalogManager } from './PriceCatalogManager';

export function QuotesTabs({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<'cotizaciones' | 'precios'>('cotizaciones');

  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
      active
        ? 'bg-sky-600 text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
    }`;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-1 flex items-center gap-1 w-fit">
        <button onClick={() => setTab('cotizaciones')} className={tabCls(tab === 'cotizaciones')}>
          <FileText className="w-3.5 h-3.5" /> Cotizaciones
        </button>
        <button onClick={() => setTab('precios')} className={tabCls(tab === 'precios')}>
          <Tag className="w-3.5 h-3.5" /> Lista de Precios
        </button>
      </div>

      {tab === 'cotizaciones' ? <div className="space-y-8">{children}</div> : <PriceCatalogManager />}
    </div>
  );
}

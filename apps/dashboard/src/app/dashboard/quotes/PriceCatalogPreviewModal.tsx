'use client';

import { X, Check, Loader2 } from 'lucide-react';
import { CatalogItem } from './PriceCatalogManager';

const clp = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

interface PriceCatalogPreviewModalProps {
  preview: CatalogItem[];
  uploading: boolean;
  replaceOnUpload: boolean;
  setReplaceOnUpload: (val: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function PriceCatalogPreviewModal({
  preview,
  uploading,
  replaceOnUpload,
  setReplaceOnUpload,
  onClose,
  onConfirm,
}: PriceCatalogPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !uploading && onClose()} />
      <div className="relative w-full max-w-4xl glass-panel shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Previsualización de carga · {preview.length} ítems ficticios
          </h3>
          <button onClick={() => !uploading && onClose()} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase">
                <th className="text-left p-2">Descripción</th>
                <th className="text-center p-2">Largo (m)</th>
                <th className="text-center p-2">Ancho (m)</th>
                <th className="text-left p-2">OPS / Instalación</th>
                <th className="text-left p-2">Tiempo Inst.</th>
                <th className="text-right p-2">Precio Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
              {preview.slice(0, 100).map((r, i) => (
                <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 text-center">{r.largo_metros ?? '-'}</td>
                  <td className="p-2 text-center">{r.ancho_metros ?? '-'}</td>
                  <td className="p-2">{r.tipo_instalacion ?? '-'}</td>
                  <td className="p-2">{r.tiempo_instalacion ?? '-'}</td>
                  <td className="p-2 text-right font-semibold">{clp(r.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 100 && <p className="text-[11px] text-slate-400 mt-2 text-center">… y {preview.length - 100} más</p>}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={replaceOnUpload}
              onChange={(e) => setReplaceOnUpload(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded"
            />
            Reemplazar el catálogo ficticio de esta demo
          </label>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl">
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 active:scale-95 transition-all"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Cargar {preview.length} ítems
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

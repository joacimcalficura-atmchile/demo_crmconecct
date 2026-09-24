'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Send, FileText, AlertCircle } from 'lucide-react';

export function SendQuoteModal({
  quote,
  open,
  onClose,
  onConfirm
}: {
  quote: any;
  open: boolean;
  onClose: () => void;
  onConfirm: (correctionType: 'normal' | 'minor' | 'major') => Promise<void>;
}) {
  const [correctionType, setCorrectionType] = useState<'normal' | 'minor' | 'major'>('normal');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si el envío falla, el modal SE QUEDA ABIERTO con el motivo. Antes se cerraba
  // igual (onConfirm no propagaba el error) y la cotización quedaba en Borrador
  // sin que nadie se enterara de que el cliente nunca la recibió.
  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm(correctionType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la cotización.');
    } finally {
      setLoading(false);
    }
  };

  // Mismo motivo que en QuoteEditorModal: dentro de createPortal,
  // <AnimatePresence> no desmontaba el modal al cerrarlo y quedaba pegado en
  // pantalla. Se desmonta con `open` y se anima por CSS.
  if (!mounted || !open) return null;

  return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !loading && onClose()}
          />
          <div
            className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white border border-slate-200 dark:border-white/10 dark:[background:linear-gradient(145deg,#0f172a,#1e293b)] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500" />
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-black/[0.03] dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">Enviar Cotización</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Revisión final antes de enviar</p>
                </div>
              </div>
              <button onClick={() => !loading && onClose()} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col gap-5">

              <div className="bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex items-start gap-4">
                <FileText className="w-8 h-8 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-900 dark:text-white font-bold mb-1">Cotización Oficial Generada</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Revisa el documento final en PDF antes de que se envíe al cliente.</p>
                  {quote.pdf_url ? (
                    <a href={quote.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline">
                      📎 Abrir previsualización del PDF
                    </a>
                  ) : (
                    <p className="text-xs text-rose-500 dark:text-rose-400">PDF no disponible.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mensaje que recibirá el cliente</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${correctionType === 'normal' ? 'bg-sky-500/10 border-sky-500/30' : 'bg-transparent border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <input type="radio" name="ctype" checked={correctionType === 'normal'} onChange={() => setCorrectionType('normal')} className="mt-0.5" />
                    <div>
                      <p className={`text-sm font-bold ${correctionType === 'normal' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'}`}>Envío Normal</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">"Hemos revisado y aprobado tu presupuesto..."</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${correctionType === 'minor' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-transparent border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <input type="radio" name="ctype" checked={correctionType === 'minor'} onChange={() => setCorrectionType('minor')} className="mt-0.5" />
                    <div>
                      <p className={`text-sm font-bold ${correctionType === 'minor' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>Corrección Menor / Descuento</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">"Aplicamos un pequeño ajuste a tu favor respecto a la versión anterior..."</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${correctionType === 'major' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-transparent border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <input type="radio" name="ctype" checked={correctionType === 'major'} onChange={() => setCorrectionType('major')} className="mt-0.5" />
                    <div>
                      <p className={`text-sm font-bold ${correctionType === 'major' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>Corrección Mayor (Disculpas)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">"Te pedimos las disculpas correspondientes por el error... aquí tienes el corregido."</p>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 flex items-center justify-end gap-3">
              <button onClick={() => onClose()} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-900/20 hover:bg-sky-500 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirmar y Enviar
              </button>
            </div>
          </div>
        </div>,
    document.body
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Send, Pencil } from 'lucide-react';
import { QuoteEditorModal } from './QuoteEditorModal';
import { SendQuoteModal } from './SendQuoteModal';

export function QuoteStatusActions({ quote }: { quote: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'accepted' | 'rejected' | 'sent' | null>(null);
  const [confirming, setConfirming] = useState<'accepted' | 'rejected' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [error, setError] = useState('');
  const currentStatus = quote.status;
  const quoteId = quote.id;

  // Devuelve el error en vez de tragárselo: antes un fallo del bot solo iba a
  // console.error, el modal de envío se cerraba igual y la cotización se quedaba
  // en Borrador — el dueño creía que la había enviado al cliente.
  const updateStatus = async (status: 'accepted' | 'rejected' | 'sent', correctionType?: 'normal' | 'minor' | 'major') => {
    setLoading(status);
    setError('');
    try {
      const res = await fetch(`/api/proxy/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, correctionType }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error || `No se pudo actualizar la cotización (HTTP ${res.status})`);
      }
      router.refresh();
      // Recarga forzada rápida para asegurar sincronización en tiempo real con el servidor
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar la cotización';
      console.error(err);
      setError(msg);
      setLoading(null);
      throw err;
    }
  };

  if (currentStatus === 'draft') {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowEditModal(true)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-colors text-xs font-bold"
          >
            <Pencil className="w-3.5 h-3.5" />
            Corregir
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 disabled:opacity-50 transition-colors text-xs font-bold"
          >
            {loading === 'sent' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Aprobar y Enviar
          </button>
        </div>
        {error && <p className="mt-1.5 max-w-[220px] text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        <QuoteEditorModal quote={quote} open={showEditModal} onClose={() => setShowEditModal(false)} />
        <SendQuoteModal 
          quote={quote} 
          open={showSendModal} 
          onClose={() => setShowSendModal(false)} 
          onConfirm={(type) => updateStatus('sent', type)} 
        />
      </>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-1.5">
      <button
        onClick={() => { updateStatus('accepted').catch(() => {}); }}
        disabled={loading !== null}
        title="Marcar como aceptada (suma a Finanzas)"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 transition-colors text-xs font-bold"
      >
        {loading === 'accepted' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Aceptar
      </button>
      <button
        onClick={() => { updateStatus('rejected').catch(() => {}); }}
        disabled={loading !== null}
        title="Marcar como rechazada"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 disabled:opacity-50 transition-colors text-xs font-bold"
      >
        {loading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Rechazar
      </button>
      </div>
      {error && <p className="max-w-[220px] text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

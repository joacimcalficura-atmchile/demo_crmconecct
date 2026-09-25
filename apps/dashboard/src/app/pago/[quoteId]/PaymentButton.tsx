'use client';

import { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';

export function PaymentButton({ amountLabel }: { amountLabel: string }) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'paid'>('idle');

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500" />
        <p className="text-lg font-extrabold text-slate-900">¡Pago simulado recibido!</p>
        <p className="text-sm text-slate-500 max-w-xs">
          En un caso real, esto dispara el comprobante automático y confirma tu pedido en el chat de WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setStatus('processing');
        setTimeout(() => setStatus('paid'), 1200);
      }}
      disabled={status === 'processing'}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold py-3.5 px-6 transition-colors shadow-lg"
    >
      {status === 'processing' ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" /> Procesando pago simulado…
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" /> Pagar {amountLabel} (demo)
        </>
      )}
    </button>
  );
}

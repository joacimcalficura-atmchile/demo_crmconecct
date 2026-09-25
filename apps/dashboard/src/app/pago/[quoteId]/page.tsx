import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { demoQuotes } from '@/lib/demo-data';
import { PaymentButton } from './PaymentButton';

export const metadata = { title: 'Pagar cotización · Aceros Temuco (demo)' };

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

export default async function PagoPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const quote = demoQuotes.find((q) => q.id === quoteId);

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">Link de pago no encontrado</h1>
          <p className="text-sm text-slate-500 mt-1">Esta es una demostración: solo existen los links de las cotizaciones de muestra.</p>
        </div>
      </div>
    );
  }

  const items = JSON.parse(quote.items_json) as { description: string; quantity: number; unit_price: number }[];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <span className="text-orange-400 font-extrabold text-sm">AT</span>
          </div>
          <div>
            <p className="font-extrabold text-slate-900 leading-tight">Aceros Temuco</p>
            <p className="text-xs text-slate-500">Pago de servicios · página de demostración</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cotización {quote.id}</p>
            <p className="text-sm text-slate-700 font-semibold mt-1">{quote.subject}</p>
            <p className="text-xs text-slate-500 mt-0.5">{quote.contact_name} · {quote.contact_company}</p>
          </div>

          <div className="px-6 py-4 space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm gap-4">
                <span className="text-slate-600">{it.description} {it.quantity > 1 ? `× ${it.quantity}` : ''}</span>
                <span className="text-slate-900 font-medium shrink-0 tabular-nums">{clp(it.unit_price * it.quantity)}</span>
              </div>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Neto</span><span className="tabular-nums">{clp(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>IVA (19%)</span><span className="tabular-nums">{clp(quote.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Total</span><span className="tabular-nums">{clp(quote.total)}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <PaymentButton amountLabel={clp(quote.total)} />
            <p className="flex items-center gap-1.5 justify-center text-[11px] text-slate-400 mt-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Anticipo de reserva de producción
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5 px-4">
          Página de demostración generada por ATM Agent — no procesa pagos reales ni se conecta a Mercado Pago, Stripe ni ningún medio de pago.
        </p>
      </div>
    </div>
  );
}

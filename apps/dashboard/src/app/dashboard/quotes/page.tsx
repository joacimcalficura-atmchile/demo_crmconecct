import { api } from '@/lib/api';
import { FileText, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ConfigurePDFButton } from './ConfigurePDFButton';
import { ManualQuoteGenerator } from './ManualQuoteGenerator';
import { QuoteStatusActions } from './QuoteStatusActions';
import { QuotesTabs } from './QuotesTabs';

// ============================================================
// ATM CHILE - Quotes History
// Estilo: Glassmorphism, Clean White, Slate Gray y Cobalt Blue.
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bgIcon: string; textIcon: string; borderIcon: string }> = {
  draft: { label: 'Borrador', color: 'bg-black/5 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10', icon: Clock, bgIcon: 'bg-black/5 dark:bg-white/5', textIcon: 'text-slate-600 dark:text-slate-400', borderIcon: 'border-slate-200 dark:border-white/10' },
  sent: { label: 'Enviada', color: 'bg-sky-500/10 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-500/30', icon: FileText, bgIcon: 'bg-sky-500/10', textIcon: 'text-sky-600 dark:text-sky-400', borderIcon: 'border-sky-200 dark:border-sky-500/20' },
  accepted: { label: 'Aceptada', color: 'bg-emerald-500/10 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle, bgIcon: 'bg-emerald-500/10', textIcon: 'text-emerald-600 dark:text-emerald-400', borderIcon: 'border-emerald-200 dark:border-emerald-500/20' },
  rejected: { label: 'Rechazada', color: 'bg-rose-500/10 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30', icon: XCircle, bgIcon: 'bg-rose-500/10', textIcon: 'text-rose-600 dark:text-rose-400', borderIcon: 'border-rose-200 dark:border-rose-500/20' },
};

export default async function QuotesPage() {
  let quotes: Awaited<ReturnType<typeof api.getQuotes>> = [];
  try { quotes = await api.getQuotes(); } catch { /* offline */ }

  const totalRevenue = quotes
    .filter((q) => q.status === 'accepted')
    .reduce((a, q) => a + q.total, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Cotizaciones</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm drop-shadow-sm">Generadas automáticamente por el Sub-Agente de Cotizaciones</p>
        </div>
        <div className="flex items-center gap-3">
          <ManualQuoteGenerator />
          <ConfigurePDFButton />
        </div>
      </div>

      <QuotesTabs>
      {/* Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          const count = quotes.filter((q) => q.status === status).length;
          return (
            <div key={status} className="glass-panel p-5 flex items-center justify-between transition-all hover:bg-black/5 dark:hover:bg-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{config.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{count}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgIcon} border ${config.borderIcon}`}>
                <Icon className={`w-5 h-5 ${config.textIcon}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Alert */}
      {totalRevenue > 0 && (
        <div className="bg-emerald-500/10 dark:bg-emerald-900/30 backdrop-blur-xl rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-5 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-wider">Revenue de cotizaciones aceptadas</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">${totalRevenue.toLocaleString('es-CL')} CLP</p>
            <p className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Cada venta aceptada se registra automáticamente como ingreso en Finanzas.</p>
          </div>
        </div>
      )}

      {/* Quotes Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">Historial de Cotizaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5">
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Cliente</th>
                <th className="text-left p-4 font-semibold">Subtotal</th>
                <th className="text-left p-4 font-semibold">IVA (19%)</th>
                <th className="text-left p-4 font-semibold">Monto Total</th>
                <th className="text-left p-4 font-semibold">Estado</th>
                <th className="text-left p-4 font-semibold">Documento</th>
                <th className="text-left p-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-500 dark:text-slate-400 font-medium">
                    No hay cotizaciones emitidas aún
                  </td>
                </tr>
              ) : quotes.map((quote) => {
                const cfg = STATUS_CONFIG[quote.status];
                const Icon = cfg?.icon ?? Clock;
                return (
                  <tr key={quote.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">{quote.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4">
                      {quote.subject && (
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mb-0.5">{quote.subject}</div>
                      )}
                      <div className="font-semibold text-slate-900 dark:text-white">{quote.contact_name || 'Sin nombre'}</div>
                      {quote.contact_company && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{quote.contact_company}</div>
                      )}
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{quote.phone}</div>
                      {quote.contact_email && (
                        <div className="text-xs text-sky-600 dark:text-sky-400">{quote.contact_email}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">${quote.subtotal.toLocaleString('es-CL')}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">${quote.tax.toLocaleString('es-CL')}</td>
                    <td className="p-4 text-slate-900 dark:text-white font-extrabold">${quote.total.toLocaleString('es-CL')}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 w-fit text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg?.color ?? ''}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg?.label ?? quote.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {quote.pdf_url ? (
                        <a 
                          href={quote.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          📎 Ver PDF
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {quote.status === 'sent' || quote.status === 'draft' ? (
                        <QuoteStatusActions quote={quote} />
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </QuotesTabs>
    </div>
  );
}

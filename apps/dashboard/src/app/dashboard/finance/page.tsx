import Link from 'next/link';
import { api } from '@/lib/api';
import { Receipt, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import AgentChat from '@/components/AgentChat';
import { ExportExcelButton } from './ExportExcelButton';

// ============================================================
// ATM CHILE - Finance Workspace (Vision AI Docs)
// Estilo: Glassmorphism, Clean White, Slate Gray y Cobalt Blue.
// ============================================================

export const revalidate = 0; // force dynamic

export default async function FinancePage() {
  let documents: Awaited<ReturnType<typeof api.getFinanceDocuments>> = [];
  let metrics: Awaited<ReturnType<typeof api.getFinanceMetrics>> = { totalDocs: 0, totalMonto: 0, byType: [] };

  let fetchError = null;
  try {
    [documents, metrics] = await Promise.all([
      api.getFinanceDocuments(),
      api.getFinanceMetrics(),
    ]);
  } catch (err: any) {
    fetchError = err.message || 'Unknown error';
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Finanzas &amp; Flujo de Caja</h1>
        <p className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm drop-shadow-sm">Gestiona gastos y revisa reportes financieros</p>
      </div>

      {/* Sub-nav (scrollable en móvil, nunca se parte) */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-none">
        <span className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white border-b-2 border-sky-500 dark:border-sky-400 whitespace-nowrap shrink-0">
          Documentos
        </span>
        <Link
          href="/dashboard/finance/finanzas"
          className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0"
        >
          Flujo de Caja
        </Link>
        <Link
          href="/dashboard/finance/costos"
          className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0"
        >
          Costos
        </Link>
      </div>

      {fetchError && (
        <div className="bg-rose-900/40 border border-rose-500/30 backdrop-blur-xl text-rose-300 px-4 py-3 rounded-2xl">
          <strong className="font-bold">Error de conexión con el Bot VPS: </strong>
          <span className="block sm:inline">{fetchError}</span>
        </div>
      )}

      <div className="space-y-5">
          {/* Metrics Summary — compactas, 2 en fila también en móvil */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="glass-panel p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <Receipt className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Documentos</p>
                <p className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">{metrics.totalDocs}</p>
              </div>
            </div>
            <div className="glass-panel p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Gasto registrado</p>
                <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-none tabular-nums truncate">
                  ${metrics.totalMonto.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </div>

          {/* Processed Documents Table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Flujo de Documentos</h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg whitespace-nowrap">Últimos movimientos</span>
                <ExportExcelButton
                  data={documents.map(d => ({
                    Tipo: d.tipo_documento,
                    Proveedor: d.proveedor,
                    Monto: d.total_amount || d.monto_total || 0,
                    Estado: d.status || 'procesado'
                  }))} 
                  filename="Documentos_Financieros" 
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 sticky top-0 backdrop-blur-md">
                    <th className="text-left p-4 font-semibold">Tipo</th>
                    <th className="text-left p-4 font-semibold">Proveedor</th>
                    <th className="text-left p-4 font-semibold">Monto Total</th>
                    <th className="text-left p-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-slate-500 font-medium">
                        Sube un documento en el chat para procesarlo
                      </td>
                    </tr>
                  ) : documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {doc.tipo_documento || 'Documento'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-900 dark:text-white font-bold max-w-[120px] truncate" title={doc.proveedor || undefined}>
                        {doc.proveedor || 'Desconocido'}
                      </td>
                      <td className="p-4 text-slate-900 dark:text-white font-extrabold">
                        ${(doc.total_amount || doc.monto_total || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {doc.status === 'confirmed' || doc.confianza_extraccion >= 0.8 ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold text-emerald-400">Confirmado</span></>
                          ) : (
                            <><AlertCircle className="w-4 h-4 text-amber-400" /><span className="text-xs font-bold text-amber-400">Revisión req.</span></>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}

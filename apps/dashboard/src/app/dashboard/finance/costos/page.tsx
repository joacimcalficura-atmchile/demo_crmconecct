import Link from 'next/link';
import { api } from '@/lib/api';
import { CostosIndustrialDashboard } from './CostosIndustrialDashboard';
import { ExportExcelButton } from '../ExportExcelButton';

export const revalidate = 0;

export default async function CostosPage() {
  let cashFlow: Awaited<ReturnType<typeof api.getCashFlow>> = [];
  let breakdown: Awaited<ReturnType<typeof api.getCostBreakdown>> = { total_expenses: 0, by_type: {}, by_center: {} };

  try {
    [cashFlow, breakdown] = await Promise.all([
      api.getCashFlow(),
      api.getCostBreakdown(),
    ]);
  } catch { /* offline */ }

  // Build export data from breakdown
  const exportData = [
    { Clasificación: 'TOTAL GASTOS', Monto: breakdown.total_expenses },
    ...Object.entries(breakdown.by_type).map(([k, v]) => ({ Clasificación: `Tipo: ${k}`, Monto: v })),
    ...Object.entries(breakdown.by_center).map(([k, v]) => ({ Clasificación: `Centro: ${k}`, Monto: v })),
  ];

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1 drop-shadow-md">Análisis de Costos</h1>
        <p className="text-slate-300 font-medium text-xs sm:text-sm drop-shadow-sm">
          Panel de Ingeniería Industrial — Proveedores, productos y rentabilidad operacional
        </p>
      </div>

      {/* Sub-nav (tabs scrollables; el botón Excel baja a su propia fila en móvil) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/10">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          <Link href="/dashboard/finance" className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0">
            Documentos
          </Link>
          <Link href="/dashboard/finance/finanzas" className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0">
            Flujo de Caja
          </Link>
          <span className="px-4 py-2 text-sm font-semibold text-white border-b-2 border-sky-400 whitespace-nowrap shrink-0">
            Costos
          </span>
        </div>
        <div className="shrink-0 pb-3 sm:pb-0">
          <ExportExcelButton data={exportData} filename="Analisis_Costos" />
        </div>
      </div>

      <CostosIndustrialDashboard cashFlow={cashFlow} breakdown={breakdown} />
    </div>
  );
}

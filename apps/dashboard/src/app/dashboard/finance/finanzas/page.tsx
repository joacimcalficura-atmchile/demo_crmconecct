import Link from 'next/link';
import { api } from '@/lib/api';
import { CashFlowClientView } from './CashFlowClientView';

export const revalidate = 0; // force dynamic

export default async function FinanzasPage() {
  let cashFlow: Awaited<ReturnType<typeof api.getCashFlow>> = [];
  try {
    cashFlow = await api.getCashFlow();
  } catch (err) {
    console.error('Error fetching cash flow:', err);
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1 drop-shadow-md">Flujo de Caja</h1>
        <p className="text-slate-300 font-medium text-xs sm:text-sm drop-shadow-sm">Monitorea los ingresos y egresos de tu empresa procesados automáticamente.</p>
      </div>

      {/* Sub-nav (scrollable en móvil, nunca se parte) */}
      <div className="flex gap-1 border-b border-white/10 overflow-x-auto scrollbar-none">
        <Link
          href="/dashboard/finance"
          className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0"
        >
          Documentos
        </Link>
        <span className="px-4 py-2 text-sm font-semibold text-white border-b-2 border-sky-400 whitespace-nowrap shrink-0">
          Flujo de Caja
        </span>
        <Link
          href="/dashboard/finance/costos"
          className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0"
        >
          Costos
        </Link>
      </div>

      {/* Main Real-Time View */}
      <CashFlowClientView initialCashFlow={cashFlow} />
    </div>
  );
}

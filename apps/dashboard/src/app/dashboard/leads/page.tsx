import { api } from '@/lib/api';
import { KanbanBoard } from './KanbanBoard';

// ============================================================
// ATM CHILE - Leads / CRM
// Estilo: Glassmorphism, Clean White, Slate Gray y Cobalt Blue.
// Las métricas y el refresco en vivo viven ahora en KanbanBoard (client),
// para que se actualicen con la calificación del agente sin recargar.
// ============================================================

export default async function LeadsPage() {
  let leads: Awaited<ReturnType<typeof api.getLeads>> = [];
  try { leads = await api.getLeads(); } catch { /* offline */ }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header compacto */}
      <div className="px-1 mb-3 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-md">Leads / CRM</h1>
        <p className="hidden sm:block text-slate-600 dark:text-slate-300 font-medium text-xs drop-shadow-sm">Funnel de ventas automatizado gestionado por el Sub-Agente Lead Qualifier</p>
      </div>

      {/* Métricas compactas + tablero (client, con refresco en vivo) */}
      <KanbanBoard initialLeads={leads} />
    </div>
  );
}

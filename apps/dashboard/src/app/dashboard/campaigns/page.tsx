import { api } from '@/lib/api';
import { Megaphone, Clock, Loader2, CheckCircle, XCircle, PauseCircle } from 'lucide-react';
import { CreateCampaignForm } from './CreateCampaignForm';
import { StopCampaignButton } from './StopCampaignButton';

// ============================================================
// ATM CHILE - Campañas de Promoción
// Estilo: Glassmorphism, Clean White, Slate Gray y Cobalt Blue.
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-black/5 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10', icon: Clock },
  sending: { label: 'Enviando', color: 'bg-sky-500/10 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-500/30', icon: Loader2 },
  sent: { label: 'Enviada', color: 'bg-emerald-500/10 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle },
  failed: { label: 'Falló', color: 'bg-rose-500/10 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30', icon: XCircle },
  paused: { label: 'Detenida', color: 'bg-amber-500/10 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', icon: PauseCircle },
};

export default async function CampaignsPage() {
  let campaigns: Awaited<ReturnType<typeof api.getCampaigns>> = [];
  try { campaigns = await api.getCampaigns(); } catch { /* offline */ }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Campañas</h1>
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm drop-shadow-sm">Campañas de muestra para segmentos ficticios. En el modo demo no se envían mensajes.</p>
      </div>

      <CreateCampaignForm />

      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">Historial de Campañas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5">
                <th className="text-left p-4 font-semibold">Nombre</th>
                <th className="text-left p-4 font-semibold">Segmento</th>
                <th className="text-left p-4 font-semibold">Estado</th>
                <th className="text-left p-4 font-semibold">Creada</th>
                <th className="text-left p-4 font-semibold">Enviada</th>
                <th className="text-left p-4 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500 dark:text-slate-400 font-medium">
                    <Megaphone className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                    No hay campañas creadas aún
                  </td>
                </tr>
              ) : campaigns.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                const Icon = cfg?.icon ?? Clock;
                return (
                  <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-900 dark:text-white font-semibold">{c.name}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs font-mono">{JSON.stringify(c.segment_filter)}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 w-fit text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg?.color ?? ''}`}>
                        <Icon className={`w-3.5 h-3.5 ${c.status === 'sending' ? 'animate-spin' : ''}`} />
                        {cfg?.label ?? c.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">{new Date(c.created_at).toLocaleString('es-CL')}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">{c.sent_at ? new Date(c.sent_at).toLocaleString('es-CL') : '—'}</td>
                    <td className="p-4">
                      {(c.status === 'sending' || c.status === 'draft') ? (
                        <StopCampaignButton campaignId={c.id} />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

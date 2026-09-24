'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';

const STAGE_OPTIONS = [
  { value: 'qualified', label: 'Calificados' },
  { value: 'proposal', label: 'Con propuesta enviada' },
  { value: 'closed_won', label: 'Clientes (cerrados/ganados)' },
];

export function CreateCampaignForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [stage, setStage] = useState('closed_won');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateAndSend = async () => {
    if (!name || !message) {
      setError('Completa el nombre y el mensaje de la campaña.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const createRes = await fetch('/api/proxy/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          message_template: message,
          segment_filter: { stage },
        }),
      });
      if (!createRes.ok) throw new Error('No se pudo crear la campaña');
      const campaign = await createRes.json();

      const sendRes = await fetch(`/api/proxy/campaigns/${campaign.id}/send`, { method: 'POST' });
      if (!sendRes.ok) throw new Error('No se pudo iniciar el envío');

      setSuccess('Campaña simulada. No se contactó a nadie; el historial se reinicia al recargar la demo.');
      setName('');
      setMessage('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-bold text-slate-900 dark:text-white">Nueva Campaña</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Previsualiza una campaña sobre leads ficticios; el envío es solo una simulación.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la campaña</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Seguimiento de cotizaciones de plegado"
            className="w-full p-2.5 bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Segmento</label>
          <select
            value={stage} onChange={(e) => setStage(e.target.value)}
            className="w-full p-2.5 bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mensaje</label>
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          rows={3}
            placeholder="Hola {{name}}, ¿te ayudamos a completar tu cotización de oxicorte?"
          className="w-full p-2.5 bg-white/70 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Usa <code className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-1 rounded text-slate-700 dark:text-slate-300">{'{{name}}'}</code> para personalizar con el nombre del lead.</p>
      </div>

      {error && <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl">{error}</div>}
      {success && <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold rounded-xl">{success}</div>}

      <button
        onClick={handleCreateAndSend}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-sky-500 disabled:opacity-50 transition-all active:scale-95"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Crear y Enviar
      </button>
    </div>
  );
}

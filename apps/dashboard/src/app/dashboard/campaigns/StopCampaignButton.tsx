'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, StopCircle } from 'lucide-react';

// Botón para DETENER una campaña en curso. Antes no existía: una vez lanzada,
// el bot no releía el estado y solo un reinicio del proceso la frenaba. Ahora
// deja la campaña en 'paused' y el loop del bot lo respeta en la próxima vuelta.
export function StopCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStop = async () => {
    if (!confirm('¿Detener esta campaña? No se enviarán más mensajes.')) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/campaigns/${campaignId}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('No se pudo detener');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleStop}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-rose-500 disabled:opacity-50 transition-all active:scale-95"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
        Detener
      </button>
      {error && <span className="text-[11px] text-rose-500 font-semibold">{error}</span>}
    </div>
  );
}

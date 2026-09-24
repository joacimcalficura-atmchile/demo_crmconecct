'use client';

import { useState } from 'react';
import { Activity, Cpu, Mic, PhoneOff, ShieldCheck } from 'lucide-react';

export default function Agent3D({ agentConfig }: { agentConfig?: any }) {
  const [active, setActive] = useState(false);
  const agentName = agentConfig?.agent_id || 'Asistente de ventas';

  return (
    <section className="w-full rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0f] overflow-hidden relative shadow-2xl mb-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Agente de voz · Demo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{agentName} · interacción simulada</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md">
          <ShieldCheck className="w-3 h-3" /> Sin conexión externa
        </div>
      </div>
      <div className="relative z-10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <Activity className="w-4 h-4 mt-0.5 text-sky-500" />
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Prueba cómo el asistente recopila servicio, material, espesor, medidas y cantidad antes de dejar una solicitud de cotización para revisión del equipo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActive((value) => !value)}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${active ? 'bg-rose-600 hover:bg-rose-500' : 'bg-sky-600 hover:bg-sky-500'}`}
        >
          {active ? <PhoneOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {active ? 'Cerrar muestra' : 'Probar muestra'}
        </button>
      </div>
      {active && (
        <div className="relative z-10 mx-6 mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="font-semibold">Asistente (demo)</p>
          <p className="mt-1">“Hola, ¿qué servicio de acero necesitas cotizar y qué espesor tiene el material?”</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">El micrófono y las llamadas están desactivados. Este ejemplo no graba ni transmite audio.</p>
        </div>
      )}
    </section>
  );
}

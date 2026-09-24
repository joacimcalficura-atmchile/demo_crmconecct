'use client';

import { use, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import {
  cajaChannel, cartTotals, clp, emptyCajaState, type CajaState,
} from '@/lib/caja';

export default function CustomerDisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [state, setState] = useState<CajaState>(emptyCajaState());
  const [connected, setConnected] = useState(false);
  const lastTs = useRef(0);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const ch = supabase
      .channel(cajaChannel(code), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        const p = payload as CajaState;
        if (!p || p.updatedAt < lastTs.current) return; // descarta mensajes viejos
        lastTs.current = p.updatedAt;
        setState(p);
      })
      .subscribe((st) => {
        if (st === 'SUBSCRIBED') {
          setConnected(true);
          // Pide al cajero que reenvíe el estado actual al entrar
          ch.send({ type: 'broadcast', event: 'hello', payload: { at: Date.now() } });
        }
      });
    return () => { supabase.removeChannel(ch); };
  }, [code]);

  const totals = cartTotals(state.items);
  const brand = state.business || 'Bienvenido';
  const hasItems = state.items.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white flex flex-col">
      {/* Header / branding */}
      <header className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur">
            <ShoppingBag className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight">{brand}</p>
            <p className="text-xs text-white/50 font-mono tracking-widest uppercase">Caja {code}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${connected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
          {connected ? '● En línea' : '○ Conectando…'}
        </span>
      </header>

      {/* Cuerpo */}
      <main className="flex-1 px-8 pb-8 grid lg:grid-cols-5 gap-6">
        {/* Lista de compra */}
        <section className="lg:col-span-3 flex flex-col">
          <AnimatePresence mode="wait">
            {!hasItems ? (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-20">
                <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-20 h-20 rounded-3xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-sky-300" />
                </motion.div>
                <h1 className="text-4xl font-extrabold tracking-tight">¡Te damos la bienvenida!</h1>
                <p className="text-white/50 max-w-md">
                  En un momento el equipo comenzará a registrar tu compra. Aquí verás cada producto en tiempo real.
                </p>
                <div className="flex items-center gap-2 text-white/40 text-sm mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Esperando a la caja…
                </div>
              </motion.div>
            ) : (
              <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-2">
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-3">Tu compra</p>
                <AnimatePresence initial={false}>
                  {state.items.map((i) => (
                    <motion.div key={i.id} layout
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center font-extrabold text-sky-300">
                        {i.qty}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold truncate">{i.name}</p>
                        <p className="text-sm text-white/40">{clp(i.unit_price)} c/u</p>
                      </div>
                      <p className="text-xl font-extrabold tabular-nums">{clp(i.unit_price * i.qty)}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Panel total */}
        <aside className="lg:col-span-2">
          <div className="sticky top-8 bg-white/5 border border-white/10 rounded-3xl p-7 backdrop-blur-xl">
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Total a pagar</p>
            <motion.p key={totals.total} initial={{ scale: 0.96 }} animate={{ scale: 1 }}
              className="text-6xl font-black tracking-tight mt-2 tabular-nums">{clp(totals.total)}</motion.p>
            <div className="mt-6 space-y-2 text-white/60">
              <div className="flex justify-between text-sm"><span>Neto</span><span className="tabular-nums">{clp(totals.net)}</span></div>
              <div className="flex justify-between text-sm"><span>IVA (19%)</span><span className="tabular-nums">{clp(totals.tax)}</span></div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-2"><span>Productos</span><span className="tabular-nums">{totals.count}</span></div>
            </div>
          </div>
        </aside>
      </main>

      {/* Overlay de agradecimiento al pagar */}
      <AnimatePresence>
        {state.status === 'paid' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-emerald-600/95 backdrop-blur-xl text-center px-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle2 className="w-28 h-28" />
            </motion.div>
            <h1 className="text-5xl font-black tracking-tight">¡Gracias por tu compra!</h1>
            <p className="text-white/80 text-lg">Tu pago fue registrado con éxito. ¡Te esperamos pronto! 💚</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

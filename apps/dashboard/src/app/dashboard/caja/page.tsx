'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Search, Plus, Minus, Trash2, Monitor, ExternalLink, Loader2, ShoppingCart,
  CheckCircle2, Wifi, WifiOff, Store,
} from 'lucide-react';
import { getBrowserSupabase, isCajaRealtimeConfigured } from '@/lib/supabase-browser';
import {
  cajaChannel, cartTotals, clp, makeCajaCode,
  type CajaItem, type CajaStatus,
} from '@/lib/caja';

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  active: boolean;
}

export default function CajaTerminalPage() {
  const [code] = useState(() => makeCajaCode());
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CajaItem[]>([]);
  const [status, setStatus] = useState<CajaStatus>('idle');
  const [business, setBusiness] = useState('Mi Empresa');
  const [connected, setConnected] = useState(false);
  const [charging, setCharging] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef({ items, status, business });
  stateRef.current = { items, status, business };

  const configured = isCajaRealtimeConfigured();
  const customerUrl = typeof window !== 'undefined' ? `${window.location.origin}/caja/${code}` : `/caja/${code}`;

  // Nombre de la empresa persistido localmente (branding pantalla cliente)
  useEffect(() => {
    const saved = localStorage.getItem('caja_business');
    if (saved) setBusiness(saved);
  }, []);
  useEffect(() => { localStorage.setItem('caja_business', business); }, [business]);

  // Cargar catálogo
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/price-catalog', { cache: 'no-store' });
        const d = await res.json();
        setCatalog((d.items || []).filter((i: CatalogItem) => i.active !== false));
      } catch { /* offline */ } finally { setLoadingCat(false); }
    })();
  }, []);

  const broadcast = useCallback(() => {
    const ch = channelRef.current;
    if (!ch) return;
    const { items, status, business } = stateRef.current;
    ch.send({ type: 'broadcast', event: 'state', payload: { items, status, business, updatedAt: Date.now() } });
  }, []);

  // Canal Realtime: emite estado al suscribirse un cliente + heartbeat
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const ch = supabase
      .channel(cajaChannel(code), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'hello' }, () => broadcast())
      .subscribe((st) => setConnected(st === 'SUBSCRIBED'));
    channelRef.current = ch;
    const hb = setInterval(broadcast, 3000);
    return () => { clearInterval(hb); supabase.removeChannel(ch); channelRef.current = null; };
  }, [code, broadcast]);

  // Reemite en cada cambio del carrito
  useEffect(() => { broadcast(); }, [items, status, business, broadcast]);

  const addItem = (c: CatalogItem) => {
    setStatus('active');
    setItems((prev) => {
      const found = prev.find((i) => i.id === c.id);
      if (found) return prev.map((i) => i.id === c.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: c.id, name: c.name, unit: c.unit, unit_price: c.unit_price, qty: 1 }];
    });
  };
  const setQty = (id: string, delta: number) =>
    setItems((prev) => prev
      .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter((i) => i.qty > 0));
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => { setItems([]); setStatus('idle'); };

  const totals = useMemo(() => cartTotals(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog.slice(0, 60);
    return catalog.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)
    ).slice(0, 60);
  }, [catalog, search]);

  const cobrar = async () => {
    if (items.length === 0 || charging) return;
    setCharging(true);
    try {
      const ticketId = `${code}-${Date.now()}`;
      const res = await fetch('/api/caja/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, total: totals.total, itemsCount: totals.count }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo cobrar');
      setStatus('paid');           // dispara pantalla de "gracias" en el cliente
      setTimeout(() => clearCart(), 4500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Caja en Vivo</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
            Lo que digitas aquí se refleja en tiempo real en la pantalla del cliente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border ${connected ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-500/10 text-slate-500 border-slate-200 dark:border-white/10'}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'En vivo' : 'Conectando…'}
          </span>
          <a href={customerUrl} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors">
            <Monitor className="w-4 h-4" /> Abrir pantalla cliente <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {!configured && (
        <div className="p-3 bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl">
          ⚠️ Falta configurar <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para activar la sincronización en vivo. El terminal funciona, pero la pantalla del cliente no recibirá los datos hasta configurarla.
        </div>
      )}

      {/* Código de sesión + branding */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Código de pantalla</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-[0.2em] font-mono">{code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <Store className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Nombre de tu negocio"
            className="w-full p-2 bg-transparent border border-slate-200 dark:border-white/10 focus:border-sky-500 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Catálogo */}
        <div className="lg:col-span-3 glass-panel overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto o categoría…"
                className="w-full p-2 bg-transparent text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
            {loadingCat ? (
              <div className="col-span-full text-center p-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                Sin productos. Carga tu <strong>Lista de Precios</strong> en Cotizaciones → Lista de Precios.
              </div>
            ) : filtered.map((c) => (
              <button key={c.id} onClick={() => addItem(c)}
                className="text-left p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-sky-400 hover:bg-sky-500/5 active:scale-[0.98] transition-all">
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{c.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.category}</p>
                <p className="text-sm font-extrabold text-sky-600 dark:text-sky-400 mt-1">{clp(c.unit_price)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ticket actual</h3>
            <span className="ml-auto text-[10px] font-bold text-slate-500 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full">{totals.count} ítems</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-white/10 max-h-[46vh]">
            {items.length === 0 ? (
              <div className="text-center p-8 text-slate-500 dark:text-slate-400 text-sm">Toca un producto para agregarlo.</div>
            ) : items.map((i) => (
              <div key={i.id} className="p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{i.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{clp(i.unit_price)} · {i.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(i.id, -1)} className="p-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 text-slate-600 dark:text-slate-300"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-7 text-center text-sm font-bold text-slate-900 dark:text-white">{i.qty}</span>
                  <button onClick={() => setQty(i.id, 1)} className="p-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 text-slate-600 dark:text-slate-300"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <p className="w-20 text-right text-sm font-extrabold text-slate-900 dark:text-white">{clp(i.unit_price * i.qty)}</p>
                <button onClick={() => removeItem(i.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>Neto</span><span>{clp(totals.net)}</span></div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>IVA (19%)</span><span>{clp(totals.tax)}</span></div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900 dark:text-white pt-1"><span>Total</span><span>{clp(totals.total)}</span></div>
            <div className="flex gap-2 pt-2">
              <button onClick={clearCart} disabled={items.length === 0}
                className="px-3 py-2.5 text-xs font-bold rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40">Vaciar</button>
              <button onClick={cobrar} disabled={items.length === 0 || charging}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md disabled:opacity-50 active:scale-95 transition-all">
                {charging ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : null}
                {status === 'paid' ? 'Venta registrada' : `Cobrar ${clp(totals.total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

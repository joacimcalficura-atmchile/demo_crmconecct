'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingDown, Award, Package, AlertTriangle, CheckCircle,
  BarChart2, ShoppingCart, Star, Zap, DollarSign,
} from 'lucide-react';
import type { CashFlow, CostBreakdown } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────
interface ProviderMetric {
  name: string;
  totalSpent: number;
  transactionCount: number;
  categories: string[];
  avgPerTransaction: number;
  costType: string;
  rentabilityScore: number; // 0-100, higher = more manageable/predictable
}

interface ProductMetric {
  description: string;
  occurrences: number;
  totalValue: number;
  avgValue: number;
  providers: string[];
}

// ── Helpers ───────────────────────────────────────────────────────
const PIE_COLORS = ['#38bdf8', '#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#fb923c'];

function scoreProvider(p: ProviderMetric): number {
  // IE scoring: predictability + volume + frequency
  const fixedBonus = p.costType === 'fijo' ? 20 : 0;
  const frequencyScore = Math.min(p.transactionCount * 5, 40);
  const volumeScore = Math.min(Math.floor(p.totalSpent / 50000), 30);
  return Math.min(fixedBonus + frequencyScore + volumeScore, 100);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-xl text-sm">
        <p className="font-semibold text-slate-900 dark:text-white">{payload[0].name}</p>
        <p className="text-sky-600 dark:text-sky-400 font-bold">${Number(payload[0].value).toLocaleString('es-CL')}</p>
      </div>
    );
  }
  return null;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-500/30'
    : score >= 40 ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-900/40 border-amber-300 dark:border-amber-500/30'
    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-900/40 border-rose-300 dark:border-rose-500/30';
  const label = score >= 70 ? 'Alta' : score >= 40 ? 'Media' : 'Baja';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {label} · {score}pts
    </span>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export function CostosIndustrialDashboard({
  cashFlow,
  breakdown,
}: {
  cashFlow: CashFlow[];
  breakdown: CostBreakdown;
}) {
  const [activeTab, setActiveTab] = useState<'proveedores' | 'productos' | 'estados'>('proveedores');

  const egresos = useMemo(() => cashFlow.filter(c => c.direction === 'egreso'), [cashFlow]);

  // ── Provider analytics ────────────────────────────────────────
  const providers = useMemo((): ProviderMetric[] => {
    const map = new Map<string, { spends: number[]; cats: Set<string>; costType: string }>();
    egresos.forEach(cf => {
      const key = cf.counterparty || 'Sin proveedor';
      if (!map.has(key)) map.set(key, { spends: [], cats: new Set(), costType: cf.cost_type || 'sin_clasificar' });
      const entry = map.get(key)!;
      entry.spends.push(cf.amount);
      if (cf.category) entry.cats.add(cf.category);
    });

    return Array.from(map.entries()).map(([name, d]) => {
      const totalSpent = d.spends.reduce((a, b) => a + b, 0);
      const avgPerTransaction = totalSpent / d.spends.length;
      const p: ProviderMetric = {
        name,
        totalSpent,
        transactionCount: d.spends.length,
        categories: Array.from(d.cats),
        avgPerTransaction,
        costType: d.costType,
        rentabilityScore: 0,
      };
      p.rentabilityScore = scoreProvider(p);
      return p;
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [egresos]);

  // ── Product analytics (from items_json) ───────────────────────
  const products = useMemo((): ProductMetric[] => {
    const map = new Map<string, { values: number[]; providers: Set<string> }>();
    egresos.forEach(cf => {
      if (!cf.items_json) return;
      cf.items_json.forEach(item => {
        const key = item.description?.trim() || 'Sin descripción';
        if (!map.has(key)) map.set(key, { values: [], providers: new Set() });
        const entry = map.get(key)!;
        entry.values.push(item.total || 0);
        if (cf.counterparty) entry.providers.add(cf.counterparty);
      });
    });

    return Array.from(map.entries()).map(([desc, d]) => ({
      description: desc,
      occurrences: d.values.length,
      totalValue: d.values.reduce((a, b) => a + b, 0),
      avgValue: d.values.reduce((a, b) => a + b, 0) / d.values.length,
      providers: Array.from(d.providers),
    })).sort((a, b) => b.occurrences - a.occurrences).slice(0, 15);
  }, [egresos]);

  // ── Pie chart data ────────────────────────────────────────────
  const byTypeData = Object.entries(breakdown.by_type).map(([k, v]) => ({
    name: k === 'fijo' ? 'Fijo' : k === 'variable' ? 'Variable' : 'Sin Clasificar',
    value: v,
  }));
  const byCenterData = Object.entries(breakdown.by_center).map(([k, v]) => ({
    name: k === 'operacional' ? 'Operacional' : k === 'gastos_generales' ? 'Gastos Grales.' : 'Sin Clasificar',
    value: v,
  }));

  // ── Top 5 by spend ────────────────────────────────────────────
  const top5Providers = providers.slice(0, 5);
  const top5Chart = top5Providers.map(p => ({ name: p.name.slice(0, 20), value: p.totalSpent }));

  const empty = egresos.length === 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Gastos', value: `$${breakdown.total_expenses.toLocaleString('es-CL')}`, color: 'sky' },
          { icon: ShoppingCart, label: 'Proveedores Únicos', value: providers.length, color: 'violet' },
          { icon: Package, label: 'Productos Registrados', value: products.length, color: 'emerald' },
          { icon: TrendingDown, label: 'Costo Promedio/Transacción', value: egresos.length ? `$${Math.round(breakdown.total_expenses / egresos.length).toLocaleString('es-CL')}` : '—', color: 'amber' },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-3.5 sm:p-5 shadow-xl"
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-2 sm:mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
          </motion.div>
        ))}
      </div>

      {empty ? (
        <div className="glass-panel p-12 text-center">
          <BarChart2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Sin datos de egreso</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Sube facturas o documentos en la pestaña Documentos para ver el análisis de costos acá.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top 5 Providers Bar */}
            <div className="lg:col-span-2 glass-panel p-5 shadow-xl">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Top 5 Proveedores por Gasto
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top5Chart} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#38bdf8" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie: Fijo vs Variable */}
            <div className="glass-panel p-5 shadow-xl">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Costos Fijos vs Variables
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byTypeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {byTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabs: Proveedores / Productos / Estados */}
          <div className="glass-panel shadow-xl overflow-hidden">
            {/* Tab header */}
            <div className="flex items-center gap-1 px-5 pt-5 border-b border-slate-200 dark:border-white/10 pb-0">
              {([
                { id: 'proveedores', label: 'Proveedores Rentables', icon: Award },
                { id: 'productos', label: 'Productos más usados', icon: Package },
                { id: 'estados', label: 'Estado Financiero', icon: BarChart2 },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${
                    activeTab === id
                      ? 'text-slate-900 dark:text-white border-sky-400 bg-black/5 dark:bg-white/5'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* ── TAB: Proveedores ── */}
              {activeTab === 'proveedores' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Puntuación de gestión basada en: frecuencia de transacciones, volumen total y predictibilidad del costo (fijo vs variable).
                  </p>
                  <div className="space-y-2">
                    {providers.length === 0 ? (
                      <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Sin proveedores registrados aún.</p>
                    ) : providers.map((p, idx) => (
                      <motion.div
                        key={p.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : idx === 1 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          : idx === 2 ? 'bg-orange-800/20 text-orange-400 border border-orange-700/30'
                          : 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
                            {idx < 3 && <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {p.transactionCount} transacciones · Promedio ${Math.round(p.avgPerTransaction).toLocaleString('es-CL')}
                            {p.categories.length > 0 && ` · ${p.categories.slice(0, 2).join(', ')}`}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">${p.totalSpent.toLocaleString('es-CL')}</span>
                          <ScoreBadge score={p.rentabilityScore} />
                        </div>

                        {/* Bar */}
                        <div className="w-20 shrink-0">
                          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${Math.min((p.totalSpent / (providers[0]?.totalSpent || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: Productos ── */}
              {activeTab === 'productos' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Productos y servicios extraídos de las líneas de factura. Ordenados por frecuencia de aparición.
                  </p>
                  {products.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Sin ítems de factura registrados. Sube documentos con detalle de líneas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                            <th className="text-left py-2 px-3">Producto / Servicio</th>
                            <th className="text-center py-2 px-3">Apariciones</th>
                            <th className="text-right py-2 px-3">Total Acumulado</th>
                            <th className="text-right py-2 px-3">Precio Promedio</th>
                            <th className="text-left py-2 px-3">Proveedores</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                          {products.map((p, idx) => (
                            <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  {p.occurrences >= 3 && <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />}
                                  <span className="text-slate-900 dark:text-white font-medium text-xs">{p.description}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  p.occurrences >= 5 ? 'bg-sky-500/10 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30'
                                  : p.occurrences >= 2 ? 'bg-violet-500/10 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30'
                                  : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                }`}>
                                  ×{p.occurrences}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white text-xs">
                                ${p.totalValue.toLocaleString('es-CL')}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 text-xs">
                                ${Math.round(p.avgValue).toLocaleString('es-CL')}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {p.providers.slice(0, 2).map(pv => (
                                    <span key={pv} className="text-[9px] bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                      {pv.slice(0, 15)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Estado Financiero ── */}
              {activeTab === 'estados' && (
                <div className="space-y-5">
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        label: 'Gastos Fijos',
                        value: `$${(breakdown.by_type['fijo'] || 0).toLocaleString('es-CL')}`,
                        sub: 'Predecibles y recurrentes',
                        icon: CheckCircle,
                        color: 'emerald',
                      },
                      {
                        label: 'Gastos Variables',
                        value: `$${(breakdown.by_type['variable'] || 0).toLocaleString('es-CL')}`,
                        sub: 'Sujetos a fluctuación',
                        icon: AlertTriangle,
                        color: 'amber',
                      },
                      {
                        label: 'Sin Clasificar',
                        value: `$${(breakdown.by_type['sin_clasificar'] || 0).toLocaleString('es-CL')}`,
                        sub: 'Pendientes de clasificación',
                        icon: AlertTriangle,
                        color: 'rose',
                      },
                    ].map(({ label, value, sub, icon: Icon, color }) => (
                      <div key={label} className={`bg-${color}-900/20 border border-${color}-500/20 rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 text-${color}-400`} />
                          <span className={`text-xs font-bold text-${color}-300`}>{label}</span>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Centro de costos chart */}
                  <div className="bg-black/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Distribución por Centro de Costos</h3>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byCenterData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={3}>
                            {byCenterData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

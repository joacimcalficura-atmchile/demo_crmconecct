'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ArrowUpRight, ArrowDownRight, Activity,
  ChevronLeft, ChevronRight, Filter, X, Download, Search,
  Calendar, Tag, Building2, TrendingUp,
} from 'lucide-react';
import { CashFlow } from '@/lib/api';
import { ClassificationEditor } from './ClassificationEditor';
import { ExportExcelButton } from '../ExportExcelButton';
import { CashFlowRowActions } from './CashFlowRowActions';

const PAGE_SIZE = 20;

// ── Animated Counter ───────────────────────────────────────────
function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number;
    const startValue = displayValue;
    const endValue = value;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(startValue + (endValue - startValue) * easeProgress));
      if (progress < 1) window.requestAnimationFrame(step);
      else setDisplayValue(endValue);
    };
    window.requestAnimationFrame(step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span suppressHydrationWarning>{prefix}{displayValue.toLocaleString('es-CL')}</span>;
}

// ── Filter Bar ─────────────────────────────────────────────────
interface Filters {
  search: string;
  direction: '' | 'ingreso' | 'egreso';
  category: string;
  counterparty: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: Filters = {
  search: '',
  direction: '',
  category: '',
  counterparty: '',
  dateFrom: '',
  dateTo: '',
};

// ── Main Component ─────────────────────────────────────────────
export function CashFlowClientView({ initialCashFlow }: { initialCashFlow: CashFlow[] }) {
  const [cashFlow, setCashFlow] = useState<CashFlow[]>(initialCashFlow);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // ── Polling ──────────────────────────────────────────────────
  const fetchCashFlow = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/finance/cash-flow');
      if (res.ok) {
        const data = await res.json() as CashFlow[];
        setCashFlow(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchCashFlow, 4000);
    return () => clearInterval(interval);
  }, [fetchCashFlow]);

  // ── Derived data for filters ──────────────────────────────────
  const categories = useMemo(() => Array.from(new Set(cashFlow.map(c => c.category).filter(Boolean))) as string[], [cashFlow]);
  const counterparties = useMemo(() => Array.from(new Set(cashFlow.map(c => c.counterparty).filter(Boolean))) as string[], [cashFlow]);

  // ── Filter logic ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return cashFlow.filter(cf => {
      const d = new Date(cf.entry_date);
      if (filters.direction && cf.direction !== filters.direction) return false;
      if (filters.category && cf.category !== filters.category) return false;
      if (filters.counterparty && cf.counterparty !== filters.counterparty) return false;
      if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && d > new Date(filters.dateTo + 'T23:59:59')) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const amountStr = cf.amount.toString();
        const taxStr = cf.tax_amount?.toString() ?? '';
        const dateStr = new Date(cf.entry_date).toLocaleDateString('es-CL');
        const directionLabel = cf.direction === 'ingreso' ? 'ingreso' : 'egreso';
        const matched =
          cf.category?.toLowerCase().includes(q) ||
          cf.counterparty?.toLowerCase().includes(q) ||
          cf.folio?.toLowerCase().includes(q) ||
          cf.document_type?.toLowerCase().includes(q) ||
          cf.recorded_by?.toLowerCase().includes(q) ||
          cf.cost_type?.toLowerCase().includes(q) ||
          cf.cost_center?.toLowerCase().includes(q) ||
          amountStr.includes(q) ||
          taxStr.includes(q) ||
          dateStr.includes(q) ||
          directionLabel.includes(q);
        if (!matched) return false;
      }
      return true;
    });
  }, [cashFlow, filters]);

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filters]);

  // ── Metrics (from full dataset) ────────────────────────────────
  const ingresos = cashFlow.filter(c => c.direction === 'ingreso').reduce((a, c) => a + c.amount, 0);
  const egresos = cashFlow.filter(c => c.direction === 'egreso').reduce((a, c) => a + c.amount, 0);
  const balance = ingresos - egresos;

  // ── Active filter count ───────────────────────────────────────
  const activeFilters = Object.values(filters).filter(v => v !== '').length;

  // ── Export filtered data ──────────────────────────────────────
  const exportData = filtered.map(cf => ({
    Fecha: new Date(cf.entry_date).toLocaleDateString('es-CL'),
    Flujo: cf.direction === 'ingreso' ? 'Ingreso' : 'Egreso',
    Doc: cf.document_type || '—',
    Folio: cf.folio || '',
    Categoría: cf.category || '',
    Proveedor: cf.counterparty || '',
    Monto: cf.amount,
    IVA: cf.tax_amount || 0,
    Registrado_Por: cf.recorded_by || 'Sistema',
  }));

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <motion.div layout className="glass-panel p-3 sm:p-5 shadow-xl flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Balance Total</p>
            <p className={`text-lg sm:text-2xl font-extrabold leading-none truncate ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'}`}>
              <AnimatedCounter value={balance} prefix="$" />
            </p>
          </div>
        </motion.div>

        <motion.div layout className="glass-panel p-3 sm:p-5 shadow-xl flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Ingresos</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none truncate">
              <AnimatedCounter value={ingresos} prefix="$" />
            </p>
          </div>
        </motion.div>

        <motion.div layout className="glass-panel p-3 sm:p-5 shadow-xl flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <ArrowDownRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Egresos / Gastos</p>
            <p className="text-lg sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none truncate">
              <AnimatedCounter value={egresos} prefix="$" />
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Main Table ── */}
      <motion.div layout className="glass-panel shadow-xl overflow-hidden">
        {/* Table Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">Últimos Movimientos</h2>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full">
              {filtered.length} registros
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                showFilters || activeFilters > 0
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg'
                  : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
              {activeFilters > 0 && (
                <span className="bg-sky-400 text-sky-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {activeFilters}
                </span>
              )}
            </button>
            {/* Clear filters */}
            {activeFilters > 0 && (
              <button
                onClick={() => setFilters(emptyFilters)}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white bg-rose-500/10 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-500/30 rounded-xl transition-all"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
            <ExportExcelButton data={exportData} filename="Flujo_de_Caja_Filtrado" />
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-200 dark:border-white/10"
            >
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-black/5 dark:bg-white/5">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                {/* Direction */}
                <div className="relative">
                  <TrendingUp className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 z-10" />
                  <select
                    value={filters.direction}
                    onChange={e => setFilters(f => ({ ...f, direction: e.target.value as Filters['direction'] }))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 appearance-none"
                  >
                    <option value="">Flujo</option>
                    <option value="ingreso">Ingresos</option>
                    <option value="egreso">Egresos</option>
                  </select>
                </div>
                {/* Category */}
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 z-10" />
                  <select
                    value={filters.category}
                    onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 appearance-none"
                  >
                    <option value="">Categoría</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Provider */}
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 z-10" />
                  <select
                    value={filters.counterparty}
                    onChange={e => setFilters(f => ({ ...f, counterparty: e.target.value }))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 appearance-none"
                  >
                    <option value="">Proveedor</option>
                    {counterparties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Date From */}
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 z-10" />
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                {/* Date To */}
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 z-10" />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full min-w-[640px] text-sm relative">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5">
                <th className="text-left p-4 font-semibold">Fecha</th>
                <th className="text-left p-4 font-semibold">Flujo</th>
                <th className="text-left p-4 font-semibold">Doc.</th>
                <th className="text-left p-4 font-semibold">Folio</th>
                <th className="text-left p-4 font-semibold">Categoría</th>
                <th className="text-left p-4 font-semibold">Proveedor / Cliente</th>
                <th className="text-left p-4 font-semibold">Clasificación</th>
                <th className="text-right p-4 font-semibold">IVA</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="text-right p-4 font-semibold">Registrado Por</th>
                <th className="text-center p-4 font-semibold w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300 relative">
              <AnimatePresence mode="popLayout">
                {paginated.length === 0 ? (
                  <motion.tr key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={11} className="text-center p-12 text-slate-400 dark:text-slate-500 font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <Activity className="w-8 h-8 opacity-30" />
                        <p>
                          {activeFilters > 0
                            ? 'No hay resultados con los filtros aplicados.'
                            : 'No hay movimientos registrados aún.'}
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  paginated.map((cf) => (
                    <motion.tr
                      key={cf.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="hover:bg-black/5 dark:hover:bg-white/5 group transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" suppressHydrationWarning>
                        {new Date(cf.entry_date).toLocaleDateString('es-CL')}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                          cf.direction === 'ingreso'
                            ? 'bg-emerald-500/10 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-rose-500/10 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                        }`}>
                          {cf.direction === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {cf.document_type || '—'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs font-semibold">
                        {cf.folio ? (
                          <span className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            Nº {cf.folio}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{cf.category ?? '—'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={cf.counterparty ?? undefined}>
                        {cf.counterparty ?? 'Sin proveedor'}
                      </td>
                      <td className="p-4">
                        {cf.direction === 'egreso'
                          ? <ClassificationEditor entry={cf} />
                          : <span className="text-xs text-slate-400 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs" suppressHydrationWarning>
                        {cf.tax_amount ? `$${cf.tax_amount.toLocaleString('es-CL')}` : '—'}
                      </td>
                      <td className={`p-4 text-right font-bold whitespace-nowrap ${cf.direction === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`} suppressHydrationWarning>
                        {cf.direction === 'ingreso' ? '+' : '-'}${cf.amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-4 text-right text-[11px] text-slate-400 dark:text-slate-500 font-mono max-w-[100px] truncate">
                        {cf.recorded_by ?? 'Sistema'}
                      </td>
                      <td className="p-4 text-center">
                        <CashFlowRowActions entry={cf} onUpdate={fetchCashFlow} />
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-4 bg-black/5 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Página <span className="text-slate-900 dark:text-white font-bold">{page}</span> de{' '}
              <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span>{' '}
              · <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      p === page
                        ? 'bg-sky-600 text-white shadow-lg'
                        : 'bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

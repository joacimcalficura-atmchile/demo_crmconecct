'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Lead } from '@/lib/api';
type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { Bot, Phone, Clock, AlertCircle, Users, Star, TrendingUp, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { isUnresolvedLid, formatPhone } from '@/lib/phone-identity';

const STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'];
const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  closed_won: 'Ganado',
  closed_lost: 'Perdido',
};

// UI Config
const STAGE_COLORS: Record<LeadStage, { bg: string, border: string, text: string }> = {
  new: { bg: 'bg-black/5 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-500/30', text: 'text-slate-700 dark:text-slate-300' },
  contacted: { bg: 'bg-blue-500/10 dark:bg-blue-900/40', border: 'border-blue-200 dark:border-blue-400/30', text: 'text-blue-800 dark:text-blue-300' },
  qualified: { bg: 'bg-indigo-500/10 dark:bg-indigo-900/40', border: 'border-indigo-200 dark:border-indigo-400/30', text: 'text-indigo-800 dark:text-indigo-300' },
  proposal: { bg: 'bg-amber-500/10 dark:bg-amber-900/40', border: 'border-amber-200 dark:border-amber-400/30', text: 'text-amber-800 dark:text-amber-300' },
  closed_won: { bg: 'bg-emerald-500/10 dark:bg-emerald-900/40', border: 'border-emerald-200 dark:border-emerald-400/30', text: 'text-emerald-800 dark:text-emerald-300' },
  closed_lost: { bg: 'bg-rose-500/10 dark:bg-rose-900/40', border: 'border-rose-200 dark:border-rose-400/30', text: 'text-rose-800 dark:text-rose-300' },
};

// isUnresolvedLid y formatPhone viven en @/lib/phone-identity — fuente única
// del dashboard (invariantes #3 y #4). Estaban duplicados acá y en
// ConversationsClient, y las copias ya habían divergido.

function LeadCard({ lead, isOverlay }: { lead: Lead, isOverlay?: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const scoreColor = lead.score >= 70 ? 'bg-emerald-500' : lead.score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const lidUnresolved = isUnresolvedLid(lead.phone);
  const displayName = lead.name || (lidUnresolved ? 'Contacto sin nombre' : formatPhone(lead.phone));

  const openChat = () => router.push(`/dashboard/conversations?phone=${encodeURIComponent(lead.phone)}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={openChat}
      className={`relative bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border p-3.5 shadow-lg cursor-grab active:cursor-grabbing transition-all text-slate-900 dark:text-white ${
        isDragging && !isOverlay ? 'opacity-30' : 'opacity-100'
      } ${isOverlay ? 'shadow-2xl rotate-2 ring-2 ring-blue-400/50' : 'border-slate-200 dark:border-white/10 hover:border-sky-500/40 hover:shadow-sky-900/20'}`}
    >
      {/* Bot indicator if touched by AI */}
      <div className="absolute top-3 right-3 text-slate-400 dark:text-slate-500" title="Gestionado por el agente IA">
        <Bot className="w-4 h-4" />
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 pr-6 truncate">{displayName}</h3>

      {lidUnresolved ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-400/30 mb-3">
          <AlertTriangle className="w-3 h-3" /> Número sin verificar
        </span>
      ) : (
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1 truncate">
          <Phone className="w-3 h-3 shrink-0" /> {formatPhone(lead.phone)}
        </p>
      )}

      {lead.need && (
        <p className="text-xs text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/5 mb-3 line-clamp-2">
          {lead.need}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</span>
          <span className={`w-2 h-2 rounded-full ${scoreColor}`}></span>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">{lead.score}</span>
        </div>

        {lead.urgency === 'high' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
        {lead.urgency === 'medium' && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
      </div>

      {/* Link explícito al chat — un tap directo (no interfiere con el drag porque
          detiene el pointer). En móvil el doble clic no es práctico. */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); openChat(); }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 text-xs font-bold border border-sky-500/20 transition-colors active:scale-[0.98]"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Abrir chat
      </button>
    </div>
  );
}

function KanbanColumn({ stage, leads }: { stage: LeadStage, leads: Lead[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
    data: { stage }
  });

  const colors = STAGE_COLORS[stage];

  return (
    <div className="flex flex-col flex-shrink-0 w-[85vw] max-w-[300px] sm:w-72 h-full">
      {/* Column Header */}
      <div className={`sticky top-0 z-10 mb-3 p-3 rounded-xl border ${colors.bg} ${colors.border} backdrop-blur-xl flex items-center justify-between shadow-md`}>
        <h2 className={`font-bold text-sm ${colors.text} uppercase tracking-wider`}>
          {STAGE_LABELS[stage]}
        </h2>
        <span className="bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
          {leads.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-2 min-h-[200px] transition-all flex flex-col gap-3 ${
          isOver ? 'bg-sky-500/10 dark:bg-sky-900/30 ring-2 ring-sky-400/50 ring-inset' : 'bg-black/5 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5'
        }`}
      >
        <AnimatePresence>
          {leads.map((lead) => (
            <motion.div
              key={lead.id}
              layoutId={lead.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <LeadCard lead={lead} />
            </motion.div>
          ))}
          {leads.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6 italic">Sin leads</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type DateFilter = 'all' | 'today' | '7d' | '30d' | 'custom';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'custom', label: 'Rango…' },
];

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<number>(Date.now());

  // Cambios de etapa recién hechos por drag: se preservan sobre los datos que
  // llegan del refresco en vivo hasta que el servidor los confirme (evita que un
  // poll a mitad del PATCH devuelva la tarjeta a su columna anterior).
  const optimisticRef = useRef<Map<string, { stage: string; ts: number }>>(new Map());
  const isDraggingRef = useRef(false);

  // ── Refresco en vivo: trae la calificación/score actualizados por el agente ──
  const fetchLeads = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/proxy/leads', { cache: 'no-store' });
      if (!res.ok) return;
      const fresh = (await res.json()) as Lead[];
      if (!Array.isArray(fresh)) return;
      // No pisar mientras se arrastra (evita saltos visuales).
      if (isDraggingRef.current) return;
      const now = Date.now();
      const merged = fresh.map((l) => {
        const opt = optimisticRef.current.get(l.id);
        if (opt && now - opt.ts < 12000 && l.stage !== opt.stage) {
          return { ...l, stage: opt.stage };
        }
        if (opt && (now - opt.ts >= 12000 || l.stage === opt.stage)) optimisticRef.current.delete(l.id);
        return l;
      });
      setLeads(merged);
      setLastSync(now);
    } catch {
      /* offline: se mantiene lo que hay */
    } finally {
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => fetchLeads(false), 15000);
    return () => clearInterval(id);
  }, [fetchLeads]);

  // Configure sensors for mobile and desktop to prevent accidental drags when scrolling
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require dragging 8 pixels to start (avoids drag on simple clicks)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Require pressing the card for 250ms to drag on mobile
        tolerance: 5, // Allow up to 5px movement during the 250ms press before aborting
      },
    })
  );

  // When drag starts, keep track of the active lead for the overlay
  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  // When drag ends, update the lead's stage if dropped over a valid column
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as LeadStage;

    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead || currentLead.stage === newStage) return;

    // Optimistic UI update (+ recordar para que el refresco no lo pise)
    optimisticRef.current.set(leadId, { stage: newStage, ts: Date.now() });
    setLeads(current =>
      current.map(l => l.id === leadId ? { ...l, stage: newStage } : l)
    );

    // Call API to persist the stage change
    try {
      await fetch(`/api/proxy/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
    } catch (err) {
      console.error('Failed to update lead stage', err);
      // Revert if error
      optimisticRef.current.delete(leadId);
      setLeads(current =>
        current.map(l => l.id === leadId ? { ...l, stage: currentLead.stage } : l)
      );
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Filtro por fechas ──
  const filteredLeads = useMemo(() => {
    if (dateFilter === 'all') return leads;
    const now = new Date();
    return leads.filter((l) => {
      const created = new Date(l.created_at || 0);
      if (dateFilter === 'today') return created.toDateString() === now.toDateString();
      if (dateFilter === '7d') return created >= new Date(now.getTime() - 7 * 864e5);
      if (dateFilter === '30d') return created >= new Date(now.getTime() - 30 * 864e5);
      if (dateFilter === 'custom') {
        if (customFrom && created < new Date(customFrom + 'T00:00:00')) return false;
        if (customTo && created > new Date(customTo + 'T23:59:59')) return false;
        return true;
      }
      return true;
    });
  }, [leads, dateFilter, customFrom, customTo]);

  // ── Métricas en vivo (calculadas sobre lo filtrado) ──
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const qualified = filteredLeads.filter((l) => l.score >= 70).length;
    const avg = total > 0 ? Math.round(filteredLeads.reduce((a, l) => a + (l.score || 0), 0) / total) : 0;
    return { total, qualified, avg };
  }, [filteredLeads]);

  const secsAgo = Math.max(0, Math.round((Date.now() - lastSync) / 1000));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Métricas compactas — una fila, también en móvil */}
      <div className="grid grid-cols-3 gap-2 mb-3 px-1 shrink-0">
        <div className="glass-panel px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Leads</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">{stats.total}</p>
          </div>
        </div>
        <div className="glass-panel px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Star className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Calif. ≥70</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">{stats.qualified}</p>
          </div>
        </div>
        <div className="glass-panel px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Score prom.</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">{stats.avg}</p>
          </div>
        </div>
      </div>

      {/* Filtro por fechas + estado de sincronización */}
      <div className="flex items-center gap-1.5 mb-3 px-1 overflow-x-auto scrollbar-none shrink-0">
        {DATE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
              dateFilter === key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white/50 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 outline-none"
              aria-label="Desde"
            />
            <span className="text-slate-400 text-xs">–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 outline-none"
              aria-label="Hasta"
            />
          </div>
        )}

        <button
          onClick={() => fetchLeads(true)}
          className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title={`Sincronizado hace ${secsAgo}s — toca para actualizar`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">En vivo · {secsAgo}s</span>
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-auto flex-1 min-h-0 pb-4 pt-1 px-1 scrollbar-thin"
        >
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={filteredLeads.filter(l => l.stage === stage)}
            />
          ))}
        </div>

        {/* The DragOverlay provides a visual representation of the dragged item that moves with the cursor */}
        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

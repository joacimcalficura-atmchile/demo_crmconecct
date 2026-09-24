'use client';

import { useState } from 'react';
import type { CashFlow } from '@/lib/api';

const COST_TYPES = [
  { value: '', label: 'Sin clasificar' },
  { value: 'fijo', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
];

const COST_CENTERS = [
  { value: '', label: 'Sin clasificar' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'gastos_generales', label: 'Gastos Generales' },
];

// Corrección manual — pedida explícitamente para que el negocio siga
// avanzando aunque la clasificación automática se equivoque. Llama al
// proxy autenticado (no a lib/api.ts, que es solo para el servidor)
// y esa misma corrección alimenta la memoria adaptativa del agente
// (ver updateLearnedPattern en el bot).
export function ClassificationEditor({ entry }: { entry: CashFlow }) {
  const [costType, setCostType] = useState(entry.cost_type ?? '');
  const [costCenter, setCostCenter] = useState(entry.cost_center ?? '');
  const [saving, setSaving] = useState(false);

  const save = async (patch: { cost_type?: string; cost_center?: string }) => {
    setSaving(true);
    try {
      // '' ("Sin clasificar") se envía como null — el CHECK constraint
      // de la columna no acepta string vacío, solo los valores del enum o NULL.
      const normalized = Object.fromEntries(
        Object.entries(patch).map(([k, v]) => [k, v === '' ? null : v])
      );
      await fetch(`/api/proxy/finance/ledger/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
    } catch (err) {
      console.error('Error guardando clasificación:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-1.5">
      <select
        value={costType}
        disabled={saving}
        onChange={(e) => { setCostType(e.target.value); save({ cost_type: e.target.value }); }}
        className="text-xs border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-colors"
      >
        {COST_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        value={costCenter}
        disabled={saving}
        onChange={(e) => { setCostCenter(e.target.value); save({ cost_center: e.target.value }); }}
        className="text-xs border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 outline-none transition-colors"
      >
        {COST_CENTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

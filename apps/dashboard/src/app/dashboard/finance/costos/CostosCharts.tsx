'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CostBreakdown } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  fijo: 'Fijo',
  variable: 'Variable',
  sin_clasificar: 'Sin clasificar',
};

const CENTER_LABELS: Record<string, string> = {
  operacional: 'Operacional',
  gastos_generales: 'Gastos Generales',
  sin_clasificar: 'Sin clasificar',
};

const COLORS = ['#0ea5e9', '#f59e0b', '#94a3b8', '#10b981'];

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel px-4 py-2.5 shadow-lg text-sm">
        <p className="font-semibold text-white">{payload[0].name}</p>
        <p className="text-sky-400 font-bold">${Number(payload[0].value).toLocaleString('es-CL')}</p>
      </div>
    );
  }
  return null;
}

function toChartData(breakdown: Record<string, number>, labels: Record<string, string>) {
  return Object.entries(breakdown).map(([key, value]) => ({
    name: labels[key] || key,
    value,
  }));
}

export function CostosCharts({ breakdown }: { breakdown: CostBreakdown }) {
  const byTypeData = toChartData(breakdown.by_type, TYPE_LABELS);
  const byCenterData = toChartData(breakdown.by_center, CENTER_LABELS);
  const empty = breakdown.total_expenses === 0;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total de gastos clasificados</p>
        <p className="text-2xl font-extrabold text-white">${breakdown.total_expenses.toLocaleString('es-CL')} CLP</p>
      </div>

      {empty ? (
        <div className="glass-panel p-10 shadow-sm text-center text-slate-400 font-medium">
          Aún no hay egresos clasificados. Sube documentos en la pestaña Documentos para ver el desglose acá.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 shadow-sm">
            <h2 className="font-bold text-white mb-4">Costos Fijos vs Variables</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byTypeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {byTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 shadow-sm">
            <h2 className="font-bold text-white mb-4">Operacional vs Gastos Generales</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCenterData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {byCenterData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

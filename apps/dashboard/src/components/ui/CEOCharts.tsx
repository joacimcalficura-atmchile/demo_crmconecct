'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { motion } from 'framer-motion';

const cashflowData = [
  { name: '1 Jul', ingresos: 4000000, gastos: 2400000 },
  { name: '8 Jul', ingresos: 5200000, gastos: 2100000 },
  { name: '15 Jul', ingresos: 4800000, gastos: 2800000 },
  { name: '22 Jul', ingresos: 7100000, gastos: 3100000 },
  { name: '29 Jul', ingresos: 8500000, gastos: 3500000 },
  { name: 'Hoy', ingresos: 9200000, gastos: 3800000 },
];

const conversionData = [
  { name: 'Semana 1', conversiones: 12 },
  { name: 'Semana 2', conversiones: 18 },
  { name: 'Semana 3', conversiones: 24 },
  { name: 'Semana 4', conversiones: 35 },
];

const formatCLP = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

export function CashflowChart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-5 sm:p-6 w-full h-[350px]"
    >
      <div className="mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Flujo de Caja Proyectado</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Ingresos vs Gastos operativos (30 días)</p>
      </div>
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `$${value/1000000}M`} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: any) => formatCLP(Number(value))}
            />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function ConversionChart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel p-5 sm:p-6 w-full h-[350px]"
    >
      <div className="mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Cierres de IA</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Leads convertidos por los Agentes Automáticos</p>
      </div>
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={conversionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
            />
            <Bar dataKey="conversiones" name="Negocios Cerrados" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

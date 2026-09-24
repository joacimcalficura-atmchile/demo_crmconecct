import React from 'react';
import FlowBuilder from './FlowBuilder';

export const metadata = {
  title: 'Flujos de Automatización | ATM Agent',
};

export default function FlowsPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Flujos de Automatización</h1>
        <p className="text-slate-600 dark:text-slate-300 font-medium drop-shadow-sm">Diseña reglas de negocio y respuestas automáticas (ej. envío de precios) sin usar IA.</p>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden relative shadow-xl">
        <FlowBuilder />
      </div>
    </div>
  );
}

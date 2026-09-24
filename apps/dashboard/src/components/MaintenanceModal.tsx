'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function MaintenanceModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Forzado a mostrar siempre por ahora para asegurar visibilidad en todos los clientes
    setIsOpen(true);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/10"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Aviso de Mantenimiento y Pruebas
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Estamos implementando mejoras estructurales en la plataforma de Agentes IA.
              </p>
              <ul className="mt-3 text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Posible <b>latencia</b> en la carga de datos.</li>
                <li><b>Inconsistencias temporales</b> (ej. nombres de contactos desajustados).</li>
              </ul>
              <p className="mt-3 text-sm text-amber-300/80 font-medium">
                Nuestro equipo está trabajando para estabilizar el entorno a la brevedad. Agradecemos su comprensión.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-semibold transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

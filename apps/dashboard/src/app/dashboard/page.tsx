'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Users, Receipt, FileText,
  Wifi, WifiOff, Clock, TrendingUp, RefreshCw, AlertTriangle,
  Power, VolumeX, Volume2, QrCode, Zap, X, Calendar, Plus, Trash2, ChevronDown, Brain, Activity, Loader2
} from 'lucide-react';
import { CashflowChart, ConversionChart } from '@/components/ui/CEOCharts';
import type { DashboardMetrics, BotStatus } from '@/lib/api';


// ─── MetricCard ───────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, bg, border, sub, delay }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; border: string; sub?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 100 }}
      className="glass-panel-interactive p-4 sm:p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
      <div className="flex items-start justify-between mb-3 sm:mb-4 relative z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${bg.replace('50', '500/20').replace('100', '500/30')} border ${border.replace('100', '500/20').replace('200', '500/30')} transition-transform group-hover:scale-105`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color.replace('600', '400')}`} />
        </div>
        {sub && (
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1 relative z-10">{value}</p>
      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider relative z-10 leading-tight">{label}</p>
    </motion.div>
  );
}

// ─── BotStatusCard ────────────────────────────────────────────
const QR_TTL = 20; // segundos antes de que Baileys genere un nuevo QR

function BotStatusCard({ status, provider = 'baileys', onSwitchProvider, onRefresh, onRequestNewQR, delay }: {
  status: BotStatus; provider?: 'baileys' | 'meta'; onSwitchProvider?: (p: 'baileys' | 'meta') => void; onRefresh: () => void; onRequestNewQR: () => void; delay: number;
}) {
  const uptimeHours = Math.floor(status.uptime / 3600);
  const uptimeMin = Math.floor((status.uptime % 3600) / 60);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TTL);
  const [isInitializing, setIsInitializing] = useState(false);

  // Reinicia contador cada vez que llega un QR nuevo
  useEffect(() => {
    if (!status.qr) { setQrSecondsLeft(QR_TTL); return; }
    setQrSecondsLeft(QR_TTL);
    const t = setInterval(() => {
      setQrSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status.qr]);

  const isMetaActive = provider === 'meta';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 100 }}
      className="glass-panel p-5 sm:p-6 col-span-full lg:col-span-3 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight flex items-center gap-2">
            Estado del Bot
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {isMetaActive ? 'Meta Cloud API · Demo' : 'WhatsApp · Demo'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Estado simulado; esta demo no conecta WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón Selector de Canal (Baileys vs Meta) */}
          <div className="flex items-center bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => onSwitchProvider?.('baileys')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                !isMetaActive ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              QR Baileys
            </button>
            <button
              onClick={() => onSwitchProvider?.('meta')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                isMetaActive ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Meta API
            </button>
          </div>

          {!isMetaActive && status.connected && (
            <button
              onClick={async () => {
                await fetch('/api/proxy/status/logout', { method: 'POST' });
                onRefresh();
              }}
              className="px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors border border-rose-500/30"
            >
              Desconectar
            </button>
          )}

          <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border ${
            isMetaActive || status.connected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}>
            {isMetaActive || status.connected ? <><Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Simulado</> : <><WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Desconectado</>}
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 sm:p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 active:scale-95 transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {isMetaActive ? (
        /* VISTA META CLOUD API (CONEXIÓN OFICIAL EN LA NUBE) */
        <div className="p-5 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-400 text-sm">Vista de ejemplo de Meta Cloud API</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Esta pantalla ilustra una posible integración. No existe una conexión activa y ningún mensaje se recibe o envía desde esta demo.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300">
              🌐 Integración externa desactivada en esta demo
            </span>
            <a
              href="/dashboard/settings"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              Configuración Meta API →
            </a>
          </div>
        </div>
      ) : status.qr && !status.connected ? (
        <div className="flex flex-col items-center gap-4 p-4 sm:p-5 border border-dashed border-sky-500/30 bg-sky-500/5 rounded-2xl">
          {/* Header: título + contador de expiración */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400">
              <QrCode className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Escanea desde WhatsApp</p>
            </div>
            <span className={`text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-full border transition-colors ${
              qrSecondsLeft <= 5
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
            }`}>
              {qrSecondsLeft}s
            </span>
          </div>

          {/* Barra de progreso de expiración */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                qrSecondsLeft <= 5 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              animate={{ width: `${(qrSecondsLeft / QR_TTL) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>

          {/* Imagen QR — padding blanco forzado para evitar errores de lectura móvil */}
          <div className="bg-white rounded-2xl p-3 shadow-md border border-sky-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={status.qr}
              alt="WhatsApp QR Code"
              width={200}
              height={200}
              className="block"
              style={{ width: 200, height: 200, imageRendering: 'pixelated', objectFit: 'contain' }}
            />
          </div>

          <ol className="text-[11px] text-slate-500 space-y-1 text-left w-full max-w-[220px]">
            <li>1️⃣ Abre <strong>WhatsApp</strong> en tu teléfono</li>
            <li>2️⃣ Ve a <strong>Dispositivos vinculados</strong></li>
            <li>3️⃣ Pulsa <strong>"Vincular dispositivo"</strong></li>
            <li>4️⃣ Apunta la cámara al código QR</li>
          </ol>

          {/* Botón para solicitar nuevo QR cuando expira */}
          <AnimatePresence>
            {qrSecondsLeft === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                onClick={onRequestNewQR}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 active:scale-95 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Solicitar nuevo QR
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      ) : status.connected ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-slate-800/50 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Uptime</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{uptimeHours}h {uptimeMin}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <TrendingUp className="w-4 h-4 text-sky-500 dark:text-sky-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sincronización</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {new Date(status.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Esperando Inicialización</p>
              <p className="text-xs text-slate-400 mt-1">La instancia está levantada pero no se ha iniciado sesión de WhatsApp.</p>
            </div>
          </div>
          <button
            disabled={isInitializing}
            onClick={async () => {
              setIsInitializing(true);
              try {
                await fetch('/api/proxy/status/init', { method: 'POST' });
                onRefresh();
              } finally {
                setTimeout(() => setIsInitializing(false), 3000);
              }
            }}
            className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm border border-white/10"
          >
            {isInitializing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isInitializing ? 'Iniciando conexión...' : 'Generar QR / Iniciar Conexión'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Business Hours Modal ──────────────────────────────────────
const DAYS = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
];

function BusinessHoursModal({ currentConfig, onSave, onClose }: { currentConfig: any, onSave: (cfg: any) => void, onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState(() => ({
    enabled: currentConfig?.enabled ?? false,
    schedule: currentConfig?.schedule ?? {}
  }));
  const [isModeOpen, setIsModeOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // WhatsApp has 3 basic modes conceptually here:
  // "Siempre abierto" (enabled: false)
  // "Horario específico" (enabled: true)
  
  const handleModeChange = (mode: '24/7' | 'specific') => {
    setIsModeOpen(false);
    setConfig((p: any) => ({ ...p, enabled: mode === 'specific' }));
  };
  
  const handleDayChange = (day: string, active: boolean) => {
    setConfig((p: any) => {
      const newSchedule = { ...p.schedule };
      if (active) {
        newSchedule[day] = [{ start: '09:00', end: '18:00' }]; // Default de WhatsApp
      } else {
        delete newSchedule[day];
      }
      return { ...p, schedule: newSchedule };
    });
  };

  const handleTimeChange = (day: string, blockIndex: number, field: 'start' | 'end', value: string) => {
    setConfig((p: any) => {
      const newSchedule = { ...p.schedule };
      if (!newSchedule[day]) return p;
      newSchedule[day][blockIndex][field] = value;
      return { ...p, schedule: newSchedule };
    });
  };

  const addTimeBlock = (day: string) => {
    setConfig((p: any) => {
      const newSchedule = { ...p.schedule };
      if (!newSchedule[day]) return p;
      newSchedule[day].push({ start: '09:00', end: '18:00' });
      return { ...p, schedule: newSchedule };
    });
  };

  const removeTimeBlock = (day: string, blockIndex: number) => {
    setConfig((p: any) => {
      const newSchedule = { ...p.schedule };
      if (!newSchedule[day]) return p;
      newSchedule[day].splice(blockIndex, 1);
      if (newSchedule[day].length === 0) {
        delete newSchedule[day]; // Si quitamos el último, desactiva el día
      }
      return { ...p, schedule: newSchedule };
    });
  };

  const handleSave = () => {
    onSave({ ...config, timezone: 'America/Santiago' });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Edita el horario comercial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta es la única fuente del horario: el asistente lo usa para responder y para ofrecer citas.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nota: este horario es la fuente de verdad que habla el bot */}
          <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              El asistente <span className="font-semibold text-slate-800 dark:text-white">solo dice y agenda dentro de este horario</span>. Los días que no actives quedan como <span className="font-semibold">cerrados</span> y no se ofrecen. En modo <span className="font-semibold">24/7</span> no publica un horario semanal: atiende siempre y coordina las citas según tu disponibilidad real.
            </p>
          </div>

          {/* WhatsApp Style Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsModeOpen(!isModeOpen)}
              className="w-full flex items-center justify-between p-3.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 rounded-xl transition-colors shadow-sm"
            >
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {config.enabled ? 'Abierto en horario específico' : 'Abierto 24/7 (Siempre abierto)'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isModeOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1 glass-panel z-10 overflow-hidden py-1"
                >
                  <button onClick={() => handleModeChange('24/7')} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Abierto 24/7 (Siempre abierto)
                  </button>
                  <button onClick={() => handleModeChange('specific')} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Abierto en horario específico
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {config.enabled && (
            <div className="space-y-1">
              {DAYS.map(day => {
                const isActive = !!config.schedule[day.id];
                const blocks = config.schedule[day.id] || [];
                return (
                  <div key={day.id} className="py-4 border-b border-slate-200 dark:border-white/10 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{day.label}</span>
                        {!isActive && <span className="text-xs text-slate-400 dark:text-slate-500">Cerrado 24 horas</span>}
                      </div>

                      <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center cursor-pointer ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} onClick={() => handleDayChange(day.id, !isActive)}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="space-y-3 mt-3">
                        {blocks.map((block: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-3 items-center">
                              <div className="relative">
                                <span className="absolute -top-2 left-3 bg-white dark:bg-slate-800 px-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Abierto</span>
                                <input type="time" value={block.start} onChange={(e) => handleTimeChange(day.id, i, 'start', e.target.value)} className="w-full text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none text-slate-900 dark:text-white bg-black/5 dark:bg-white/5 shadow-sm" />
                              </div>
                              <div className="relative">
                                <span className="absolute -top-2 left-3 bg-white dark:bg-slate-800 px-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cerrado</span>
                                <input type="time" value={block.end} onChange={(e) => handleTimeChange(day.id, i, 'end', e.target.value)} className="w-full text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none text-slate-900 dark:text-white bg-black/5 dark:bg-white/5 shadow-sm" />
                              </div>
                            </div>
                            
                            {blocks.length > 1 && (
                              <button onClick={() => removeTimeBlock(day.id, i)} className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => addTimeBlock(day.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-1 px-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir horario
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-black/5 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm">Guardar</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Master Control Panel ─────────────────────────────────────
function MasterControlPanel({ botActive, onTogglePower, onSilence, silenceUntil, toggling, businessHours, onUpdateConfig }: {
  botActive: boolean;
  onTogglePower: () => void;
  onSilence: (minutes: number) => void;
  silenceUntil: Date | null;
  toggling: boolean;
  businessHours?: any;
  onUpdateConfig: (config: any) => Promise<void>;
}) {
  const [showHoursModal, setShowHoursModal] = useState(false);
  const isSilenced = silenceUntil !== null && silenceUntil > new Date();

  // Estados diferenciados con claridad
  let stateLabel = '';
  if (isSilenced) stateLabel = '🔕 Silenciado manualmente — Bot escucha pero no responde';
  else if (!botActive) stateLabel = '🔴 Bot Apagado — Kill-switch activado';
  else if (businessHours?.enabled) stateLabel = '🟢 IA Activa — Respetando horario de atención';
  else stateLabel = '🟢 IA Activa — Respondiendo 24/7 automáticamente';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, type: 'spring', stiffness: 120 }}
      className="relative z-40 glass-panel p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Estado */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors duration-300 ${
            isSilenced ? 'bg-amber-500/20 border-amber-500/30' : botActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30'
          }`}>
            <Zap className={`w-5 h-5 transition-colors duration-300 ${
              isSilenced ? 'text-amber-400' : botActive ? 'text-emerald-400' : 'text-rose-400'
            }`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Control de Respuesta Automática</p>
            <p className={`text-xs mt-0.5 font-medium ${
              isSilenced ? 'text-amber-500 dark:text-amber-400' : botActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
            }`}>{stateLabel}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Horario de Atención */}
          <button
            onClick={() => setShowHoursModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 select-none"
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" /> Horarios
          </button>
          
          <button
            onClick={() => setShowHoursModal(true)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Silenciar — Toggle simple ON/OFF, solo visible cuando el bot está ENCENDIDO */}
          {botActive && (
            <button
              onClick={() => onSilence(isSilenced ? 0 : -1)}
              title={isSilenced ? 'Reactivar respuestas automáticas' : 'Silenciar bot (sin límite de tiempo)'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 select-none ${
                isSilenced
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isSilenced
                ? <VolumeX className="w-3.5 h-3.5 flex-shrink-0" />
                : <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
              }
              <span className="sm:inline hidden">{isSilenced ? '🔕 Silenciado' : 'Silenciar'}</span>
            </button>
          )}

          {/* Apagar / Encender */}
          <button
            onClick={onTogglePower}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 select-none ${
              botActive
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            <Power className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="sm:inline hidden">
              {toggling ? 'Cambiando...' : botActive ? 'Apagar Bot' : 'Encender Bot'}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHoursModal && (
          <BusinessHoursModal
            currentConfig={businessHours}
            onClose={() => setShowHoursModal(false)}
            onSave={async (cfg) => {
              await onUpdateConfig({ business_hours: cfg });
              setShowHoursModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [provider, setProvider] = useState<'baileys' | 'meta'>('baileys');
  const [botActive, setBotActive] = useState(true);
  const [silenceUntil, setSilenceUntil] = useState<Date | null>(null);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const idleRef = useRef(0);
  const metricsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const mutatingUntilRef = useRef(0);

  // Cargar wa_provider de la empresa
  useEffect(() => {
    fetch('/api/proxy/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg?.wa_provider === 'meta') setProvider('meta');
      })
      .catch(() => {});
  }, []);

  const handleSwitchProvider = async (newProvider: 'baileys' | 'meta') => {
    setProvider(newProvider);
    await fetch('/api/proxy/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wa_provider: newProvider }),
    }).catch(() => {});
  };

  // ── Métricas cada 10s (sin necesidad de tiempo real) ─────────
  const fetchMetrics = useCallback(async (silent = false) => {
    try {
      const mRes = await fetch('/api/proxy/dashboard/metrics').then(r => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<DashboardMetrics>;
      });
      setMetrics(prev => {
        const same = JSON.stringify(prev) === JSON.stringify(mRes);
        idleRef.current = same ? idleRef.current + 1 : 0;
        return mRes;
      });
      // Solo aplicamos el estado del servidor si NO hay una acción manual
      // reciente en vuelo (así el toggle no revierte por una respuesta vieja).
      if (Date.now() > mutatingUntilRef.current) {
        if (mRes.botActive !== undefined) {
          setBotActive(mRes.botActive);
        }
        if (mRes.silenceUntil !== undefined) {
          setSilenceUntil(mRes.silenceUntil ? new Date(mRes.silenceUntil) : null);
        }
      }
      setError(false);
    } catch {
      setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Fallback polling de status (cuando SSE no disponible) ────
  const fetchData = useCallback(async (silent = false) => {
    try {
      const sRes = await fetch('/api/proxy/status').then(r => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<BotStatus>;
      });
      setBotStatus(sRes);
    } catch { /* silencioso */ } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── SSE: estado del bot en tiempo real vía EventSource ───────
  useEffect(() => {
    let fallbackPoll: ReturnType<typeof setInterval> | null = null;
    let consecutiveErrors = 0;

    const stopFallback = () => {
      if (fallbackPoll) {
        clearInterval(fallbackPoll);
        fallbackPoll = null;
      }
    };

    const connect = () => {
      if (esRef.current) esRef.current.close();
      const es = new EventSource('/api/sse/status');
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        // Llegó dato por SSE: el canal está sano, no hace falta el poll de rescate.
        consecutiveErrors = 0;
        stopFallback();
        try {
          const data = JSON.parse(e.data) as BotStatus;
          setBotStatus(data);
          setLoading(false);
        } catch { /* ignorar parse error */ }
      };

      es.onerror = () => {
        // OJO: /api/sse/status se cierra a propósito cada 28s y EventSource
        // reconecta solo. Cerrarlo aquí mataba esa reconexión y dejaba el poll
        // de rescate encendido para siempre — 20 req/min por pestaña, de forma
        // permanente, que era el mayor consumidor de la cuota del bot.
        consecutiveErrors += 1;
        if (consecutiveErrors < 3) return; // cierre esperado: dejar reconectar

        es.close();
        if (!fallbackPoll) {
          void fetchData(true);
          fallbackPoll = setInterval(() => void fetchData(true), 15_000);
        }
        // Reintentar el canal en tiempo real más adelante en vez de rendirse.
        setTimeout(() => {
          if (esRef.current === es) connect();
        }, 30_000);
      };
    };

    connect();
    // Metrics poll independiente
    fetchMetrics();
    metricsRef.current = setInterval(() => void fetchMetrics(true), 10_000);

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (metricsRef.current) clearInterval(metricsRef.current);
      stopFallback();
    };
  }, [fetchData, fetchMetrics]);

  // ── Solicitar nuevo QR (fuerza logout → Baileys regenera QR) ─
  const handleRequestNewQR = useCallback(async () => {
    await fetch('/api/proxy/status/logout', { method: 'POST' }).catch(() => {});
  }, []);

  const handleTogglePower = async () => {
    const next = !botActive;
    mutatingUntilRef.current = Date.now() + 6000; // protege el estado durante la escritura
    setBotActive(next);
    setToggling(true);
    
    // Si el usuario decide encender el bot de nuevo, limpiamos cualquier silencio residual para evitar confusión
    const payload: any = { bot_active: next };
    if (next && silenceUntil) {
      payload.silence_until = null;
      setSilenceUntil(null);
    }
    
    await fetch('/api/proxy/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => setBotActive(!next));
    setToggling(false);
  };

  const handleUpdateConfig = async (payload: any) => {
    await fetch('/api/proxy/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    fetchMetrics(true); // Refresca las métricas para ver los cambios
  };

  const handleSilence = async (minutes: number) => {
    mutatingUntilRef.current = Date.now() + 6000; // protege el estado durante la escritura
    if (minutes === 0) {
      setSilenceUntil(null);
      await handleUpdateConfig({ silence_until: null });
      return;
    }
    const until = minutes === -1 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + minutes * 60000);
    setSilenceUntil(until);
    await handleUpdateConfig({ silence_until: until.toISOString() });
  };

  const m = metrics ?? { activeConversations: 0, pausedConversations: 0, leadsToday: 0, docsToday: 0, quotesSent: 0, botConnected: false, timestamp: new Date().toISOString() };
  const s = botStatus ?? { connected: false, qr: null, uptime: 0, timestamp: new Date().toISOString() };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            CEO Command Center
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              PRO
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Visión Estratégica — {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" /> Actualizando...
            </span>
          )}
          {error && (
            <span className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>
      </div>

      {/* 🧠 Strategic Brief (AI Insight Engine) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
        className="glass-panel-interactive border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent p-5 sm:p-6"
      >
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center flex-shrink-0 border border-sky-500/30 shadow-inner">
            <Brain className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h3 className="font-bold text-sky-500 dark:text-sky-400 text-sm flex items-center gap-2">
              Gemini 2.0 Insight <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed font-medium">
              "Buen día, Joacim. El flujo de caja de esta semana proyecta un <strong className="text-emerald-500">crecimiento del 12%</strong>. Las conversiones por IA han cerrado 24 negocios, ahorrando 140 horas operativas. Te sugiero revisar 3 cotizaciones pendientes de alto valor en el CRM."
            </p>
          </div>
        </div>
      </motion.div>

      {/* 📊 Métricas Financieras y Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
        <MetricCard 
          label="MRR (Ingreso Mensual)" 
          value={loading && !metrics ? '...' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(metrics?.pipelineRevenue ?? 0)} 
          icon={TrendingUp} 
          color="text-emerald-500" 
          bg="bg-emerald-50" 
          border="border-emerald-200" 
          sub="+12% v/s mes anterior" 
          delay={0.05} 
        />
        <MetricCard 
          label="Pipeline de Ventas (IA)" 
          value={loading && !metrics ? '...' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(m.pipelineRevenue ?? 0)} 
          icon={Activity} 
          color="text-sky-500" 
          bg="bg-sky-50" 
          border="border-sky-200" 
          sub="Cotizaciones activas" 
          delay={0.1} 
        />
        <MetricCard 
          label="Horas Operativas Ahorradas" 
          value={loading && !metrics ? '...' : `${m.hoursSaved ?? 0} hrs`} 
          icon={Clock} 
          color="text-amber-500" 
          bg="bg-amber-50" 
          border="border-amber-200" 
          sub="Por agentes IA" 
          delay={0.15} 
        />
      </div>

      {/* 📈 Gráficos Ejecutivos (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CashflowChart />
        <ConversionChart />
      </div>

      {/* ⚙️ Control Operativo Inferior (El antiguo panel) */}
      <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Infraestructura de Agentes
        </h3>
        
        <MasterControlPanel
          botActive={botActive}
          onTogglePower={handleTogglePower}
          onSilence={handleSilence}
          silenceUntil={silenceUntil}
          toggling={toggling}
          businessHours={m.businessHours}
          onUpdateConfig={handleUpdateConfig}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <BotStatusCard
            status={s}
            provider={provider}
            onSwitchProvider={handleSwitchProvider}
            onRefresh={() => void fetchData()}
            onRequestNewQR={handleRequestNewQR}
            delay={0.25}
          />
          <div className="grid grid-rows-2 gap-3">
            <MetricCard label="Leads Nuevos Hoy" value={loading && !metrics ? '...' : m.leadsToday} icon={Users} color="text-violet-500" bg="bg-violet-50" border="border-violet-100" delay={0.2} />
            <MetricCard label="Conversaciones Activas" value={loading && !metrics ? '...' : m.activeConversations} icon={MessageSquare} color="text-slate-600" bg="bg-slate-50" border="border-slate-100" delay={0.3} />
          </div>
        </div>
      </div>

      {/* Warning bot caído */}
      <AnimatePresence>
        {!m.botConnected && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 mt-4"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-400">
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-400 text-sm">Agentes Desconectados de WhatsApp</h3>
                <p className="text-xs text-slate-300 mt-1">Asegúrate de que el puente WS esté levantado en el VPS.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

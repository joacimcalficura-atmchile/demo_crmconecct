'use client';

import { 
  Calendar as CalendarIcon, Info, Copy, Check, ExternalLink, 
  Clock, MapPin, AlertCircle, RefreshCw, ChevronRight, ChevronLeft, LogIn, Settings, Video, X, LogOut, Send, UserCheck, Bell, Plus
} from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBotEvents } from '../../../hooks/useBotEvents';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
}

interface DerivationRecipient {
  nombre: string;
  telefono: string;
  tipo: string;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

const DEFAULT_CONFIG = {
  workHourStart: '08:00',
  workHourEnd: '19:00',
  defaultDuration: '60',
  bufferMargin: '15',
  workDays: ['1', '2', '3', '4', '5'],
  enableDailyDigest: true,
  digestTime: '07:30',
};

const WEEK_DAYS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS_RANGE = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 a 20:00

export function CalendarView() {
  const latestEvent = useBotEvents();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [email, setEmail] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Control de Fechas y Vistas
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Configuraciones de Agenda & Derivaciones
  const [showSettings, setShowSettings] = useState(false);
  const [agendaConfig, setAgendaConfig] = useState(DEFAULT_CONFIG);
  // ¿El agente le entrega el enlace de Google Meet al cliente al agendar?
  // Vive en company_config.send_meet_link (lo lee el bot), NO en localStorage.
  const [sendMeetLink, setSendMeetLink] = useState(true);
  const [savingMeetPref, setSavingMeetPref] = useState(false);
  const [recipients, setRecipients] = useState<DerivationRecipient[]>([]);
  const [adminFallback, setAdminFallback] = useState<string[]>([]);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Crear / editar eventos manualmente
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('atm_calendar_config');
    if (saved) {
      try {
        setAgendaConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } catch(e) {}
    }
    fetchRecipients();
    // Preferencia de enlace Meet: fuente real es company_config (la lee el bot)
    fetch('/api/proxy/config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg && typeof cfg.send_meet_link === 'boolean') setSendMeetLink(cfg.send_meet_link); })
      .catch(() => {});
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/calendar/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
        setAdminFallback(data.adminFallback || []);
      }
    } catch (e) {
      console.error('Error al cargar destinatarios:', e);
    }
  };

  const saveConfig = async (newConfig: typeof DEFAULT_CONFIG) => {
    setAgendaConfig(newConfig);
    localStorage.setItem('atm_calendar_config', JSON.stringify(newConfig));

    // La preferencia del enlace Meet SÍ la lee el bot: se guarda en company_config
    // (no en localStorage). Si el guardado falla, avisamos y no cerramos el modal.
    setSavingMeetPref(true);
    try {
      const res = await fetch('/api/proxy/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_meet_link: sendMeetLink }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setToastMessage('⚠️ Se guardaron los ajustes locales, pero no pude guardar la preferencia del enlace Meet. Reintenta.');
      setSavingMeetPref(false);
      return;
    }
    setSavingMeetPref(false);
    setToastMessage('✅ Configuración de agenda actualizada');
    setShowSettings(false);
  };

  const fetchCalendarData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const eventsRes = await fetch('/api/calendar/events');
      
      if (eventsRes.status === 404) {
        setIsConfigured(false);
      } else if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setIsConfigured(true);
        setEvents(eventsData.events || []);
        setEmail(eventsData.email || '');
      } else {
        throw new Error('No se pudo cargar la información del calendario.');
      }
    } catch (err: any) {
      console.error('[CALENDAR VIEW ERROR]:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'linked') {
      setToastMessage('✅ Cuenta de Google vinculada exitosamente');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      setError('No se pudo vincular la cuenta. Inténtalo de nuevo.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchCalendarData();
  }, []);

  useEffect(() => {
    if (latestEvent && latestEvent.type === 'NEW_VISIT') {
      const eventDetails = latestEvent.event;
      setToastMessage(`📅 Nueva visita agendada: ${eventDetails.summary || 'Sin título'}`);
      fetchCalendarData(true);
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [latestEvent]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCalendarData(true);
  };

  const handleLoginGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogoutGoogle = async () => {
    if (!window.confirm('¿Estás seguro de desvincular la cuenta de Google Calendar conectada?')) return;
    setUnlinking(true);
    try {
      const res = await fetch('/api/auth/google/logout', { method: 'POST' });
      if (res.ok) {
        setIsConfigured(false);
        setEmail('');
        setEvents([]);
        setToastMessage('🔒 Cuenta de Google desvinculada correctamente');
      } else {
        throw new Error('No se pudo desvincular la cuenta');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnlinking(false);
    }
  };

  const handleSendTestDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await fetch('/api/calendar/send-daily-digest', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`📱 ${data.message || 'Resumen matutino enviado exitosamente por WhatsApp'}`);
      } else {
        alert(`❌ Error al enviar resumen: ${data.message || data.error || 'Fallo desconocido'}`);
      }
    } catch (e: any) {
      alert(`❌ Error de conexión: ${e.message}`);
    } finally {
      setSendingDigest(false);
    }
  };

  // Navegación por fechas
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // El scroll ya NO navega de fecha. Antes un onWheel cambiaba de día/mes al
  // hacer scroll (p.ej. para ver más horas en Semana/Día), lo que en PC hacía
  // saltar el calendario sin querer. La navegación es solo con los botones ‹ ›
  // y "Hoy". (Estilo Google Calendar: scroll = ver contenido, no cambiar fecha.)

  const getEventColor = (title: string = '') => {
    const lower = title.toLowerCase();
    if (lower.includes('instalación') || lower.includes('instalacion')) {
      return { bg: 'bg-emerald-500/10 dark:bg-emerald-900/40', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' };
    }
    if (lower.includes('reunión') || lower.includes('reunion') || lower.includes('meet') || lower.includes('visita')) {
      return { bg: 'bg-violet-500/10 dark:bg-violet-900/40', border: 'border-violet-200 dark:border-violet-500/30', text: 'text-violet-700 dark:text-violet-300', icon: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500/20 text-violet-700 dark:text-violet-300' };
    }
    if (lower.includes('mantenimiento') || lower.includes('reparación') || lower.includes('reparacion')) {
      return { bg: 'bg-amber-500/10 dark:bg-amber-900/40', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' };
    }
    return { bg: 'bg-sky-500/10 dark:bg-sky-900/40', border: 'border-sky-200 dark:border-sky-500/30', text: 'text-sky-700 dark:text-sky-300', icon: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-300' };
  };

  // Cálculo de Matriz del Mes
  const monthDaysGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Cálculo de Días de la Semana Actual
  const weekDaysGrid = useMemo(() => {
    const curr = new Date(currentDate);
    let dayOfWeek = curr.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  }, [currentDate]);

  // Agrupar eventos por fecha key (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(evt => {
      const dateStr = evt.start?.dateTime || evt.start?.date;
      if (!dateStr) return;
      const key = new Date(dateStr).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, [events]);

  const formattedMonthYear = currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-sky-900/90 text-white px-5 py-4 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center gap-3.5 backdrop-blur-xl"
          >
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Notificación ATM</p>
              <p className="text-sm font-semibold">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
            Agenda de Clientes
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
            Gestión inteligente de visitas y reuniones agendadas autónomamente por la IA.
          </p>
        </div>
        
        {isConfigured && (
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Indicador de email conectado y botón de logout */}
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono truncate max-w-[180px]">
                {email}
              </span>
              <button
                onClick={handleLogoutGoogle}
                disabled={unlinking}
                className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors ml-1"
                title="Desvincular / Cambiar Cuenta de Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
              title="Configuración de Notificaciones y Horarios"
            >
              <Settings className="w-4 h-4 text-sky-500" />
              <span>Ajustes</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[550px] glass-panel rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Cargando calendario interactivo...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-900/40 border border-rose-500/30 backdrop-blur-xl rounded-2xl p-6 text-center max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <div>
            <h3 className="font-bold text-rose-300 text-base">Error al conectar con Google</h3>
            <p className="text-xs text-rose-400 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchCalendarData()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : !isConfigured ? (
        /* ==================== ONBOARDING VINCULACIÓN GOOGLE ==================== */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
        >
          <div className="p-8 lg:p-12 space-y-8 flex flex-col justify-center">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-900/40 text-sky-300 rounded-full border border-sky-500/30 text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                Integración Nativa Google OAuth
              </span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Vincula tu Google Calendar</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Permite a los Agentes IA agendar visitas técnicas y consultar disponibilidades en tiempo real sin traslapes.
              </p>
            </div>

            <button
              onClick={handleLoginGoogle}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-900/20 active:scale-95 transition-all w-full sm:w-auto"
            >
              <LogIn className="w-5 h-5" />
              Continuar con Google
            </button>
          </div>

          <div className="bg-black/5 dark:bg-white/5 p-8 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10">
            <div className="max-w-xs space-y-4 text-center">
              <div className="w-16 h-16 bg-sky-500/20 rounded-3xl flex items-center justify-center mx-auto border border-sky-500/30">
                <CalendarIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Flujo de Agendamiento Autónomo</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  El Bot consulta tu disponibilidad, detecta franjas libres y notifica vía WhatsApp a tus derivaciones.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ==================== VISTA GOOGLE CALENDAR COMPLETA ==================== */
        <div
          className="glass-panel rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col space-y-4 shadow-2xl transition-all"
        >
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            {/* Navegador de Fecha */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateDate('today')}
                className="px-3.5 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white transition-all"
              >
                Hoy
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                  title="Anterior (o usa la rueda del mouse)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                  title="Siguiente (o usa la rueda del mouse)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white capitalize">
                {formattedMonthYear}
              </h2>
            </div>

            {/* Selectores de Vista + Botón Nuevo Evento */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === 'month' 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === 'week' 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === 'day' 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Día
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-sky-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Lista
                </button>
              </div>

              <button
                onClick={() => { setEditingEvent(null); setPrefilledDate(null); setShowEventModal(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nuevo Evento</span>
              </button>
            </div>
          </div>

          {/* ==================== 1. VISTA MES (GRID) ==================== */}
          {viewMode === 'month' && (
            <div className="flex flex-col h-[calc(100dvh-260px)] min-h-[420px]">
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 pb-2 text-center">
                {WEEK_DAYS_HEADER.map((day) => (
                  <span key={day} className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-200 dark:bg-white/10 rounded-2xl overflow-hidden mt-2">
                {monthDaysGrid.map(({ date, isCurrentMonth }, idx) => {
                  const dateIso = date.toISOString().split('T')[0];
                  const dayEvents = eventsByDate[dateIso] || [];
                  const isToday = new Date().toISOString().split('T')[0] === dateIso;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setPrefilledDate(`${dateIso}T09:00`);
                        setEditingEvent(null);
                        setShowEventModal(true);
                      }}
                      className={`p-1.5 md:p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                        isCurrentMonth 
                          ? 'bg-white/80 dark:bg-slate-900/90 hover:bg-sky-500/5 dark:hover:bg-slate-800/80' 
                          : 'bg-slate-100/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday 
                              ? 'bg-sky-600 text-white shadow-md' 
                              : isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-sky-500 font-bold transition-opacity">
                          + Evento
                        </span>
                      </div>

                      <div className="space-y-1 my-1 overflow-y-auto max-h-[80px] scrollbar-none">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const colors = getEventColor(evt.summary);
                          const timeStr = evt.start?.dateTime 
                            ? new Date(evt.start.dateTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                            : 'Todo el día';

                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(evt);
                                setShowEventModal(true);
                              }}
                              className={`p-1 text-[10px] font-bold rounded-lg border ${colors.bg} ${colors.border} ${colors.text} truncate flex items-center gap-1 shadow-xs hover:brightness-95`}
                              title={`${timeStr} - ${evt.summary}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              <span className="truncate"><span className="hidden sm:inline">{timeStr} </span>{evt.summary}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] font-extrabold text-sky-500 block text-center">
                            +{dayEvents.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 2. VISTA SEMANA (7 COLUMNAS HORARIAS) ==================== */}
          {viewMode === 'week' && (
            <div className="h-[calc(100dvh-260px)] min-h-[420px] flex flex-col overflow-y-auto overflow-x-auto pr-1 scrollbar-thin border border-slate-200 dark:border-white/10 rounded-2xl">
              {/* En móvil, 8 columnas no caben: se scrollea horizontal (como Google Calendar) */}
              <div className="min-w-[760px] sm:min-w-0 flex flex-col flex-1">
              {/* Header de la semana */}
              <div className="grid grid-cols-8 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-center sticky top-0 z-20 backdrop-blur-md">
                <div className="p-2 text-xs font-bold text-slate-400 border-r border-slate-200 dark:border-white/10">Hora</div>
                {weekDaysGrid.map((d, i) => {
                  const dateIso = d.toISOString().split('T')[0];
                  const isToday = new Date().toISOString().split('T')[0] === dateIso;
                  return (
                    <div key={i} className="p-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 last:border-r-0">
                      <span className="block text-[10px] text-slate-400 uppercase">{WEEK_DAYS_HEADER[i]}</span>
                      <span className={`inline-block w-6 h-6 rounded-full leading-6 mt-0.5 ${isToday ? 'bg-sky-600 text-white' : ''}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grilla Horaria */}
              <div className="flex-1">
                {HOURS_RANGE.map((hour) => {
                  const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div key={hour} className="grid grid-cols-8 border-b border-slate-200 dark:border-white/5 min-h-[54px] hover:bg-white/5 transition-colors">
                      {/* Columna Hora */}
                      <div className="p-2 text-[11px] font-mono font-bold text-slate-400 border-r border-slate-200 dark:border-white/10 flex items-center justify-center">
                        {hourFormatted}
                      </div>

                      {/* 7 Días de la semana */}
                      {weekDaysGrid.map((dayObj, dayIdx) => {
                        const dateIso = dayObj.toISOString().split('T')[0];
                        const dayEvts = (eventsByDate[dateIso] || []).filter(evt => {
                          if (!evt.start?.dateTime) return hour === 8;
                          const evtHour = new Date(evt.start.dateTime).getHours();
                          return evtHour === hour;
                        });

                        return (
                          <div
                            key={dayIdx}
                            onClick={() => {
                              setPrefilledDate(`${dateIso}T${hourFormatted}`);
                              setEditingEvent(null);
                              setShowEventModal(true);
                            }}
                            className="p-1 border-r border-slate-200 dark:border-white/5 last:border-r-0 relative group cursor-pointer hover:bg-sky-500/5 transition-colors"
                          >
                            {dayEvts.map(evt => {
                              const colors = getEventColor(evt.summary);
                              return (
                                <div
                                  key={evt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(evt);
                                    setShowEventModal(true);
                                  }}
                                  className={`p-1.5 text-[10px] font-bold rounded-lg border ${colors.bg} ${colors.border} ${colors.text} truncate mb-1 shadow-xs hover:scale-[1.02] transition-transform`}
                                >
                                  {evt.summary}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {/* ==================== 3. VISTA DÍA (HORAS DEL DÍA) ==================== */}
          {viewMode === 'day' && (
            <div className="h-[calc(100dvh-260px)] min-h-[420px] flex flex-col overflow-y-auto pr-1 scrollbar-thin border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
                  {currentDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <span className="text-xs font-bold text-sky-400 bg-sky-900/40 px-2.5 py-1 rounded-full border border-sky-500/30">
                  {(eventsByDate[currentDate.toISOString().split('T')[0]] || []).length} Eventos Hoy
                </span>
              </div>

              <div className="flex-1 divide-y divide-slate-200 dark:divide-white/5">
                {HOURS_RANGE.map((hour) => {
                  const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;
                  const dateIso = currentDate.toISOString().split('T')[0];
                  const dayEvts = (eventsByDate[dateIso] || []).filter(evt => {
                    if (!evt.start?.dateTime) return hour === 8;
                    const evtHour = new Date(evt.start.dateTime).getHours();
                    return evtHour === hour;
                  });

                  return (
                    <div 
                      key={hour}
                      onClick={() => {
                        setPrefilledDate(`${dateIso}T${hourFormatted}`);
                        setEditingEvent(null);
                        setShowEventModal(true);
                      }}
                      className="flex items-start gap-4 p-3 min-h-[64px] hover:bg-sky-500/5 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-mono font-bold text-slate-400 w-14 shrink-0 pt-0.5">
                        {hourFormatted}
                      </span>

                      <div className="flex-1 space-y-2">
                        {dayEvts.length === 0 ? (
                          <span className="opacity-0 group-hover:opacity-100 text-xs text-sky-500 font-bold transition-opacity flex items-center gap-1 pt-0.5">
                            <Plus className="w-3.5 h-3.5" /> Agregar evento a las {hourFormatted}
                          </span>
                        ) : (
                          dayEvts.map(evt => {
                            const colors = getEventColor(evt.summary);
                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEvent(evt);
                                  setShowEventModal(true);
                                }}
                                className={`p-3 rounded-xl border ${colors.bg} ${colors.border} ${colors.text} flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform`}
                              >
                                <div>
                                  <h4 className="font-bold text-sm">{evt.summary}</h4>
                                  {evt.location && (
                                    <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" /> {evt.location}
                                    </p>
                                  )}
                                </div>

                                {evt.hangoutLink && (
                                  <a 
                                    href={evt.hangoutLink} target="_blank" rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1 text-xs font-bold bg-sky-900/40 text-sky-300 px-3 py-1.5 rounded-lg border border-sky-500/30 hover:bg-sky-500/20"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Meet
                                  </a>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 4. VISTA LISTA (AGENDA CRONOLÓGICA) ==================== */}
          {viewMode === 'list' && (
            <div className="h-[calc(100dvh-260px)] min-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <CalendarIcon className="w-10 h-10 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Sin eventos programados en la agenda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => {
                      const colors = getEventColor(event.summary);
                      const startIso = event.start?.dateTime || event.start?.date;
                      const dateObj = startIso ? new Date(startIso) : new Date();
                      const dateFormatted = dateObj.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
                      const timeStr = event.start?.dateTime
                        ? dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                        : 'Todo el día';

                      return (
                        <div
                          key={event.id}
                          onClick={() => { setEditingEvent(event); setShowEventModal(true); }}
                          className={`p-4 ${colors.bg} ${colors.border} border rounded-2xl flex items-center justify-between gap-4 transition-all hover:brightness-95 cursor-pointer shadow-sm relative overflow-hidden backdrop-blur-md`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-2 bg-white/10 rounded-xl border ${colors.border} flex flex-col items-center justify-center shrink-0`}>
                              <span className={`text-[11px] font-extrabold ${colors.text}`}>{dateFormatted}</span>
                            </div>

                            <div className="space-y-1">
                              <h4 className={`font-bold ${colors.text} text-sm`}>
                                {event.summary || 'Evento sin título'}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-sky-400" /> {timeStr}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1 truncate max-w-xs">
                                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {event.hangoutLink && (
                            <a 
                              href={event.hangoutLink} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-xs font-bold text-sky-400 bg-sky-900/40 px-3 py-1.5 rounded-xl border border-sky-500/30 flex items-center gap-1 hover:bg-sky-500/20"
                            >
                              <Video className="w-3.5 h-3.5" /> Google Meet
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Evento */}
      <EventModal
        open={showEventModal}
        initial={editingEvent}
        prefilledDate={prefilledDate}
        allEvents={events}
        onClose={() => setShowEventModal(false)}
        onSaved={() => { setToastMessage('✅ Calendario actualizado'); fetchCalendarData(true); }}
      />

      {/* Settings Modal (Ajustes & Notificaciones Matutinas) */}
      {mounted && createPortal(
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowSettings(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/20 p-6 w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto space-y-6"
              >
                <button
                  onClick={() => setShowSettings(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Configuración de Agenda & Notificaciones</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajustes para la IA y alertas matutinas WhatsApp</p>
                  </div>
                </div>

                {/* Sección 1: Notificaciones Matutinas WhatsApp */}
                <div className="p-4 bg-sky-500/5 dark:bg-sky-900/20 border border-sky-500/30 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Resumen Matutino por WhatsApp</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={agendaConfig.enableDailyDigest} 
                        onChange={(e) => setAgendaConfig({ ...agendaConfig, enableDailyDigest: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Hora de Envío Diario</label>
                      <input 
                        type="time"
                        value={agendaConfig.digestTime}
                        onChange={(e) => setAgendaConfig({ ...agendaConfig, digestTime: e.target.value })}
                        className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="pt-4 sm:pt-0">
                      <button
                        onClick={handleSendTestDigest}
                        disabled={sendingDigest}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        {sendingDigest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Probar Envío Ahora</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Destinatarios de Derivaciones */}
                  <div className="space-y-2 pt-2 border-t border-sky-500/20">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Destinatarios Configurados (Derivaciones):
                    </span>
                    {recipients.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {recipients.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-black/10 dark:bg-white/5 rounded-xl border border-white/5 text-xs">
                            <span className="font-bold text-slate-200">{r.nombre}</span>
                            <span className="font-mono text-sky-300">{r.telefono}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-black/10 dark:bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400">
                        No hay contactos específicos con el check "Recibir reportes" en Derivaciones. Se enviará a los números de administrador globales: {adminFallback.join(', ') || 'Sin configurar'}.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección 2: Parámetros del Agente */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Inicio Jornada</label>
                      <input 
                        type="time" 
                        value={agendaConfig.workHourStart}
                        onChange={e => setAgendaConfig({...agendaConfig, workHourStart: e.target.value})}
                        className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Fin Jornada</label>
                      <input 
                        type="time" 
                        value={agendaConfig.workHourEnd}
                        onChange={e => setAgendaConfig({...agendaConfig, workHourEnd: e.target.value})}
                        className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Enlace de Google Meet: ¿el agente se lo envía al cliente? */}
                  <div className="p-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Video className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Enviar enlace de Google Meet al cliente</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                          Si lo desactivas, el agente confirma la cita sin mandar el link de Meet. El evento del calendario y el aviso a tu equipo lo siguen incluyendo.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={sendMeetLink}
                        onChange={(e) => setSendMeetLink(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Margen entre citas (Buffer Anti-Traslapes)</label>
                    <select 
                      value={agendaConfig.bufferMargin}
                      onChange={e => setAgendaConfig({...agendaConfig, bufferMargin: e.target.value})}
                      className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 dark:text-white [&>option]:bg-slate-900"
                    >
                      <option value="0">0 min (Sin holgura)</option>
                      <option value="15">15 min (Recomendado)</option>
                      <option value="30">30 min (Viaje corto)</option>
                      <option value="60">1 hora (Viaje largo)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => saveConfig(agendaConfig)}
                    disabled={savingMeetPref}
                    className="w-full py-3 mt-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingMeetPref && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Guardar Configuración
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ============================================================
// Modal: Crear / Editar evento con Validación Anti-Traslapes
// ============================================================
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function EventModal({ open, initial, prefilledDate, allEvents, onClose, onSaved }: {
  open: boolean;
  initial: CalendarEvent | null;
  prefilledDate?: string | null;
  allEvents: CalendarEvent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [summary, setSummary] = useState('');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [addMeet, setAddMeet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setErr('');
    setOverlapWarning(null);
    if (initial?.id) {
      setSummary(initial.summary || '');
      setStart(toLocalInput(initial.start?.dateTime || initial.start?.date));
      const s = initial.start?.dateTime ? new Date(initial.start.dateTime).getTime() : 0;
      const e = initial.end?.dateTime ? new Date(initial.end.dateTime).getTime() : 0;
      setDuration(s && e ? String(Math.max(15, Math.round((e - s) / 60000))) : '60');
      setLocation(initial.location || '');
      setDescription(initial.description || '');
      setAddMeet(!!initial.hangoutLink);
    } else {
      setSummary('');
      setStart(prefilledDate ? prefilledDate : '');
      setDuration('60');
      setLocation('');
      setDescription('');
      setAddMeet(false);
    }
  }, [open, initial, prefilledDate]);

  useEffect(() => {
    if (!start) {
      setOverlapWarning(null);
      return;
    }
    const newStart = new Date(start).getTime();
    const newEnd = newStart + Number(duration) * 60000;

    const conflict = allEvents.find(evt => {
      if (initial?.id && evt.id === initial.id) return false;
      const evtStartStr = evt.start?.dateTime || evt.start?.date;
      const evtEndStr = evt.end?.dateTime || evt.end?.date;
      if (!evtStartStr) return false;
      const evtStart = new Date(evtStartStr).getTime();
      const evtEnd = evtEndStr ? new Date(evtEndStr).getTime() : evtStart + 3600000;

      return newStart < evtEnd && newEnd > evtStart;
    });

    if (conflict) {
      setOverlapWarning(`⚠️ ¡Atención! Este horario entra en conflicto con el evento "${conflict.summary || 'Sin título'}".`);
    } else {
      setOverlapWarning(null);
    }
  }, [start, duration, allEvents, initial]);

  const save = async (force = false) => {
    if (!summary || !start) { setErr('Completa el título y la fecha/hora.'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        id: initial?.id,
        summary,
        start: new Date(start).toISOString(),
        durationMinutes: Number(duration),
        location,
        description,
        addMeet,
        force
      };
      const res = await fetch('/api/calendar/events', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        const d = await res.json();
        setErr(`⛔ Traslape detectado: ${d.error}`);
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'No se pudo guardar el evento');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!initial?.id) return;
    if (!window.confirm('¿Eliminar este evento del calendario?')) return;
    setDeleting(true); setErr('');
    try {
      const res = await fetch(`/api/calendar/events?id=${encodeURIComponent(initial.id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'No se pudo eliminar el evento');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = 'w-full p-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors';
  const labelCls = 'block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !saving && !deleting && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-black/[0.03] dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">{isEdit ? 'Editar Evento' : 'Nuevo Evento'}</h2>
              </div>
              <button onClick={() => !saving && !deleting && onClose()} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className={labelCls}>Título *</label>
                <input value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} placeholder="Ej: Visita técnica / Instalación" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha y hora *</label>
                  <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Duración</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls}>
                    <option value="30">30 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 h 30 min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              {overlapWarning && (
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{overlapWarning}</span>
                </div>
              )}

              <div>
                <label className={labelCls}>Ubicación</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Dirección del cliente" />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-y`} placeholder="Notas adicionales" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={addMeet} onChange={(e) => setAddMeet(e.target.checked)} className="w-4 h-4 accent-sky-600" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-sky-400" /> Generar enlace Google Meet
                </span>
              </label>

              {err && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl">
                  {err}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
              {isEdit ? (
                <button
                  onClick={del}
                  disabled={deleting || saving}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Eliminar
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button onClick={() => !saving && !deleting && onClose()} className="px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white rounded-xl">
                  Cancelar
                </button>
                <button
                  onClick={() => save(false)}
                  disabled={saving || deleting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-all active:scale-95"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isEdit ? 'Guardar cambios' : 'Crear evento'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

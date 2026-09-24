'use client';

import { useState, useCallback, useEffect, useRef, useMemo, memo, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, User, Pause, Play, X, Clock, Search,
  ChevronRight, ChevronLeft, RefreshCw, Bot, BrainCircuit,
  AlertTriangle, CheckCircle2, Loader2, SendHorizontal,
  Info, Edit3, Save, Eye, LayoutGrid, List, Sparkles, Store, Mic, Paperclip, CalendarClock, Trash2, Filter, Reply, Plus, Smile, MoreVertical
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Conversation, Message } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { isUnresolvedLid } from '@/lib/phone-identity';

// ─── Presupuesto de polling ─────────────────────────────────
// El bot aplica un rate limit por IP y el dashboard vive en Vercel, así que
// TODAS las pestañas de un mismo cliente comparten el bucket (salen por las
// mismas IPs de egress). Estos intervalos son el presupuesto sostenible:
// 10s + 6s ≈ 16 req/min por pestaña activa. Además el polling se detiene con
// la pestaña oculta, que era el consumo invisible que reventaba la cuota.
const CONVERSATIONS_POLL_MS = 10_000;
const MESSAGES_POLL_MS = 6_000;
const MAX_BACKOFF_MS = 60_000;

// Convierte las URLs dentro de un texto en enlaces clicables (abren en pestaña
// nueva). Antes el texto se pintaba como <span> plano, así que los links —por
// ejemplo el PDF de una cotización aprobada— salían como texto muerto. Los PDF
// se muestran con una etiqueta amable en vez de la URL cruda larga de Storage.
function renderTextWithLinks(text: string): React.ReactNode[] {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    let url = m[0];
    // No arrastrar la puntuación final (punto, coma, paréntesis) dentro del href.
    let trailing = '';
    const punct = url.match(/[.,;:!?)\]]+$/);
    if (punct) { trailing = punct[0]; url = url.slice(0, -trailing.length); }
    const isPdf = /\.pdf(?:[?#]|$)/i.test(url);
    out.push(
      <a
        key={`lnk-${idx++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="underline font-medium text-[#059669] dark:text-[#53bdeb] break-all hover:opacity-80"
      >
        {isPdf ? '📄 Ver documento (PDF)' : url}
      </a>
    );
    if (trailing) out.push(trailing);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length > 0 ? out : [text];
}

/** Backoff exponencial que respeta `Retry-After` cuando el bot lo envía. */
function nextBackoff(res: Response, current: number): number {
  const retryAfter = Number(res.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_BACKOFF_MS);
  }
  return Math.min(current * 2, MAX_BACKOFF_MS);
}

// ─── Helpers de UI ──────────────────────────────────────────
const QUALIFICATIONS = {
  unqualified: { label: 'No calificado', emoji: '🚫', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  lead: { label: 'Cliente potencial', emoji: '👤', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  cold: { label: 'Frío', emoji: '🧊', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  warm: { label: 'Medio', emoji: '🟡', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  hot: { label: 'Caliente', emoji: '🔥', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

function formatPhone(raw: string): string {
  if (!raw) return 'Desconocido';
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('56') && digits.length >= 11) {
    const local = digits.slice(2);
    return `+56 ${local.slice(0, 1)} ${local.slice(1, 5)} ${local.slice(5)}`;
  }
  if (digits.length > 8) return `+${digits}`;
  return raw.split('@')[0] ?? raw;
}

// isUnresolvedLid vive en @/lib/phone-identity — fuente única del dashboard
// (invariantes #3 y #4). Estaba duplicado acá y en leads/KanbanBoard.tsx.

// Un contact_name repetido en varias conversaciones de LID sin resolver es la
// señal de que ese nombre no distingue a nadie (ver [[lid-fusion-fix]]): WhatsApp
// reporta el mismo pushName genérico para contactos que en realidad son personas
// distintas. Ahí se prefiere el teléfono/identificador, que al menos sí varía.
// Si el nombre es único o el teléfono es un número real, se muestra tal cual.
function getDisplayName(conv: Conversation, duplicateNames: Set<string>): string {
  // Un nombre repetido no distingue a nadie, tenga o no el teléfono forma de
  // Algunos clientes pueden compartir un nombre de perfil en conversaciones ficticias.
  // repetido con números reales confundía igual (varias filas con el mismo
  // título en la lista). Mostrar el teléfono es honesto en cualquier caso.
  if (conv.contact_name && duplicateNames.has(conv.contact_name)) {
    return formatPhone(conv.phone);
  }
  return conv.contact_name || formatPhone(conv.phone);
}

function formatChatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

/** Etiqueta del separador de fecha entre mensajes de días distintos (estilo WhatsApp). */
function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  const sameYear = d.getFullYear() === now.getFullYear();
  const label = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: sameYear ? undefined : 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const AVATAR_COLORS = [
  'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]',
  'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
  'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
];
function avatarColor(phone: string): string {
  const sum = phone.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}
function avatarInitial(nameOrPhone: string): string {
  if (!nameOrPhone) return '?';
  if (/[a-zA-Z]/.test(nameOrPhone)) {
    return nameOrPhone.charAt(0).toUpperCase();
  }
  const digits = nameOrPhone.replace(/[^0-9]/g, '');
  return digits.slice(-2, -1) || '?';
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  paused: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
  human: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/50 shadow-[0_0_10px_rgba(100,116,139,0.3)]',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', paused: 'Pausado', human: 'Humano', closed: 'Cerrado',
};
const INTENT_LABELS: Record<string, string> = {
  FINANCE_QUERY: '💰 Financiero', SCHEDULE_MEETING: '📅 Agenda',
  QUALIFY_LEAD: '🎯 Lead', REQUEST_QUOTE: '📄 Cotización',
  GENERAL_CHAT: '💬 General', UNKNOWN: '❓ Desconocido',
};
const INTENT_COLORS: Record<string, string> = {
  FINANCE_QUERY: 'text-violet-300 bg-violet-500/20 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
  SCHEDULE_MEETING: 'text-sky-300 bg-sky-500/20 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.3)]',
  QUALIFY_LEAD: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  REQUEST_QUOTE: 'text-pink-300 bg-pink-500/20 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
  GENERAL_CHAT: 'text-slate-300 bg-slate-500/20 border-slate-500/50 shadow-[0_0_10px_rgba(100,116,139,0.3)]',
  UNKNOWN: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
};

// Nombre en español del sub-agente que respondió (se muestra en la burbuja).
// Cubre TODOS los intents/orígenes que se guardan en messages.intent.
const AGENT_LABELS: Record<string, string> = {
  FINANCE_QUERY: '💰 Finanzas',
  SCHEDULE_MEETING: '📅 Agenda',
  QUALIFY_LEAD: '🎯 Comercial',
  GENERAL_CHAT: '💬 Asistente',
  REQUEST_QUOTE: '📄 Cotizador',
  RECRUITMENT_CHAT: '🧑‍💼 Reclutamiento',
  ADMIN_EXECUTIVE: '🛡️ Ejecutivo',
  WAKE_UP_PROTOCOL: '🔔 Reactivación',
  UNKNOWN: '💬 Asistente',
};
function agentLabel(intent?: string | null): string {
  if (!intent) return '🤖 Asistente';
  return AGENT_LABELS[intent] ?? '🤖 Asistente';
}

// ─── Componente WhatsApp Audio Player ─────────────────────────
function WhatsAppAudioPlayer({ src, primaryMime }: { src: string, primaryMime: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Error al reproducir audio:', err);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(true);
      }
    }
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-1.5 flex flex-col gap-1 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#202c33] min-w-[240px] max-w-[280px] shadow-sm">
      <div className="flex items-center gap-3">
        <div className="shrink-0 relative">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <User className="w-7 h-7 text-white opacity-50" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10b981] rounded-full flex items-center justify-center border-2 border-white dark:border-[#202c33]">
            <Mic className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <button onClick={togglePlay} className="shrink-0 text-[#54656f] dark:text-[#8696a0] hover:text-[#10b981] transition-colors">
          {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
        </button>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden relative cursor-pointer" onClick={(e) => {
            if(!audioRef.current || !isFinite(audioRef.current.duration)) return;
            const bounds = e.currentTarget.getBoundingClientRect();
            const perc = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
            audioRef.current.currentTime = perc * audioRef.current.duration;
          }}>
            <div className="absolute top-0 left-0 h-full bg-[#10b981]" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-[#10b981] rounded-full shadow-sm" style={{ left: `max(0px, calc(${progress}% - 6px))` }} />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-[#54656f] dark:text-[#8696a0] font-medium">
            <span>{isPlaying && audioRef.current ? formatTime(audioRef.current.currentTime) : formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        preload="metadata"
        className="hidden"
        onError={(e) => {
          const el = e.currentTarget;
          const parent = el.parentElement;
          if (parent && !parent.querySelector('a.audio-fallback')) {
            const a = document.createElement('a');
            a.href = src;
            a.download = 'audio.ogg';
            a.className = 'audio-fallback';
            a.style.cssText = 'font-size:11px;color:#10b981;text-decoration:underline;white-space:nowrap;margin-top:4px;display:block;';
            a.textContent = '⬇ Descargar audio (Formato no soportado en tu navegador)';
            parent.appendChild(a);
          }
        }}
      />
    </div>
  );
}

// ─── Imagen del chat (estilo WhatsApp) ────────────────────────
// Se muestra grande dentro de la burbuja; al tocarla se abre el visor in-app.
// Si la URL no carga como imagen (ej. un PDF servido como adjunto), degrada a
// un enlace de documento en vez de dejar un hueco roto.
function ChatImage({ url, onOpen }: { url: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 my-1 px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-medium text-[#059669] dark:text-[#10b981] transition-colors">
        <Paperclip className="w-4 h-4 shrink-0" /> Ver documento adjunto
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block my-1 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 active:scale-[0.99] transition-transform"
      style={{ maxWidth: 300 }}
      title="Ver imagen"
    >
      <img
        src={url}
        alt="Adjunto"
        className="w-full h-auto max-h-[340px] object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </button>
  );
}

// ─── Video del chat (estilo WhatsApp) ─────────────────────────
// Miniatura con el primer fotograma (preload=metadata) + botón play. Al tocar
// se reproduce en el visor in-app, sin abrir pestañas ni redirigir.
function ChatVideo({ url, onOpen }: { url: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block my-1 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 bg-black active:scale-[0.99] transition-transform"
      style={{ maxWidth: 300 }}
      title="Reproducir video"
    >
      <video src={url} className="w-full h-auto max-h-[340px] object-cover" muted playsInline preload="metadata" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center shadow-lg">
          <Play className="w-6 h-6 text-white fill-current ml-0.5" />
        </span>
      </span>
    </button>
  );
}

// ─── Panel lateral de conversación ────────────────────────────
// Lista de mensajes memoizada: se aisla del composer para que ESCRIBIR en el
// input no re-renderice todo el historial (burbujas, media, animaciones). Sus
// props son estables mientras se tipea, asi que memo() evita el re-render que
// causaba el lag al escribir (sobre todo en celulares).
const ChatMessageList = memo(function ChatMessageList({
  loading,
  messages,
  sortedMessages,
  consumedReactionIds,
  reactionByTargetWaId,
  onReply,
  onOpenMedia,
}: {
  loading: boolean;
  messages: Message[];
  sortedMessages: Message[];
  consumedReactionIds: Set<string>;
  reactionByTargetWaId: Map<string, string>;
  onReply: (msg: Message) => void;
  onOpenMedia: (v: { type: 'image' | 'video'; url: string }) => void;
}) {
  return (
    <>
      {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-slate-500 bg-white/50 backdrop-blur-sm rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Sincronizando chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <MessageSquare className="w-12 h-12 text-[#059669] mb-3" />
              <p className="text-slate-600 text-sm font-medium px-4 py-1.5 bg-white rounded-full shadow-sm">Inicia la conversación para ver mensajes</p>
            </div>
          ) : (
            <>
            {sortedMessages.map((msg, idx) => {
              // Extraer texto citado si existe (ej: » Nombre: "Cita..."\nTexto)
              const isQuoted = msg.content?.startsWith('» ');
              let quotedAuthor = '';
              let quotedText = '';
              let mainBody = msg.content ?? '';

              if (isQuoted) {
                const lines = mainBody.split('\n');
                const firstLine = lines[0] || '';
                const match = firstLine.match(/^» (.*?): "(.*?)"$/);
                if (match) {
                  quotedAuthor = match[1] || 'Mensaje citado';
                  quotedText = match[2] || '';
                  mainBody = lines.slice(1).join('\n').trim();
                }
              }

              // Separador de fecha (estilo WhatsApp): aparece una vez por cada
              // día distinto. `sticky top-2` (sin wrapper propio, como hermano
              // directo dentro del contenedor con scroll) hace que quede fijo
              // arriba mientras se recorren los mensajes de ese día, sin JS.
              const prevMsg = messages[idx - 1];
              const showDateDivider = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

              const dateDivider = showDateDivider ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex justify-center py-2"
                >
                  <span className="px-3 py-1 rounded-lg bg-white/90 dark:bg-[#182229]/90 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
                    {formatDateDivider(msg.created_at)}
                  </span>
                </motion.div>
              ) : null;

              // Stagger delay basado en posición — los primeros mensajes entran
              // más rápido para que la carga se sienta instantánea. Máximo 0.3s.
              const staggerDelay = Math.min(idx * 0.04, 0.3);
              const isAssistant = msg.role === 'assistant';

              // Reacción del cliente (emoji). Hoy llega como una fila de mensaje
              // con el texto "[El cliente reaccionó con X]". En vez de mostrar
              // esa burbuja con corchetes, la renderizamos como un chip discreto
              // estilo WhatsApp. (Pegarla a la burbuja EXACTA requiere que el bot
              // guarde el wa_message_id de sus salientes — pendiente.)
              const reactionMatch = msg.content?.match(/^\[El cliente (?:reaccionó con (.+?)|(quitó su reacción))\]$/);
              if (reactionMatch) {
                // Ya enganchada a su burbuja (badge): ocultamos la fila suelta,
                // conservando el separador de fecha si le tocaba a este mensaje.
                if (consumedReactionIds.has(msg.id)) {
                  return dateDivider ? <Fragment key={msg.id}>{dateDivider}</Fragment> : null;
                }
                const emoji = reactionMatch[1];
                return (
                  <Fragment key={msg.id}>
                    {dateDivider}
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#202c33] border border-black/5 dark:border-white/10 shadow-sm">
                        {emoji && <span className="text-base leading-none">{emoji}</span>}
                        <span className="text-[11px] italic text-slate-500 dark:text-slate-400">
                          {emoji ? 'El cliente reaccionó' : 'El cliente quitó su reacción'}
                        </span>
                      </div>
                    </div>
                  </Fragment>
                );
              }

              return (
                <Fragment key={msg.id}>
                  {dateDivider}
                  <motion.div
                    initial={{ opacity: 0, x: isAssistant ? 24 : -24, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      delay: staggerDelay,
                      duration: 0.28,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`flex group relative ${isAssistant ? 'justify-end' : 'justify-start'}`}
                  >
                  <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2 shadow-sm text-[14px] leading-relaxed relative ${
                    msg.role === 'assistant'
                      ? 'bg-[#d1fae5] dark:bg-[#047857] text-slate-900 dark:text-[#e9edef] rounded-2xl rounded-tr-none'
                      : 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-[#e9edef] rounded-2xl rounded-tl-none'
                  }`}>
                    {/* Botón flotante para Responder al pasar el cursor (WhatsApp style) */}
                    <div className={`absolute top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
                      msg.role === 'assistant' ? '-left-8' : '-right-8'
                    }`}>
                      <button
                        onClick={() => onReply(msg)}
                        className="p-1.5 rounded-full bg-white dark:bg-[#2a3942] text-slate-500 dark:text-slate-300 hover:text-[#10b981] shadow-md border border-slate-200 dark:border-white/10 active:scale-95 transition-all"
                        title="Responder a este mensaje"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Caja de Cita de Mensaje (Estilo WhatsApp Web) */}
                    {quotedText && (
                      <div className="mb-2 p-2 rounded-xl bg-black/10 dark:bg-black/30 border-l-4 border-[#10b981] text-xs">
                        <p className="font-bold text-[#10b981] text-[11px] mb-0.5">{quotedAuthor}</p>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2 italic">{quotedText}</p>
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5 border-b border-black/5 pb-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-[#059669] dark:text-[#10b981]" />
                        <span className="text-[10px] font-bold text-[#059669] dark:text-[#10b981] tracking-wider">{agentLabel(msg.intent)}</span>
                        {msg.audit_trail && Object.keys(msg.audit_trail).length > 0 && (
                          <button 
                            onClick={() => alert(`🔍 Auditoría RAG:\n\n${JSON.stringify(msg.audit_trail, null, 2)}`)} 
                            className="ml-auto flex items-center gap-1 text-[9px] font-bold text-sky-600 bg-sky-100 hover:bg-sky-200 px-1.5 py-0.5 rounded transition-colors"
                            title="Inspeccionar Memoria (RAG)"
                          >
                            <Search className="w-3 h-3" /> Auditar
                          </button>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words">
                      {(() => {
                        if (!mainBody.trim()) {
                          return (
                            <span className="italic text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5" /> Nota de voz o adjunto
                            </span>
                          );
                        }

                        // ── Media estilo WhatsApp: la imagen se muestra grande
                        // dentro de la burbuja y al tocarla se abre en un visor
                        // in-app (sin pestañas nuevas). Si la URL no carga como
                        // imagen (ej. un PDF), ChatImage degrada a un enlace de
                        // documento. Ver componentes ChatImage / ChatVideo.
                        const renderImgBubble = (url: string, key: number) => (
                          <ChatImage key={key} url={url} onOpen={() => onOpenMedia({ type: 'image', url })} />
                        );

                        // ── Parser robusto: extrae segmentos del mensaje ──
                        // Estrategia: encontrar todos los marcadores con sus posiciones exactas
                        // usando exec() para evitar que .split() rompa URLs largas
                        type Segment = { type: 'text' | 'img' | 'video' | 'audio' | 'file'; value: string; };
                        const segments: Segment[] = [];
                        // Regex que captura: [Tipo adjunto/a: URL] o URL directa de imagen
                        const TOKEN_RE = /\[(?:imagen|audio|archivo|video|documento)\s+adjunt[ao]:\s*(https?:\/\/[^\]]+?)\]|((https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp|svg))(?=[\s,"'<>]|$))/gi;
                        let lastIdx = 0;
                        let m: RegExpExecArray | null;
                        while ((m = TOKEN_RE.exec(mainBody)) !== null) {
                          if (m.index > lastIdx) {
                            segments.push({ type: 'text', value: mainBody.slice(lastIdx, m.index) });
                          }
                          const fullMatch = m[0];
                          const bracketUrl = m[1]; // URL dentro de [Tipo adjunto: URL]
                          const directUrl = m[2];  // URL directa de imagen
                          const url = (bracketUrl ?? directUrl ?? '').trim();
                          if (/imagen/i.test(fullMatch)) {
                            segments.push({ type: 'img', value: url });
                          } else if (/video/i.test(fullMatch)) {
                            segments.push({ type: 'video', value: url });
                          } else if (/audio/i.test(fullMatch)) {
                            segments.push({ type: 'audio', value: url });
                          } else if (directUrl) {
                            segments.push({ type: 'img', value: url });
                          } else {
                            segments.push({ type: 'file', value: url });
                          }
                          lastIdx = m.index + fullMatch.length;
                        }
                        // Texto restante después del último marcador
                        if (lastIdx < mainBody.length) {
                          const tail = mainBody.slice(lastIdx);
                          // Ocultar URLs crudas de Supabase storage que son el adjunto real
                          if (/https?:\/\/[^\s]+\/storage\/v1\/object\/public\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)/i.test(tail)) {
                            const supabaseMatch = tail.match(/https?:\/\/[^\s]+\/storage\/v1\/object\/public\/[^\s]+/i);
                            if (supabaseMatch) segments.push({ type: 'img', value: supabaseMatch[0].trim() });
                          } else {
                            segments.push({ type: 'text', value: tail });
                          }
                        }

                        // Si no se encontró NINGÚN marcador, renderizar como texto plano
                        if (segments.length === 0) return <span>{renderTextWithLinks(mainBody)}</span>;

                        return segments.map((seg, i) => {
                          if (!seg.value.trim()) return null;

                          // 1. Imagen
                          if (seg.type === 'img') {
                            return renderImgBubble(seg.value, i);
                          }

                          // 1b. Video — miniatura con botón play; se reproduce en el visor in-app
                          if (seg.type === 'video') {
                            return <ChatVideo key={i} url={seg.value} onOpen={() => onOpenMedia({ type: 'video', url: seg.value })} />;
                          }

                          // 2. Audio (WhatsApp OGG/OPUS — necesita múltiples sources para compatibilidad)
                          if (seg.type === 'audio') {
                            const audioUrl = seg.value;
                            // Determinar extensión para el type correcto
                            const ext = audioUrl.split('?')[0].split('.').pop()?.toLowerCase() ?? 'ogg';
                            const mimeMap: Record<string, string> = {
                              ogg: 'audio/ogg; codecs=opus',
                              oga: 'audio/ogg; codecs=opus',
                              opus: 'audio/ogg; codecs=opus',
                              mp3: 'audio/mpeg',
                              mp4: 'audio/mp4',
                              m4a: 'audio/mp4',
                              wav: 'audio/wav',
                              webm: 'audio/webm',
                            };
                            const primaryMime = mimeMap[ext] ?? 'audio/ogg; codecs=opus';
                            return <WhatsAppAudioPlayer key={i} src={audioUrl} primaryMime={primaryMime} />;
                          }

                          // 3. Archivo genérico
                          if (seg.type === 'file') {
                            if (/\.(?:png|jpg|jpeg|gif|webp|svg)(?:[?#]|$)/i.test(seg.value)) {
                              return renderImgBubble(seg.value, i);
                            }
                            if (/\.(?:mp4|webm|mov|m4v|3gp)(?:[?#]|$)/i.test(seg.value)) {
                              return <ChatVideo key={i} url={seg.value} onOpen={() => onOpenMedia({ type: 'video', url: seg.value })} />;
                            }
                            return (
                              <a key={i} href={seg.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 my-1 px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-medium text-[#059669] dark:text-[#10b981] transition-colors">
                                <Paperclip className="w-4 h-4 shrink-0" /> Ver archivo adjunto
                              </a>
                            );
                          }

                          // 4. Texto plano (con URLs clicables)
                          return <span key={i}>{renderTextWithLinks(seg.value)}</span>;
                        });
                      })()}
                    </div>

                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                      msg.role === 'assistant' ? 'text-emerald-700/60 dark:text-emerald-200/50' : 'text-slate-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      {msg.role === 'assistant' && (
                        <span className="text-[#10b981] font-bold ml-0.5 text-[11px]">✓✓</span>
                      )}
                    </div>

                    {/* Reacción del cliente pegada a ESTA burbuja (estilo WhatsApp) */}
                    {msg.wa_message_id && reactionByTargetWaId.has(msg.wa_message_id) && (
                      <div className={`absolute -bottom-3 z-10 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full bg-white dark:bg-[#2a3942] border border-black/5 dark:border-white/10 shadow-md text-[13px] leading-none ${
                        msg.role === 'assistant' ? 'left-2' : 'right-2'
                      }`}>
                        {reactionByTargetWaId.get(msg.wa_message_id)}
                      </div>
                    )}
                  </div>
                </motion.div>
                </Fragment>
              );
            })}
            </>
          )}
    </>
  );
});

function ConversationPanel({
  conv,
  messages,
  loading,
  onClose,
  onTogglePause,
  toggling,
  onSendTip,
  onSaveName,
  onSaveProfile,
  onToggleSupplier,
  onSaveQualification,
  duplicateNames,
  companyConfig
}: {
  conv: Conversation;
  messages: Message[];
  loading: boolean;
  onClose: () => void;
  onTogglePause: () => void;
  toggling: boolean;
  onSendTip: (tip: string) => Promise<void>;
  onSaveName: (newName: string) => Promise<void>;
  onSaveProfile: (newProfile: string) => Promise<void>;
  onToggleSupplier: () => Promise<void>;
  onSaveQualification: (newQual: string) => Promise<void>;
  duplicateNames: Set<string>;
  companyConfig?: any;
}) {
  const isPaused = conv.status === 'paused' || conv.status === 'human';
  const displayName = getDisplayName(conv, duplicateNames);
  const [tip, setTip] = useState('');
  const [sendingTip, setSendingTip] = useState(false);
  const [tipSent, setTipSent] = useState(false);
  // Varios adjuntos a la vez (documentos e imágenes). Cada uno se envía como su
  // propio mensaje de WhatsApp, en orden, reutilizando el endpoint send-manual.
  const [attachments, setAttachments] = useState<{ id: string; name: string; base64: string; mimeType: string; previewUrl: string }[]>([]);
  // Visor de media in-app (imagen/video) — se abre sobre el chat, sin salir ni
  // abrir pestañas nuevas (imita a WhatsApp).
  const [mediaViewer, setMediaViewer] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reacciones enganchadas a su burbuja: mapa wa_message_id_objetivo → emoji, y
  // set de filas-reacción "consumidas" (se ocultan porque ya se muestran como
  // badge sobre la burbuja correcta). Si el mensaje objetivo NO está cargado
  // (ej. saliente viejo sin wa_message_id), la reacción no se consume y cae al
  // chip de respaldo — nunca se adivina la burbuja.
  const { reactionByTargetWaId, consumedReactionIds } = useMemo(() => {
    const byTarget = new Map<string, string>();
    const consumed = new Set<string>();
    const waIds = new Set(messages.map(m => m.wa_message_id).filter(Boolean) as string[]);
    for (const m of messages) {
      const rm = m.content?.match(/^\[El cliente (?:reaccionó con (.+?)|quitó su reacción)\]$/);
      if (!rm || !m.reacted_to_wa_id || !waIds.has(m.reacted_to_wa_id)) continue;
      const emoji = rm[1];
      if (emoji) byTarget.set(m.reacted_to_wa_id, emoji);
      else byTarget.delete(m.reacted_to_wa_id); // el cliente quitó la reacción
      consumed.add(m.id);
    }
    return { reactionByTargetWaId: byTarget, consumedReactionIds: consumed };
  }, [messages]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [schedForm, setSchedForm] = useState({ summary: '', date: '', time: '', durationMinutes: 60, location: '', addMeet: true });
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordCancelledRef = useRef(false);
  
  // States for Profile & Name Edit
  const [showProfile, setShowProfile] = useState(false);
  // En móvil, las acciones secundarias del header (calificar, proveedor, agendar,
  // perfil, orden) se agrupan en este menú "⋮" para que Pausar quede siempre
  // visible y el nombre no se apriete. En desktop se muestran inline.
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(conv.contact_name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileText, setEditProfileText] = useState(conv.client_profile || '');

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sortMsgDesc, setSortMsgDesc] = useState(false);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return sortMsgDesc ? tb - ta : ta - tb;
    });
  }, [messages, sortMsgDesc]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-crecer el campo de mensaje: sube la barra hasta el máximo (≈4 líneas en
  // móvil/tablet, más en PC vía max-h responsivo del CSS) y de ahí hace scroll.
  // Se recalcula al escribir y al limpiar el texto (envío), reseteando la altura.
  const tipRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [tip]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 120);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [replyMode, setReplyMode] = useState<'ai' | 'human'>('human');
  
  const handleSendTip = async () => {
    if (!tip.trim()) return;
    setSendingTip(true);
    await onSendTip(tip.trim());
    setTip('');
    setSendingTip(false);
    setTipSent(true);
    setTimeout(() => setTipSent(false), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = ''; // permitir re-seleccionar el mismo archivo
    if (files.length === 0) return;
    for (const file of files) {
      // Límite defensivo (~16MB, tope típico de media de WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        alert(`"${file.name}" supera los 16MB permitidos por WhatsApp y no se adjuntó.`);
        continue;
      }
      const dataUrl = await blobToDataUrl(file);
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setAttachments((prev) => [...prev, { id: makeAttachmentId(), name: file.name, base64, mimeType: file.type || 'application/octet-stream', previewUrl: dataUrl }]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > 16 * 1024 * 1024) {
            alert('La imagen pegada supera los 16MB permitidos.');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || '');
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            // Cuando se pega una captura, file.name suele ser "image.png"
            setAttachments((prev) => [...prev, { id: makeAttachmentId(), name: file.name || 'image.png', base64, mimeType: file.type || 'image/png', previewUrl: dataUrl }]);
          };
          reader.readAsDataURL(file);
          // Evitamos que el navegador intente procesar el paste por defecto si encontramos una imagen
          e.preventDefault(); 
          break;
        }
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const d = String(r.result || ''); resolve(d.includes(',') ? d.split(',')[1] : d); };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  // Id estable por adjunto (para keys de React y para quitarlo de la lista).
  const makeAttachmentId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const stopRecordTimer = () => { if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; } };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];
      const mime = preferred.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recordChunksRef.current = [];
      recordCancelledRef.current = false;
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data); };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (e) {
      console.error(e);
      alert('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    recordCancelledRef.current = true;
    if (mr && mr.state !== 'inactive') { mr.onstop = () => mr.stream?.getTracks().forEach((t) => t.stop()); mr.stop(); }
    stopRecordTimer();
    setIsRecording(false);
    setRecordSecs(0);
  };

  const sendRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    recordCancelledRef.current = false;
    mr.onstop = async () => {
      mr.stream?.getTracks().forEach((t) => t.stop());
      stopRecordTimer();
      setIsRecording(false);
      const secs = recordSecs;
      setRecordSecs(0);
      if (recordCancelledRef.current) return;
      const blob = new Blob(recordChunksRef.current, { type: mr.mimeType || 'audio/webm' });
      if (blob.size === 0 || secs < 1) return;
      setSendingTip(true);
      try {
        const base64 = await blobToBase64(blob);
        let msgPayload = '';
        if (replyingTo) {
          const quotedSender = replyingTo.role === 'assistant' ? 'Usted' : (conv.contact_name || 'Cliente');
          const cleanQuotedText = replyingTo.content?.replace(/\n/g, ' ').slice(0, 70) || 'Adjunto';
          msgPayload = `» ${quotedSender}: "${cleanQuotedText}..."`;
        }
        const res = await fetch(`/api/proxy/conversations/${conv.phone}/send-manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msgPayload || undefined, mediaBase64: base64, mimeType: blob.type, fileName: 'nota-de-voz', voiceNote: true }),
        });
        if (!res.ok) throw new Error('fail');
        setReplyingTo(null);
        setTipSent(true);
        setTimeout(() => setTipSent(false), 3000);
        if (conv.status !== 'paused' && conv.status !== 'human') conv.status = 'human';
      } catch (e) {
        console.error(e);
        alert('Error enviando la nota de voz. Revisa el estado del bot.');
      } finally {
        setSendingTip(false);
      }
    };
    if (mr.state !== 'inactive') mr.stop();
  };

  const handleSendManual = async () => {
    if (sendingTip) return; // evita doble envío si se presiona Enter mientras uno ya está en curso
    const outgoing = tip.trim(); // se preserva por si el envío "falla" (timeout) y hay que reenviar
    const atts = attachments;
    if (!outgoing && atts.length === 0) return;
    setSendingTip(true);

    // El texto (y la cita de respuesta) viajan como caption del PRIMER envío;
    // los adjuntos siguientes van sin caption, como un álbum de WhatsApp.
    let firstMessage = outgoing;
    if (replyingTo) {
      const quotedSender = replyingTo.role === 'assistant' ? 'Usted' : (conv.contact_name || 'Cliente');
      const cleanQuotedText = replyingTo.content?.replace(/\n/g, ' ').slice(0, 70) || 'Adjunto';
      firstMessage = `» ${quotedSender}: "${cleanQuotedText}..."\n${outgoing}`.trim();
    }

    // Cola de envíos, en orden. Sin adjuntos = un solo mensaje de texto.
    type Job = { message?: string; att?: (typeof atts)[number] };
    const jobs: Job[] = atts.length > 0
      ? atts.map((att, i) => ({ message: i === 0 ? (firstMessage || undefined) : undefined, att }))
      : [{ message: firstMessage }];

    // Limpiamos la caja al arrancar: si un envío "falla" por timeout (pero salió),
    // el próximo mensaje NO se acumula con éste (bug de mensajes repetidos). Lo no
    // confirmado se lista abajo para que el usuario decida si reenvía.
    setTip('');
    setAttachments([]);
    setReplyingTo(null);

    let sent = 0;
    const failedLabels: string[] = [];
    let textJobFailed = false;
    // Secuencial a propósito: preserva el orden en WhatsApp y no dispara varios
    // envíos concurrentes sobre el mismo hilo de Baileys.
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]!;
      try {
        const payload: Record<string, string> = {};
        if (job.message) payload.message = job.message;
        if (job.att) { payload.mediaBase64 = job.att.base64; payload.mimeType = job.att.mimeType; payload.fileName = job.att.name; }
        const res = await fetch(`/api/proxy/conversations/${conv.phone}/send-manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('fail');
        sent++;
      } catch (e) {
        console.error(e);
        failedLabels.push(job.att ? job.att.name : 'mensaje de texto');
        if (i === 0 && outgoing) textJobFailed = true;
      }
    }

    // Cualquier envío exitoso ya tomó el control humano → reflejarlo localmente.
    if (sent > 0 && conv.status !== 'paused' && conv.status !== 'human') conv.status = 'human';

    if (failedLabels.length === 0) {
      setTipSent(true);
      setTimeout(() => setTipSent(false), 3000);
    } else {
      const scope = failedLabels.length === jobs.length ? 'el envío' : `${failedLabels.length} de ${jobs.length} envíos`;
      alert(
        `No pudimos confirmar ${scope}. Es posible que SÍ haya salido: revisa el chat antes de reenviar.` +
        `\n\nSin confirmar: ${failedLabels.join(', ')}` +
        (textJobFailed ? `\n\nTu texto (por si necesitas reenviarlo):\n"${outgoing}"` : '')
      );
    }
    setSendingTip(false);
  };

  const handleSaveName = async () => {
    if (editName.trim() !== conv.contact_name) {
      await onSaveName(editName.trim());
    }
    setIsEditingName(false);
  };

  const handleSchedule = async () => {
    if (!schedForm.date || !schedForm.time) { alert('Indica fecha y hora.'); return; }
    setScheduling(true);
    try {
      const startISO = new Date(`${schedForm.date}T${schedForm.time}`).toISOString();
      const summary = schedForm.summary.trim() || `Reunión con ${conv.contact_name || 'cliente'}`;

      // 1. Crear el evento en Google Calendar (con Meet si corresponde)
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          start: startISO,
          durationMinutes: schedForm.durationMinutes,
          location: schedForm.location,
          addMeet: schedForm.addMeet,
          description: `Agendado desde el panel para ${conv.contact_name || conv.phone} (${conv.phone}).`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === 'no_linked_account'
        ? 'No hay una cuenta de Google vinculada. Vincúlala en Configuración → Calendario.'
        : (data.error || 'No se pudo crear el evento.'));

      const meet = data.event?.hangoutLink || '';

      // 2. Confirmar al cliente por WhatsApp (queda en el timeline y pausa el bot)
      const fecha = new Date(startISO).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
      const msg = `✅ *Reunión/Visita Agendada*\n\n📌 *Asunto:* ${summary}\n📅 *Fecha:* ${fecha}` +
        (schedForm.location ? `\n📍 *Ubicación:* ${schedForm.location}` : '') +
        (meet ? `\n🎥 *Google Meet:* ${meet}` : '') +
        `\n\n¡Te esperamos! Si necesitas reprogramar, avísanos por aquí.`;
      await fetch(`/api/proxy/conversations/${conv.phone}/send-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      setShowSchedule(false);
      setSchedForm({ summary: '', date: '', time: '', durationMinutes: 60, location: '', addMeet: true });
      if (conv.status !== 'paused' && conv.status !== 'human') conv.status = 'human';
      alert('Reunión agendada y confirmada al cliente ✅');
    } catch (e: any) {
      console.error(e);
      alert(`Error al agendar: ${e.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const handleSaveProfile = async () => {
    await onSaveProfile(editProfileText);
    setIsEditingProfile(false);
  };

  return (
    <div className="flex-1 flex relative h-full min-h-0 min-w-0 w-full overflow-hidden bg-[#f0f2f5] dark:bg-[#111b21]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-h-0 min-w-0 w-full">
        {/* Header — WhatsApp style */}
        <div className="flex items-center justify-between px-3 md:px-5 py-3.5 bg-[#059669] dark:bg-[#202c33] shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button onClick={onClose} className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/90 active:scale-95 shrink-0">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white/20 shrink-0 ${avatarColor(conv.phone)}`}>
              {avatarInitial(conv.contact_name || conv.phone)}
            </div>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 z-20 min-w-0 max-w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 rounded-lg text-sm text-slate-900 focus:outline-none w-full max-w-[160px] sm:max-w-[200px] shadow-inner font-medium"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-md active:scale-95 transition-all"
                    title="Guardar nombre"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-white/80 hover:text-white p-1 shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group min-w-0">
                  <p className="font-bold text-white text-[15px] leading-tight truncate">
                    {displayName}
                  </p>
                  <button
                    onClick={() => { setEditName(conv.contact_name || ''); setIsEditingName(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <p className="text-xs text-white/70 font-medium whitespace-nowrap shrink-0">{formatPhone(conv.phone)}</p>
                {/* Un LID de WhatsApp que el bot no logró resolver a un número real —
                    no es el número de teléfono del cliente. Se rotula honestamente en
                    vez de mostrarlo como si fuera un dato confiable. */}
                {isUnresolvedLid(conv.phone) && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(conv.phone.replace(/[^0-9]/g, ''));
                      alert('Identificador interno de WhatsApp copiado (no es el número de teléfono real del cliente): ' + conv.phone.replace(/[^0-9]/g, ''));
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-[10px] text-amber-200 hover:text-amber-100 transition-all shadow-sm border border-amber-400/30"
                    title="El bot aún no resolvió el número real de este contacto — esto es un identificador interno de WhatsApp, no su teléfono"
                  >
                    <AlertTriangle className="w-3 h-3" /> Número sin verificar
                  </button>
                )}
                <p className="text-xs text-white/70 font-medium truncate">· {conv.is_supplier ? 'Proveedor' : (INTENT_LABELS[conv.last_intent ?? ''] ?? '—')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Acciones secundarias — barra inline SOLO en desktop (md+) */}
            <div className="hidden md:flex items-center gap-1">
              <select
                value={conv.qualification || 'unqualified'}
                onChange={(e) => onSaveQualification(e.target.value)}
                className={`text-xs font-bold px-2 py-1.5 rounded-full outline-none transition-colors appearance-none cursor-pointer text-center mr-1 ${QUALIFICATIONS[conv.qualification as keyof typeof QUALIFICATIONS]?.color || QUALIFICATIONS.unqualified.color}`}
                title="Calificación del Lead"
              >
                {Object.entries(QUALIFICATIONS).map(([key, q]) => (
                  <option key={key} value={key} className="text-slate-900 font-medium">
                    {q.emoji} {q.label}
                  </option>
                ))}
              </select>
              <button
                onClick={onToggleSupplier}
                className={`flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 ${conv.is_supplier ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-white/80 hover:bg-white/10 border border-transparent'}`}
                title="Marcar como Proveedor"
              >
                <Store className="w-4 h-4" />
                <span className="hidden lg:inline">{conv.is_supplier ? 'Proveedor' : 'Marcar Proveedor'}</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5 lg:mx-1"></div>
              <button
                onClick={() => setShowSchedule(true)}
                className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-xs font-bold rounded-full text-white/80 hover:bg-white/10 transition-all active:scale-95"
                title="Agendar reunión/visita y avisar al cliente"
              >
                <CalendarClock className="w-4 h-4" />
                <span className="hidden lg:inline">Agendar</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5 lg:mx-1"></div>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 ${showProfile ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                title="Analizador de Perfil"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline">{showProfile ? 'Ocultar Ojo' : 'Perfil IA'}</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5 lg:mx-1"></div>
              <button
                onClick={() => setSortMsgDesc(!sortMsgDesc)}
                className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-xs font-bold rounded-full text-white/80 hover:bg-white/10 transition-all active:scale-95"
                title={sortMsgDesc ? 'Viendo más recientes primero' : 'Viendo más antiguos primero'}
              >
                <Filter className={`w-4 h-4 transition-transform ${sortMsgDesc ? 'rotate-180' : ''}`} />
                <span className="hidden lg:inline">{sortMsgDesc ? 'Recientes' : 'Antiguos'}</span>
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5 lg:mx-1"></div>
            </div>

            {/* Pausar / Reactivar — SIEMPRE visible (acción principal, también en móvil) */}
            <button
              onClick={onTogglePause}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                isPaused
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] hover:shadow-[0_0_20px_rgba(52,211,153,0.7)] animate-pulse hover:animate-none'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPaused ? <Play className="w-3.5 h-3.5 fill-current drop-shadow-md" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden sm:inline drop-shadow-md">{isPaused ? 'Reactivar IA' : 'Pausar'}</span>
            </button>

            {/* Menú "⋮" — SOLO móvil: agrupa las acciones secundarias */}
            <div className="relative md:hidden shrink-0">
              <button
                onClick={() => setShowHeaderMenu((v) => !v)}
                className={`p-2 rounded-full transition-colors active:scale-95 ${showHeaderMenu ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'}`}
                title="Más opciones"
                aria-label="Más opciones"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showHeaderMenu && (
                <>
                  {/* Backdrop para cerrar al tocar afuera */}
                  <div className="fixed inset-0 z-30" onClick={() => setShowHeaderMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-60 rounded-2xl bg-white dark:bg-[#233138] shadow-xl border border-black/5 dark:border-white/10 overflow-hidden py-1 text-slate-700 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Calificación del lead */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Calificación</span>
                      <select
                        value={conv.qualification || 'unqualified'}
                        onChange={(e) => { onSaveQualification(e.target.value); setShowHeaderMenu(false); }}
                        className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 outline-none cursor-pointer"
                        title="Calificación del Lead"
                      >
                        {Object.entries(QUALIFICATIONS).map(([key, q]) => (
                          <option key={key} value={key} className="text-slate-900 font-medium">
                            {q.emoji} {q.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => { onToggleSupplier(); setShowHeaderMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Store className={`w-4 h-4 ${conv.is_supplier ? 'text-indigo-500' : 'text-slate-400'}`} />
                      {conv.is_supplier ? 'Quitar Proveedor' : 'Marcar Proveedor'}
                    </button>
                    <button
                      onClick={() => { setShowSchedule(true); setShowHeaderMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <CalendarClock className="w-4 h-4 text-slate-400" /> Agendar visita
                    </button>
                    <button
                      onClick={() => { setShowProfile((v) => !v); setShowHeaderMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Eye className={`w-4 h-4 ${showProfile ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {showProfile ? 'Ocultar Perfil IA' : 'Perfil IA'}
                    </button>
                    <button
                      onClick={() => { setSortMsgDesc((v) => !v); setShowHeaderMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Filter className={`w-4 h-4 text-slate-400 transition-transform ${sortMsgDesc ? 'rotate-180' : ''}`} />
                      {sortMsgDesc ? 'Ver antiguos primero' : 'Ver recientes primero'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={onClose} className="hidden md:block p-2 ml-1 rounded-full hover:bg-white/10 transition-colors text-white/80 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isPaused && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-200/40 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Chat en pausa — intervención humana requerida</span>
          </div>
        )}

        {/* Historial — fondo wallpaper estilo WhatsApp */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3 relative min-h-0 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ backgroundColor: '#e8ede8', backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d8c8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        >
          <ChatMessageList
            loading={loading}
            messages={messages}
            sortedMessages={sortedMessages}
            consumedReactionIds={consumedReactionIds}
            reactionByTargetWaId={reactionByTargetWaId}
            onReply={setReplyingTo}
            onOpenMedia={setMediaViewer}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Botón flotante Scroll-to-Bottom — estilo Apple/WhatsApp */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              key="scroll-btn"
              initial={{ opacity: 0, scale: 0.7, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 12 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={scrollToBottom}
              className="absolute bottom-[72px] right-4 z-30 w-11 h-11 rounded-full bg-white dark:bg-[#202c33] shadow-[0_4px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-black/8 dark:border-white/10 flex items-center justify-center text-[#059669] dark:text-[#10b981] hover:scale-110 active:scale-95 transition-transform"
              aria-label="Ir al mensaje más reciente"
              title="Ir al mensaje más reciente"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3.5V16.5M10 16.5L5 11.5M10 16.5L15 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Footer: Composer estilo WhatsApp Web */}
        <div className="shrink-0 border-t border-slate-200/60 dark:border-white/10 bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col">
          {/* Dual Mode Tabs */}
          <div className="flex border-b border-slate-200/60 dark:border-white/5">
            <button
              onClick={() => setReplyMode('human')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                replyMode === 'human' ? 'bg-[#10b981]/10 text-[#059669] dark:text-[#10b981] border-b-2 border-[#10b981]' : 'text-slate-500 hover:bg-black/5'
              }`}
            >
              Intervenir (Manual)
            </button>
            <button
              onClick={() => setReplyMode('ai')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                replyMode === 'ai' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500' : 'text-slate-500 hover:bg-black/5'
              }`}
            >
              Instruir IA (Secreto)
            </button>
          </div>

          <div className="p-2.5">
            {/* Banner de Mensaje Citado (Responder estilo WhatsApp Web) */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-white dark:bg-[#2a3942] rounded-xl border-l-4 border-[#10b981] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#10b981] mb-0.5">
                    <Reply className="w-3.5 h-3.5" />
                    <span>Respondiendo a {replyingTo.role === 'assistant' ? 'Usted / IA' : displayName}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                    "{replyingTo.content || 'Adjunto'}"
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Cancelar respuesta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Actions Bar (Emojis & Canned Responses) */}
            {showEmojiPicker && (
              <div className="flex flex-col gap-2 p-2.5 bg-white/90 dark:bg-[#111b21]/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 mb-2 animate-in fade-in zoom-in-95 duration-150 relative z-20">
                {/* Emojis */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100 dark:border-white/5">
                  {['👍', '❤️', '😂', '😲', '😢', '🙏', '🔥', '✅', '👋', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setTip((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1 shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Canned Responses */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-hide">
                  <button
                    onClick={() => {
                      const msg = `¡Hola! Te damos la bienvenida a ${companyConfig?.name || 'nuestra empresa'}. ¿En qué te podemos ayudar hoy?`;
                      setTip((prev) => prev + (prev ? ' ' : '') + msg);
                      setShowEmojiPicker(false);
                    }}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-bold hover:bg-sky-500/20 transition-colors"
                  >
                    👋 Saludo
                  </button>
                  {companyConfig?.instagram_url && (
                    <button
                      onClick={() => {
                        setTip((prev) => prev + (prev ? ' ' : '') + `Síguenos en Instagram oficial: ${companyConfig.instagram_url}`);
                        setShowEmojiPicker(false);
                      }}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 text-xs font-bold hover:bg-pink-500/20 transition-colors"
                    >
                      📸 Instagram
                    </button>
                  )}
                  {companyConfig?.tiktok_url && (
                    <button
                      onClick={() => {
                        setTip((prev) => prev + (prev ? ' ' : '') + `Mira nuestro TikTok oficial: ${companyConfig.tiktok_url}`);
                        setShowEmojiPicker(false);
                      }}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/10 text-slate-800 dark:text-slate-300 border border-slate-500/20 text-xs font-bold hover:bg-slate-800/20 transition-colors"
                    >
                      🎵 TikTok
                    </button>
                  )}
                  {companyConfig?.website_url && (
                    <button
                      onClick={() => {
                        setTip((prev) => prev + (prev ? ' ' : '') + `Visita nuestro sitio web oficial: ${companyConfig.website_url}`);
                        setShowEmojiPicker(false);
                      }}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                    >
                      🌐 Sitio Web
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Preview de los adjuntos (solo modo manual) — varios a la vez */}
            {replyMode === 'human' && attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 px-1">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-white dark:bg-[#2a3942] rounded-xl px-2 py-1.5 shadow-sm max-w-full">
                    {att.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={att.previewUrl} alt={att.name} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{att.name}</span>
                    <button onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))} className="text-slate-400 hover:text-red-500 transition-colors" title="Quitar adjunto">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {attachments.length > 1 && (
                  <button onClick={() => setAttachments([])} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors px-1" title="Quitar todos">
                    Quitar todos ({attachments.length})
                  </button>
                )}
              </div>
            )}

            {replyMode === 'human' && isRecording ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="flex items-center justify-center w-[40px] h-[40px] rounded-full text-red-500 hover:bg-red-500/10 active:scale-95 transition-all shrink-0"
                  title="Cancelar grabación"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2 px-4 h-[40px] bg-white dark:bg-[#2a3942] rounded-2xl shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-slate-700 dark:text-slate-200 tabular-nums">{`${Math.floor(recordSecs / 60)}:${String(recordSecs % 60).padStart(2, '0')}`}</span>
                  <span className="text-xs text-slate-400 ml-1">Grabando nota de voz…</span>
                </div>
                <button
                  onClick={sendRecording}
                  disabled={sendingTip}
                  className="flex items-center justify-center w-[40px] h-[40px] rounded-full text-white bg-[#10b981] hover:bg-[#008f6f] active:scale-95 transition-all disabled:opacity-50 shadow-md shrink-0"
                  title="Enviar nota de voz"
                >
                  {sendingTip ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5 -ml-0.5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Botones izquierdos estilo WhatsApp Web (+ y 😄) */}
                {replyMode === 'human' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-slate-500 hover:text-[#10b981] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
                      title="Adjuntar archivo o imagen"
                    >
                      <Plus className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-slate-500 hover:text-[#10b981] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
                      title="Emojis rápidos"
                    >
                      <Smile className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                  </>
                )}

                {/* Input de Texto */}
                <div className="flex-1">
                  <textarea
                    ref={tipRef}
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (replyMode === 'human') handleSendManual();
                        else handleSendTip();
                      }
                    }}
                    rows={1}
                    placeholder={replyMode === 'human' ? 'Escribe un mensaje...' : 'Ej: Ofrece un 10% de descuento...'}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#2a3942] border-0 rounded-2xl text-sm leading-5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981] shadow-sm resize-none transition-[height] duration-100 min-h-[40px] max-h-[116px] md:max-h-[148px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full"
                  />
                </div>

                {/* Botón Derecho: Micrófono cuando está vacío vs Enviar cuando hay texto */}
                {replyMode === 'human' ? (
                  (tip.trim() || attachments.length > 0) ? (
                    <button
                      onClick={handleSendManual}
                      disabled={sendingTip}
                      className="flex items-center justify-center w-[40px] h-[40px] rounded-full text-white bg-[#10b981] hover:bg-[#008f6f] active:scale-95 transition-all disabled:opacity-50 shadow-md shrink-0"
                      title="Enviar mensaje"
                    >
                      {sendingTip ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5 -ml-0.5" />}
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="flex items-center justify-center w-[40px] h-[40px] rounded-full text-slate-500 dark:text-slate-300 hover:text-[#10b981] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all shrink-0"
                      title="Grabar nota de voz"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleSendTip}
                    disabled={sendingTip || !tip.trim()}
                    className="flex items-center justify-center px-4 py-2 rounded-2xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all disabled:opacity-50 shadow-md shrink-0 gap-1.5"
                  >
                    {sendingTip ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                    <span>Instruir</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Agendar reunión/visita */}
      {showSchedule && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50" onClick={() => !scheduling && setShowSchedule(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#059669] dark:bg-[#111b21] text-white">
              <div className="flex items-center gap-2 font-bold text-sm"><CalendarClock className="w-4 h-4" /> Agendar con {displayName}</div>
              <button onClick={() => !scheduling && setShowSchedule(false)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Asunto</label>
                <input type="text" value={schedForm.summary} onChange={(e) => setSchedForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder={`Reunión con ${conv.contact_name || 'cliente'}`}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2a3942] text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fecha</label>
                  <input type="date" value={schedForm.date} onChange={(e) => setSchedForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2a3942] text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hora</label>
                  <input type="time" value={schedForm.time} onChange={(e) => setSchedForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2a3942] text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Duración (min)</label>
                  <input type="number" min={15} step={15} value={schedForm.durationMinutes} onChange={(e) => setSchedForm(f => ({ ...f, durationMinutes: Number(e.target.value) || 60 }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2a3942] text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ubicación</label>
                  <input type="text" value={schedForm.location} onChange={(e) => setSchedForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Taller / dirección"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2a3942] text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={schedForm.addMeet} onChange={(e) => setSchedForm(f => ({ ...f, addMeet: e.target.checked }))} className="accent-[#10b981] w-4 h-4" />
                Añadir enlace de Google Meet
              </label>
              <p className="text-[11px] text-slate-400">Se crea el evento en tu Google Calendar y se le confirma automáticamente al cliente por WhatsApp.</p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowSchedule(false)} disabled={scheduling}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50">Cancelar</button>
                <button onClick={handleSchedule} disabled={scheduling}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#10b981] hover:bg-[#008f6f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                  {scheduling ? 'Agendando…' : 'Agendar y avisar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Sidebar (El Ojo) */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden shadow-2xl relative z-20"
          >
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-transparent flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 shadow-sm border border-sky-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm tracking-wide">Perfil IA</h3>
              </div>
              <button 
                onClick={() => {
                  if (isEditingProfile) handleSaveProfile();
                  else { setEditProfileText(conv.client_profile || ''); setIsEditingProfile(true); }
                }}
                className="text-xs font-medium text-[#10b981] hover:text-[#008f6f] px-2 py-1 rounded hover:bg-[#10b981]/10 transition-colors"
              >
                {isEditingProfile ? 'Guardar' : 'Editar'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isEditingProfile ? (
                <textarea
                  value={editProfileText}
                  onChange={(e) => setEditProfileText(e.target.value)}
                  className="w-full h-full min-h-[300px] p-3 text-sm bg-slate-50 dark:bg-[#2a3942] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono text-slate-700 dark:text-slate-300"
                  placeholder="## Notas del Cliente..."
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert prose-emerald max-w-none">
                  {conv.client_profile ? (
                    <ReactMarkdown>{conv.client_profile}</ReactMarkdown>
                  ) : (
                    <div className="text-center mt-10 opacity-50">
                      <User className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                      <p>El sub-agente perfilador aún no ha analizado este chat.</p>
                      <p className="text-xs mt-2">Se genera automáticamente tras algunos mensajes.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visor de media in-app — imagen a tamaño completo o video reproducible,
          todo dentro de la misma pantalla (no abre pestañas ni redirige). */}
      <AnimatePresence>
        {mediaViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMediaViewer(null)}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <button
              onClick={() => setMediaViewer(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <div onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[88vh] flex items-center justify-center">
              {mediaViewer.type === 'image' ? (
                <img src={mediaViewer.url} alt="Adjunto" className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl" />
              ) : (
                <video src={mediaViewer.url} controls autoPlay playsInline className="max-w-[92vw] max-h-[88vh] rounded-lg shadow-2xl bg-black" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────
export default function ConversationsPageClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Con un chat abierto en móvil, el panel ocupa toda la pantalla y el dock
  // inferior (CapsuleNav) tapaba el input. Marcamos <body> para que el CSS lo
  // oculte SOLO en móvil (ver globals.css). En desktop no aplica: el dock queda.
  useEffect(() => {
    document.body.classList.toggle('chat-open', !!selected);
    return () => document.body.classList.remove('chat-open');
  }, [selected]);

  // Botón "atrás" del teléfono (Android): con un chat abierto en móvil, debe
  // VOLVER A LA LISTA, no salir de toda la app. Al abrir un chat empujamos una
  // entrada de historial; el "atrás" del sistema la saca y disparamos popstate,
  // que cierra el chat. El ← del header cierra vía history.back() (handleCloseChat)
  // para consumir esa misma entrada y no dejar un "atrás fantasma".
  const chatHistoryPushed = useRef(false);
  useEffect(() => {
    if (!selected) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;
    window.history.pushState({ atmChatOpen: true }, '');
    chatHistoryPushed.current = true;
    const onPop = () => {
      chatHistoryPushed.current = false;
      setSelected(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [selected]);

  // Cierre unificado del chat: si empujamos historial (móvil), volvemos con
  // history.back() para consumir esa entrada; si no, cerramos directo (desktop).
  const handleCloseChat = useCallback(() => {
    if (chatHistoryPushed.current) window.history.back();
    else setSelected(null);
  }, []);

  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'hitl' | 'active' | 'supplier' | 'closed' | 'today'>('all');
  const [sortConvAsc, setSortConvAsc] = useState(false);
  const itemsPerPage = 20;
  // Backoff persistente entre re-montajes del efecto: si vive dentro del efecto
  // se resetea cada vez que cambia `selected` y el 429 nunca cede.
  const convBackoffRef = useRef(CONVERSATIONS_POLL_MS);
  const msgBackoffRef = useRef(MESSAGES_POLL_MS);

  useEffect(() => {
    setMounted(true);
    fetch('/api/proxy/config').then(r => r.json()).then(data => setCompanyConfig(data)).catch(() => {});
    if (phoneParam && conversations.length > 0 && !selected) {
      const conv = conversations.find(c => c.phone === phoneParam);
      if (conv) {
        setSelected(conv);
      }
    }
  }, [phoneParam, conversations, selected]);

  // Reset page when switching views or applying search/filters
  useEffect(() => { setCurrentPage(1); }, [viewMode, searchTerm, statusFilter]);

  const forceGenerateSummaries = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/proxy/conversations/backfill-summaries', { method: 'POST' });
      const data = await res.json();
      if (data.count > 0) {
        alert(`⏳ Procesando ${data.count} chats en segundo plano.\n\nEsto tomará aproximadamente ${Math.ceil((data.count * 3) / 60)} minuto(s) para proteger la API de IA.\n\nLos resúmenes irán apareciendo solos, no cierres el bot.`);
        let ticks = 0;
        const interval = setInterval(() => {
          fetchConversations(true);
          ticks++;
          if (ticks > 10) clearInterval(interval);
        }, 3000);
      } else {
        alert(`✅ ¡Todo al día! Todos los chats con mensajes ya tienen su resumen IA.`);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Hubo un error de conexión con el bot. ¿Actualizaste el VPS con git pull?');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const fetchConversations = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const res = await fetch('/api/proxy/conversations');
      if (res.status === 429) {
        convBackoffRef.current = nextBackoff(res, convBackoffRef.current);
        return;
      }
      if (res.ok) {
        convBackoffRef.current = CONVERSATIONS_POLL_MS;
        const data = await res.json() as Conversation[];
        // ANTI-PARPADEO: Solo actualizar estado si los datos cambiaron realmente
        setConversations(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
        setSelected(prev => {
          if (!prev) return prev;
          const fresh = data.find((c) => c.id === prev.id);
          if (!fresh) return prev;
          if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
          return { ...prev, ...fresh };
        });
      }
    } catch { /* offline */ }
    finally { if (!quiet) setRefreshing(false); }
  }, []);

  // Helper para desduplicar mensajes en la interfaz
  const deduplicateMessages = useCallback((msgs: Message[]): Message[] => {
    const seen = new Set<string>();
    const result: Message[] = [];
    for (const m of msgs) {
      const key = m.id ? String(m.id) : `${m.created_at}_${m.role}_${m.content?.slice(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(m);
      }
    }
    return result;
  }, []);

  // Poll de la lista de conversaciones. Usa setTimeout encadenado (no setInterval)
  // para poder ceder terreno cuando el bot responde 429, y se congela mientras la
  // pestaña está en segundo plano.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (!document.hidden) await fetchConversations(true);
      if (!cancelled) timeoutId = setTimeout(tick, convBackoffRef.current);
    };

    timeoutId = setTimeout(tick, convBackoffRef.current);

    // Al volver a la pestaña, refrescar de inmediato en vez de esperar el ciclo.
    const onVisible = () => {
      if (document.hidden || cancelled) return;
      convBackoffRef.current = CONVERSATIONS_POLL_MS;
      void fetchConversations(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchConversations]);

  // Sólo el ID gobierna el ciclo de mensajes. Antes la dependencia era el objeto
  // `selected` completo, y como el poll de la lista lo reemplaza por una identidad
  // nueva cada vez que llega un mensaje, el efecto se remontaba constantemente:
  // cada remontaje disparaba un fetch fuera de ciclo y reseteaba el backoff.
  const selectedId = selected?.id ?? null;

  // Polling de mensajes del chat activo con backoff en 429.
  useEffect(() => {
    // Limpiar de inmediato al cambiar de chat: si no, la burbuja del chat
    // anterior queda pintada bajo el header del nuevo (chats "mezclados").
    setMessages([]);
    if (!selectedId) return;

    let cancelled = false;
    let isFirstRun = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    setLoadingMsgs(true);
    // Ojo: NO se resetea msgBackoffRef aquí. Si el bot nos está limitando,
    // cambiar de chat no debe devolvernos al ritmo agresivo — la primera carga
    // es inmediata igual, y un 200 restaura el intervalo normal por sí solo.

    const poll = async () => {
      // La primera carga se hace siempre: si el usuario abre un chat y cambia de
      // pestaña, saltarla dejaría el spinner colgado indefinidamente.
      if (document.hidden && !isFirstRun) {
        if (!cancelled) timeoutId = setTimeout(poll, msgBackoffRef.current);
        return;
      }
      isFirstRun = false;
      try {
        const res = await fetch(`/api/proxy/conversations/${selectedId}/messages`, {
          signal: controller.signal,
        });
        // La respuesta puede llegar después de que el usuario cambió de chat:
        // descartarla en vez de pintarla sobre la conversación equivocada.
        if (cancelled) return;
        if (res.status === 429) {
          msgBackoffRef.current = nextBackoff(res, msgBackoffRef.current);
        } else if (res.ok) {
          msgBackoffRef.current = MESSAGES_POLL_MS;
          const rawData = await res.json() as Message[];
          if (cancelled) return;
          const cleanData = deduplicateMessages(rawData);
          setMessages(prev => {
            if (JSON.stringify(prev) === JSON.stringify(cleanData)) return prev;
            return cleanData;
          });
        }
      } catch { /* offline o abortado al cambiar de chat */ }
      finally { if (!cancelled) setLoadingMsgs(false); }
      if (!cancelled) timeoutId = setTimeout(poll, msgBackoffRef.current);
    };

    // Primera carga inmediata: abrir un chat ya no dispara su propio fetch.
    void poll();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [selectedId, deduplicateMessages]);

  const openConversation = useCallback((conv: Conversation) => {
    // El efecto de arriba se encarga de limpiar y cargar los mensajes en cuanto
    // cambia el ID. Hacerlo también aquí duplicaba la petición y abría la ventana
    // de carrera que mezclaba conversaciones.
    setSelected(conv);
  }, []);

  const handleTogglePause = useCallback(async () => {
    if (!selected) return;
    const isPaused = selected.status === 'paused' || selected.status === 'human';
    const newStatus = isPaused ? 'active' : 'paused';
    setToggling(true);
    try {
      const res = await fetch(`/api/proxy/conversations/${encodeURIComponent(selected.phone)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      // fetch NO lanza en 4xx/5xx: sin este chequeo, un bot caído o un error
      // del servidor pasaban desapercibidos y la UI cambiaba igual (falso OK).
      if (!res.ok) {
        let detail = '';
        try { detail = ((await res.json()) as { error?: string })?.error ?? ''; } catch { /* sin cuerpo */ }
        throw new Error(detail || `El servidor respondió ${res.status}`);
      }
      // Solo tocamos la UI si el cambio quedó guardado de verdad.
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: newStatus } : c));
      setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      setFeedback({ type: 'ok', text: newStatus === 'active' ? '✅ IA reactivada — el bot vuelve a responder' : '⏸️ Chat pausado — el bot no responderá' });
    } catch (err) {
      setFeedback({ type: 'err', text: `No se pudo ${isPaused ? 'reactivar' : 'pausar'}: ${err instanceof Error ? err.message : 'el bot no respondió'}. Reintenta.` });
    }
    finally { setToggling(false); }
  }, [selected]);

  // El aviso de pausar/reactivar se auto-oculta a los 4s.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleSendTip = useCallback(async (tipText: string) => {
    if (!selected) return;
    await fetch(`/api/proxy/conversations/${selected.phone}/tip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip: tipText }),
    }).catch(() => {});
  }, [selected]);

  const handleToggleSupplier = useCallback(async () => {
    if (!selected) return;
    const newStatus = !selected.is_supplier;

    // 1. Optimistic update — UI reacciona de inmediato
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, is_supplier: newStatus } : c));
    setSelected(prev => prev ? { ...prev, is_supplier: newStatus } : null);

    try {
      const res = await fetch(`/api/proxy/conversations/${selected.phone}/supplier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_supplier: newStatus }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setFeedback({ type: 'ok', text: newStatus ? '✅ Marcado como Proveedor' : '✅ Desmarcado como Proveedor' });
    } catch (err) {
      // Revertir optimismo
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, is_supplier: !newStatus } : c));
      setSelected(prev => prev ? { ...prev, is_supplier: !newStatus } : null);
      setFeedback({ type: 'err', text: 'Error al cambiar proveedor' });
    }
  }, [selected]);

  const handleSaveQualification = useCallback(async (newQual: string) => {
    if (!selected) return;
    const oldQual = selected.qualification;
    
    // 1. Optimistic update
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, qualification: newQual } : c));
    setSelected(prev => prev ? { ...prev, qualification: newQual } : null);

    try {
      const res = await fetch(`/api/proxy/conversations/${selected.phone}/qualification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualification: newQual }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setFeedback({ type: 'ok', text: '✅ Calificación guardada' });
    } catch (err) {
      // Revertir
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, qualification: oldQual } : c));
      setSelected(prev => prev ? { ...prev, qualification: oldQual } : null);
      setFeedback({ type: 'err', text: 'Error al cambiar la calificación' });
    }
  }, [selected]);


  const handleSaveName = useCallback(async (newName: string) => {
    if (!selected) return;
    try {
      await fetch(`/api/proxy/conversations/${selected.phone}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, contact_name: newName } : c));
      setSelected(prev => prev ? { ...prev, contact_name: newName } : null);
    } catch { /* offline */ }
  }, [selected]);

  const handleSaveProfile = useCallback(async (newProfile: string) => {
    if (!selected) return;
    try {
      await fetch(`/api/proxy/conversations/${selected.phone}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: newProfile }),
      });
      setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, client_profile: newProfile } : c));
      setSelected(prev => prev ? { ...prev, client_profile: newProfile } : null);
    } catch { /* offline */ }
  }, [selected]);

  // Filtro Anti-Fantasmas: Ocultar LIDs vacíos sin mensajes
  const validConversations = useMemo(() => {
    return conversations.filter(c => !(isUnresolvedLid(c.phone) && c.message_count === 0));
  }, [conversations]);

  // Nombres que se repiten en más de una conversación — la señal de que el
  // nombre no distingue a nadie (ver getDisplayName). Se calcula sobre el
  // conjunto completo, no sobre la lista ya filtrada por búsqueda/pestaña,
  // para que un duplicado siga detectándose aunque uno de los dos quede
  // fuera del filtro actual.
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of validConversations) {
      if (!c.contact_name) continue;
      counts.set(c.contact_name, (counts.get(c.contact_name) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  }, [validConversations]);

  const hitl = useMemo(() => validConversations.filter((c) => c.status === 'paused' || c.status === 'human'), [validConversations]);
  const active = useMemo(() => validConversations.filter((c) => c.status === 'active'), [validConversations]);
  const suppliers = useMemo(() => validConversations.filter((c) => c.is_supplier), [validConversations]);
  const closed = useMemo(() => validConversations.filter((c) => c.status === 'closed'), [validConversations]);

  // Búsqueda en tiempo real (Nombre, Teléfono, Resumen, Intención)
  const filteredConversations = useMemo(() => {
    return validConversations.filter(c => {
      // 1. Filtro de Pestaña / Estado
      if (statusFilter === 'hitl' && (c.status !== 'paused' && c.status !== 'human')) return false;
      if (statusFilter === 'active' && c.status !== 'active') return false;
      if (statusFilter === 'closed' && c.status !== 'closed') return false;
      if (statusFilter === 'supplier' && !c.is_supplier) return false;
      if (statusFilter === 'today') {
        const today = new Date().toDateString();
        const updatedAt = new Date(c.updated_at || c.created_at).toDateString();
        if (updatedAt !== today) return false;
      }

      // 2. Filtro de Búsqueda por Texto
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const cleanSearchDigits = term.replace(/[^0-9]/g, '');
      const cleanPhoneDigits = c.phone.replace(/[^0-9]/g, '');

      // 2.1 Coincidencia de Nombre (incluyendo el fallback formateado si no tiene nombre guardado)
      const displayName = (c.contact_name || formatPhone(c.phone)).toLowerCase();
      const nameMatch = displayName.includes(term);
      
      const summaryMatch = c.summary?.toLowerCase().includes(term);
      const intentMatch = c.last_intent?.toLowerCase().includes(term);
      
      // 2.2 Coincidencia de Teléfono más robusta (ignorando el prefijo 56 para números chilenos si es necesario)
      let phoneMatch = false;
      if (cleanSearchDigits.length >= 3) {
        const sDigits = cleanSearchDigits.startsWith('56') ? cleanSearchDigits.slice(2) : cleanSearchDigits;
        const pDigits = cleanPhoneDigits.startsWith('56') ? cleanPhoneDigits.slice(2) : cleanPhoneDigits;
        
        phoneMatch = cleanPhoneDigits.includes(cleanSearchDigits) || 
                     cleanSearchDigits.includes(cleanPhoneDigits) ||
                     (sDigits.length >= 3 && (pDigits.includes(sDigits) || sDigits.includes(pDigits)));
      } else {
        phoneMatch = c.phone.toLowerCase().includes(term);
      }

      return Boolean(nameMatch || summaryMatch || intentMatch || phoneMatch);
    });
  }, [validConversations, searchTerm, statusFilter]);

  // Ordenar por timestamp de última actividad (orden de llegada/horario descendente por defecto)
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return sortConvAsc ? timeA - timeB : timeB - timeA;
    });
  }, [filteredConversations, sortConvAsc]);

  return (
    <div data-chat-root className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111b21] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
      {/* WhatsApp Web Split Container */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* Columna Izquierda: Lista de Chats (WhatsApp Web Sidebar) */}
        <div className={`w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-slate-200 dark:border-white/10 flex flex-col bg-[#f6faf8] dark:bg-[#111b21] ${selected ? 'hidden md:flex' : 'flex'}`}>
          {/* Header de la Lista */}
          <div className="p-3 bg-white/70 dark:bg-[#202c33] backdrop-blur-sm border-b border-slate-200 dark:border-white/5 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#10b981]" />
                WhatsApp Live Feed ({sortedConversations.length})
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortConvAsc(!sortConvAsc)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all"
                  title={sortConvAsc ? 'Viendo más antiguos primero' : 'Viendo más recientes primero'}
                >
                  <Filter className={`w-3.5 h-3.5 transition-transform ${sortConvAsc ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={forceGenerateSummaries}
                  disabled={isGenerating}
                  className="p-1.5 rounded-lg text-purple-500 dark:text-purple-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Ejecutar Backfill de Resúmenes IA"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => fetchConversations()}
                  disabled={refreshing}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Actualizar chats"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Input de Búsqueda estilo WhatsApp Web */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, número (+56 9...) o resumen..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] font-medium transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros Rápido por Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-[#10b981]/15 dark:bg-[#10b981]/20 text-emerald-700 dark:text-[#10b981] border border-[#10b981]/40'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                Todos ({validConversations.length})
              </button>
              <button
                onClick={() => setStatusFilter('hitl')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'hitl'
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                ⚠️ Humano ({hitl.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'active'
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                💬 Activos ({active.length})
              </button>
              <button
                onClick={() => setStatusFilter('supplier')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'supplier'
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                🏬 Proveedores ({suppliers.length})
              </button>
            </div>
          </div>

          {/* Lista de Conversaciones Ordenada Estrictamente por Horario de Llegada */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10">
            {sortedConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No se encontraron conversaciones</p>
              </div>
            ) : (
              sortedConversations.map((conv) => {
                const isSelected = selected?.id === conv.id;
                const isPaused = conv.status === 'paused' || conv.status === 'human';

                return (
                  <div
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all duration-200 ease-out border-l-4 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-[#2a3942] border-l-[#10b981]'
                        : isPaused
                        ? 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border-l-rose-400 dark:border-l-rose-500/80'
                        : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-[#202c33] hover:border-l-emerald-200 dark:hover:border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                        isPaused
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                          : avatarColor(conv.phone)
                      }`}>
                        {avatarInitial(conv.contact_name || conv.phone)}
                      </div>
                      {isPaused && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#111b21] animate-pulse shadow-sm" title="Atención Humana Requerida" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className={`font-bold text-[14px] truncate leading-tight ${isPaused ? 'text-rose-700 dark:text-rose-200' : 'text-slate-900 dark:text-white'}`}>
                          {getDisplayName(conv, duplicateNames)}
                        </p>
                        <span className={`text-[11px] font-semibold shrink-0 ${isPaused ? 'text-rose-500 dark:text-rose-300 font-bold' : 'text-slate-400'}`} suppressHydrationWarning>
                          {formatChatTime(conv.updated_at)}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 italic leading-relaxed ${isPaused ? 'text-rose-600/80 dark:text-rose-200/80 font-medium' : 'text-slate-500 dark:text-slate-300'}`}>
                        "{conv.summary || 'Generando resumen IA...'}"
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        {conv.is_supplier ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                            Proveedor
                          </span>
                        ) : isPaused ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50 shadow-sm animate-pulse">
                            ⚠️ Atención Humana
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            IA Activa
                          </span>
                        )}
                        {conv.qualification && conv.qualification !== 'unqualified' && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${QUALIFICATIONS[conv.qualification as keyof typeof QUALIFICATIONS]?.color || ''}`}>
                            {QUALIFICATIONS[conv.qualification as keyof typeof QUALIFICATIONS]?.emoji} {QUALIFICATIONS[conv.qualification as keyof typeof QUALIFICATIONS]?.label}
                          </span>
                        )}
                        {/* Si el nombre está duplicado y ya se muestra el teléfono arriba
                            como título, repetirlo aquí abajo sería redundante. */}
                        {conv.contact_name && getDisplayName(conv, duplicateNames) === conv.contact_name && (
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            {formatPhone(conv.phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Ventana Principal de Chat */}
        <div className={`flex-1 flex flex-col h-full min-w-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
          <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 flex flex-col h-full min-h-0 min-w-0"
            >
            <ConversationPanel
              conv={selected}
              messages={messages}
              loading={loadingMsgs}
              onClose={handleCloseChat}
              onTogglePause={handleTogglePause}
              toggling={toggling}
              onSendTip={handleSendTip}
              onSaveName={handleSaveName}
              onSaveProfile={handleSaveProfile}
              onToggleSupplier={handleToggleSupplier}
              onSaveQualification={handleSaveQualification}
              duplicateNames={duplicateNames}
              companyConfig={companyConfig}
            />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center bg-[#f6faf8] dark:bg-[#222e35] p-8 text-center border-l border-slate-200 dark:border-white/5"
            >
              <div className="w-20 h-20 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center text-[#10b981] mb-4 shadow-inner">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">WhatsApp Web Live Feed</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Selecciona una conversación de la lista lateral para ver los mensajes en tiempo real, intervenir manualmente o instruir al agente de IA.
              </p>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Aviso de pausar/reactivar IA — feedback REAL del servidor (no optimista) */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold max-w-[92vw] flex items-center gap-2 ${
              feedback.type === 'ok'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-rose-600 text-white border-rose-400'
            }`}
          >
            {feedback.type === 'ok'
              ? <Play className="w-4 h-4 shrink-0 fill-current" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

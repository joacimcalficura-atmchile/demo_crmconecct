'use client';

import { useState, useEffect } from 'react';
import { Send, Paperclip, Trash2, History, X, Loader2 } from 'lucide-react';
import { useBotEvents } from '@/hooks/useBotEvents';

interface AgentChatProps {
  endpoint: string;
  title: string;
  subtitle: string;
  allowAttachments?: boolean;
  acceptTypes?: string;
  placeholder?: string;
  // Historial persistido en el servidor (hilos consultables/purgables,
  // como Claude/Gemini) + notificación en tiempo real de procesamiento
  // de archivos pesados. Solo se activa donde tiene sentido (Finanzas
  // hoy) para no afectar otros chats que reusan este mismo componente.
  enableHistory?: boolean;
}

interface ChatSession {
  session_id: string;
  first_message: string;
  message_count: number;
  updated_at: string;
}

interface StoredMessage {
  sender: 'admin' | 'agent';
  text: string;
  agentsConsulted?: string[];
}

export default function AgentChat({
  endpoint,
  title,
  subtitle,
  allowAttachments = true,
  acceptTypes = 'image/*,application/pdf',
  placeholder = 'Escribe tu consulta...',
  enableHistory = false,
}: AgentChatProps) {
  // Inicializamos vacío para evitar hydration mismatch en SSR, luego cargamos del localStorage
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [processingNotice, setProcessingNotice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const botEvent = useBotEvents() as any;

  // Clave única por agente para no mezclar historiales
  const storageKey = `chat_history_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const sessionStorageKey = `chat_session_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading chat history', e);
      }
    }
    if (enableHistory) {
      const savedSession = localStorage.getItem(sessionStorageKey);
      setSessionId(savedSession || crypto.randomUUID());
    }
  }, [storageKey, sessionStorageKey, enableHistory]);

  useEffect(() => {
    if (isClient && enableHistory && sessionId) {
      localStorage.setItem(sessionStorageKey, sessionId);
    }
  }, [sessionId, isClient, enableHistory, sessionStorageKey]);

  // Sincronizar mensajes a localStorage cada vez que cambian
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, isClient, storageKey]);

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/finance/chat/sessions/${id}`);
      if (!res.ok) return;
      const rows: { sender: 'admin' | 'agent'; message_text: string }[] = await res.json();
      setMessages(rows.map((r) => ({ sender: r.sender, text: r.message_text })));
      setSessionId(id);
      setShowHistory(false);
    } catch (err) {
      console.error('Error cargando hilo de historial:', err);
    }
  };

  // Notificación en tiempo real: cuando el bot termina de procesar un
  // archivo pesado (audio/video) en segundo plano, avisa por este mismo
  // canal (además del WhatsApp real que ya recibe el usuario). Si el
  // evento trae el session_id de este chat, se recarga el hilo para
  // mostrar la respuesta que el agente ya dejó guardada.
  useEffect(() => {
    if (!enableHistory || !botEvent || botEvent.event !== 'finance_processing_done') return;
    setProcessingNotice(null);
    if (botEvent.status === 'ok' && botEvent.sessionId === sessionId) {
      loadSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botEvent]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/proxy/finance/chat/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Error listando hilos de historial:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) fetchSessions();
  };

  const deleteSession = async (id: string) => {
    if (!window.confirm('¿Eliminar este hilo permanentemente? No se puede deshacer.')) return;
    try {
      await fetch(`/api/proxy/finance/chat/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.session_id !== id));
      if (id === sessionId) startNewSession();
    } catch (err) {
      console.error('Error eliminando hilo:', err);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
    if (enableHistory) setSessionId(crypto.randomUUID());
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de eliminar el historial con este Agente?')) {
      startNewSession();
    }
  };

  const getFileBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((typeof reader.result === 'string' ? reader.result.split(',')[1] : '') || '');
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const calculateHash = async (text: string) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const agentBadgeColors: Record<string, string> = {
    Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Commercial: 'bg-blue-50 text-blue-700 border-blue-200',
    Operations: 'bg-violet-50 text-violet-700 border-violet-200',
    Orchestrator: 'bg-[#3A3F47] text-[#E4E7EC] border-[#3A3F47]' // Metal Graphite
  };

  const agentLabels: Record<string, string> = {
    Finance: '🧮 Financiero',
    Commercial: '💼 Comercial',
    Operations: '📅 Operaciones',
    Orchestrator: '🤖 Orquestador'
  };

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    let b64 = '';
    let hash = '';
    let mime = '';

    const newMsgs = [...messages];

    if (file) {
      newMsgs.push({ sender: 'admin', text: `📎 Archivo adjunto: ${file.name}` });
      b64 = await getFileBase64(file);
      hash = await calculateHash(b64.slice(0, 500) + file.name);
      mime = file.type;
    }
    if (input.trim()) {
      newMsgs.push({ sender: 'admin', text: input });
    }

    setMessages(newMsgs);
    setIsLoading(true);
    setInput('');
    setFile(null);

    try {
      const res = await fetch(`/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint, // Pasamos el endpoint del VPS al proxy
          message: input,
          fileBase64: b64,
          fileMime: mime,
          fileHash: hash,
          senderId: 'admin',
          sessionId: enableHistory ? sessionId : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${res.status}`);
      }

      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.processing) {
        const isAV = mime.startsWith('audio/') || mime.startsWith('video/');
        setProcessingNotice(
          isAV
            ? 'Procesando tu audio/video — puede tardar uno o dos minutos. Te avisamos aquí mismo cuando termine.'
            : 'Procesando tu archivo en segundo plano...'
        );
      }
      setMessages((prev) => [...prev, {
        sender: 'agent',
        text: data.reply || 'Sin respuesta',
        agentsConsulted: data.agentsConsulted
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: 'agent', text: `❌ Error: ${err.message || 'Fallo en la comunicación.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[500px] bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Metal Style */}
      <div className="p-4 bg-white/5 text-white border-b border-white/10 flex justify-between items-center">
        <div>
          <h3 className="font-bold tracking-wide">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {enableHistory && (
            <button
              onClick={toggleHistory}
              className="text-slate-400 hover:text-sky-400 transition-colors"
              title="Historial de conversaciones"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClearHistory}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title="Nuevo chat (borra la vista local)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {enableHistory && (
        <div className="px-4 py-1.5 bg-amber-500/20 border-b border-amber-500/30 text-[11px] text-amber-300">
          Los hilos de este chat se guardan en el servidor. Si necesitas liberar espacio, puedes eliminar hilos antiguos desde el ícono de historial.
        </div>
      )}

      {showHistory && (
        <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-2xl flex flex-col">
          <div className="p-4 bg-white/5 text-white border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold tracking-wide">Historial de conversaciones</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingSessions ? (
              <div className="flex justify-center pt-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-sm text-slate-400 pt-8">Aún no hay hilos guardados.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.session_id} className="flex items-center gap-2 p-3 rounded-xl border border-white/10 hover:bg-white/5">
                  <button onClick={() => loadSession(s.session_id)} className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{s.first_message || '(sin texto)'}</p>
                    <p className="text-[11px] text-slate-400">{s.message_count} mensajes · {new Date(s.updated_at).toLocaleString('es-CL')}</p>
                  </button>
                  <button onClick={() => deleteSession(s.session_id)} className="text-slate-300 hover:text-red-500 p-1" title="Eliminar hilo">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.sender === 'admin' ? 'bg-sky-600 text-white rounded-br-none shadow-sm' : 'bg-slate-800 border border-white/10 text-white rounded-bl-none shadow-sm'}`}>
              <span className="whitespace-pre-wrap">{m.text}</span>
            </div>
            {m.sender === 'agent' && m.agentsConsulted && m.agentsConsulted.length > 0 && (
              <div className="flex gap-1 mt-1 ml-1 flex-wrap">
                {m.agentsConsulted.map((ag) => (
                  <span key={ag} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${agentBadgeColors[ag] || agentBadgeColors['Orchestrator']}`}>
                    {agentLabels[ag] || ag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-white/10 text-slate-400 p-3 rounded-2xl rounded-bl-none text-xs italic shadow-sm">
              Analizando...
            </div>
          </div>
        )}
        {processingNotice && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-sky-500/20 border border-sky-500/30 text-sky-300 p-3 rounded-2xl rounded-bl-none text-xs shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {processingNotice}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-2">
        {allowAttachments && (
          <label className="cursor-pointer p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept={acceptTypes} />
          </label>
        )}

        <div className="flex-1 flex flex-col">
          {file && <span className="text-xs text-white font-medium px-2 py-1 bg-white/10 border border-white/10 rounded mb-1 w-max">{file.name}</span>}
          <input
            type="text"
            placeholder={placeholder}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-500 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && !file)}
          className="p-2 text-white bg-sky-600 hover:bg-sky-500 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

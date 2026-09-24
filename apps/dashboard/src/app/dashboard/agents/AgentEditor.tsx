'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Shield, Cpu, Save, FileText, Sparkles } from 'lucide-react';
import type { AgentConfig } from './page';

interface AgentEditorProps {
  current: AgentConfig;
  activeInfo: { label: string; id: string; color: string };
  update: (key: keyof AgentConfig, value: string | number | boolean | string[]) => void;
  handleSave: () => Promise<void>;
  saving: boolean;
  saved: boolean;
}

// ── Simple Markdown Parser to avoid dependency bloat ────────
function MarkdownPreview({ content }: { content: string }) {
  if (!content) return <p className="text-slate-500 dark:text-slate-400 text-xs italic">Sin contenido para previsualizar</p>;
  
  return (
    <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-h-[350px] overflow-y-auto pr-2 font-sans">
      {content.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          return <h3 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-1">{trimmed.slice(2)}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h4 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">{trimmed.slice(3)}</h4>;
        }
        if (trimmed.startsWith('### ')) {
          return <h5 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">{trimmed.slice(4)}</h5>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1">
              <li>{trimmed.slice(2)}</li>
            </ul>
          );
        }
        if (trimmed === '') return <div key={idx} className="h-2" />;
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

const SOUL_TEMPLATES = [
  {
    title: 'Formal Corporativo',
    desc: 'Tono ejecutivo y respuestas directas',
    content: `## Personalidad
- Altamente profesional y cortés
- Usa pronombres formales (Usted)
- Respuestas precisas enfocadas a resolver la consulta
- Evita modismos o lenguaje casual`
  },
  {
    title: 'Cercano / Chileno',
    desc: 'Empático y con lenguaje natural chileno',
    content: `## Personalidad
- Cálido, cercano y empático
- Usa modismos chilenos sutiles (ej: "hola, ¿cómo estás?", "altiro")
- Respuestas amigables pero siempre manteniendo el respeto`
  },
  {
    title: 'Comercial Persuasivo',
    desc: 'Enfocado en conversión y ventas',
    content: `## Personalidad
- Entusiasta y proactivo
- Siempre orienta la conversación hacia agendar una llamada o cotizar
- Resalta los beneficios y ventajas competitivas de ATM Chile`
  },
  {
    title: 'Asesor Estratégico Corporativo',
    desc: 'Consejero de negocios de alto nivel',
    content: `## Personalidad
- Eres un asesor corporativo de altísimo nivel, estilo mentor.
- Hablas con seguridad, dando consejos estratégicos claros y procesables.
- Tienes inteligencia empresarial, siempre sugieres cómo optimizar operaciones y mejorar ventas.
- Empatizas con los emprendedores y los motivas a escalar sus negocios.`
  }
];

export function AgentEditor({
  current,
  activeInfo,
  update,
  handleSave,
  saving,
  saved
}: AgentEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [activeRulesTab, setActiveRulesTab] = useState<'edit' | 'preview'>('edit');

  const applyTemplate = (templateContent: string) => {
    update('soul_md', current.soul_md + '\n' + templateContent);
  };

  return (
    <div className="space-y-6">
      {/* Soul MD Editor + Preview */}
      <div className="glass-panel p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Soul — Identidad y Personalidad</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Define quién es el agente, su tono y directrices</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-black/5 dark:bg-slate-800/80 rounded-lg p-1 flex gap-1 self-start sm:self-center border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'edit' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Editar
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'preview' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vista Previa
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <textarea
                value={current.soul_md}
                onChange={(e) => update('soul_md', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all font-mono resize-y leading-relaxed"
                placeholder="# Identidad del Asistente..."
              />
            </div>
            
            {/* Templates panel */}
            <div className="bg-black/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                <span>Prediseñados</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Añade fragmentos rápidos de personalidad al agente:</p>
              <div className="space-y-2">
                {SOUL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    onClick={() => applyTemplate(tmpl.content)}
                    className="w-full text-left p-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:border-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-900/20 transition-all active:scale-[0.98]"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.title}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <MarkdownPreview content={current.soul_md} />
          </div>
        )}
      </div>

      {/* Reglas de Negocio */}
      <div className="glass-panel p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Reglas de Negocio</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Políticas comerciales, instrucciones de paso a paso</p>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-slate-800/80 rounded-lg p-1 flex gap-1 border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setActiveRulesTab('edit')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeRulesTab === 'edit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Editar
            </button>
            <button
              onClick={() => setActiveRulesTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeRulesTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vista Previa
            </button>
          </div>
        </div>

        {activeRulesTab === 'edit' ? (
          <textarea
            value={current.business_rules_md}
            onChange={(e) => update('business_rules_md', e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono resize-y leading-relaxed"
            placeholder="## Políticas de Cotización..."
          />
        ) : (
          <div className="bg-black/5 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-5">
            <MarkdownPreview content={current.business_rules_md} />
          </div>
        )}
      </div>

      {/* Límites Estrictos (Negative Prompts) */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 backdrop-blur-xl rounded-2xl border border-rose-200 dark:border-rose-500/20 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-200 dark:border-rose-500/20">
          <div className="w-5 h-5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          </div>
          <div>
            <h2 className="font-bold text-rose-700 dark:text-rose-300 text-sm">Límites Estrictos (Qué NO Hacer)</h2>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70">Instrucciones críticas que la IA tiene prohibido desobedecer (Negative Prompts)</p>
          </div>
        </div>

        <textarea
          value={current.negative_prompt_md || ''}
          onChange={(e) => update('negative_prompt_md', e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-rose-500/5 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm text-rose-900 dark:text-rose-100 placeholder-rose-400 dark:placeholder-rose-500/50 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all font-mono resize-y leading-relaxed"
          placeholder="- Nunca des precios con descuento sin autorización.&#10;- No prometas plazos de entrega menores a 48 horas."
        />
      </div>

      {/* UX Tuning & Latencia */}
      <div className="glass-panel p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
          <Cpu className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Latencia y Humanización UX</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Controla el retardo simulado para simular escritura humana</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Latencia Base (ms)</label>
            <input
              type="number"
              min={500}
              max={8000}
              step={100}
              value={current.ux_base_latency_ms}
              onChange={(e) => update('ux_base_latency_ms', parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-all"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">Tiempo de respuesta mínimo ({(current.ux_base_latency_ms / 1000).toFixed(1)}s)</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Velocidad de Escritura (ms/char)</label>
            <input
              type="number"
              min={10}
              max={200}
              step={5}
              value={current.ux_typing_speed_ms}
              onChange={(e) => update('ux_typing_speed_ms', parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-all"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">Tiempo adicional de "typing..." por carácter ({current.ux_typing_speed_ms}ms)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Límite Mínimo de Palabras</label>
            <input
              type="number"
              min={1}
              max={100}
              step={5}
              value={current.min_words ?? 10}
              onChange={(e) => update('min_words', parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-all"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">Forzará al modelo a generar al menos esta cantidad.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Límite Máximo de Palabras</label>
            <input
              type="number"
              min={15}
              max={1000}
              step={5}
              value={current.max_words ?? 35}
              onChange={(e) => update('max_words', parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-all"
            />
            <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">Evita que el agente entregue testamentos.</p>
          </div>
        </div>
        
        {/* Human Presence */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-4">Presencia y Emociones</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Indicador de Escritura</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Muestra "escribiendo..." en WhatsApp antes de responder.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={current.typing_presence ?? true} onChange={(e) => update('typing_presence', e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Reacciones con Emoji</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reacciona automáticamente a los mensajes del usuario.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={current.emoji_reactions ?? true} onChange={(e) => update('emoji_reactions', e.target.checked)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Emojis Principales (Selección Múltiple):</p>
              <div className="flex flex-wrap items-center gap-2">
                {['👍','✅','👀','👋','🙌','🤖','❤️','💡','🚀','🔥','🤝','📝','🛠️','⚠️','✨','💼'].map(emoji => {
                  const isSelected = (current.reaction_emojis || ['👍']).includes(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => {
                        const currentEmojis = current.reaction_emojis || ['👍'];
                        if (isSelected) {
                          if (currentEmojis.length > 1) {
                            update('reaction_emojis', currentEmojis.filter(e => e !== emoji));
                          }
                        } else {
                          update('reaction_emojis', [...currentEmojis, emoji]);
                        }
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
                        isSelected 
                          ? 'bg-sky-500/10 dark:bg-sky-500/20 ring-2 ring-sky-400 dark:ring-sky-500 text-sky-600 dark:text-sky-300' 
                          : 'bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer ${
            saved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:opacity-95'
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? '✅ Agente Guardado' : `Guardar ${activeInfo.label}`}
        </button>
      </div>
    </div>
  );
}

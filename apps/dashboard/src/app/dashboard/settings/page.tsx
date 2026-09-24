'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Save, Building2, Phone, Mail, Key, Bot,
  CheckCircle, Loader2, Upload, Image as ImageIcon, X,
  MessageSquare, Globe, Shield, Zap, RefreshCw, Plus, Trash2, Network, Mic, CreditCard
} from 'lucide-react';

export interface DerivationRule {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  receives_reports?: boolean;
}

interface CompanyConfig {
  name?: string;
  rut?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_rate?: number;
  wa_public_number?: string;
  wa_admin_number?: string;
  dashboard_url?: string;
  slack_webhook_url?: string;
  bot_active?: boolean;
  logo_url?: string;
  meta_api_token?: string;
  meta_phone_number_id?: string;
  meta_waba_id?: string;
  report_email?: string;
  derivation_rules?: DerivationRule[];
  vapi_public_key?: string;
  vapi_assistant_id?: string;
  daily_report_active?: boolean;
  daily_report_time?: string;
  daily_report_agenda_only?: boolean;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  website_url?: string;
  mp_access_token?: string;
  mp_public_key?: string;
}

// ─── Logo Uploader ────────────────────────────────────────────
function LogoUploader({ currentUrl, onChange }: { currentUrl?: string; onChange: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUrl !== undefined) {
      setPreview(currentUrl);
    }
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl); // In production: upload to Supabase Storage
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Logo de la Empresa</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-sky-300 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          ) : preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Logo" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[9px] font-semibold text-center">Subir logo</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">Sube el logo de tu empresa (PNG, SVG o JPG). Aparecerá en la barra de navegación del dashboard.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
          >
            {preview ? 'Cambiar imagen' : 'Seleccionar archivo'}
          </button>
          
          <div className="flex items-center gap-3 mt-3">
            {preview && (
              <button
                type="button"
                onClick={() => { setPreview(null); onChange(''); }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Quitar
              </button>
            )}
            
            <a
              href="/api/proxy/pdf/sample"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-100 shadow-sm"
            >
              👁️ Ver PDF de Prueba
            </a>
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
      }} />
    </div>
  );
}

// ─── Page Principal ───────────────────────────────────────────
export default function SettingsPage() {
  const [config, setConfig] = useState<CompanyConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleSaved, setToggleSaved] = useState(false);
  const [testingMeta, setTestingMeta] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'empresa' | 'rrss' | 'whatsapp' | 'meta' | 'notifs' | 'derivations' | 'vapi' | 'mercadopago'>('empresa');
  // Las URLs de configuración se calculan desde el dominio de esta demo.
  // Se llena en useEffect para que servidor y cliente tengan el mismo render inicial.
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    fetch('/api/proxy/config').then((r) => r.json()).then((data) => setConfig(data || {})).catch(() => {});
  }, []);

  const handleToggleBot = async () => {
    const newState = !config.bot_active;
    setConfig((prev) => ({ ...prev, bot_active: newState }));
    setToggling(true);
    try {
      await fetch('/api/proxy/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_active: newState }),
      });
      setToggleSaved(true);
      setTimeout(() => setToggleSaved(false), 3000);
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { bot_active, ...rest } = config;
      void bot_active;
      await fetch('/api/proxy/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof CompanyConfig, label: string, placeholder: string, type = 'text', hint?: string) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={config[key]?.toString() ?? ''}
        onChange={(e) => setConfig((prev) => ({
          ...prev,
          [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
        }))}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
      />
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  const toggleField = (key: keyof CompanyConfig, label: string, hint?: string) => (
    <div className="flex items-start gap-3 py-1">
      <label className="relative inline-flex items-center cursor-pointer mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={!!config[key]}
          onChange={(e) => setConfig((prev) => ({
            ...prev,
            [key]: e.target.checked,
          }))}
        />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-sky-500"></div>
      </label>
      <div className="flex-1">
        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    </div>
  );

  const isActive = config.bot_active !== false;

  const tabs = [
    { id: 'empresa' as const, label: 'Empresa', icon: Building2 },
    { id: 'rrss' as const, label: 'Redes Sociales', icon: Globe },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
    { id: 'derivations' as const, label: 'Derivaciones', icon: Network },
    { id: 'notifs' as const, label: 'Alertas', icon: Mail },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Configuración</h1>
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm drop-shadow-sm">Parámetros globales de tu empresa, canales y notificaciones</p>
      </div>

      {/* ── Kill Switch Premium ── */}
      <motion.div
        animate={{
          background: isActive
            ? 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(2,132,199,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.6) 100%)',
          borderColor: isActive ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.08)',
        }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-2xl border backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-sky-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                <Bot className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Asistente Inteligente (WhatsApp AI)</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Controla si el agente de IA debe responder automáticamente. Al desactivarlo, el bot guardará silencio total.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleToggleBot}
              disabled={toggling}
              aria-label="Activar/Desactivar bot"
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-sky-500' : 'bg-slate-600'}`}
            >
              {toggling ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </span>
              ) : (
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              )}
            </button>
            <AnimatePresence>
              {toggleSaved && (
                <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Guardado
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full transition-colors duration-300 ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Estado actual: {isActive ? 'Activo — Respuesta Automática Encendida' : 'Apagado — Bot en Silencio Total'}
          </span>
        </div>
      </motion.div>

      <div role="note" className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
        Configuración de muestra. Las integraciones externas y los datos de empresa no se guardan ni se conectan a servicios reales.
      </div>

      {/* Logo */}
      <div className="glass-panel p-6 space-y-5 shadow-xl rounded-2xl">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-200 dark:border-white/10">
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Identidad Visual</h2>
        </div>
        <LogoUploader
          currentUrl={config.logo_url}
          onChange={(url) => setConfig(prev => ({ ...prev, logo_url: url }))}
        />
      </div>

      {/* Tabs de configuración */}
      <div className="glass-panel shadow-xl overflow-hidden rounded-2xl">
        <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === id
                  ? 'text-sky-500 dark:text-sky-400 border-sky-500 bg-sky-500/10 dark:bg-sky-900/30'
                  : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'empresa' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">{field('name', 'Nombre de la Empresa', 'Mi Empresa S.A.')}</div>
              {field('rut', 'RUT de Empresa', '12.345.678-9')}
              {field('tax_rate', 'Tasa IVA (ej. 0.19 = 19%)', '0.19', 'number', 'Usado para calcular IVA en cotizaciones y flujo de caja')}
              <div className="sm:col-span-2">{field('address', 'Dirección Fiscal', 'Av. Vitacura 2670, Las Condes')}</div>
              {field('email', 'Email de Contacto', 'contacto@miempresa.cl', 'email')}
              {field('phone', 'Teléfono Comercial', '+56 9 1234 5678')}
              <div className="sm:col-span-2">
                {field('dashboard_url', '🔗 Dominio del Panel', 'https://tuempresa-agent.atmchile.com', 'url', 'El dominio propio de tu panel — sin "/" al final. Se usa en los links que el bot manda por WhatsApp (avisos al dueño, cotizaciones, pagos). Si lo dejas vacío, se usa un dominio genérico.')}
              </div>
            </div>
          )}

          {activeTab === 'rrss' && (
            <div className="space-y-5">
              <div className="bg-sky-50/60 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-sky-800 dark:text-sky-300 text-sm">Canales Oficiales y Redes Sociales</h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Configura aquí los enlaces oficiales de tu empresa. El <strong>Asistente IA</strong> utilizará estos links cuando se presente a clientes nuevos, y también se enlazarán a los <strong>Atajos Rápidos de 1-Clic</strong> en el chat.
                </p>
              </div>

              <div className="space-y-4">
                {field('instagram_url', '📸 Perfil de Instagram', 'https://www.instagram.com/tu_cuenta/', 'url', 'Link completo de tu cuenta oficial de Instagram')}
                {field('tiktok_url', '🎵 Perfil de TikTok', 'https://www.tiktok.com/@tu_cuenta', 'url', 'Link completo de tu cuenta oficial de TikTok')}
                {field('facebook_url', '📘 Página de Facebook', 'https://www.facebook.com/tu_pagina', 'url', 'Link de tu página de Facebook')}
                {field('website_url', '🌐 Sitio Web Oficial', 'https://www.tuempresa.cl', 'url', 'Dirección web principal de tu empresa')}
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {field('wa_public_number', 'Número Canal de Clientes', '56912345678', 'text', 'ID de WhatsApp del canal de atención principal')}
              {field('wa_admin_number', 'Números de Administración', '56987654321, 56911111111', 'text', 'Separados por coma, con código país y sin "+" (ej: 56912345678). Estos números acceden al modo administrador del bot: registrar gastos, consultar finanzas y dar instrucciones. El cambio se aplica en menos de 1 minuto, sin reiniciar el bot.')}
              {field('report_email', 'Email para Reportes Automáticos', 'finanzas@miempresa.cl', 'email', 'Los reportes financieros diarios, semanales o mensuales se enviarán aquí.')}
            </div>
          )}

          {activeTab === 'derivations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-sky-400" />
                    Reglas de Derivación Inteligente
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                    Define a qué áreas o encargados debe derivar el asistente cuando el cliente necesite soporte humano. El agente enviará una notificación vía WhatsApp a estos números.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      derivation_rules: [
                        ...(prev.derivation_rules || []),
                        { id: crypto.randomUUID(), nombre: '', cargo: '', telefono: '', email: '' }
                      ]
                    }));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-bold border border-sky-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Regla
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {(config.derivation_rules || []).map((rule, idx) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 space-y-4 relative group"
                    >
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              derivation_rules: (prev.derivation_rules || []).filter(r => r.id !== rule.id)
                            }));
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Área o Cargo</label>
                          <input
                            type="text"
                            value={rule.cargo}
                            onChange={(e) => {
                              const newRules = [...(config.derivation_rules || [])];
                              newRules[idx].cargo = e.target.value;
                              setConfig(prev => ({ ...prev, derivation_rules: newRules }));
                            }}
                            placeholder="Ej: Soporte Técnico, Ventas..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nombre Encargado</label>
                          <input
                            type="text"
                            value={rule.nombre}
                            onChange={(e) => {
                              const newRules = [...(config.derivation_rules || [])];
                              newRules[idx].nombre = e.target.value;
                              setConfig(prev => ({ ...prev, derivation_rules: newRules }));
                            }}
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Teléfono (WhatsApp)</label>
                          <input
                            type="text"
                            value={rule.telefono}
                            onChange={(e) => {
                              const newRules = [...(config.derivation_rules || [])];
                              newRules[idx].telefono = e.target.value;
                              setConfig(prev => ({ ...prev, derivation_rules: newRules }));
                            }}
                            placeholder="Ej: 56912345678"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email (Opcional)</label>
                          <input
                            type="email"
                            value={rule.email}
                            onChange={(e) => {
                              const newRules = [...(config.derivation_rules || [])];
                              newRules[idx].email = e.target.value;
                              setConfig(prev => ({ ...prev, derivation_rules: newRules }));
                            }}
                            placeholder="contacto@empresa.cl"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rule.receives_reports ? 'bg-sky-500 border-sky-500' : 'bg-transparent border-slate-500 group-hover:border-slate-400'}`}>
                            {rule.receives_reports && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium select-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Recibir reportes de agendamiento de calendario
                          </span>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={rule.receives_reports || false}
                            onChange={(e) => {
                              const newRules = [...(config.derivation_rules || [])];
                              newRules[idx].receives_reports = e.target.checked;
                              setConfig(prev => ({ ...prev, derivation_rules: newRules }));
                            }}
                          />
                        </label>
                      </div>
                    </motion.div>
                  ))}
                  {(config.derivation_rules?.length === 0 || !config.derivation_rules) && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">No hay reglas de derivación configuradas.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-5">
              <div className="bg-sky-50/60 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-sky-800 dark:text-sky-300 text-sm">Meta Cloud API — WhatsApp Oficial</h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Conéctate a la <strong>API Oficial de Meta</strong> para escalar sin límites de escaneo QR, con SLA empresarial y sin riesgo de suspensión. Requiere cuenta de <strong>Meta Business Manager</strong>.
                </p>
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline mt-1">
                  📱 Abrir Meta Developers →
                </a>
              </div>

              {field('meta_phone_number_id', 'Phone Number ID (Meta)', 'Ej: 1126022697268940', 'text', 'Obtenlo en: Meta Developers → WhatsApp → Paso 1 ó 2')}
              {field('meta_waba_id', 'WhatsApp Business Account ID (WABA)', 'Ej: 246844783648484', 'text', 'Obtenlo en: Meta Developers → WhatsApp → Paso 1 ó 2')}
              {field('meta_api_token', 'Access Token de Meta (Permanente)', 'EAAxxxxxxxxxxxxx...', 'password', '⚠️ Pega aquí el Token que generaste en Meta Developers.')}

              {/* Botón de prueba de conexión */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setTestingMeta(true);
                    setMetaTestResult(null);
                    try {
                      const res = await fetch('/api/proxy/meta/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          token: config.meta_api_token,
                          phoneId: config.meta_phone_number_id,
                        }),
                      });
                      const data = await res.json();
                      setMetaTestResult(data);
                    } catch (err: any) {
                      setMetaTestResult({ ok: false, message: 'Error al conectar con la API' });
                    } finally {
                      setTestingMeta(false);
                    }
                  }}
                  disabled={testingMeta}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {testingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {testingMeta ? 'Probando Conexión...' : '🧪 Probar Conexión con Meta Cloud API'}
                </button>

                {metaTestResult && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs font-medium ${metaTestResult.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'}`}>
                    {metaTestResult.ok ? '✅ ' : '❌ '} {metaTestResult.message}
                  </div>
                )}
              </div>

              {/* Caja de Webhook oficial para Meta Developers Paso 2 */}
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-400">Datos para configurar en Meta Developers (Paso 2. Configuración de producción):</p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">URL de devolución de llamada (Callback URL):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-black/60 px-3 py-1.5 rounded border border-white/10 text-sky-300 select-all flex-1">
                        {`${origin}/api/meta/webhook?clientId=${(config as any).client_id ?? ''}`}
                      </code>
                    </div>
                    <span className="text-slate-500 block text-[10px] mt-1">El <code className="text-sky-400">clientId</code> enruta el webhook al bot de ESTE cliente. Cópialo tal cual en Meta.</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Identificador de verificación (Verify Token):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-black/60 px-3 py-1.5 rounded border border-white/10 text-amber-300 select-all flex-1">
                        atm_verify_token
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vapi' && (
            <div className="space-y-5">
              <div className="bg-sky-50/60 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-sky-800 dark:text-sky-300 text-sm">Configuración de Vapi.ai</h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Conecta tu Dashboard con la API de Vapi para habilitar llamadas de voz en tiempo real con el Asistente IA (ATM Neural Core).
                </p>
              </div>

              {field('vapi_public_key', 'Vapi Public Key', 'Ej: fdfa8b7d-8479-478a-930d-763f...', 'text', 'La encuentras en el panel de Vapi (Client-side SDK access)')}
              {field('vapi_assistant_id', 'Vapi Assistant ID', 'Ej: d43b2f8a-9e12-4f3b-8a7c...', 'text', 'El ID del asistente que has configurado en Vapi.ai')}
            </div>
          )}

          {activeTab === 'mercadopago' && (
            <div className="space-y-5">
              <div className="bg-sky-50/60 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-sky-800 dark:text-sky-300 text-sm">Mercado Pago (Chile - CLP)</h3>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Configura tus credenciales oficiales de <strong>Mercado Pago Developers (Chile)</strong> para habilitar enlaces de pago automáticos en las cotizaciones enviadas por el Asistente de IA en WhatsApp.
                </p>
                <a href="https://www.mercadopago.cl/developers/panel" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline mt-1">
                  💳 Abrir Mercado Pago Developers →
                </a>
              </div>

              {field('mp_public_key', 'Public Key de ejemplo', 'Clave ficticia de demostración', 'text', 'Las integraciones están desactivadas en este entorno.')}
              {field('mp_access_token', 'Access Token de Producción (Secreto)', 'APP_USR-...', 'password', '⚠️ Pega aquí tu Access Token de Producción copiado desde el panel de Mercado Pago.')}

              {/* Caja de Webhook de Mercado Pago */}
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-400">URL del Webhook de Pagos (Confirmación Instantánea):</p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">URL de Notificación (Webhook URL):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-black/60 px-3 py-1.5 rounded border border-white/10 text-sky-300 select-all flex-1">
                        {`${origin}/api/webhooks/mercadopago`}
                      </code>
                    </div>
                    <span className="text-slate-500 block text-[10px] mt-1">Sincroniza automáticamente los pagos en tiempo real en la base de datos de Supabase.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifs' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Alertas e Integraciones</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Slack: envía notificaciones HITL cuando el bot necesite intervención humana.</p>
                </div>
                {field('slack_webhook_url', 'Slack Webhook URL (HITL)', 'https://hooks.slack.com/services/...')}
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                <div className="bg-sky-50/60 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/50 p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-sky-800 dark:text-sky-300 text-sm">Reporte Diario Matutino</h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">Configura el envío del resumen de agenda y estado del negocio a los números administradores/derivaciones.</p>
                </div>
                
                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                  {toggleField('daily_report_active', 'Activar Reporte Diario', 'El bot enviará un mensaje de WhatsApp todos los días con el resumen matutino y citas agendadas.')}
                  
                  {config.daily_report_active && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                      <div className="w-1/2">
                        {field('daily_report_time', 'Hora de Envío', '07:30', 'time', 'Hora local (Chile) a la que se enviará el reporte')}
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                        {toggleField('daily_report_agenda_only', 'Solo enviar si hay agendamiento', 'Si activas esto, el reporte NO se enviará los días que no tengas reuniones agendadas.')}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer ${
          saved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:opacity-95'
        } disabled:opacity-50`}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Guardando...' : saved ? '✅ Configuración Guardada' : 'Guardar Configuración'}
      </button>
    </div>
  );
}

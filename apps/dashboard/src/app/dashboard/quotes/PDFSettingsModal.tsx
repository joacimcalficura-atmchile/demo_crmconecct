'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Sparkles, Check, X, Loader2, AlertCircle, Building2 } from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface BankDetails {
  bank?: string;
  account_type?: string;
  account_number?: string;
  rut?: string;
  holder?: string;
  email?: string;
}

interface CompanyConfig {
  name?: string;
  rut?: string;
  address?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  pdf_primary_color?: string;
  pdf_secondary_color?: string;
  pdf_accent_color?: string;
  quote_validity_days?: number;
  quote_payment_terms?: string;
  quote_footer_notes?: string;
  quote_bank_details?: BankDetails;
}

interface PDFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// Color Palettes — Enterprise Grade (8 total)
// ============================================================
const COLOR_PALETTES = [
  {
    name: 'Apple Enterprise Dark',
    category: 'Premium',
    primary: '#1c1c1e',
    secondary: '#86868b',
    accent: '#0066cc',
  },
  {
    name: 'Cobalt Executive',
    category: 'Corporativo',
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#2563eb',
  },
  {
    name: 'Trust Blue',
    category: 'Legal / Finanzas',
    primary: '#1e3a8a',
    secondary: '#6b7280',
    accent: '#3b82f6',
  },
  {
    name: 'Industrial Orange',
    category: 'Construcción / Arq.',
    primary: '#1c1917',
    secondary: '#57534e',
    accent: '#f97316',
  },
  {
    name: 'Eco Green',
    category: 'Sustentabilidad',
    primary: '#1a2e1a',
    secondary: '#6b7280',
    accent: '#22c55e',
  },
  {
    name: 'Tech Purple',
    category: 'Software / Agencias',
    primary: '#0f0a1a',
    secondary: '#6b7280',
    accent: '#7c3aed',
  },
  {
    name: 'Emerald Onyx',
    category: 'Salud / Bienestar',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#10b981',
  },
  {
    name: 'Minimalist Charcoal',
    category: 'Minimalismo',
    primary: '#27272a',
    secondary: '#71717a',
    accent: '#09090b',
  },
];

// ============================================================
// Live PDF Preview — Uses real company data
// ============================================================
function PDFPreview({
  company,
  primary,
  secondary,
  accent,
  validityDays,
  paymentTerms,
  footerNotes,
  bank,
}: {
  company: CompanyConfig;
  primary: string;
  secondary: string;
  accent: string;
  validityDays: number;
  paymentTerms: string;
  footerNotes: string;
  bank: BankDetails;
}) {
  const quoteId = 'CTZ-00001';
  const date = new Date().toLocaleDateString('es-CL');
  const bankLines = [
    bank.holder && `Titular: ${bank.holder}`,
    bank.rut && `RUT: ${bank.rut}`,
    bank.bank && `Banco: ${bank.bank}`,
    bank.account_type && `Tipo de cuenta: ${bank.account_type}`,
    bank.account_number && `N° de cuenta: ${bank.account_number}`,
    bank.email && `Correo: ${bank.email}`,
  ].filter(Boolean) as string[];

  return (
    <div
      className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* PDF Header */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="Logo" className="h-10 object-contain mb-2" />
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="w-4 h-4" style={{ color: accent }} />
              </div>
            )}
            <h4 className="font-extrabold text-base leading-tight" style={{ color: primary }}>
              {company.name || 'NOMBRE DE EMPRESA'}
            </h4>
            <p className="text-[10px] mt-0.5" style={{ color: secondary }}>
              {company.rut ? `RUT: ${company.rut}` : 'RUT: 00.000.000-0'}
            </p>
            {company.address && (
              <p className="text-[10px]" style={{ color: secondary }}>{company.address}</p>
            )}
            {company.email && (
              <p className="text-[10px]" style={{ color: secondary }}>{company.email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-sm" style={{ color: primary }}>COTIZACIÓN</p>
            <p className="text-[10px]" style={{ color: secondary }}>N° {quoteId}</p>
            <p className="text-[10px]" style={{ color: secondary }}>Fecha: {date}</p>
          </div>
        </div>

        {/* Accent line */}
        <div className="h-0.5 rounded-full mb-4" style={{ backgroundColor: accent }} />

        {/* Table header */}
        <div className="flex justify-between text-[10px] font-bold pb-1.5 border-b border-slate-100" style={{ color: primary }}>
          <span>Descripción</span>
          <div className="flex gap-8">
            <span>Cant.</span>
            <span>P. Unit.</span>
            <span>Total</span>
          </div>
        </div>

        {/* Table rows */}
        <div className="space-y-1.5 mt-2">
          {[
            { desc: 'Agente IA Comercial (mensual)', qty: 1, price: 450000 },
            { desc: 'Configuración y Onboarding', qty: 1, price: 150000 },
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-[10px]" style={{ color: secondary }}>
              <span>{item.desc}</span>
              <div className="flex gap-8 font-medium">
                <span>{item.qty}</span>
                <span>${item.price.toLocaleString('es-CL')}</span>
                <span>${item.price.toLocaleString('es-CL')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
          {[
            { label: 'Neto:', value: '$504.202' },
            { label: 'IVA (19%):', value: '$95.798' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-end gap-10 text-[10px]" style={{ color: secondary }}>
              <span>{label}</span>
              <span className="w-20 text-right">{value}</span>
            </div>
          ))}
          <div className="flex justify-end gap-10 text-xs font-extrabold" style={{ color: primary }}>
            <span>TOTAL:</span>
            <span className="w-20 text-right">$600.000</span>
          </div>
        </div>

        {/* Condiciones de pago */}
        {paymentTerms.trim() && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Condiciones de pago</p>
            <p className="text-[9px] whitespace-pre-wrap" style={{ color: secondary }}>{paymentTerms}</p>
          </div>
        )}

        {/* Datos de transferencia */}
        {bankLines.length > 0 && (
          <div className="mt-3">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Datos de transferencia</p>
            {bankLines.map((line) => (
              <p key={line} className="text-[9px]" style={{ color: secondary }}>{line}</p>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-[9px] text-center mt-4 pt-3 border-t border-slate-100" style={{ color: secondary }}>
          Cotización válida por {validityDays} días desde la fecha de emisión. Precios en CLP. {footerNotes.trim() || 'Sujeto a visita técnica.'}
          {company.phone ? ` • ${company.phone}` : ''}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Main Modal
// ============================================================
export function PDFSettingsModal({ isOpen, onClose }: PDFSettingsModalProps) {
  const [primary, setPrimary] = useState('#1c1c1e');
  const [secondary, setSecondary] = useState('#86868b');
  const [accent, setAccent] = useState('#0066cc');
  const [company, setCompany] = useState<CompanyConfig>({});

  // Condiciones comerciales persistentes (fuente: company_config)
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [footerNotes, setFooterNotes] = useState('');
  const [bank, setBank] = useState<BankDetails>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingCompany(true);
    setError(null);
    fetch('/api/proxy/config')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: CompanyConfig) => {
        setCompany(data ?? {});
        if (data?.pdf_primary_color) setPrimary(data.pdf_primary_color);
        if (data?.pdf_secondary_color) setSecondary(data.pdf_secondary_color);
        if (data?.pdf_accent_color) setAccent(data.pdf_accent_color);
        if (typeof data?.quote_validity_days === 'number') setValidityDays(data.quote_validity_days);
        if (typeof data?.quote_payment_terms === 'string') setPaymentTerms(data.quote_payment_terms);
        if (typeof data?.quote_footer_notes === 'string') setFooterNotes(data.quote_footer_notes);
        if (data?.quote_bank_details) setBank(data.quote_bank_details);
      })
      .catch(() => {
        setError('No se pudo cargar la config de empresa. Se mostrará datos de ejemplo.');
      })
      .finally(() => setLoadingCompany(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_primary_color: primary,
          pdf_secondary_color: secondary,
          pdf_accent_color: accent,
          quote_validity_days: Number(validityDays) || 30,
          quote_payment_terms: paymentTerms,
          quote_footer_notes: footerNotes,
          quote_bank_details: bank,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Error ${res.status}: ${body}`);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(`No se pudo guardar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[90dvh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Modal Header */}
        <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Personalización de Cotización PDF</h3>
              <p className="text-xs text-slate-500">Diseño Enterprise Apple Style A4 · Datos enlazados desde Configuración</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-100 px-5 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {/* Main Content — Split Layout (apilado en móvil, dos columnas en desktop) */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

          {/* Left Panel — Config Controls */}
          <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 p-5 space-y-6 md:overflow-y-auto">

            {/* Company Data Binding Info */}
            <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Data Binding Activo</p>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                La vista previa consume automáticamente los datos de tu empresa en <strong>Configuración → Empresa</strong> (nombre, RUT, dirección, correo, logo).
              </p>
            </div>

            {/* Palettes Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Paletas Enterprise
              </label>
              <div className="space-y-2">
                {COLOR_PALETTES.map((pal) => {
                  const isSelected = primary === pal.primary && accent === pal.accent;
                  return (
                    <button
                      key={pal.name}
                      onClick={() => {
                        setPrimary(pal.primary);
                        setSecondary(pal.secondary);
                        setAccent(pal.accent);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500'
                          : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{pal.name}</p>
                        <p className="text-[10px] text-slate-400">{pal.category}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          {[pal.primary, pal.secondary, pal.accent].map((c) => (
                            <span
                              key={c}
                              className="w-3 h-3 rounded-full border border-black/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Pickers */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colores Personalizados</label>
              </div>

              {[
                { label: 'Título y Encabezados', value: primary, set: setPrimary },
                { label: 'Subtítulos / Metadatos', value: secondary, set: setSecondary },
                { label: 'Línea de Acento', value: accent, set: setAccent },
              ].map(({ label, value, set }) => (
                <div key={label} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <p className="text-[11px] font-bold text-slate-700 mb-2">{label}</p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-600">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Condiciones comerciales — se guardan una vez y se reutilizan */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condiciones comerciales</label>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed -mt-1">
                Se guardan una vez y se reutilizan en cada cotización (manual y del bot). Puedes ajustarlas por cotización al enviarla.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Validez de la cotización (días)</label>
                <input
                  type="number" min={1} value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-sky-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Condiciones de pago</label>
                <textarea
                  rows={2} value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="Ej: 50% anticipo, 50% contra entrega"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-sky-500 resize-y"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nota al pie del PDF</label>
                <input
                  value={footerNotes}
                  onChange={(e) => setFooterNotes(e.target.value)}
                  placeholder="Ej: Sujeto a visita técnica."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-sky-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Datos de transferencia</p>
                {([
                  { key: 'holder', label: 'Titular', ph: 'Nombre del titular' },
                  { key: 'rut', label: 'RUT', ph: '12.345.678-9' },
                  { key: 'bank', label: 'Banco', ph: 'Banco Estado' },
                  { key: 'account_type', label: 'Tipo de cuenta', ph: 'Cuenta Corriente' },
                  { key: 'account_number', label: 'N° de cuenta', ph: '000123456' },
                  { key: 'email', label: 'Correo', ph: 'pagos@empresa.cl' },
                ] as const).map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">{label}</label>
                    <input
                      value={bank[key] ?? ''}
                      onChange={(e) => setBank((b) => ({ ...b, [key]: e.target.value }))}
                      placeholder={ph}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel — Live PDF Preview */}
          <div className="w-full md:flex-1 bg-slate-50/50 md:overflow-y-auto p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vista Previa en Vivo — A4</p>
              {loadingCompany && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[10px]">Cargando datos…</span>
                </div>
              )}
            </div>

            {/* A4 ratio paper simulation: 210x297mm → approx 595x842pt → ~1:1.41 */}
            <div className="w-full max-w-lg mx-auto" style={{ aspectRatio: '1 / 1.41' }}>
              <div className="shadow-2xl shadow-slate-300/40 h-full overflow-hidden rounded-lg">
                <PDFPreview
                  company={company}
                  primary={primary}
                  secondary={secondary}
                  accent={accent}
                  validityDays={validityDays}
                  paymentTerms={paymentTerms}
                  footerNotes={footerNotes}
                  bank={bank}
                />
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-4">
              Esta vista previa refleja automáticamente los datos en <strong>Configuración → Empresa</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end sm:justify-between items-center gap-3 shrink-0">
          <p className="hidden sm:block text-[10px] text-slate-400 min-w-0">
            Los cambios se aplicarán a todas las cotizaciones nuevas generadas por el bot.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-all whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando…</>
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" />¡Aplicado!</>
              ) : (
                <>
                  <span className="sm:hidden">Aplicar Formato</span>
                  <span className="hidden sm:inline">Aplicar Formato Enterprise</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

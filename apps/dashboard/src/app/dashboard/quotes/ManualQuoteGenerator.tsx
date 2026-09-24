'use client';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, X, Loader2, FileText, Download, MessageCircle, Mail, Building2, Sparkles, Check,
} from 'lucide-react';

// ============================================================
// Estudio de Cotización — editor + preview en vivo + envío
// Editor de cotización para la demo; envíos se simulan y el PDF se informa como no disponible.
// ============================================================

interface Item { desc: string; qty: number; unit: string; price: number; }
interface BankDetails {
  bank?: string; account_type?: string; account_number?: string;
  rut?: string; holder?: string; email?: string;
}
interface Company {
  name?: string; rut?: string; address?: string; email?: string; phone?: string;
  logo_url?: string; pdf_primary_color?: string; pdf_secondary_color?: string; pdf_accent_color?: string;
  quote_validity_days?: number; quote_payment_terms?: string; quote_footer_notes?: string;
  quote_bank_details?: BankDetails;
}

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

// ── Live paper preview (refleja el PDF que genera el bot) ──────────
function QuotePaper({
  company, clientName, clientCompany, subject, items, subtotal, tax, total,
  validityDays, paymentTerms, bank,
}: {
  company: Company; clientName: string; clientCompany: string; subject: string;
  items: Item[]; subtotal: number; tax: number; total: number;
  validityDays: number; paymentTerms: string; bank: BankDetails;
}) {
  const primary = company.pdf_primary_color || '#1c1c1e';
  const secondary = company.pdf_secondary_color || '#86868b';
  const accent = company.pdf_accent_color || '#0066cc';
  const date = new Date().toLocaleDateString('es-CL');
  const footerNote = (company.quote_footer_notes || '').trim() || 'Sujeto a visita técnica.';
  const bankLines = [
    bank.holder && `Titular: ${bank.holder}`,
    bank.rut && `RUT: ${bank.rut}`,
    bank.bank && `Banco: ${bank.bank}`,
    bank.account_type && `Tipo de cuenta: ${bank.account_type}`,
    bank.account_number && `N° de cuenta: ${bank.account_number}`,
    bank.email && `Correo: ${bank.email}`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden text-left" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="Logo" className="h-9 object-contain mb-2" />
            ) : (
              <Building2 className="w-4 h-4 mb-1" style={{ color: accent }} />
            )}
            <h4 className="font-extrabold text-sm leading-tight truncate" style={{ color: primary }}>
              {company.name || 'NOMBRE DE EMPRESA'}
            </h4>
            <p className="text-[10px] mt-0.5" style={{ color: secondary }}>{company.rut ? `RUT: ${company.rut}` : 'RUT: 00.000.000-0'}</p>
            {company.address && <p className="text-[10px]" style={{ color: secondary }}>{company.address}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm" style={{ color: primary }}>COTIZACIÓN</p>
            <p className="text-[10px]" style={{ color: secondary }}>Fecha: {date}</p>
            {clientName && <p className="text-[10px] mt-1 font-semibold" style={{ color: primary }}>Para: {clientName}</p>}
            {clientCompany && <p className="text-[10px]" style={{ color: secondary }}>{clientCompany}</p>}
          </div>
        </div>

        <div className="h-0.5 rounded-full mb-3" style={{ backgroundColor: accent }} />

        {subject.trim() && (
          <p className="text-[10px] font-bold mb-2" style={{ color: primary }}>
            ASUNTO: <span className="font-semibold" style={{ color: secondary }}>{subject}</span>
          </p>
        )}

        <div className="flex justify-between text-[10px] font-bold pb-1.5 border-b border-slate-100" style={{ color: primary }}>
          <span>Descripción</span>
          <div className="flex gap-6"><span>Cant.</span><span>P. Unit.</span><span>Total</span></div>
        </div>

        <div className="space-y-1.5 mt-2 min-h-[40px]">
          {items.filter(i => i.desc).length === 0 ? (
            <p className="text-[10px] italic py-2" style={{ color: secondary }}>Agrega ítems para verlos aquí…</p>
          ) : items.filter(i => i.desc).map((item, i) => (
            <div key={i} className="flex justify-between text-[10px]" style={{ color: secondary }}>
              <span className="truncate pr-2 max-w-[45%]">{item.desc}</span>
              <div className="flex gap-6 font-medium tabular-nums">
                <span>{item.qty}</span>
                <span>{clp(item.price)}</span>
                <span>{clp(item.qty * item.price)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
          <div className="flex justify-end gap-10 text-[10px]" style={{ color: secondary }}>
            <span>Neto:</span><span className="w-20 text-right tabular-nums">{clp(subtotal)}</span>
          </div>
          <div className="flex justify-end gap-10 text-[10px]" style={{ color: secondary }}>
            <span>IVA (19%):</span><span className="w-20 text-right tabular-nums">{clp(tax)}</span>
          </div>
          <div className="flex justify-end gap-10 text-xs font-extrabold" style={{ color: primary }}>
            <span>TOTAL:</span><span className="w-20 text-right tabular-nums">{clp(total)}</span>
          </div>
        </div>

        {paymentTerms.trim() && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Condiciones de pago</p>
            <p className="text-[9px] whitespace-pre-wrap" style={{ color: secondary }}>{paymentTerms}</p>
          </div>
        )}

        {bankLines.length > 0 && (
          <div className="mt-3">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: primary }}>Datos de transferencia</p>
            {bankLines.map((line) => (
              <p key={line} className="text-[9px]" style={{ color: secondary }}>{line}</p>
            ))}
          </div>
        )}

        <p className="text-[9px] text-center mt-4 pt-3 border-t border-slate-100" style={{ color: secondary }}>
          Cotización válida por {validityDays} días. Precios en CLP. {footerNote}{company.phone ? ` • ${company.phone}` : ''}
        </p>
      </div>
    </div>
  );
}

export function ManualQuoteGenerator() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [company, setCompany] = useState<Company>({});

  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPhone, setClientPhone] = useState('+56');
  const [clientEmail, setClientEmail] = useState('');
  // El dígito verificador lo valida el bot (packages/zod-schemas), que es la
  // fuente única. Si no calza, la ruta responde 400 y el mensaje cae en `error`.
  const [clientRut, setClientRut] = useState('');
  const [subject, setSubject] = useState(''); // Asunto: a qué corresponde la cotización
  const [items, setItems] = useState<Item[]>([{ desc: '', qty: 1, unit: 'un', price: 0 }]);

  // Catálogo (lista de precios) para el autocompletar de ítems
  const [catalog, setCatalog] = useState<{ name: string; unit: string; unit_price: number }[]>([]);

  // Condiciones comerciales: se precargan desde company_config y se pueden
  // ajustar por cotización sin pisar el default global guardado.
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [bank, setBank] = useState<BankDetails>({});

  const [message, setMessage] = useState('');
  const [msgTouched, setMsgTouched] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [savedDefault, setSavedDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  // Cargar datos de empresa + condiciones comerciales para precargar (best-effort)
  useEffect(() => {
    if (!open) return;
    fetch('/api/proxy/config')
      .then(r => (r.ok ? r.json() : null))
      .then((d: Company | null) => {
        if (!d) return;
        setCompany(d);
        if (typeof d.quote_validity_days === 'number') setValidityDays(d.quote_validity_days);
        if (typeof d.quote_payment_terms === 'string') setPaymentTerms(d.quote_payment_terms);
        if (d.quote_bank_details) setBank(d.quote_bank_details);
      })
      .catch(() => {});

    // Catálogo para el autocompletar de ítems (solo activos)
    fetch('/api/price-catalog', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: { items?: Record<string, unknown>[] } | null) => {
        if (!d?.items) return;
        setCatalog(
          d.items
            .filter(i => i.active !== false && String(i.name ?? '').trim())
            .map(i => ({ name: String(i.name ?? ''), unit: String(i.unit ?? 'un'), unit_price: Number(i.unit_price) || 0 }))
        );
      })
      .catch(() => {});
  }, [open]);

  const subtotal = useMemo(() => items.reduce((a, c) => a + Number(c.qty) * Number(c.price), 0), [items]);
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + tax;

  // Mensaje de envío sugerido — CORTO. El detalle de ítems va en el PDF adjunto;
  // repetirlo en el texto es redundante (feedback del cliente). Solo saludo,
  // asunto, aviso del PDF, total y validez.
  useEffect(() => {
    if (msgTouched) return;
    const saludo = clientName ? `Hola ${clientName} 👋` : 'Hola 👋';
    const emp = company.name ? ` de ${company.name}` : '';
    const asunto = subject.trim() ? ` por *${subject.trim()}*` : '';
    setMessage(
      `${saludo}, te compartimos tu cotización${emp}${asunto}.\n\n` +
      `📎 El detalle va en el PDF adjunto.\n` +
      `Total: ${clp(total)} CLP (IVA incluido). Validez: ${validityDays} días.\n\n` +
      `Quedamos atentos a cualquier consulta. ¡Gracias! 🙌`
    );
  }, [clientName, subject, total, company.name, validityDays, msgTouched]);

  const digits = clientPhone.replace(/[^0-9]/g, '');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim());

  // Payload común (ítems + condiciones comerciales resueltas para esta cotización)
  const quotePayload = () => ({
    clientName, clientCompany, clientPhone, clientEmail, clientRut, subject, items,
    validityDays: Number(validityDays) || 30, paymentTerms, bankDetails: bank,
  });

  const canGenerate = !!clientName && items.some(i => i.desc && i.price >= 0 && i.qty > 0);

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  // Cambio de descripción: si coincide con un ítem del catálogo (lista de precios),
  // autocompleta unidad y precio. Si no coincide, se puede escribir a mano.
  const onDescChange = (idx: number, desc: string) => {
    const match = catalog.find(c => c.name.trim().toLowerCase() === desc.trim().toLowerCase());
    if (match) updateItem(idx, { desc, unit: match.unit || 'un', price: match.unit_price });
    else updateItem(idx, { desc });
  };

  const handleDownload = async () => {
    if (!canGenerate) { setError('Completa el nombre del cliente y al menos un ítem con descripción.'); return; }
    setError('');
    setDownloading(true);
    try {
      const res = await fetch('/api/proxy/quotes/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload()),
      });
      if (!res.ok) throw new Error('La generación y descarga de PDF no está habilitada en esta demo.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion_${clientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Envía la cotización (mensaje + PDF adjunto) por WhatsApp DESDE la plataforma.
  // No abre WhatsApp externo: pega al bot, que resuelve el número y adjunta el PDF.
  const handleSendWhatsApp = async () => {
    if (!canGenerate) { setError('Completa el nombre del cliente y al menos un ítem con descripción.'); return; }
    if (digits.length < 8) { setError('Ingresa un teléfono válido para enviar por WhatsApp.'); return; }
    setError(''); setSent(false); setSending(true);
    try {
      const res = await fetch('/api/proxy/quotes/manual/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quotePayload(), message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'No se pudo enviar. Verifica que el bot esté conectado.');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Envía la cotización por CORREO con el PDF adjunto, desde la plataforma.
  // El mailto: no podía adjuntar archivos; ahora el bot manda el PDF vía SMTP.
  const handleSendEmail = async () => {
    if (!canGenerate) { setError('Completa el nombre del cliente y al menos un ítem con descripción.'); return; }
    if (!emailValid) { setError('Ingresa un correo válido del cliente para enviar por email.'); return; }
    setError(''); setEmailed(false); setEmailing(true);
    try {
      const res = await fetch('/api/proxy/quotes/manual/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quotePayload(), message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'No se pudo enviar el correo. Verifica el SMTP del cliente.');
      }
      setEmailed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEmailing(false);
    }
  };

  // Guarda las condiciones comerciales actuales como PREDETERMINADO global
  // (company_config). Así se cargan solas en cada cotización y no hay que
  // retipearlas; siguen siendo editables por cotización. Es la misma persistencia
  // de "Personalizar PDF", accesible sin salir del editor.
  const handleSaveDefaults = async () => {
    setError(''); setSavedDefault(false); setSavingDefault(true);
    try {
      const res = await fetch('/api/proxy/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_validity_days: Number(validityDays) || 30,
          quote_payment_terms: paymentTerms,
          quote_bank_details: bank,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'No se pudieron guardar los datos por defecto.');
      }
      setCompany(c => ({ ...c, quote_validity_days: Number(validityDays) || 30, quote_payment_terms: paymentTerms, quote_bank_details: bank }));
      setSavedDefault(true);
      setTimeout(() => setSavedDefault(false), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingDefault(false);
    }
  };

  const reset = () => {
    setClientName(''); setClientCompany(''); setClientPhone('+56'); setClientEmail(''); setSubject('');
    setItems([{ desc: '', qty: 1, unit: 'un', price: 0 }]);
    setMsgTouched(false); setError(''); setSent(false); setEmailed(false);
  };

  const inputCls = 'w-full p-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-1 focus:ring-sky-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors';
  const labelCls = 'block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(''); }}
        className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-full text-xs font-bold hover:bg-sky-700 transition-colors shadow-sm active:scale-95"
      >
        <Plus className="w-4 h-4" /> Crear Cotización
      </button>

      {/* Igual que QuoteEditorModal: dentro de createPortal, <AnimatePresence>
          no desmontaba el modal al cerrarlo (la X y el fondo no hacían nada y
          la ventana quedaba pegada). Se desmonta con `open` y se anima por CSS. */}
      {open && createPortal(
        (
          (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => !downloading && setOpen(false)}
              />
              <div
                className="relative w-full max-w-5xl glass-panel shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-300 dark:border-sky-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">Estudio de Cotización</h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Edita, previsualiza y envía en segundos</p>
                    </div>
                  </div>
                  <button onClick={() => !downloading && setOpen(false)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Split body */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-0">
                  {/* Left: form */}
                  <div className="overflow-y-auto p-5 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Nombre del Cliente *</label>
                        <input value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} placeholder="Juan Pérez" />
                      </div>
                      <div>
                        <label className={labelCls}>Empresa (Opcional)</label>
                        <input value={clientCompany} onChange={e => setClientCompany(e.target.value)} className={inputCls} placeholder="Constructora XYZ" />
                      </div>
                      <div>
                        <label className={labelCls}>Teléfono / WhatsApp</label>
                        <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={inputCls} placeholder="+56 9 1234 5678" />
                      </div>
                      <div>
                        <label className={labelCls}>Correo (Opcional)</label>
                        <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} type="email" className={inputCls} placeholder="cliente@correo.cl" />
                      </div>
                      <div>
                        <label className={labelCls}>RUT empresa (Opcional)</label>
                        <input value={clientRut} onChange={e => setClientRut(e.target.value)} className={inputCls} placeholder="12.345.678-5" />
                      </div>
                    </div>

                    {/* Asunto: a qué corresponde la cotización (va arriba de los ítems en el PDF) */}
                    <div>
                      <label className={labelCls}>Asunto de la cotización</label>
                      <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Ej: Reparación de estructura alza hombre" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`${labelCls} mb-0`}>Ítems a cotizar</label>
                        {catalog.length > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {catalog.length} en tu lista de precios · escribe para buscar
                          </span>
                        )}
                      </div>
                      {/* Autocompletar nativo: sugiere ítems del catálogo; al elegir uno se
                          carga su precio y unidad. Igual puedes escribir uno a mano si no existe. */}
                      <datalist id="atm-catalog-items">
                        {catalog.map((c, i) => (
                          <option key={i} value={c.name}>
                            {c.unit_price ? `$${c.unit_price.toLocaleString('es-CL')} / ${c.unit}` : c.unit}
                          </option>
                        ))}
                      </datalist>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-black/5 dark:bg-white/5 p-2 border border-slate-200 dark:border-white/10 rounded-xl">
                            <input value={item.desc} onChange={e => onDescChange(idx, e.target.value)} list="atm-catalog-items" placeholder="Busca en tu lista de precios o escribe uno…"
                              className="flex-1 min-w-[160px] p-2 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-sky-500" />
                            <input type="number" value={item.qty} onChange={e => updateItem(idx, { qty: Number(e.target.value) })} placeholder="Cant"
                              className="w-16 p-2 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg text-sm text-center text-slate-900 dark:text-white outline-none focus:border-sky-500" />
                            <input value={item.unit} onChange={e => updateItem(idx, { unit: e.target.value })} placeholder="Unidad"
                              className="w-16 p-2 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg text-sm text-center text-slate-900 dark:text-white outline-none focus:border-sky-500" />
                            <div className="flex items-center gap-1 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden flex-1 sm:max-w-[130px] focus-within:border-sky-500">
                              <span className="pl-2.5 text-slate-400 font-medium text-sm">$</span>
                              <input type="number" value={item.price || ''} onChange={e => updateItem(idx, { price: Number(e.target.value) })} placeholder="Precio"
                                className="w-full p-2 bg-transparent outline-none text-sm text-slate-900 dark:text-white" />
                            </div>
                            {items.length > 1 && (
                              <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setItems([...items, { desc: '', qty: 1, unit: 'un', price: 0 }])}
                        className="mt-3 text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:text-sky-700 dark:hover:text-sky-300">
                        <Plus className="w-3.5 h-3.5" /> Agregar otro ítem
                      </button>
                    </div>

                    {/* Condiciones comerciales (precargadas de Configuración, editables aquí) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`${labelCls} mb-0`}>Condiciones comerciales</label>
                        <button
                          type="button"
                          onClick={handleSaveDefaults}
                          disabled={savingDefault}
                          title="Guarda estos datos como predeterminados para todas las cotizaciones"
                          className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 disabled:opacity-50"
                        >
                          {savingDefault ? <Loader2 className="w-3 h-3 animate-spin" /> : savedDefault ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          {savingDefault ? 'Guardando…' : savedDefault ? 'Guardado por defecto' : 'Guardar como predeterminado'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Validez (días)</label>
                          <input type="number" min={1} value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Condiciones de pago</label>
                          <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="50% anticipo, 50% contra entrega" className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {([
                          { key: 'holder', ph: 'Titular' },
                          { key: 'rut', ph: 'RUT' },
                          { key: 'bank', ph: 'Banco' },
                          { key: 'account_type', ph: 'Tipo de cuenta' },
                          { key: 'account_number', ph: 'N° de cuenta' },
                          { key: 'email', ph: 'Correo de pago' },
                        ] as const).map(({ key, ph }) => (
                          <input
                            key={key}
                            value={bank[key] ?? ''}
                            onChange={e => setBank(b => ({ ...b, [key]: e.target.value }))}
                            placeholder={ph}
                            className="w-full p-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-sky-500"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Editable send message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`${labelCls} mb-0`}>Mensaje de envío</label>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          <Sparkles className="w-3 h-3" /> {msgTouched ? 'Editado' : 'Auto'}
                        </span>
                      </div>
                      <textarea
                        value={message}
                        onChange={e => { setMessage(e.target.value); setMsgTouched(true); }}
                        rows={5}
                        className={`${inputCls} resize-y leading-relaxed`}
                      />
                      {msgTouched && (
                        <button onClick={() => setMsgTouched(false)} className="mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400">
                          ↺ Regenerar automático
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Right: live preview */}
                  <div className="overflow-y-auto p-5 bg-black/[0.03] dark:bg-black/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vista previa en vivo</p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Actualiza al escribir
                      </span>
                    </div>

                    <QuotePaper company={company} clientName={clientName} clientCompany={clientCompany} subject={subject} items={items} subtotal={subtotal} tax={tax} total={total} validityDays={validityDays} paymentTerms={paymentTerms} bank={bank} />

                    {/* Message bubble preview */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ejemplo de envío</p>
                      <div className="bg-[#dcf8c6] dark:bg-emerald-900/40 border border-emerald-200/70 dark:border-emerald-500/20 rounded-2xl rounded-tr-sm p-3 text-[13px] text-slate-800 dark:text-emerald-50 whitespace-pre-wrap leading-relaxed shadow-sm max-w-[95%] ml-auto">
                        {message || 'Tu mensaje aparecerá aquí…'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                      Total: <span className="font-extrabold text-slate-900 dark:text-white">{clp(total)}</span>
                    </p>
                    <button onClick={reset} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">Limpiar</button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={handleDownload}
                      disabled={downloading || !canGenerate}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Descargar PDF
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={emailing || !emailValid || !canGenerate}
                      title="Envía el PDF de la cotización adjunto al correo del cliente, desde la plataforma"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 border ${(emailValid && canGenerate) ? 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10' : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                    >
                      {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : emailed ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {emailing ? 'Enviando…' : emailed ? 'Enviado' : 'Correo'}
                    </button>
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={sending || digits.length < 8 || !canGenerate}
                      title="Envía el mensaje y el PDF adjunto al número, desde la plataforma"
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md ${(digits.length >= 8 && canGenerate) ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-emerald-600/40 text-white/70 cursor-not-allowed'}`}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                      {sending ? 'Simulando…' : sent ? 'Envío simulado' : 'Simular envío por WhatsApp'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        ),
        document.body
      )}
    </>
  );
}

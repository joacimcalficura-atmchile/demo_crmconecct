'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, Save, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Cantidad y precio viven como STRING en el estado: con `Number()` en cada
// tecla, borrar el campo lo dejaba en 0 y no se podía escribir un monto nuevo
// encima ("no me deja cambiar los montos"). Se convierten recién al guardar.
interface EditableItem { desc: string; qty: string; unit: string; price: string }

const fieldCls =
  'w-full p-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 outline-none transition-colors';

export function QuoteEditorModal({ quote, open, onClose }: { quote: any; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Datos del cliente — editables. La IA los deja vacíos cuando el cliente no
  // los dio (su propio prompt dice "un humano los completará"), y hasta ahora
  // no había dónde completarlos: la cotización salía en PDF como "Sin nombre".
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // El RUT se valida en el bot (dígito verificador incluido), no acá: una
  // segunda copia de la regla en el navegador es una copia que se desincroniza.
  // Si no calza, el PATCH responde 400 y el mensaje se muestra en `error`.
  const [contactRut, setContactRut] = useState('');
  const [subject, setSubject] = useState('');

  // Lista de precios del dashboard, para autocompletar unidad y precio.
  const [catalog, setCatalog] = useState<{ name: string; unit: string; unit_price: number }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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

  useEffect(() => {
    if (!quote) return;
    setContactName(quote.contact_name ?? '');
    setContactCompany(quote.contact_company ?? '');
    setContactEmail(quote.contact_email ?? '');
    setContactRut(quote.contact_rut ?? '');
    setSubject(quote.subject ?? '');
    setError('');

    if (!quote.items_json) return;
    let parsed = quote.items_json;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return;
      }
    }
    if (!Array.isArray(parsed)) return;
    setItems(parsed.map((i: any) => ({
      desc: i.description || i.desc || '',
      qty: String(i.quantity ?? i.qty ?? 1),
      unit: i.unit || 'un',
      price: String(i.unit_price ?? i.price ?? 0),
    })));
  }, [quote?.id]);

  const updateItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  // Si la descripción coincide con un ítem de la lista de precios, se traen
  // unidad y precio. Mismo comportamiento que la Cotización Manual.
  const onDescChange = (idx: number, desc: string) => {
    const match = catalog.find(c => c.name.trim().toLowerCase() === desc.trim().toLowerCase());
    if (match) updateItem(idx, { desc, unit: match.unit || 'un', price: String(match.unit_price) });
    else updateItem(idx, { desc });
  };

  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.qty) || 0) * (Number(curr.price) || 0), 0);
  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + tax;

  const handleSave = async () => {
    const invalid = items.some(i =>
      !i.desc.trim() || !(Number(i.qty) > 0) || !(Number(i.price) >= 0)
    );
    if (invalid) {
      setError('Cada ítem necesita descripción, cantidad mayor a 0 y un precio válido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            desc: i.desc.trim(),
            qty: Number(i.qty),
            unit: i.unit.trim() || 'un',
            price: Number(i.price),
          })),
          contact_name: contactName,
          contact_company: contactCompany,
          contact_email: contactEmail,
          contact_rut: contactRut,
          subject,
        })
      });
      if (!res.ok) {
        // El error real del bot (ej. "column ... does not exist") se perdía tras
        // un mensaje genérico; sin él no hay forma de saber por qué no guardó.
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error || `Error al guardar la corrección (HTTP ${res.status})`);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Se desmonta con `open` en vez de delegar la salida a <AnimatePresence>:
  // dentro de createPortal, AnimatePresence NO quitaba el nodo al cerrar
  // (verificado: showEditModal en false y el modal seguía en el DOM con
  // opacity 1), así que "Cancelar" y "Guardar" dejaban la ventana pegada en
  // pantalla y la corrección parecía no responder. Misma técnica que usa
  // PDFSettingsModal, que sí cierra: portal + animación por CSS.
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/70 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !loading && onClose()}
          />
          <div
            className="relative w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white border border-slate-200 dark:border-white/10 dark:[background:linear-gradient(145deg,#0f172a,#1e293b)] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">Corregir Cotización</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Edita los ítems generados por la IA antes de aprobar</p>
                </div>
              </div>
              <button onClick={() => !loading && onClose()} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50 dark:[background:rgba(2,12,28,0.6)]">

              {/* Datos del cliente — van al PDF y a la tabla de cotizaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Datos del cliente</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={contactName} onChange={e => setContactName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className={fieldCls}
                  />
                  <input
                    value={contactCompany} onChange={e => setContactCompany(e.target.value)}
                    placeholder="Empresa (opcional)"
                    className={fieldCls}
                  />
                  <input
                    type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    className={fieldCls}
                  />
                  <input
                    value={contactRut} onChange={e => setContactRut(e.target.value)}
                    placeholder="RUT empresa (ej. 12.345.678-5)"
                    inputMode="text"
                    className={fieldCls}
                  />
                  <input
                    value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Asunto (a qué corresponde)"
                    className={fieldCls}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Teléfono: <span className="font-mono">{quote?.phone}</span> · no se modifica desde acá.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ítems a cotizar</label>
                  {catalog.length > 0 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {catalog.length} en tu lista de precios · escribe para buscar
                    </span>
                  )}
                </div>
                <datalist id="atm-quote-editor-catalog">
                  {catalog.map((c, i) => (
                    <option key={i} value={c.name}>{`$${c.unit_price.toLocaleString('es-CL')} / ${c.unit}`}</option>
                  ))}
                </datalist>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white dark:bg-slate-800/50 p-2.5 border border-slate-200 dark:border-white/5 rounded-xl">
                      <input
                        value={item.desc} onChange={e => onDescChange(idx, e.target.value)}
                        list="atm-quote-editor-catalog"
                        placeholder="Busca en tu lista de precios o escribe uno…"
                        className="flex-1 min-w-[200px] p-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-sky-500 outline-none transition-colors"
                      />
                      <input
                        type="number" inputMode="decimal" min="0" value={item.qty}
                        onChange={e => updateItem(idx, { qty: e.target.value })}
                        placeholder="Cant"
                        className="w-20 p-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white text-center focus:border-sky-500 outline-none transition-colors"
                      />
                      <input
                        value={item.unit} onChange={e => updateItem(idx, { unit: e.target.value })}
                        placeholder="Unidad"
                        className="w-16 p-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white text-center focus:border-sky-500 outline-none transition-colors"
                      />
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden flex-1 sm:max-w-[140px] focus-within:border-sky-500 transition-colors">
                        <span className="pl-3 text-slate-400 dark:text-slate-400 font-medium">$</span>
                        <input
                          type="number" inputMode="decimal" min="0" value={item.price}
                          onChange={e => updateItem(idx, { price: e.target.value })}
                          placeholder="Precio"
                          className="w-full p-2.5 bg-transparent outline-none text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      {items.length > 1 && (
                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setItems([...items, { desc: '', qty: '1', unit: 'un', price: '0' }])}
                  className="mt-4 text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-colors w-fit"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otro ítem
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-4 text-right">
                <div className="bg-black/5 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Subtotal Neto</p>
                  <p className="text-slate-900 dark:text-white font-medium">${subtotal.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-black/5 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">IVA (19%)</p>
                  <p className="text-slate-900 dark:text-white font-medium">${tax.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-300 dark:border-sky-500/20">
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-bold tracking-wider mb-1">Total</p>
                  <p className="text-sky-700 dark:text-sky-300 font-bold text-lg">${total.toLocaleString('es-CL')}</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 flex items-center justify-end gap-3">
              <button onClick={() => onClose()} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-900/20 hover:bg-sky-500 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Corrección
              </button>
            </div>

          </div>
    </div>,
    document.body
  );
}

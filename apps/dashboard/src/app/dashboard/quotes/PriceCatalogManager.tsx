'use client';

import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, Download, Upload, Loader2, Info, ListChecks,
} from 'lucide-react';
import { PriceCatalogPreviewModal } from './PriceCatalogPreviewModal';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  active: boolean;
  largo_metros?: number | null;
  ancho_metros?: number | null;
  tipo_instalacion?: string | null;
  tiempo_instalacion?: string | null;
}

export function PriceCatalogManager() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Carga Excel
  const [preview, setPreview] = useState<CatalogItem[] | null>(null);
  const [replaceOnUpload, setReplaceOnUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isExtendedCatalog = items.some(
    (it) => it.largo_metros != null || it.ancho_metros != null || !!it.tipo_instalacion || !!it.tiempo_instalacion
  );

  const load = async () => {
    setError('');
    try {
      const res = await fetch('/api/price-catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar el catálogo.');
      const d = await res.json();
      setItems((d.items || []).map((i: Record<string, unknown>) => ({
        id: String(i.id),
        name: String(i.name ?? ''),
        category: String(i.category ?? 'General'),
        unit: String(i.unit ?? 'un'),
        unit_price: Number(i.unit_price) || 0,
        active: i.active !== false,
        largo_metros: i.largo_metros != null ? Number(i.largo_metros) : null,
        ancho_metros: i.ancho_metros != null ? Number(i.ancho_metros) : null,
        tipo_instalacion: i.tipo_instalacion ? String(i.tipo_instalacion) : null,
        tiempo_instalacion: i.tiempo_instalacion ? String(i.tiempo_instalacion) : null,
      })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    setAdding(true); setError('');
    try {
      const payload = isExtendedCatalog
        ? { name: 'Nuevo Porta Escalera / Producto', category: 'Porta Escaleras', unit: 'un', unit_price: 0, largo_metros: 2.00, ancho_metros: 1.10, tipo_instalacion: 'No se perfora', tiempo_instalacion: '1 Hr', active: true }
        : { name: 'Nuevo ítem', category: 'General', unit: 'un', unit_price: 0, active: true };

      const res = await fetch('/api/price-catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo agregar');
      const { item } = await res.json();
      setItems((prev) => [{
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        unit_price: item.unit_price,
        active: item.active !== false,
        largo_metros: item.largo_metros,
        ancho_metros: item.ancho_metros,
        tipo_instalacion: item.tipo_instalacion,
        tiempo_instalacion: item.tiempo_instalacion,
      }, ...prev]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al agregar ítem');
    } finally { setAdding(false); }
  };

  const patchField = (id: string, patch: Partial<CatalogItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const saveRow = async (id: string) => {
    const row = items.find((i) => i.id === id);
    if (!row) return;
    setSavingId(id);
    try {
      const res = await fetch('/api/price-catalog', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: row.name,
          category: row.category,
          unit: row.unit,
          unit_price: row.unit_price,
          active: row.active,
          largo_metros: row.largo_metros,
          ancho_metros: row.ancho_metros,
          tipo_instalacion: row.tipo_instalacion,
          tiempo_instalacion: row.tiempo_instalacion,
        }),
      });
      if (!res.ok) throw new Error('No se pudo guardar');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally { setSavingId(null); }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm('¿Eliminar este ítem del catálogo?')) return;
    try {
      const res = await fetch(`/api/price-catalog?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const downloadTemplate = () => {
    const example = isExtendedCatalog
      ? [
          { 'DESCRIPCION': 'Porta Escalera Basico Hasta 2,00m', 'Dimensiones Largo Metros': 2.00, 'Dimensiones Ancho Metros': 1.10, 'Data Interna - OPS': 'Hibrido', 'Tiempo de Instalacion / HRS': '1 Hr', 'VALORES REALES NETO': 135000 },
          { 'DESCRIPCION': 'BAICPLUS/Chevrolet N300 Sin Extencion Trasera', 'Dimensiones Largo Metros': 2.00, 'Dimensiones Ancho Metros': 1.10, 'Data Interna - OPS': 'Se Perfora', 'Tiempo de Instalacion / HRS': '1,5 Hrs', 'VALORES REALES NETO': 160000 },
        ]
      : [
          { 'Nombre': 'Oxicorte plancha A36 · 12 mm', 'Categoría': 'Oxicorte', 'Unidad': 'pieza', 'Precio': 18500 },
          { 'Nombre': 'Plegado de plancha · 3 mm', 'Categoría': 'Plegado', 'Unidad': 'trabajo', 'Precio': 67500 },
          { 'Nombre': 'Cilindrado · sujeto a medidas', 'Categoría': 'Cilindrado', 'Unidad': 'cotización', 'Precio': 0 },
        ];

    const ws = XLSX.utils.json_to_sheet(example);
    ws['!cols'] = isExtendedCatalog
      ? [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 26 }, { wch: 20 }]
      : [{ wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Precios');
    XLSX.writeFile(wb, 'Plantilla_Lista_de_Servicios_Aceros_Temuco_Demo.xlsx');
  };

  const onFile = async (file: File) => {
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      const norm = (k: string) => k.toString().toLowerCase().trim();
      const mapped: CatalogItem[] = rows.map((r, idx) => {
        const entries = Object.fromEntries(Object.entries(r).map(([k, v]) => [norm(k), v]));
        const name = String(entries['descripcion'] ?? entries['descripción'] ?? entries['nombre'] ?? entries['producto'] ?? entries['servicio'] ?? entries['item'] ?? '').trim();
        const category = String(entries['categoría'] ?? entries['categoria'] ?? 'General').trim();
        const unit = String(entries['unidad'] ?? entries['unit'] ?? 'un').trim();

        const largoRaw = entries['dimensiones largo metros'] ?? entries['largo metros'] ?? entries['largo'] ?? entries['dimensiones largo'];
        const largo_metros = largoRaw !== undefined && largoRaw !== '' ? Number(String(largoRaw).replace(',', '.')) || null : null;

        const anchoRaw = entries['dimensiones ancho metros'] ?? entries['ancho metros'] ?? entries['ancho'] ?? entries['dimensiones ancho'];
        const ancho_metros = anchoRaw !== undefined && anchoRaw !== '' ? Number(String(anchoRaw).replace(',', '.')) || null : null;

        const opsRaw = entries['data interna - ops'] ?? entries['data interna'] ?? entries['ops'] ?? entries['tipo instalacion'] ?? entries['tipo instalación'];
        const tipo_instalacion = opsRaw ? String(opsRaw).trim() : null;

        const tiempoRaw = entries['tiempo de instalacion / hrs'] ?? entries['tiempo de instalación / hrs'] ?? entries['tiempo instalacion'] ?? entries['tiempo'];
        const tiempo_instalacion = tiempoRaw ? String(tiempoRaw).trim() : null;

        const priceRaw = entries['valores reales neto'] ?? entries['valores reales'] ?? entries['neto'] ?? entries['precio'] ?? entries['valor'] ?? entries['unit_price'] ?? 0;
        const unit_price = Number(String(priceRaw).replace(/[^0-9.-]/g, '')) || 0;

        return {
          id: `preview-${idx}`,
          name,
          category: category || 'General',
          unit: unit || 'un',
          unit_price,
          active: true,
          largo_metros,
          ancho_metros,
          tipo_instalacion,
          tiempo_instalacion,
        };
      }).filter((r) => r.name.length > 0);

      if (mapped.length === 0) {
        setError('No se encontraron filas válidas en el Excel.');
        return;
      }
      setPreview(mapped);
    } catch (e: unknown) {
      setError('No se pudo leer el Excel: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmUpload = async () => {
    if (!preview) return;
    setUploading(true); setError('');
    try {
      const res = await fetch('/api/price-catalog/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: preview, replace: replaceOnUpload }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Falló la carga');
      setPreview(null);
      setReplaceOnUpload(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar Excel');
    } finally { setUploading(false); }
  };

  const inputCls = 'w-full p-2 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-sky-500 rounded-lg text-sm text-slate-900 dark:text-white outline-none transition-colors';

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {isExtendedCatalog ? (
              <>Catálogo adaptado con dimensiones (Largo, Ancho, OPS/Instalación y Tiempo). El agente IA lee estas especificaciones para cotizar automáticamente.</>
            ) : (
              <>El agente de cotizaciones <strong>lee esta lista</strong> para cotizar con tus precios fijos. ¿Trabajas con <strong>visita a terreno / precios variables</strong>? Deja el catálogo vacío y define tu lógica en <strong>Agentes IA → Reglas de Negocio</strong>.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Plantilla Excel
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors">
            <Upload className="w-3.5 h-3.5" /> Cargar Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button onClick={addItem} disabled={adding} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors disabled:opacity-50">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Agregar ítem
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl">{error}</div>
      )}

      {/* Tabla Adaptativa */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {isExtendedCatalog ? 'Lista de Precios · Catálogo Extendido' : 'Lista de Precios'}
          </h3>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full">{items.length} ítems</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5">
                <th className="text-left p-3 font-semibold min-w-[220px]">
                  {isExtendedCatalog ? 'Descripción' : 'Producto / Servicio'}
                </th>
                {isExtendedCatalog ? (
                  <>
                    <th className="text-center p-3 font-semibold w-24">Largo (m)</th>
                    <th className="text-center p-3 font-semibold w-24">Ancho (m)</th>
                    <th className="text-left p-3 font-semibold w-36">OPS / Instalación</th>
                    <th className="text-left p-3 font-semibold w-28">Tiempo Inst.</th>
                  </>
                ) : (
                  <>
                    <th className="text-left p-3 font-semibold">Categoría</th>
                    <th className="text-left p-3 font-semibold w-24">Unidad</th>
                  </>
                )}
                <th className="text-right p-3 font-semibold w-32">Precio (CLP)</th>
                <th className="text-center p-3 font-semibold w-16">Activo</th>
                <th className="text-center p-3 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading ? (
                <tr><td colSpan={isExtendedCatalog ? 8 : 6} className="text-center p-8 text-slate-500 dark:text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={isExtendedCatalog ? 8 : 6} className="text-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                  Sin precios cargados. Carga tu catálogo con el botón <strong>Cargar Excel</strong>.
                </td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-1.5">
                    <input className={inputCls} value={it.name} onChange={(e) => patchField(it.id, { name: e.target.value })} onBlur={() => saveRow(it.id)} />
                  </td>
                  {isExtendedCatalog ? (
                    <>
                      <td className="p-1.5 text-center">
                        <input type="number" step="0.01" className={`${inputCls} text-center font-mono`} value={it.largo_metros ?? ''} onChange={(e) => patchField(it.id, { largo_metros: e.target.value ? Number(e.target.value) : null })} onBlur={() => saveRow(it.id)} />
                      </td>
                      <td className="p-1.5 text-center">
                        <input type="number" step="0.01" className={`${inputCls} text-center font-mono`} value={it.ancho_metros ?? ''} onChange={(e) => patchField(it.id, { ancho_metros: e.target.value ? Number(e.target.value) : null })} onBlur={() => saveRow(it.id)} />
                      </td>
                      <td className="p-1.5">
                        <input className={inputCls} value={it.tipo_instalacion ?? ''} onChange={(e) => patchField(it.id, { tipo_instalacion: e.target.value })} onBlur={() => saveRow(it.id)} />
                      </td>
                      <td className="p-1.5">
                        <input className={inputCls} value={it.tiempo_instalacion ?? ''} onChange={(e) => patchField(it.id, { tiempo_instalacion: e.target.value })} onBlur={() => saveRow(it.id)} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-1.5">
                        <input className={inputCls} value={it.category} onChange={(e) => patchField(it.id, { category: e.target.value })} onBlur={() => saveRow(it.id)} />
                      </td>
                      <td className="p-1.5">
                        <input className={`${inputCls} w-20`} value={it.unit} onChange={(e) => patchField(it.id, { unit: e.target.value })} onBlur={() => saveRow(it.id)} />
                      </td>
                    </>
                  )}
                  <td className="p-1.5">
                    <input type="number" className={`${inputCls} text-right font-semibold`} value={it.unit_price} onChange={(e) => patchField(it.id, { unit_price: Number(e.target.value) })} onBlur={() => saveRow(it.id)} />
                  </td>
                  <td className="p-1.5 text-center">
                    <input type="checkbox" checked={it.active} onChange={(e) => { patchField(it.id, { active: e.target.checked }); setTimeout(() => saveRow(it.id), 0); }} className="w-4 h-4 accent-sky-600 rounded" />
                  </td>
                  <td className="p-1.5 text-center">
                    {savingId === it.id
                      ? <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" />
                      : <button onClick={() => removeItem(it.id)} className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal preview */}
      {preview && (
        <PriceCatalogPreviewModal
          preview={preview}
          uploading={uploading}
          replaceOnUpload={replaceOnUpload}
          setReplaceOnUpload={setReplaceOnUpload}
          onClose={() => setPreview(null)}
          onConfirm={confirmUpload}
        />
      )}
    </div>
  );
}
